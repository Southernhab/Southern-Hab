---
name: Portal/Admin Config Pattern
description: How browser Supabase credentials are delivered to portal and admin pages without being committed to git.
---

## Pattern
Both `portal/config.js` and `admin/config.js` are **gitignored** and set `window.__SHC_CONFIG__ = { SUPABASE_URL, SUPABASE_ANON_KEY }`.

Example files (`portal/config.js.example`, `admin/config.js.example`) ARE committed.

## For Netlify production
`netlify.toml` build command runs a shell one-liner that echoes the config object from Netlify env vars into each file before Netlify deploys.

## For local development
Developer copies the `.example` file and fills in their Supabase project values.

## Load order on every portal/admin page
1. `portal/config.js` (or `admin/config.js`) — sets `window.__SHC_CONFIG__`
2. `portal/lib/supabase-client.js` — reads `window.__SHC_CONFIG__`, creates `window.shcSupabase`
3. `portal/lib/auth.js` — reads `window.shcSupabase`
4. `portal/lib/api.js` — reads `window.shcSupabase`
5. Page-specific JS (app.js or admin.js)

**Why:** Only the anon key goes to the browser; service-role key stays in Edge Function env vars.
