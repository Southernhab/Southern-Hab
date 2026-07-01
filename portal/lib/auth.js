// SHC Portal — Authentication helpers (Firebase Auth)
// Depends on: portal/lib/firebase-client.js (window.shcFirebaseAuth, window.shcDb)
//
// Preserves the same window.shcAuth interface so portal/app/app.js and
// admin/admin.js require minimal changes.

(function () {
  'use strict';

  var fbAuth = window.shcFirebaseAuth;
  var db     = window.shcDb;

  var STAFF_ROLES  = ['super_admin', 'staff_admin', 'field_staff'];
  var ADMIN_ROLES  = ['super_admin', 'staff_admin'];
  var CLIENT_ROLES = ['client_owner', 'client_viewer'];

  // ── Internal helpers ──────────────────────────────────────────────────────

  // Returns the Firebase user's ID token claims (includes role, clientIds).
  async function getClaims(user) {
    try {
      var result = await user.getIdTokenResult(false);
      return result.claims || {};
    } catch (e) {
      return {};
    }
  }

  // Fetches the Firestore profile for the user (firstName, lastName, etc.).
  // Falls back gracefully if the document hasn't been created yet.
  async function fetchProfile(uid) {
    try {
      var snap = await db.collection('users').doc(uid).get();
      if (snap.exists) return { id: uid, ...snap.data() };
    } catch (e) {
      console.warn('SHC: Could not fetch user profile:', e.code);
    }
    return null;
  }

  // Returns a unified auth object: { user, claims, profile } or null.
  async function getAuth() {
    var user = fbAuth.currentUser;
    if (!user) return null;

    // Force-refresh token if it's more than 50 minutes old
    await user.getIdToken(false);
    var claims  = await getClaims(user);
    var profile = await fetchProfile(user.uid);

    return {
      user:    user,
      claims:  claims,
      profile: profile || {
        id:        user.uid,
        email:     user.email,
        firstName: user.displayName ? user.displayName.split(' ')[0] : '',
        lastName:  user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
        role:      claims.role || '',
        active:    true
      }
    };
  }

  // ── window.shcAuth ────────────────────────────────────────────────────────

  window.shcAuth = {

    // ── getCurrentUser ────────────────────────────────────────────────────
    getCurrentUser: function () {
      return fbAuth.currentUser;
    },

    // ── getSession (compatibility alias — returns { user, claims, profile }) ──
    getSession: async function () {
      return getAuth();
    },

    // ── getProfile ────────────────────────────────────────────────────────
    getProfile: async function () {
      var user = fbAuth.currentUser;
      if (!user) return null;
      return fetchProfile(user.uid);
    },

    // ── requireAuth ───────────────────────────────────────────────────────
    // Waits for Firebase to resolve the initial auth state (handles page refresh).
    // Redirects to /portal/ if not signed in. Returns { user, claims, profile }.
    requireAuth: async function (options) {
      var opts = options || {};
      return new Promise(function (resolve) {
        var unsubscribe = fbAuth.onAuthStateChanged(async function (user) {
          unsubscribe();

          if (!user) {
            var returnTo = opts.returnTo || window.location.href;
            window.location.replace('/portal/?returnTo=' + encodeURIComponent(returnTo));
            resolve(null);
            return;
          }

          // Check account is not disabled (Firebase handles this in auth, but
          // also check our Firestore active flag for soft-deactivation)
          var claims  = await getClaims(user);
          var profile = await fetchProfile(user.uid);

          if (profile && profile.active === false) {
            await fbAuth.signOut();
            window.location.replace('/portal/unauthorized/?reason=disabled');
            resolve(null);
            return;
          }

          // Synthesize profile if Firestore document is not yet created
          if (!profile) {
            profile = {
              id:        user.uid,
              email:     user.email,
              firstName: user.displayName ? user.displayName.split(' ')[0] : '',
              lastName:  user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
              role:      claims.role || '',
              active:    true
            };
          }

          // Update lastLoginAt (non-blocking)
          db.collection('users').doc(user.uid).set(
            { lastLoginAt: new Date().toISOString() }, { merge: true }
          ).catch(function () {});

          resolve({ user: user, claims: claims, profile: profile });
        });
      });
    },

    // ── requireRole ───────────────────────────────────────────────────────
    requireRole: async function (allowedRoles, options) {
      var auth = await this.requireAuth(options);
      if (!auth) return null;
      if (allowedRoles.indexOf(auth.claims.role || auth.profile.role) === -1) {
        window.location.replace('/portal/unauthorized/?reason=role');
        return null;
      }
      return auth;
    },

    // ── requireStaff ──────────────────────────────────────────────────────
    requireStaff: async function () {
      return this.requireRole(STAFF_ROLES);
    },

    // ── requireAdmin ──────────────────────────────────────────────────────
    requireAdmin: async function () {
      return this.requireRole(ADMIN_ROLES);
    },

    // ── requireClient ─────────────────────────────────────────────────────
    requireClient: async function () {
      return this.requireRole(CLIENT_ROLES);
    },

    // ── signIn ────────────────────────────────────────────────────────────
    signIn: async function (email, password) {
      return fbAuth.signInWithEmailAndPassword(email, password);
    },

    // ── signOut ───────────────────────────────────────────────────────────
    signOut: async function () {
      await fbAuth.signOut();
      window.location.replace('/portal/');
    },

    // ── requestPasswordReset ──────────────────────────────────────────────
    requestPasswordReset: async function (email, redirectUrl) {
      return fbAuth.sendPasswordResetEmail(email, {
        url: redirectUrl || window.location.origin + '/portal/'
      });
    },

    // ── confirmPasswordReset ──────────────────────────────────────────────
    confirmPasswordReset: async function (oobCode, newPassword) {
      return fbAuth.confirmPasswordReset(oobCode, newPassword);
    },

    // ── verifyPasswordResetCode ───────────────────────────────────────────
    verifyPasswordResetCode: async function (oobCode) {
      return fbAuth.verifyPasswordResetCode(oobCode);
    },

    // ── onAuthChange ──────────────────────────────────────────────────────
    onAuthChange: function (callback) {
      return fbAuth.onAuthStateChanged(function (user) {
        callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', user);
      });
    },

    // ── Role helpers ──────────────────────────────────────────────────────
    isStaff: function (profileOrClaims) {
      var r = profileOrClaims && (profileOrClaims.role || '');
      return STAFF_ROLES.indexOf(r) !== -1;
    },
    isAdmin: function (profileOrClaims) {
      var r = profileOrClaims && (profileOrClaims.role || '');
      return ADMIN_ROLES.indexOf(r) !== -1;
    },
    isClient: function (profileOrClaims) {
      var r = profileOrClaims && (profileOrClaims.role || '');
      return CLIENT_ROLES.indexOf(r) !== -1;
    },

    // ── getClientIds ─────────────────────────────────────────────────────
    // Returns the array of clientIds from the current user's ID token claims.
    getClientIds: async function () {
      var user = fbAuth.currentUser;
      if (!user) return [];
      var claims = await getClaims(user);
      return Array.isArray(claims.clientIds) ? claims.clientIds : [];
    }

  };

})();
