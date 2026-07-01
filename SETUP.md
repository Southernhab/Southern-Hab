# SHC Landowner Portal — Firebase Setup Guide

This guide covers deploying the SHC Landowner Portal backend from scratch using Firebase.
The frontend is hosted on Netlify. The backend uses Firebase Authentication, Cloud Firestore,
Firebase Storage, and Cloud Functions.

---

## Prerequisites

- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- A Netlify account (for frontend hosting)

---

## Step 1 — Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add project**, name it (e.g. `shc-portal`), disable Google Analytics if not needed.
3. Copy the **project ID** — you will use it throughout this guide.

---

## Step 2 — Enable Firebase Authentication

1. In the Firebase Console, open **Authentication → Get started**.
2. Under **Sign-in method**, enable **Email/Password**.
3. Leave **Email link (passwordless sign-in)** disabled unless you explicitly want it.

---

## Step 3 — Create Firestore Database

1. In the Firebase Console, open **Firestore Database → Create database**.
2. Choose **production mode** (the rules file you deploy will control access).
3. Select a region close to your users (e.g. `us-east1`).

---

## Step 4 — Create Firebase Storage

1. In the Firebase Console, open **Storage → Get started**.
2. Choose **production mode** again.
3. Select the same region as Firestore.

---

## Step 5 — Get Your Firebase Browser Config

1. In the Firebase Console, open **Project Settings → General**.
2. Under **Your apps**, click **Add app → Web**.
3. Register the app (name it e.g. `SHC Portal Web`).
4. Copy the `firebaseConfig` object — you need all 6 fields:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

---

## Step 6 — Configure Firebase CLI

```bash
firebase login
cp .firebaserc.example .firebaserc
# Edit .firebaserc and replace "your-firebase-project-id" with your actual project ID
```

---

## Step 7 — Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

Verify in the Firebase Console that the rules are active.

---

## Step 8 — Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

Index deployment can take a few minutes. You can monitor progress in
**Firestore → Indexes** in the Firebase Console.

---

## Step 9 — Deploy Storage Security Rules

```bash
firebase deploy --only storage
```

---

## Step 10 — Deploy Cloud Functions

Install function dependencies first:

```bash
cd functions
npm install
cd ..
```

Set the required environment variables in Firebase Functions config:

```bash
firebase functions:config:set \
  shc.email_provider_api_key="YOUR_RESEND_OR_SENDGRID_KEY" \
  shc.notification_email="info@southernhabitatconsulting.com" \
  shc.email_from="noreply@southernhabitatconsulting.com" \
  shc.public_site_url="https://southernhabitatconsulting.com"
```

Then deploy:

```bash
firebase deploy --only functions
```

**Cloud Functions deployed:**
- `submitInquiry` — public HTTPS, contact page forms
- `requestAccess` — public HTTPS, portal access request
- `inviteClientUser` — callable, staff_admin+ only
- `assignRole` — callable, super_admin only
- `disableUser` — callable, admin only
- `enableUser` — callable, admin only
- `getSignedFileUrl` — callable, authenticated users
- `publishRecord` — callable, staff_admin+ only
- `unpublishRecord` — callable, staff_admin+ only

---

## Step 11 — Create the First Administrator

Firebase Authentication does not have a built-in admin role.
You must create the first super_admin using the Firebase Admin SDK directly.

**Option A: Firebase Cloud Shell (recommended)**

1. In the Firebase Console, open **Cloud Functions → Logs** to confirm functions are deployed.
2. In the Firebase Console, open **Authentication → Add user** and create a user with your
   staff email and a strong password.
3. Note the **UID** displayed in the Users list.
4. Open a terminal and run:

