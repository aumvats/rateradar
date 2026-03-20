# RateRadar — Implementation Plan

## Tech Stack
- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4 + `@tailwindcss/forms`
- **Database:** Supabase (PostgreSQL) — auth, alerts, user preferences
- **Auth:** Supabase Auth (Google OAuth only for v1)
- **Charts:** Recharts (line charts + sparklines via SVG)
- **APIs:** Frankfurter, Currency-api (fawazahmed0), REST Countries, ipapi.co
- **Email:** Supabase Edge Functions + Resend (for alert emails)
- **Cron:** Vercel Cron Jobs (every 6 hours for alert checks)
- **Deployment:** Vercel

## Project Setup
- **Package manager:** npm
- **Key dependencies:**
  - `@supabase/supabase-js` `@supabase/ssr`
  - `recharts`
  - `@tailwindcss/forms`
  - `next` `react` `react-dom` `typescript`
  - `resend` (server-side email)
  - `date-fns` (date formatting/manipulation)
  - `clsx` (conditional classnames)

- **`.env.local` contents:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
CRON_SECRET=
```

## File Structure
```
src/
├── app/
│   ├── layout.tsx                    # Root layout (fonts, providers)
│   ├── page.tsx                      # Landing page
│   ├── dashboard/
│   │   └── page.tsx                  # Main dashboard
│   ├── pair/
│   │   └── [from]/
│   │       └── [to]/
│   │           └── page.tsx          # Pair detail page
│   ├── calculator/
│   │   └── page.tsx                  # Currency calculator
│   ├── alerts/
│   │   └── page.tsx                  # Alert management (auth required)
│   ├── settings/
│   │   └── page.tsx                  # User settings (auth required)
│   └── api/
│       ├── rates/
│       │   └── route.ts              # Proxy: Frankfurter current rates
│       ├── timeseries/
│       │   └── route.ts              # Proxy: Frankfurter time series
│       ├── rates-backup/
│       │   └── route.ts              # Proxy: Currency-api backup
│       ├── countries/
│       │   └── route.ts              # Proxy: REST Countries
│       ├── alerts/
│       │   └── route.ts              # CRUD alert rules
│       └── cron/
│           └── check-alerts/
│               └── route.ts          # Cron job: evaluate alert thresholds
├── components/
│   ├── ui/
│   │   ├── RateScoreBadge.tsx        # Circular score badge (0-100, color-coded)
│   │   ├── Sparkline.tsx             # 80×32px SVG sparkline
│   │   ├── TrendArrow.tsx            # Up/down/flat trend indicator
│   │   ├── CurrencyPairCard.tsx      # Dashboard card (flags, score, sparkline)
│   │   ├── CurrencyPicker.tsx        # Searchable dropdown with flag icons
│   │   ├── LoadingSkeleton.tsx       # Skeleton loader for cards
│   │   └── Toast.tsx                 # Toast notifications
│   └── features/
│       ├── PairPickerModal.tsx       # Onboarding: pick home + target currencies
│       ├── AlertModal.tsx            # Create/edit alert rule modal
│       ├── RateChart.tsx             # Interactive line chart (30/90/365 toggle)
│       ├── PairStats.tsx             # Min/max/avg/volatility stat block
│       ├── CalculatorForm.tsx        # Amount + from/to currency form
│       └── DashboardHeader.tsx       # Header with nav + auth state
├── lib/
│   ├── api/
│   │   ├── frankfurter.ts            # Frankfurter API client
│   │   ├── currency-api.ts           # Fawazahmed0 fallback client
│   │   ├── countries.ts              # REST Countries client + cache
│   │   └── ipapi.ts                  # IP geolocation client
│   ├── rateScore.ts                  # Rate Score algorithm (percentile calc)
│   ├── storage.ts                    # localStorage helpers (pairs, prefs, cache)
│   ├── supabase/
│   │   ├── client.ts                 # Browser Supabase client
│   │   └── server.ts                 # Server Supabase client (SSR)
│   └── utils.ts                      # formatCurrency, formatDate, clsx helpers
└── types/
    └── index.ts                      # CurrencyPair, RateData, Alert, UserPrefs types
