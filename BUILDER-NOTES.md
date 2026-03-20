# Builder Agent Notes

## Build Status
- npm run build: PASS
- Pages built: `/` (Landing), `/dashboard`, `/pair/[from]/[to]`, `/calculator`, `/alerts`, `/settings`
- API routes built: `/api/rates`, `/api/timeseries`, `/api/rates-backup`, `/api/countries`, `/api/alerts`, `/api/cron/check-alerts`
- Core feature working: YES (Rate Score computation, dashboard, pair detail charts, calculator)

## Architecture
- Next.js 16 (App Router, Turbopack) with TypeScript
- Tailwind CSS v4 with design tokens via `@theme inline` in globals.css
- Recharts for line charts and tooltips
- Custom SVG sparklines (80x32px, no library dependency)
- All API calls proxied through Next.js API routes (CORS-safe, server-cached)
- Guest mode fully functional via localStorage (no auth required)
- Rate Score computed client-side from Frankfurter 365-day time series

## Deferred / Skipped
- VATComply integration — deferred to v2 per plan
- Email digest — deferred to v2
- CSV export — deferred to v2
- "I exchanged" logging — deferred to v2
- Google OAuth — scaffolded (sign-in buttons present) but not wired (needs Supabase keys)
- Supabase auth flow — client/server helpers created, needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- Alert persistence — API route ready, needs Supabase tables created and keys configured
- Resend email sending — cron route ready, needs RESEND_API_KEY

## Known Issues
- Alerts page shows "sign in required" since Supabase is not configured — this is expected for the initial build
- Dashboard alert modal creates alerts client-side only (toast confirms) — server-side persistence requires Supabase
- `@tailwindcss/forms` installed but not explicitly imported (Tailwind v4 auto-detects plugins in node_modules)

## API Status
- Frankfurter (primary rates): Integrated, proxied via `/api/rates` and `/api/timeseries`
- Currency-api (backup): Integrated, proxied via `/api/rates-backup`
- REST Countries (metadata): Integrated, proxied via `/api/countries` with hardcoded fallback for 30 currencies
- ipapi.co (geolocation): Integrated, called once per new visitor on landing page
- VATComply: Not implemented (v2)

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=        # For auth + alert persistence
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # For auth + alert persistence
SUPABASE_SERVICE_ROLE_KEY=       # For cron job alert checking
RESEND_API_KEY=                  # For alert email notifications
CRON_SECRET=                     # For securing the cron endpoint
```

## Vercel Configuration
- `vercel.json` configured with cron job: `/api/cron/check-alerts` every 6 hours
