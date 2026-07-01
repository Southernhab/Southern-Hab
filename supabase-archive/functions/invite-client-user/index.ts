// SHC — Supabase Edge Function: invite-client-user
// Staff-only. Creates a Supabase Auth invite and links the user to a client.
// Requires the caller to be authenticated as super_admin or staff_admin.
//
// Deploy: supabase functions deploy invite-client-user

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  // Verify the calling user is staff
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { data: profile } = await userClient.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['super_admin','staff_admin'].includes(profile.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden: staff_admin or super_admin required' }), { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 });
  }

  const email       = String(body.email || '').trim().toLowerCase();
  const clientId    = String(body.client_id   || '');
  const accessLevel = String(body.access_level || 'client_viewer');

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !clientId) {
    return new Response(JSON.stringify({ error: 'email and client_id are required' }), { status: 422 });
  }
  if (!['client_owner','client_viewer'].includes(accessLevel)) {
    return new Response(JSON.stringify({ error: 'access_level must be client_owner or client_viewer' }), { status: 422 });
  }

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Verify the client exists
  const { data: clientRecord } = await adminClient.from('clients').select('id,display_name').eq('id', clientId).single();
  if (!clientRecord) return new Response(JSON.stringify({ error: 'Client not found' }), { status: 404 });

  // Send the Supabase invite
  const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { role: accessLevel },
    redirectTo: Deno.env.get('PORTAL_SITE_URL') + '/portal/app/'
  });

  if (inviteErr) {
    return new Response(JSON.stringify({ error: inviteErr.message }), { status: 400 });
  }

  const newUserId = inviteData.user.id;

  // Set the role on the profile (trigger creates the profile row)
  await adminClient.from('profiles').upsert({
    id:   newUserId,
    email: email,
    role: accessLevel
  });

  // Link the user to the client
  const { error: linkErr } = await adminClient.from('client_users').upsert({
    client_id:    clientId,
    user_id:      newUserId,
    access_level: accessLevel,
    active:       true,
    invited_at:   new Date().toISOString()
  }, { onConflict: 'client_id,user_id' });

  if (linkErr) {
    return new Response(JSON.stringify({ error: 'User invited but could not be linked to client: ' + linkErr.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, user_id: newUserId, email }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
});