```

## Tailwind Config (exact design tokens)
```js
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      primary:    '#1E3A5F',
      bg:         '#F8FAFC',
      surface:    '#FFFFFF',
      border:     '#E2E8F0',
      'text-primary':   '#0F172A',
      'text-secondary': '#64748B',
      accent:     '#2563EB',
      success:    '#10B981',
      error:      '#EF4444',
      warning:    '#F59E0B',
    },
    fontFamily: {
      heading: ['Plus Jakarta Sans', 'sans-serif'],
      body:    ['Inter', 'sans-serif'],
      data:    ['JetBrains Mono', 'monospace'],
    },
    borderRadius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      full: '9999px',
    },
    transitionDuration: {
      fast:   '120ms',
      normal: '200ms',
      slow:   '400ms',
    },
  },
}
```

Google Fonts import in `layout.tsx`: Plus Jakarta Sans (700), Inter (400, 500), JetBrains Mono (500, 700).

## Pages & Routes

1. **`/` — Landing Page**
   - Hero: headline + subheadline + "Track Your Currencies" CTA button
   - 3 live Rate Score preview cards (EUR/USD, GBP/USD, JPY/USD) — fetched client-side on mount
   - IP detection runs on mount, stores result in localStorage
   - Feature highlights section (3 columns: Rate Score, Trends, Alerts)
   - Pricing section (Free / Pro cards)
   - "Track Your Currencies" opens `PairPickerModal`

2. **`/dashboard` — Main Dashboard**
   - Reads tracked pairs from localStorage (guest) or Supabase (auth)
   - Shows `CurrencyPairCard` grid for each tracked pair
   - Empty state: "No pairs tracked yet — Add your first currency pair"
   - Real-time refresh: stale localStorage data shown immediately, fresh fetch updates silently
   - Bell icon on each card opens `AlertModal`
   - Click card → navigate to `/pair/:from/:to`
   - Upgrade nudge when guest tries to add 4th pair

3. **`/pair/:from/:to` — Pair Detail**
   - Interactive `RateChart` with 30/90/365-day toggle
   - `RateScoreBadge` (large, 96px) with current score
   - `PairStats` block: today's rate, daily change, 30-day min/max/avg, percentile rank
   - Best/worst rate markers on chart
   - If alert triggered → show highlighted banner "Alert triggered: Score X, above threshold Y"

4. **`/calculator` — Calculator**
   - `CalculatorForm`: amount + from + to dropdowns
   - Result: converted amount (JetBrains Mono), current rate, timestamp
   - `RateScoreBadge` (small, 48px) below result with "better than X% of past year" label
   - 30-day mini chart showing trend with today marked
   - Share button: copies URL with `?amount=&from=&to=` query params
   - URL params pre-fill form on load

5. **`/alerts` — Alert Management** (auth required, redirect to login if not)
   - List of active alert rules (pair, threshold type, value, status)
   - Delete / edit buttons per alert
   - Alert history: triggered alerts with timestamps and rate achieved
   - Free tier: shows "1/1 alerts used" with upgrade CTA when at limit
   - Empty state: "No alerts yet — create one from any pair card"

6. **`/settings` — User Settings** (auth required)
   - Home currency selector
   - Email notification preferences (instant only for v1)
   - Plan display: current tier, upgrade/manage link
   - Sign out button

## Components Inventory

### `RateScoreBadge`
- **Props:** `score: number`, `size?: 'sm'|'md'|'lg'` (48/64/96px)
- **Logic:** bg color: 0-30 → `error`, 31-60 → `warning`, 61-100 → `success`
- **Render:** circular div, score in `font-data` white text

### `Sparkline`
- **Props:** `data: number[]`, `width?: number` (default 80), `height?: number` (default 32)
- **Logic:** compute min/max, map to SVG path, draw filled area below
- **Render:** SVG with `accent` stroke at 1.5px, `accent/5` fill

### `TrendArrow`
- **Props:** `change: number` (percentage, positive/negative/zero)
- **Render:** `↑` in `success`, `↓` in `error`, `—` in `text-secondary`

### `CurrencyPairCard`
- **Props:** `pair: CurrencyPair`, `rateData: RateData`, `onAlertClick: () => void`
- **Data:** flag pair (24px from REST Countries), Rate Score, daily change %, 30-day sparkline
- **Interactions:** card click → navigate to pair detail; bell click → alert modal

### `CurrencyPicker`
- **Props:** `value: string`, `onChange: (code: string) => void`, `currencies: Currency[]`
- **Render:** searchable dropdown, flag emoji + code + name per option

### `PairPickerModal`
- **Props:** `onComplete: (homeCurrency: string, targetCurrencies: string[]) => void`
- **State:** home currency (pre-filled from ipapi), selected targets (multi-select)
- **On submit:** store to localStorage, redirect to `/dashboard`

### `AlertModal`
- **Props:** `pair: CurrencyPair`, `existingAlert?: Alert`, `onClose: () => void`
- **Fields:** threshold type toggle (Rate Score / Exchange Rate), value input/slider, notify frequency
- **Validation:** check plan alert limit before save

### `RateChart`
- **Props:** `data: { date: string, rate: number, score: number }[]`, `lookback: 30|90|365`
- **Render:** Recharts `LineChart`, custom dot for today, toggle buttons (30/90/365)
- **Interactions:** hover tooltip with date, rate, score

### `PairStats`
- **Props:** `stats: { min, max, avg, current, percentile, volatility }`
- **Render:** 4-column stat grid in `font-data`

### `CalculatorForm`
- **Props:** none (self-contained with URL param sync)
- **State:** amount, fromCurrency, toCurrency, result, loading

## API Integration Plan

### Frankfurter — Primary
- **Base URL:** `https://api.frankfurter.app`
- **Endpoints used:**
  - `GET /latest?from={from}&to={to1},{to2}` — current multi-pair rates
  - `GET /{startDate}..{endDate}?from={from}&to={to}` — time series (Rate Score computation)
