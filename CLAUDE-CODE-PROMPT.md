# Build Constraints — RateRadar

## Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (auth + alert/preference storage)
- Recharts or Lightweight Charts for sparklines and detail charts

## Design System

```
Colors:
  primary:       #1E3A5F
  bg:            #F8FAFC
  surface:       #FFFFFF
  border:        #E2E8F0
  text-primary:  #0F172A
  text-secondary:#64748B
  accent:        #2563EB
  success:       #10B981
  error:         #EF4444
  warning:       #F59E0B

Typography:
  heading-font:  Plus Jakarta Sans
  body-font:     Inter
  data-font:     JetBrains Mono
  h1: 28px, weight 700
  h2: 22px, weight 600
  h3: 18px, weight 600
  body: 15px, line-height 1.5
  data: 14px, weight 500

Spacing:
  base-unit: 4px
  scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

Border Radius:
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px

Animation:
  fast:   120ms ease-out
  normal: 200ms ease-out
  slow:   400ms ease-out

Mode: light
```

Light mode primary. Deep navy (#1E3A5F) for brand trust. Success/error green/red map to favorable/unfavorable rate movements. JetBrains Mono for all currency figures and data tables.

Rate Score badge: 64px circular badge. Background interpolates: 0-30 = #EF4444, 31-60 = #F59E0B, 61-100 = #10B981. Score number in JetBrains Mono 24px weight 700 white.

Sparklines: 80px × 32px SVG. Stroke #2563EB at 1.5px. Fill #2563EB at 5% opacity. No axes.

## API Integrations

| API | Base URL | Auth | Purpose |
|-----|---------|------|---------|
| Frankfurter | `https://api.frankfurter.app` | None | Primary: current rates, historical time series, Rate Score computation |
| Currency-api | `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies` | None | Backup rates + extended currency coverage (150+) |
| VATComply | `https://api.vatcomply.com` | None | EU VAT rates for true-cost calculator (v2) |
| REST Countries | `https://restcountries.com/v3.1` | None | Country flags, currency names/symbols for UI enrichment |
| ipapi.co | `https://ipapi.co` | None | One-time visitor location detection for home currency auto-fill |

### Frankfurter API Patterns
- Latest rates: `GET /latest?from=USD&to=EUR,GBP`
- Historical date: `GET /2024-01-15?from=USD&to=EUR`
- Time series: `GET /2024-01-01..2025-01-01?from=USD&to=EUR`
- Conversion: `GET /latest?amount=1000&from=USD&to=EUR`

### Caching Rules
- Frankfurter: 5-minute TTL in sessionStorage (client) and API route cache (server)
- Currency-api: 1-hour TTL in sessionStorage
- VATComply: 7-day TTL in localStorage
- REST Countries: No expiry in localStorage (stable data)
- ipapi.co: Permanent localStorage (called once per new visitor, never re-fetched)

## Build Rules
- `npm run build` MUST pass before you consider any agent done
- No placeholder content (lorem ipsum, "coming soon", fake data) — use real API data everywhere
- No external images unless from a free CDN — use SVG icons and flag SVGs from REST Countries
- Error states must be visible in the UI, not just console.log — every API failure has a user-facing fallback
- Mobile-responsive by default — dashboard cards stack vertically on narrow screens
- Rate Score computation happens client-side from Frankfurter time series data — no server-side score storage
- Guest mode (localStorage) must be fully functional — auth is for persistence and alerts only
- All currency amounts rendered in JetBrains Mono with proper locale formatting (Intl.NumberFormat)
- Proxy external API calls through Next.js API routes to avoid CORS and enable server-side caching

## v1 Scope Boundary
- Landing page with 3 live Rate Score preview cards and "Track Your Currencies" CTA
- Auto-detect home currency via ipapi.co on first visit
- Currency pair picker with search, flag icons (REST Countries), supporting top 30 currencies
- Dashboard with Rate Score cards (score badge, daily change %, 30-day sparkline) for all tracked pairs
- Pair detail page with interactive line chart (30/90/365-day toggle), Rate Score history, and statistics (min, max, average, current percentile)
- Rate Score algorithm: percentile rank of today's rate within the lookback window, computed client-side from Frankfurter time series data
- Basic calculator: amount, from currency, to currency → converted amount + current rate + Rate Score context
- 1 rate alert per user (email notification when Rate Score crosses threshold)
- Guest mode with full functionality via localStorage
- Google OAuth signup for persistent state
- Free tier (3 pairs, 30-day history, 1 alert) + Pro tier ($14/mo, unlimited pairs, 365-day history, 20 alerts)
- Mobile-responsive layout
- Frankfurter as primary API, Currency-api as fallback for current rates