```bash
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.auth().setCustomUserClaims('YOUR_UID_HERE', { role: 'super_admin', clientIds: [] })
  .then(() => {
    return admin.firestore().collection('users').doc('YOUR_UID_HERE').set({
      email: 'YOUR_EMAIL',
      firstName: 'Your',
      lastName: 'Name',
      role: 'super_admin',
      clientIds: [],
      active: true,
      createdAt: new Date()
    }, { merge: true });
  })
  .then(() => { console.log('super_admin created'); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
"
```

Replace `YOUR_UID_HERE` and `YOUR_EMAIL` with real values.

**Option B: Firebase Console custom claims (limited)**

Firebase Console does not support setting custom claims through the UI.
You must use the Admin SDK (Option A) or deploy a temporary Cloud Function.

---

## Step 12 — Add Netlify Environment Variables

In the Netlify dashboard, open **Site configuration → Environment variables** and add:

| Variable | Value |
|---|---|
| `FIREBASE_API_KEY` | From your Firebase browser config |
| `FIREBASE_AUTH_DOMAIN` | `your-project-id.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | `your-project-id` |
| `FIREBASE_STORAGE_BUCKET` | `your-project-id.appspot.com` |
| `FIREBASE_MESSAGING_SENDER_ID` | From your Firebase browser config |
| `FIREBASE_APP_ID` | From your Firebase browser config |

The Netlify build command generates `portal/firebase-config.js` and `admin/firebase-config.js`
from these variables automatically.

---

## Step 13 — Add Production Domain to Firebase Auth

1. In the Firebase Console, open **Authentication → Settings → Authorized domains**.
2. Add your Netlify domain: `your-site.netlify.app`
3. If using a custom domain, add it too: `southernhabitatconsulting.com`

---

## Step 14 — Configure Email Templates (Optional)

Firebase handles password-reset and invitation emails through its own template system.

1. In the Firebase Console, open **Authentication → Templates**.
2. Customize the **Password reset** email subject and body to reflect SHC branding.
3. Set the **Action URL** to point to your production domain:
   `https://southernhabitatconsulting.com/portal/reset-password/`

For staff notifications (inquiry alerts, access request alerts), the Cloud Functions use
the `EMAIL_PROVIDER_API_KEY` and `NOTIFICATION_EMAIL` values you set in Step 10.
The functions use the Resend API format by default. Replace the `sendEmailNotification`
function in `functions/index.js` if you use a different provider (SendGrid, Postmark, etc.).

---

## Step 15 — Test Inquiry Forms

1. Open the contact page on your Netlify preview URL.
2. Submit the Private Lands form.
3. Verify a record appears in **Firestore → inquiries** in the Firebase Console.
4. If `NOTIFICATION_EMAIL` is set and the email provider key is valid, verify the notification email arrives.

---

## Step 16 — Test Client Onboarding (Fictional Data)

Use test data only. Do not use real client information for testing.

1. Sign in to `/admin/` with your super_admin account.
2. Create a client: **Clients → New Client** → name it `Test Client`.
3. Create a property: **Properties → New Property** → assign to Test Client.
4. Navigate to **Users & Access → Invite Client User**.
5. Enter a test email address and select Test Client.
6. The Cloud Function creates a Firebase Auth user and sends a password-reset email.
7. Click the link in the email, set a password, and sign in at `/portal/`.
8. Verify the portal shows the assigned property.

---

## Step 17 — Deploy Frontend to Netlify

If not already connected:

```bash
# Connect Netlify to your git repository
# Or drag and drop the project folder to app.netlify.com
```

The Netlify build command is already configured in `netlify.toml`.
Every push to your main branch triggers a new deploy.

---

## Step 18 — Add Custom Domain (Optional)

1. In the Netlify dashboard, open **Domain management → Add custom domain**.
2. Follow the DNS configuration instructions.
3. Add the custom domain to **Firebase Auth → Authorized domains** (Step 13).

---

## Step 19 — Verify Production Security

After deploying to production, verify the following manually:

