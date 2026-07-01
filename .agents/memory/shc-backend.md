---
name: SHC Backend Architecture
description: Overview of the Supabase+Netlify backend layered onto a plain static HTML site.
---

## Stack
- **Public site**: plain static HTML, no build step in Replit. Served by `static-web-server` locally, Netlify in production.
- **Backend**: Supabase Auth + PostgreSQL + Storage + Edge Functions.
- **Deployment**: Netlify. `netlify.toml` build command generates `portal/config.js` and `admin/config.js` from env vars.

## Key files
- `supabase/migrations/` — 4 SQL files: schema, RLS, views, indexes.
- `portal/lib/` — supabase-client.js, auth.js, api.js (shared JS library).
- `portal/app/` — authenticated SPA (index.html + app.js).
- `admin/` — staff SPA (index.html + admin.js).
- `supabase/functions/` — 3 Edge Functions: submit-inquiry, request-access, invite-client-user.

## Security boundary
- Client-facing API methods query `v_client_*` views; internal fields are stripped at the DB level.
- RLS on base tables is the actual security boundary — views are a usability layer.
- Service-role key only in Edge Functions (env vars, never in browser JS).
- Anon key is safe to expose in browser.

**Why:** Separating views from RLS provides defense in depth. A bug in a view won't expose data if RLS is correct.
