---
name: Contact Form Edge Function Pattern
description: How the public contact page submits to the Edge Function with graceful fallback to Netlify forms.
---

## Pattern
`contact/index.html` retains `data-netlify="true"` and `action="/thank-you.html"` on both forms.

A script at the bottom of the page:
1. Loads `<script src="/portal/config.js" onerror="void 0">` — silently fails if config is missing (local dev or unconfigured Netlify).
2. Reads `window.__SHC_CONFIG__`.
3. If config is present, intercepts `submit`, POSTs JSON to `SUPABASE_URL + '/functions/v1/submit-inquiry'`, then redirects to `/thank-you.html`.
4. If config is absent OR fetch fails, falls through to native form submit — Netlify form detection handles it.

## Field mapping (contact page → Edge Function)
- `name`, `email`, `phone`, `organization` → direct
- `location` → `property_location`
- `acreage` or `quantity` → `acreage`
- `details` (textarea) → `message`
- Form name → `inquiry_type` (`industrial_municipal` or `private_land`)

**Why:** Keeps the public site working on Netlify-only deploys while upgrading to the real backend when Supabase is configured.
