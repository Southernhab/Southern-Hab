// SHC — Supabase Edge Function: submit-inquiry
// Handles public contact form submissions from the website.
// Runs server-side; the service-role key never reaches the browser.
//
// Deploy: supabase functions deploy submit-inquiry
// Environment variables required (set with supabase secrets set):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   NOTIFICATION_EMAIL_TO, NOTIFICATION_EMAIL_FROM, EMAIL_PROVIDER_API_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  Deno.env.get('PUBLIC_SITE_URL') || '',
  'http://localhost:80',
  'http://localhost:3000'
].filter(Boolean);

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX       = 3;         // max submissions per IP per window
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
  if (info.count > RATE_LIMIT_MAX) return true;
  return false;
}

function sanitizeText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value.replace(/<[^>]*>/g, '').trim().slice(0, 4000) || null;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '';
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  // Rate limiting by IP
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(clientIp)) {
    return new Response(JSON.stringify({ error: 'Too many submissions. Please wait a minute and try again.' }), {
      status: 429, headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
      status: 400, headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  // Honeypot check
  if (body.website || body.url || body.bot_field) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  // Required fields
  const name  = sanitizeText(body.name);
  const email = sanitizeText(body.email);
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'Name and a valid email address are required.' }), {
      status: 422, headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  // Spam signal check: reject messages that look like link spam
  const message = sanitizeText(body.message) || '';
  const spamPatterns = [/https?:\/\//i, /\[url=/i, /casino|poker|viagra|lottery|prize/i];
  const spamScore = spamPatterns.filter(p => p.test(message + name)).length;
  if (spamScore >= 2) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  // Insert into inquiries using service-role key (bypasses RLS)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const inquiryType = String(body.inquiry_type || 'general');
  const { error: insertError } = await supabase.from('inquiries').insert({
    inquiry_type:       ['private_land','industrial_municipal','general'].includes(inquiryType) ? inquiryType : 'general',
    name:               name,
    email:              email,
    phone:              sanitizeText(body.phone),
    organization:       sanitizeText(body.organization),
    property_location:  sanitizeText(body.property_location),
    property_type:      sanitizeText(body.property_type),
    acreage:            sanitizeText(body.acreage),
    requested_services: sanitizeText(body.requested_services),
    message:            message || null,
    referral_source:    sanitizeText(body.referral_source),
    source_page:        sanitizeText(body.source_page),
    status:             'new'
  });

  if (insertError) {
    console.error('inquiry insert error:', insertError.message);
    return new Response(JSON.stringify({ error: 'Could not save your submission. Please try again or email us directly.' }), {
      status: 500, headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  // Email notification (optional — only if EMAIL_PROVIDER_API_KEY is configured)
  const emailKey = Deno.env.get('EMAIL_PROVIDER_API_KEY');
  if (emailKey) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + emailKey,
          'Content-Type':  'application/json'
        },
        body: JSON.stringify({
          from:    Deno.env.get('NOTIFICATION_EMAIL_FROM') || 'noreply@southernhabitatconsulting.com',
          to:      [Deno.env.get('NOTIFICATION_EMAIL_TO')  || 'info@southernhabitatconsulting.com'],
          subject: '[SHC] New Website Inquiry — ' + name,
          text:    `New inquiry received.\n\nType: ${inquiryType}\nName: ${name}\nEmail: ${email}\nPhone: ${body.phone || '—'}\nMessage:\n${message}`
        })
      });
    } catch (emailErr) {
      // Email failure is non-fatal; inquiry is already saved
      console.error('email notification failed:', emailErr);
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { ...headers, 'Content-Type': 'application/json' }
  });
});
