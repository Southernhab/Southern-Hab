// SHC Portal — Authentication helpers
// Depends on: portal/lib/supabase-client.js (window.shcSupabase)

(function () {
  'use strict';

  var sb = window.shcSupabase;

  window.shcAuth = {

    // ── getSession ────────────────────────────────────────────────────────────
    // Returns the current session or null.
    getSession: async function () {
      var result = await sb.auth.getSession();
      return result.data.session || null;
    },

    // ── getProfile ────────────────────────────────────────────────────────────
    // Fetches the current user's profile row (role, name, etc.).
    getProfile: async function () {
      var session = await this.getSession();
      if (!session) return null;
      var result = await sb.from('profiles').select('*').eq('id', session.user.id).single();
      return result.data || null;
    },

    // ── requireAuth ───────────────────────────────────────────────────────────
    // Call at the top of any authenticated page.
    // Redirects to /portal/ if not signed in, then returns { session, profile }.
    requireAuth: async function (options) {
      var opts = options || {};
      var session = await this.getSession();
      if (!session) {
        var returnTo = opts.returnTo || window.location.href;
        window.location.replace('/portal/?returnTo=' + encodeURIComponent(returnTo));
        return null;
      }
      var profile = await this.getProfile();
      if (!profile || !profile.active) {
        await sb.auth.signOut();
        window.location.replace('/portal/unauthorized/?reason=disabled');
        return null;
      }
      return { session: session, profile: profile };
    },

    // ── requireRole ───────────────────────────────────────────────────────────
    // Requires auth AND one of the given roles.
    // allowedRoles: string[] e.g. ['super_admin','staff_admin']
    requireRole: async function (allowedRoles, options) {
      var opts = options || {};
      var auth = await this.requireAuth(opts);
      if (!auth) return null;
      if (allowedRoles.indexOf(auth.profile.role) === -1) {
        window.location.replace('/portal/unauthorized/?reason=role');
        return null;
      }
      return auth;
    },

    // ── requireStaff ──────────────────────────────────────────────────────────
    requireStaff: async function () {
      return this.requireRole(['super_admin','staff_admin','field_staff']);
    },

    // ── requireAdmin ──────────────────────────────────────────────────────────
    requireAdmin: async function () {
      return this.requireRole(['super_admin','staff_admin']);
    },

    // ── requireClient ─────────────────────────────────────────────────────────
    requireClient: async function () {
      return this.requireRole(['client_owner','client_viewer']);
    },

    // ── signIn ────────────────────────────────────────────────────────────────
    signIn: async function (email, password) {
      return sb.auth.signInWithPassword({ email: email, password: password });
    },

    // ── signOut ───────────────────────────────────────────────────────────────
    signOut: async function () {
      await sb.auth.signOut();
      window.location.replace('/portal/');
    },

    // ── requestPasswordReset ──────────────────────────────────────────────────
    requestPasswordReset: async function (email, redirectTo) {
      return sb.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo || (window.location.origin + '/portal/reset-password/')
      });
    },

    // ── updatePassword ────────────────────────────────────────────────────────
    updatePassword: async function (newPassword) {
      return sb.auth.updateUser({ password: newPassword });
    },

    // ── onAuthChange ──────────────────────────────────────────────────────────
    // Subscribe to auth state changes. Returns the unsubscribe function.
    onAuthChange: function (callback) {
      var sub = sb.auth.onAuthStateChange(function (event, session) {
        callback(event, session);
      });
      return sub.data.subscription.unsubscribe;
    },

    // ── isStaff ───────────────────────────────────────────────────────────────
    isStaff: function (profile) {
      return profile && ['super_admin','staff_admin','field_staff'].indexOf(profile.role) !== -1;
    },

    // ── isAdmin ───────────────────────────────────────────────────────────────
    isAdmin: function (profile) {
      return profile && ['super_admin','staff_admin'].indexOf(profile.role) !== -1;
    },

    // ── isClient ──────────────────────────────────────────────────────────────
    isClient: function (profile) {
      return profile && ['client_owner','client_viewer'].indexOf(profile.role) !== -1;
    }

  };

})();