- **Auth:** None
- **Rate limits:** Unlimited
- **Proxied via:** `/api/rates` and `/api/timeseries` routes (server-side cache 5 min via `revalidate`)
- **Error handling:** on any non-200, set `frankfurterDown = true`, retry Currency-api fallback

### Currency-api (fawazahmed0) — Backup
- **Base URL:** `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies`
- **Endpoint:** `GET /{from}.json` → extract `{from}.{to}` key
- **Auth:** None
- **Rate limits:** Unlimited (CDN)
- **Proxied via:** `/api/rates-backup`
- **Error handling:** If also unavailable, restrict to ECB-covered pairs, show "Some currencies temporarily unavailable"

### REST Countries — Metadata & Flags
- **Base URL:** `https://restcountries.com/v3.1`
- **Endpoint:** `GET /currency/{code}` → get `flags.svg`, `currencies.{code}.symbol`, `name.common`
- **Proxied via:** `/api/countries`
- **Caching:** localStorage, no expiry. Hardcoded fallback for 30 common currencies (flag emoji map)

### ipapi.co — Geolocation
- **Base URL:** `https://ipapi.co`
- **Endpoint:** `GET /json` → `currency` field
- **Called:** once per new visitor, client-side on landing page mount
- **Caching:** localStorage key `raterade_home_currency`, never re-fetched
- **Error handling:** silently skip, default to USD

### VATComply — DEFERRED to v2
- Not implemented in v1

## Data Flow

**Guest flow:**
1. ipapi.co → `localStorage.raterade_home_currency`
2. User picks pairs → `localStorage.raterade_pairs` = `["EUR","GBP"]` (relative to home)
3. On dashboard load: read localStorage → render stale data → fetch `/api/rates` → recompute scores → update UI
4. Time series for Rate Score: fetch `/api/timeseries?from=USD&to=EUR&start={365daysAgo}&end={today}` → compute percentile client-side → cache in `sessionStorage` with 5-min TTL

**Authenticated flow:**
1. Supabase auth session in cookie
2. Pairs + alerts stored in Supabase `user_pairs` and `alerts` tables
3. Dashboard fetches from Supabase on load, then refreshes rates from API

**Rate Score algorithm (`lib/rateScore.ts`):**
```ts
function computeRateScore(currentRate: number, historicalRates: number[]): number {
  const below = historicalRates.filter(r => r <= currentRate).length
  return Math.round((below / historicalRates.length) * 100)
}
```
A score of 82 means today's rate is better than 82% of rates in the lookback window.

**Alert check cron (`/api/cron/check-alerts`):**
1. Fetch all active alerts from Supabase
2. Group by currency pair, fetch current rates from Frankfurter (single batched call per unique `from` currency)
3. Fetch 365-day time series for each unique pair, compute Rate Scores
4. For each alert: if threshold crossed → send email via Resend → update `alerts.last_triggered_at`
5. Auth: validate `Authorization: Bearer {CRON_SECRET}` header

## Supabase Schema

```sql
-- user_pairs table
CREATE TABLE user_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  home_currency text NOT NULL,
  target_currency text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- alerts table
CREATE TABLE alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  threshold_type text NOT NULL CHECK (threshold_type IN ('rate_score', 'exchange_rate')),
  threshold_value numeric NOT NULL,
  notify_once boolean DEFAULT false,
  active boolean DEFAULT true,
  last_triggered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- user_preferences table
CREATE TABLE user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users,
  home_currency text DEFAULT 'USD',
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  updated_at timestamptz DEFAULT now()
);
```

