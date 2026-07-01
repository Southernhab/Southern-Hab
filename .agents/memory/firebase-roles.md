---
name: Firebase role pattern
description: How roles and client associations are stored and enforced in the SHC portal Firebase migration
---

## Rule
Roles live exclusively in Firebase custom claims, not in Firestore alone. Firestore `users/{uid}.role` mirrors the claim for UI display, but Firestore Security Rules and Cloud Functions always read from the ID token (`request.auth.token.role`), not the Firestore document.

## Roles
- `super_admin` — full access including assignRole
- `staff_admin` — full staff access, can invite client users
- `field_staff` — read/write field data, no admin actions
- `client_owner` — read own client data, can submit project actions
- `client_viewer` — read only own client data

## clientIds claim
Client users carry a `clientIds: string[]` claim. Firestore rules gate client data reads on `request.auth.token.clientIds.hasAny([resource.data.clientId])`.

**Why:** Firebase Security Rules cannot query Firestore for role/permission lookups — they can only inspect the incoming token. All authorization must be claim-based.

**How to apply:** When adding a new protected collection, gate access in firestore.rules using `request.auth.token.role` and `request.auth.token.clientIds`. Never trust `request.auth.uid` alone for role checks.

## Setting claims
Only Cloud Functions running as Firebase Admin can call `auth.setCustomUserClaims()`. The two entry points are:
1. `inviteClientUser` — sets role + clientIds when staff invites a portal user
2. `assignRole` — super_admin only, changes role for any user

The first `super_admin` must be bootstrapped manually via Admin SDK (see SETUP.md Step 11).
