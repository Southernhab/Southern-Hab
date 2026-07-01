// SHC — Supabase Edge Function: request-access
// Handles portal access request form submissions.
// Stores to access_requests; does NOT create an account.
// Notifies staff by email if EMAIL_PROVIDER_API_KEY is configured.
//
// Deploy: supabase functions deploy request-access

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  Deno.env.get('PORTAL_SITE_URL') || '',
  'http://localhost:80',
  'http://localhost:3000'
].filter(Boolean);

const RATE_LIMIT_WINDOW_MS = 300 * 1000; // 5 minutes
const RATE_LIMIT_MAX       = 2;
const ipSubmissions        = new Map<string, { count: number; windowStart: number }>();

function corsHeaders(origin: string) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] || '*';
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

function isRateLimited(ip: string): boolean {
  const now  = Date.now();
  const info = ipSubmissions.get(ip);
  if (!info || now - info.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipSubmissions.set(ip, { count: 1, windowStart: now });
    return false;
  }
  info.count += 1;
  return info.count > RATE_LIMIT_MAX;
}

function sanitize(value: unknown, maxLen = 500): string | null {
  if (typeof value !== 'string') return null;
  return value.replace(/<[^>]*>/g, '').trim().slice(0, maxLen) || null;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '';
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(clientIp)) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
      status: 429, headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  // Honeypot
  if (body.website) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  const name  = sanitize(body.name);
  const email = sanitize(body.email);
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'Name and valid email are required.' }), {
      status: 422, headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { error: insertError } = await supabase.from('access_requests').insert({
    name:          name,
    email:         email,
    phone:         sanitize(body.phone),
    client_name:   sanitize(body.client_name),
    property_name: sanitize(body.property_name),
    message:       sanitize(body.message, 2000),
    status:        'pending'
  });

  if (insertError) {
    console.error('access_request insert error:', insertError.message);
    return new Response(JSON.stringify({ error: 'Could not save your request. Please email us directly.' }), {
      status: 500, headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  const emailKey = Deno.env.get('EMAIL_PROVIDER_API_KEY');
  if (emailKey) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + emailKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from:    Deno.env.get('NOTIFICATION_EMAIL_FROM') || 'noreply@southernhabitatconsulting.com',
          to:      [Deno.env.get('NOTIFICATION_EMAIL_TO')  || 'info@southernhabitatconsulting.com'],
          subject: '[SHC] Portal Access Request — ' + name,
          text:    `New portal access request.\n\nName: ${name}\nEmail: ${email}\nPhone: ${body.phone || '—'}\nClient: ${body.client_name || '—'}\nProperty: ${body.property_name || '—'}\nMessage: ${body.message || '—'}\n\nReview in the SHC admin at /admin/.`
        })
      });
    } catch (e) { console.error('email failed:', e); }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { ...headers, 'Content-Type': 'application/json' }
  });
});
