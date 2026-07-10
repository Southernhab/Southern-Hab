// SHC Portal — compatibility layer for Firebase claims and profile field names.
(function () {
  'use strict';

  var auth = window.shcAuth;
  var fbAuth = window.shcFirebaseAuth;
  if (!auth || !fbAuth) return;

  var STAFF_ROLES = ['super_admin', 'staff_admin', 'field_staff'];
  var ADMIN_ROLES = ['super_admin', 'staff_admin'];
  var CLIENT_ROLES = ['client_owner', 'client_viewer'];

  function roleFrom(value) {
    if (!value) return '';
    if (value.claims && value.claims.role) return value.claims.role;
    return value.role || '';
  }

  function normalizeProfile(profile, user, claims) {
    var p = Object.assign({}, profile || {});
    var first = p.firstName || p.first_name || (user && user.displayName ? user.displayName.split(' ')[0] : '');
    var last = p.lastName || p.last_name || (user && user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '');
    var role = (claims && claims.role) || p.role || '';

    p.id = p.id || (user && user.uid) || '';
    p.email = p.email || (user && user.email) || '';
    p.firstName = first;
    p.first_name = first;
    p.lastName = last;
    p.last_name = last;
    p.role = role;
    if (p.active === undefined) p.active = true;
    return p;
  }

  var originalRequireAuth = auth.requireAuth.bind(auth);
  auth.requireAuth = async function (options) {
    var result = await originalRequireAuth(options);
    if (!result) return null;
    result.profile = normalizeProfile(result.profile, result.user, result.claims || {});
    return result;
  };

  auth.getSession = async function () {
    return auth.requireAuth({ returnTo: window.location.href });
  };

  var originalGetProfile = auth.getProfile.bind(auth);
  auth.getProfile = async function () {
    var user = fbAuth.currentUser;
    var profile = await originalGetProfile();
    if (!user) return profile;
    var token = await user.getIdTokenResult(false).catch(function () { return { claims: {} }; });
    return normalizeProfile(profile, user, token.claims || {});
  };

  auth.getClientIds = async function () {
    var user = fbAuth.currentUser;
    if (!user) return [];

    var token = await user.getIdTokenResult(false);
    var ids = Array.isArray(token.claims.clientIds) ? token.claims.clientIds : [];

    // Newly assigned claims can remain cached until the token refreshes.
    if (!ids.length) {
      token = await user.getIdTokenResult(true);
      ids = Array.isArray(token.claims.clientIds) ? token.claims.clientIds : [];
    }

    return ids.filter(function (id) { return typeof id === 'string' && id.length > 0; });
  };

  auth.isStaff = function (value) { return STAFF_ROLES.indexOf(roleFrom(value)) !== -1; };
  auth.isAdmin = function (value) { return ADMIN_ROLES.indexOf(roleFrom(value)) !== -1; };
  auth.isClient = function (value) { return CLIENT_ROLES.indexOf(roleFrom(value)) !== -1; };
})();