## Build Order

1. `npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"`
2. Install deps: `npm install @supabase/supabase-js @supabase/ssr recharts date-fns clsx resend @tailwindcss/forms`
3. Configure `tailwind.config.ts` with exact design tokens above; add Google Fonts import to `layout.tsx`
4. Create `src/types/index.ts` — `CurrencyPair`, `RateData`, `TimeSeries`, `Alert`, `UserPreferences`, `Currency`
5. Create `src/lib/utils.ts` — `formatCurrency()`, `formatDate()`, `formatPercent()`, `cn()` (clsx wrapper)
6. Create `src/lib/storage.ts` — `getTrackedPairs()`, `setTrackedPairs()`, `getHomeCurrency()`, `setHomeCurrency()`, `getCachedRates()`, `setCachedRates()`
7. Create `src/lib/rateScore.ts` — `computeRateScore()`, `computeStats()`
8. Create API route `/api/rates/route.ts` — proxy Frankfurter `/latest`
9. Create API route `/api/timeseries/route.ts` — proxy Frankfurter time series
10. Create API route `/api/rates-backup/route.ts` — proxy Currency-api fallback
11. Create API route `/api/countries/route.ts` — proxy REST Countries
12. Create `src/lib/api/frankfurter.ts` — `getCurrentRates()`, `getTimeSeries()` (uses `/api/rates` proxy)
13. Create `src/lib/api/currency-api.ts` — `getBackupRate()` (uses `/api/rates-backup` proxy)
14. Create `src/lib/api/countries.ts` — `getCurrencyMetadata()` with localStorage cache
15. Create `src/lib/api/ipapi.ts` — `detectHomeCurrency()` with localStorage guard
16. Create `src/lib/supabase/client.ts` and `server.ts`
17. Set up Supabase tables (run schema SQL above in Supabase dashboard)
18. Build `src/components/ui/RateScoreBadge.tsx`
19. Build `src/components/ui/Sparkline.tsx`
20. Build `src/components/ui/TrendArrow.tsx`
21. Build `src/components/ui/LoadingSkeleton.tsx`
22. Build `src/components/ui/Toast.tsx`
23. Build `src/components/ui/CurrencyPicker.tsx`
24. Build `src/components/ui/CurrencyPairCard.tsx`
25. Build `src/components/features/DashboardHeader.tsx` (nav with auth state)
26. Build `src/app/layout.tsx` — root layout wrapping font import + header
27. Build `src/app/page.tsx` — landing page (hero, 3 live cards, features, pricing)
28. Build `src/components/features/PairPickerModal.tsx`
29. Build `src/app/dashboard/page.tsx`
30. Build `src/components/features/RateChart.tsx`
31. Build `src/components/features/PairStats.tsx`
32. Build `src/app/pair/[from]/[to]/page.tsx`
33. Build `src/app/calculator/page.tsx` + `CalculatorForm.tsx`
34. Build `src/components/features/AlertModal.tsx`
35. Build `src/app/alerts/page.tsx`
36. Create `/api/alerts/route.ts` — GET/POST/DELETE alert rules
37. Build `src/app/settings/page.tsx`
38. Build `/api/cron/check-alerts/route.ts` — alert evaluation + email dispatch via Resend
39. Configure `vercel.json` with cron job: `"crons": [{"path": "/api/cron/check-alerts", "schedule": "0 */6 * * *"}]`

## Known Risks

