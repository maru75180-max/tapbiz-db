TAPBIZ FREE BACKEND STARTER (Cloudflare Workers + D1)

This package includes your existing index.html plus a starter backend. The live website is NOT changed automatically. You must deploy/configure the backend and connect the frontend before it works end-to-end.

FREE-TIER APPROACH
- Keep GitHub Pages at https://maru75180-max.github.io/CyWeb/
- Cloudflare Worker handles admin login and shared data API.
- Cloudflare D1 stores the shared business list.
- No GitHub access token is needed; the database is separate from the repository and keeps secrets off the public page.

SETUP SUMMARY
1. Create a free Cloudflare account at https://dash.cloudflare.com/.
2. Workers & Pages -> Create -> Worker. Name it tapbiz-api and deploy a basic Worker.
3. Open the Worker -> Settings -> Bindings, add a D1 database binding named TAPBIZ_DB. Create a D1 database named tapbiz-db.
4. In the D1 Console, run the contents of schema.sql.
5. In Worker Settings -> Variables and Secrets, add secrets:
   ADMIN_PASSWORD = a long, unique password you do not use elsewhere
   SESSION_SECRET = a long random secret (at least 32 random characters)
6. Replace the Worker code with worker.js and deploy. Copy the Worker URL (for example https://tapbiz-api.YOUR-SUBDOMAIN.workers.dev).
7. The frontend still needs its API integration and admin login UI added before this is usable. Do not expose secrets in index.html.

IMPORTANT NOTES
- This backend restricts browser requests to the known GitHub Pages origin and uses an HttpOnly session cookie for admin operations.
- Keep the Worker URL on HTTPS.
- D1 starts with an empty list. Before switching the frontend, import/seed your current business list if you need to preserve it.
- Free plans have usage limits and terms that can change. Check Cloudflare's current plan details.
- This starter is not yet end-to-end connected to index.html; do not overwrite your live site and expect the feature to work until frontend integration is completed and tested.