- [ ] Unauthenticated request to `/portal/app/` redirects to `/portal/`
- [ ] Unauthenticated request to `/admin/` redirects to `/portal/`
- [ ] Client user cannot see `/admin/` (redirected to `/portal/unauthorized/`)
- [ ] Client user cannot read another client's data (test with Firestore REST API or emulator)
- [ ] Staff user can see all admin sections
- [ ] Contact form submits to Cloud Function, creates Firestore record
- [ ] Document download works (signed URL via Cloud Function)
- [ ] Disabled account cannot sign in

---

## Local Development with Firebase Emulators

The portal automatically connects to Firebase emulators when running on `localhost`.

Install the Java runtime (required by the Firestore emulator), then:

```bash
firebase emulators:start
```

Default emulator ports:
- Auth: http://localhost:9099
- Firestore: http://localhost:8080
- Storage: http://localhost:9199
- Functions: http://localhost:5001
- Emulator UI: http://localhost:4000

Copy the example config files for local use:

```bash
cp portal/firebase-config.js.example portal/firebase-config.js
cp admin/firebase-config.js.example  admin/firebase-config.js
# Edit both files and set useEmulators: true (default when apiKey is missing)
```

---

## Environment Variable Reference

| Variable | Where | Description |
|---|---|---|
| `FIREBASE_API_KEY` | Netlify | Browser-safe Firebase key |
| `FIREBASE_AUTH_DOMAIN` | Netlify | Firebase auth domain |
| `FIREBASE_PROJECT_ID` | Netlify | Firebase project ID |
| `FIREBASE_STORAGE_BUCKET` | Netlify | Firebase Storage bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | Netlify | Firebase sender ID |
| `FIREBASE_APP_ID` | Netlify | Firebase app ID |
| `EMAIL_PROVIDER_API_KEY` | Firebase Functions config | Resend/SendGrid/Postmark API key |
| `NOTIFICATION_EMAIL` | Firebase Functions config | Staff inbox for notifications |
| `EMAIL_FROM` | Firebase Functions config | Verified sender address |
| `PUBLIC_SITE_URL` | Firebase Functions config | Production site URL (for reset links) |

---

## Firestore Collections Created

| Collection | Access | Notes |
|---|---|---|
| `users` | Staff all, self own | User profiles + role |
| `clients` | Staff all, assigned clients | Client-safe fields |
| `clientsInternal` | Staff only | Internal notes |
| `clientUsers` | Staff all, own entries | Links users to clients |
| `properties` | Staff all, assigned clients | Client-safe fields |
| `propertiesInternal` | Staff only | Internal ownership notes |
| `propertySections` | Staff all, assigned clients | Most fields client-visible |
| `propertySectionsInternal` | Staff only | Internal notes only |
| `projects` | Staff all, published to clients | Client-safe fields |
| `projectsInternal` | Staff only | Financial details, internal notes |
| `projectActions` | Staff all, clients create own | Client decisions on projects |
| `workHistory` | Staff all, published to clients | — |
| `monitoringRecords` | Staff all, published to clients | — |
| `wildlifeSurveys` | Staff all, published to clients | — |
| `harvestRecords` | Staff all, published to clients | — |
| `budgets` | Staff all, published to clients | — |
| `budgetItems` | Staff all, assigned clients | — |
| `documents` | Staff all, published to clients | Client-safe fields |
| `documentsInternal` | Staff only | Internal notes, status history |
| `photographs` | Staff all, published to clients | — |
| `arcgisMaps` | Staff all, published to clients | — |
| `mapFiles` | Staff all, assigned clients | — |
| `messages` | Staff all, assigned clients | — |
| `messageEntries` | Staff all, non-internal to clients | — |
| `inquiries` | Staff only | Written by Cloud Function |
| `accessRequests` | Staff only | Written by Cloud Function |
| `notifications` | Staff all, own to clients | — |
| `auditLogs` | Staff only | Written by Cloud Functions only |
| `systemSettings` | super_admin only | — |