- **Frankfurter time series performance:** Fetching 365 days for Rate Score requires a date-ranged query. Response is ~260 data points as JSON — well under 200ms client-side compute target. Cache aggressively in sessionStorage.
- **Currency-api endpoint format:** The `fawazahmed0` CDN uses `/{from}.json` returning a flat object. Edge case: currency code must be lowercase. Test fallback path explicitly.
- **ipapi.co rate limit:** 1,000 new visitors/day. If traffic spikes, new visitors won't get auto-detection but app still works. Acceptable for v1 scale.
- **REST Countries API stability:** Has had uptime issues historically. The hardcoded flag emoji fallback for 30 currencies must be complete before launch.
- **Vercel Cron + Supabase service role:** The cron route requires `SUPABASE_SERVICE_ROLE_KEY` — must not be exposed client-side. Validate `CRON_SECRET` header to prevent unauthorized triggering.
- **Auth-gated pages without redirect:** `/alerts` and `/settings` must check auth in server component and redirect to `/` (not `/login` since there's no login page — auth is via modal/Google OAuth).
- **Free vs Pro enforcement:** Guest users can have unlimited pairs in localStorage (v1 limitation — enforcement only after signup). Alert limit (1 for Free) enforced server-side in `/api/alerts` POST handler.

## Plugin Usage Notes
- **Builder:** Use `/feature-dev` for `RateChart.tsx` (complex Recharts integration with toggle + markers), `CalculatorForm.tsx` (URL param sync + dual API call chain), and `/api/cron/check-alerts/route.ts` (multi-step alert evaluation logic)
- **Builder:** Use `/frontend-design` for the landing page hero section and `CurrencyPairCard.tsx` with aesthetic direction: **light-first, clean financial dashboard, deep navy + bright blue accent on white, data-forward typography (JetBrains Mono for numbers)**
- **QA:** Run `silent-failure-hunter` on `src/lib/api/frankfurter.ts`, `src/lib/api/currency-api.ts`, and `/api/cron/check-alerts/route.ts`
- **QA:** Run `code-reviewer` on `src/lib/rateScore.ts` and `/api/alerts/route.ts` (auth + plan enforcement logic)
- **Designer:** Aesthetic direction is **light-first, minimal, financial trust** — deep navy primary, crisp white surfaces, JetBrains Mono for all numeric data, green/red only for rate signals

## Hardcoded Currency Fallback Map (top 30)
```ts
const CURRENCY_FALLBACK: Record<string, { flag: string; name: string; symbol: string }> = {
  USD: { flag: '🇺🇸', name: 'US Dollar', symbol: '$' },
  EUR: { flag: '🇪🇺', name: 'Euro', symbol: '€' },
  GBP: { flag: '🇬🇧', name: 'British Pound', symbol: '£' },
  JPY: { flag: '🇯🇵', name: 'Japanese Yen', symbol: '¥' },
  CAD: { flag: '🇨🇦', name: 'Canadian Dollar', symbol: '$' },
  AUD: { flag: '🇦🇺', name: 'Australian Dollar', symbol: '$' },
  CHF: { flag: '🇨🇭', name: 'Swiss Franc', symbol: 'Fr' },
  CNY: { flag: '🇨🇳', name: 'Chinese Yuan', symbol: '¥' },
  INR: { flag: '🇮🇳', name: 'Indian Rupee', symbol: '₹' },
  MXN: { flag: '🇲🇽', name: 'Mexican Peso', symbol: '$' },
  SGD: { flag: '🇸🇬', name: 'Singapore Dollar', symbol: '$' },
  HKD: { flag: '🇭🇰', name: 'Hong Kong Dollar', symbol: '$' },
  NOK: { flag: '🇳🇴', name: 'Norwegian Krone', symbol: 'kr' },
  SEK: { flag: '🇸🇪', name: 'Swedish Krona', symbol: 'kr' },
  DKK: { flag: '🇩🇰', name: 'Danish Krone', symbol: 'kr' },
  NZD: { flag: '🇳🇿', name: 'New Zealand Dollar', symbol: '$' },
  BRL: { flag: '🇧🇷', name: 'Brazilian Real', symbol: 'R$' },
  ZAR: { flag: '🇿🇦', name: 'South African Rand', symbol: 'R' },
  KRW: { flag: '🇰🇷', name: 'South Korean Won', symbol: '₩' },
  THB: { flag: '🇹🇭', name: 'Thai Baht', symbol: '฿' },
  PLN: { flag: '🇵🇱', name: 'Polish Zloty', symbol: 'zł' },
  CZK: { flag: '🇨🇿', name: 'Czech Koruna', symbol: 'Kč' },
  HUF: { flag: '🇭🇺', name: 'Hungarian Forint', symbol: 'Ft' },
  RON: { flag: '🇷🇴', name: 'Romanian Leu', symbol: 'lei' },
  TRY: { flag: '🇹🇷', name: 'Turkish Lira', symbol: '₺' },
  AED: { flag: '🇦🇪', name: 'UAE Dirham', symbol: 'د.إ' },
  SAR: { flag: '🇸🇦', name: 'Saudi Riyal', symbol: '﷼' },
  PHP: { flag: '🇵🇭', name: 'Philippine Peso', symbol: '₱' },
  IDR: { flag: '🇮🇩', name: 'Indonesian Rupiah', symbol: 'Rp' },
  MYR: { flag: '🇲🇾', name: 'Malaysian Ringgit', symbol: 'RM' },
}
```
