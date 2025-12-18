Runesse (Strict Mode) – Required Local Setup

This build intentionally enforces DB-backed email existence checks on /auth.

You MUST provide your database connection string locally (it is a secret and is not shipped in ZIP).

Create one (recommended):
1) apps/web/.env.local
   RUNESSE_DATABASE_URL=postgresql://...

Optionally also:
2) apps/db/.env
   RUNESSE_DATABASE_URL=postgresql://...

Then restart:
- Ctrl+C
- pnpm dev:web

If RUNESSE_DATABASE_URL is missing, /auth will show a clear setup message and Continue will not proceed.
