# Dr. TAREK Quiz Platform - Phase 1

Phase 1 turns the project into a backend-backed quiz platform that is ready to push to GitHub and deploy on Vercel.

## What changed in Phase 1

- Server-authoritative quiz and play sessions
- Server-side scoring and answer validation
- Centralized config for class cards, timers, quiz passwords, teacher tests, custom questions, and question overrides
- Admin/account APIs with signed sessions and rate limiting on login
- Backend-backed analytics, leaderboard, notes, and exports
- Public pages no longer ship the answer bank scripts
- Service worker updated for the new runtime files

## Project structure

- `api/` serverless endpoints for Vercel
- `lib/` backend services and storage helpers
- `data/question-bank.json` canonical bundled question bank used by the backend
- `public-config-sync.js` syncs safe public config into the browser
- `quiz-runtime-v2.js` runs quiz pages against backend sessions
- `admin-config-sync.js` syncs admin changes to the backend

## Deployment target

This package is intended for:

- GitHub repository root upload
- Vercel Git import deployment

No build step is required.

For Vercel Hobby, the recommended deployment path is **GitHub -> Vercel import** rather than uploading source files from the CLI, because this repo includes many classroom image assets.

## Required environment variables

Set these in Vercel Project Settings -> Environment Variables:

- `ACCESS_ACCOUNTS_SESSION_SECRET`
- `BUILTIN_ADMINS_JSON`

Recommended for persistent production storage on Vercel:

- `KV_REST_API_URL` and `KV_REST_API_TOKEN`, or
- `REDIS_URL`

Optional:

- `ACCESS_ACCOUNTS_SESSION_TTL_SECONDS`
- `APP_CONFIG_STORAGE_KEY`
- `STUDENT_CLOUD_STORAGE_KEY`
- `ACCESS_ACCOUNTS_STORAGE_KEY`
- `ACCESS_ALLOW_HEADER_FALLBACK=0`

See `.env.example` for a ready template.

## Storage behavior

### Local development

If no KV/Redis variables are present, the app falls back to local JSON files created at runtime inside `data/`.

### Vercel / serverless

The runtime avoids writing to the deployment filesystem when `VERCEL=1`. Use KV or Redis for persistent production data.

## GitHub-safe repo notes

The repository now excludes mutable runtime data and local deployment files through `.gitignore`:

- `.vercel/`
- `node_modules/`
- local `.env*`
- mutable `data/access-accounts.json`
- mutable `data/student-cloud.json`
- mutable `data/app-config.json`

Only the canonical bundled question bank remains tracked in `data/question-bank.json`.

## Public pages and answer exposure

Student-facing pages now load:

- `public-config-sync.js`
- `student-cloud-client.js`
- `quiz-runtime-v2.js` or `play-test.js`

They no longer load the old answer-bank scripts in production page HTML.

## Local run options

You can run locally with any static/serverless-friendly workflow, for example:

- `vercel dev`
- a local Node-compatible serverless emulator

Because this project uses API routes, opening the HTML files directly from disk is not enough for the full Phase 1 flow.

## Notes for first deployment

1. Push the folder contents to the root of your GitHub repository.
2. Import the repository into Vercel.
3. Add the required environment variables.
4. Redeploy.
5. Log in to the admin panel and save your real settings/accounts.

## Cache reset after update

If you tested an older release before, clear old site data once so the new service worker cache takes over.
