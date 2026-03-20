# RateRadar — Product Specification

> A currency monitoring dashboard that gives small businesses a "weather forecast" for exchange rates — see a simple 0-100 favorability score for every currency pair you care about.

---

## 1. Product Overview

RateRadar is a real-time currency monitoring dashboard that shows small businesses when exchange rates are favorable. Import/export businesses, international freelancers, and cross-border e-commerce owners track 3-10 currency pairs and need to know when to make transfers — but existing tools are either consumer-grade converters (XE) or enterprise trading platforms (OANDA). RateRadar combines free exchange rate APIs with a Rate Score algorithm that computes a 0-100 favorability percentile for each currency pair based on historical data, turning "should I exchange now?" from a guess into a glanceable, data-driven decision. The alternative today is checking XE.com daily and guessing, or building a spreadsheet that nobody maintains.

---

## 2. Target Personas

### Persona 1: Small Import Business Owner
- **Role:** Owner of a 5-15 person e-commerce company sourcing products from China and Europe
- **Core pain:** "I wire $15K-50K monthly to suppliers and never know if I'm getting a good rate — I just send when the invoice is due and hope for the best"
- **Price sensitivity:** Pays $30-100/mo for QuickBooks, Shopify, and other SaaS tools. A $14/mo tool that saves even 1% on $50K monthly FX = $500/mo saved — obvious ROI.
- **First "aha" moment:** Sees their USD→EUR Rate Score is 82 with a green indicator, immediately understands "today is a better-than-average day to pay my German supplier"

### Persona 2: International Freelancer / Consultant
- **Role:** Design or engineering consultant in the UK billing US and EU clients
- **Core pain:** "I invoice in USD and EUR but get paid in GBP — I have no idea if I'm losing money on conversion timing or gaining"
- **Price sensitivity:** Keeps tools lean at $10-30/mo total. Uses Wise for transfers, Wave for invoicing. Needs clear ROI for any new subscription.
- **First "aha" moment:** Sees a 30-day trend chart showing GBP/USD dropped 3% over the past week — realizes they should have invoiced last week, and sets an alert so they don't miss the next favorable window

### Persona 3: Cross-border E-commerce Seller
- **Role:** Etsy/Shopify seller shipping handmade goods from Portugal to US/UK/EU markets
- **Core pain:** "I price products in USD and GBP but my costs are in EUR — when the euro strengthens, my margins vanish and I don't notice until the end of the month"
- **Price sensitivity:** Spends $29-79/mo on Shopify + apps. Margins are 20-40%, so a 2-3% currency swing can wipe out profit on a batch of orders.
- **First "aha" moment:** Opens the dashboard, sees EUR/USD Rate Score dropped to 23 (unfavorable for someone earning USD and spending EUR), and gets a clear signal to reprice their US store by 5%

---

## 3. API Integrations

### Frankfurter (Primary Data Source)
- **Base URL:** `https://api.frankfurter.app`
- **Auth:** None
- **Rate limit:** Unlimited
- **Data provided:** Current exchange rates, historical rates by date, time series over date ranges, and direct currency conversion. Sources rates from the European Central Bank (ECB). Supports ~30 major currencies.
- **Product usage:** Primary data source for all rate data and Rate Score computation. On dashboard load, fetches current rates for tracked pairs via `/latest?from=USD&to=EUR,GBP`. For Rate Score, fetches 365-day time series via `/{start}..{end}?from=USD&to=EUR` and computes the percentile ranking of today's rate client-side. Powers the historical trend charts, sparklines, min/max/average statistics, and daily change calculations.
- **Failure handling:** Fall back to Currency-api (fawazahmed0) for current rates. Historical Rate Scores use locally cached time series (refreshed daily, stored in sessionStorage). Display a subtle "Rates may be delayed" banner in the dashboard header. Dashboard remains fully functional from cache for up to 24 hours.

### Currency-api (fawazahmed0) — Backup & Extended Coverage
- **Base URL:** `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies`
- **Auth:** None
- **Rate limit:** Unlimited (CDN-hosted)
- **Data provided:** Exchange rates for 150+ currencies including many that Frankfurter/ECB doesn't cover (e.g., THB, VND, NGN, ARS).
- **Product usage:** Backup data source when Frankfurter is down. Primary source for currencies outside ECB coverage — when a user tracks a pair involving a non-ECB currency, this API serves the data. Used in the calculator page for broader currency selection.
- **Failure handling:** CDN-hosted, so downtime is extremely rare. If unavailable, the app restricts currency selection to Frankfurter-supported currencies only and shows "Some currencies temporarily unavailable" in the picker.

### VATComply — VAT Rates for Calculator
- **Base URL:** `https://api.vatcomply.com`
- **Auth:** None
- **Rate limit:** ~1,000 req/day (no auth, public API)
- **Data provided:** VAT rates by EU country, EU VAT number validation, and exchange rates as a secondary source.
- **Product usage:** Powers the "True Cost" mode in the calculator (v2 feature). When a user calculates a cross-border payment to an EU country, adds the applicable VAT rate to show total cost. Example: $10,000 USD to Germany at 0.923 EUR/USD + 19% VAT = true cost of €10,983.70. Fetched via `/rates?country=DE`.
- **Failure handling:** If VATComply is down, the calculator shows conversion without VAT and displays "VAT rates temporarily unavailable — amount shown excludes VAT." VAT rates change at most yearly; cached locally with 7-day TTL.

### REST Countries — Country Metadata & Flags
- **Base URL:** `https://restcountries.com/v3.1`
- **Auth:** None
- **Rate limit:** ~1,000 req/day (no auth required, CDN-hosted)
- **Data provided:** Country metadata including SVG flags, official currency codes, currency names, currency symbols, languages, and region data.
- **Product usage:** Enriches the dashboard UI with country flags next to currency codes, full currency names in tooltips, and currency symbol formatting. Fetched once on app initialization via `/currency/{code}` and cached in localStorage indefinitely (country data is stable).
- **Failure handling:** If unavailable on first load, use a hardcoded fallback map for the 30 most common currencies (flag emoji + currency name + symbol). If cached data exists from a previous session, use the cache. Dashboard functionality is completely unaffected — flags are cosmetic enrichment.

### ipapi.co — Visitor Location Detection
- **Base URL:** `https://ipapi.co`
- **Auth:** None
- **Rate limit:** 1,000 requests/day free
- **Data provided:** IP-based geolocation including country code, city, currency code, and timezone.
- **Product usage:** Called exactly once per new visitor (first page load) to auto-detect the user's home currency. Result stored in localStorage and never re-fetched. Used via `/json` to get the visitor's currency code (e.g., `"currency": "INR"`). Personalizes onboarding: "Looks like you're in India — we've set INR as your home currency."
- **Failure handling:** If unavailable, skip auto-detection and show a currency picker dropdown defaulting to USD. User manually selects their home currency. The 1,000/day limit supports 1,000 unique new visitors/day — sufficient for early growth.

### API Cost Per User Analysis

| API | Calls/User/Month (Free) | Calls/User/Month (Pro) | Free Tier Capacity | Bottleneck? |
|-----|-------------------------|------------------------|--------------------|-------------|
| Frankfurter | ~150 (3 pairs × ~1.5 calls/day × 30) | ~450 (10 pairs) | Unlimited | No |
| Currency-api | ~50 (fallback/extended currencies) | ~150 | Unlimited (CDN) | No |
| VATComply | 0 (v2 feature) | ~10 | Unknown, no auth | No |
| REST Countries | ~1 (cached after first load) | ~1 | Unknown, no auth | No |
| ipapi.co | 1 (first visit only) | 1 | 1,000/day | No — supports 1K new visitors/day |

**Conclusion:** No paid API tier is needed at any scale. At 1,000 paying subscribers generating ~450 calls/month each, Frankfurter handles 450K calls/month on its unlimited free tier. All other APIs are negligible.

---

## 4. Core User Flows

### Onboarding Flow (3 steps, under 30 seconds)

1. **User lands on homepage** → System auto-detects location via ipapi.co → Hero section shows 3 live Rate Score cards (EUR/USD, GBP/USD, JPY/USD) with real data. User sees Rate Scores immediately — no clicks needed for the first "aha."
2. **User clicks "Track Your Currencies"** → Modal shows: "Your home currency" (pre-filled from IP detection, e.g., "GBP 🇬🇧") + "Currencies you deal with" (searchable multi-select with flag icons). User picks 2-3 currencies. System fetches rates from Frankfurter and computes Rate Scores in real-time.
3. **Dashboard populates instantly** → User sees their personalized dashboard with Rate Score cards, trend arrows, and 30-day sparklines. Toast: "Bookmark this page to check daily. Sign up free to save your pairs and set alerts." System stores pair selection in localStorage for guests.

### Flow 1: Daily Rate Check

1. User opens RateRadar (bookmarked URL or email digest link).
2. System loads cached pair data from localStorage, renders dashboard immediately with stale data.
3. System fetches fresh rates from Frankfurter in background, updates cards with new Rate Scores and daily change percentages.
4. User scans dashboard — notices EUR/USD Rate Score jumped from 45 yesterday to 78 today.
5. User clicks the EUR/USD card → navigates to `/pair/eur/usd` detail page with full chart (30/90/365 day toggle), Rate Score history, best/worst markers, and average line.
6. User decides conditions are favorable and makes a transfer via their bank or Wise.

### Flow 2: Set and Receive a Rate Alert

1. User clicks the bell icon on a currency pair card from the dashboard.
2. Alert modal opens: "Alert me when [USD→EUR] Rate Score is above [___]" with a slider (0-100, default 75).
3. User sets threshold to 80, enters their email, clicks "Create Alert."
4. System saves alert config. A background check runs every 6 hours, fetching fresh rates from Frankfurter and computing the Rate Score.
5. Rate crosses the threshold → system sends email: "USD→EUR Rate Score hit 83 — better than 83% of the past year."
6. User clicks email link → opens `/pair/usd/eur` with today's rate highlighted on the chart and a "Rate Score: 83" badge.

---

## 5. Design System

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

**Design rationale:** Light mode is primary because the target audience — small business owners, accountants, operations managers — works in well-lit office environments and expects financial tools to look clean and trustworthy. The deep navy primary (#1E3A5F) communicates reliability and stability. Bright blue accent (#2563EB) provides clear interactive affordance on white surfaces. Success green (#10B981) and error red (#EF4444) map naturally to favorable/unfavorable rate movements, making the dashboard instantly scannable. JetBrains Mono for currency figures ensures tabular number alignment and precise readability of financial data.

**Key component notes:**
- **Rate Score badge:** Circular badge, 64px diameter. Background color interpolates: score 0-30 = error (#EF4444), 31-60 = warning (#F59E0B), 61-100 = success (#10B981). Number rendered in data-font at 24px weight 700, white text.
- **Currency pair card:** Surface background, border, md radius. Contains: flag pair (24px SVG), pair label (h3), Rate Score badge, daily change % (success/error colored), 30-day sparkline (80px wide, accent color stroke, no axes).
- **Sparkline:** 80px × 32px SVG path. Stroke: accent (#2563EB) at 1.5px. Fill: accent at 5% opacity below the line. No axis labels.
- **Trend arrow:** 12px inline SVG. Up arrow: success color, rotated 0°. Down arrow: error color, rotated 180°. Flat dash: text-secondary.

---

## 6. Routes

| Path | Page Name | Auth Required | Description |
|------|-----------|---------------|-------------|
| `/` | Landing | No | Marketing page with live Rate Score previews for 3 popular pairs, value proposition, and "Track Your Currencies" CTA |
| `/dashboard` | Dashboard | No (guest mode) / Yes (saved state) | Main monitoring view — all tracked pairs with Rate Score cards, sparklines, daily change, and alert indicators |
| `/pair/:from/:to` | Pair Detail | No | Deep-dive on one currency pair — interactive chart with 30/90/365-day toggle, Rate Score history, statistics (min, max, avg, volatility), and best/worst rate markers |
| `/calculator` | Calculator | No | Currency conversion calculator with amount input, pair selection, current rate, and Rate Score context badge |
| `/alerts` | Alerts | Yes | Manage rate alert rules (create, edit, delete), view alert history with triggered/pending status |
| `/settings` | Settings | Yes | Account preferences: home currency, email notification frequency, display preferences, plan management |

---

## 7. Pricing

### Free — $0/mo
- Track up to 3 currency pairs
- Rate Score for all tracked pairs
- 30-day historical charts and sparklines
- 1 rate alert (email notification)
- Basic calculator (conversion only, no VAT)
- Guest mode — works without signup via localStorage
- **Who it's for:** Freelancers or small sellers who deal with 1-2 foreign currencies occasionally
- **Upgrade trigger:** User tries to add a 4th pair → shown "Upgrade to Pro for unlimited pairs and 365-day history"

### Pro — $14/mo
- Unlimited currency pairs
- 365-day historical charts and Rate Score history
- 20 rate alerts with email notifications
- Daily or weekly email digest summarizing all pairs
- Full calculator with Rate Score context
- CSV export of rate history
- "I exchanged" logging to track actual rates achieved and savings over time
- **Who it's for:** Freelancers and small business owners who move money across borders monthly and want to time transfers better

### Business — $29/mo
- Everything in Pro
- Up to 5 team members with shared dashboard
- Custom branding on exported reports
- API access (REST) for integration with invoicing or ERP tools
- Multi-currency cost impact estimation (enter monthly spend per currency, see projected impact of rate changes)
- Priority email support
- **Who it's for:** Small import/export companies and agencies with multiple people involved in international payments

---

## 8. Key User Flows (Detailed)

### 8.1 First Visit → Personalized Dashboard

1. Visitor lands on `/` → sees hero section with 3 live Rate Score cards (EUR/USD, GBP/USD, JPY/USD) showing real scores computed from Frankfurter data.
2. System calls `ipapi.co/json` → detects visitor is in the UK → pre-fills "Your currency: GBP 🇬🇧" in the currency picker section below the hero.
3. Visitor clicks "Track Your Currencies" → currency picker modal opens with GBP pre-selected as home currency. Multi-select for target currencies with search and flag icons (data from REST Countries).
4. Visitor selects EUR, USD, CHF → system fetches current rates and 30-day time series from Frankfurter for GBP→EUR, GBP→USD, GBP→CHF. Computes Rate Scores client-side.
5. Redirected to `/dashboard` → sees 3 pair cards with Rate Scores (e.g., GBP→EUR: 71, GBP→USD: 45, GBP→CHF: 58), sparklines, and daily change percentages. Dashboard is fully interactive.
6. Toast notification: "Your dashboard is saved in this browser. Sign up free to sync across devices and set alerts."
7. **Error states:** (a) ipapi.co fails → currency picker shows with no pre-fill, defaults to USD. (b) Frankfurter fails → show 3 skeleton cards with "Connecting to rate feeds..." message; retry every 10 seconds up to 3 times, then show "Rate data temporarily unavailable. Please refresh in a few minutes." (c) REST Countries fails → currency picker shows currency codes without flags; functional but less polished.

### 8.2 Rate Alert Lifecycle

1. Authenticated user on `/dashboard` clicks the bell icon on their GBP→EUR card.
2. Alert creation modal: pair is pre-filled. Options: "Rate Score above [slider: 0-100, default 75]" or "Exchange rate reaches [input field]". Toggle for "Notify once" vs "Every time it crosses."
3. User selects "Rate Score above 80," leaves "Every time" toggled on, clicks "Create Alert."
4. System validates: user hasn't exceeded their plan's alert limit (1 for Free, 20 for Pro). Saves alert to Supabase with pair, threshold type, threshold value, notification preference.
5. Background cron job (every 6 hours): fetches current rates from Frankfurter, computes Rate Scores for all pairs with active alerts, compares against thresholds.
6. GBP/EUR Rate Score hits 83 → system sends email via Supabase email hook: subject "RateRadar: GBP→EUR Score 83 — Favorable Rate", body contains current rate, score, 7-day mini chart (static SVG), and CTA "View Full Dashboard."
7. User clicks email link → lands on `/pair/gbp/eur` with a highlighted banner: "Alert triggered: Rate Score 83, above your threshold of 80."
8. **Error states:** (a) User on Free tries to create 2nd alert → modal shows "Free plan includes 1 alert. Upgrade to Pro for 20 alerts." with upgrade button. (b) Email delivery fails → alert is marked "delivery failed" in `/alerts` history; in-app notification badge appears on next dashboard visit. (c) Rate data unavailable during cron run → skip this check cycle, log the miss, try again in 6 hours.

### 8.3 Cross-border Payment Calculator

1. User navigates to `/calculator` (accessible without auth from the navbar).
2. Three-field form: Amount (number input, default empty), From currency (dropdown with search + flags, default = home currency), To currency (dropdown, default empty).
3. User enters: 10,000 / USD / EUR → system fetches current USD/EUR rate from Frankfurter.
4. Result displays immediately: "10,000 USD = 9,230.00 EUR" with current rate (0.9230) and timestamp.
5. Below the result: Rate Score badge (e.g., 68 — amber) with label "This rate is better than 68% of the past year."
6. Below the score: 30-day mini chart showing the rate trend, with today's rate marked as a dot on the line.
7. "Share this calculation" button → copies a URL with query params (`/calculator?amount=10000&from=usd&to=eur`) to clipboard. Toast: "Link copied!"
8. **Error states:** (a) Frankfurter down → show last cached rate with warning: "Rate from [timestamp]. Live rates temporarily unavailable." (b) User enters invalid amount (negative, non-numeric) → inline validation: "Enter a positive number." (c) User selects same currency for From and To → result shows "1:1" with a note "Same currency selected."

---

## 9. Technical Constraints

### Performance Targets
- Dashboard initial load (cached data in localStorage): < 500ms to interactive
- Dashboard initial load (fresh API fetch, no cache): < 1.5s to interactive
- Rate Score computation for 1 pair over 365 days (~260 data points): < 200ms client-side
- Calculator conversion response: < 300ms
- Pair detail chart render (365 data points with pan/zoom): < 400ms
- Page-to-page navigation (client-side): < 100ms

### Data Handling
- **Client-side:** Rate Score percentile computation, sparkline rendering, chart rendering, localStorage read/write, currency formatting
- **Server-side (Next.js API routes):** Proxy for external API calls (avoids CORS issues, enables server-side caching), alert threshold evaluation (cron), email notification dispatch, Supabase auth and data operations
- **No sensitive data stored:** The app stores currency pair preferences and alert configs — never bank details, transaction amounts, or personal financial data

### Rate Limit Strategy
- **Frankfurter (unlimited):** Client-side cache with 5-minute TTL in sessionStorage. API route cache with 5-minute TTL on server. Prevents redundant calls during page navigation.
- **Currency-api (unlimited CDN):** Cache in sessionStorage for 1 hour. Only called for non-ECB currencies.
- **VATComply (unknown limit):** Cache VAT rates in localStorage with 7-day TTL. VAT rates change at most once per year.
- **REST Countries (unknown limit):** Cache in localStorage with no expiry. Country metadata is stable.
- **ipapi.co (1,000/day):** Call once per new visitor. Store result in localStorage permanently. Never re-fetch for returning visitors.

### Persistence
- **Guest users (no auth):** All state in localStorage — tracked pairs, home currency, last fetched rates, display preferences. Dashboard is fully functional without an account.
- **Authenticated users:** Supabase for pair configs, alert rules, alert history, exchange logs, and user preferences. Rates are never stored server-side — always fetched fresh from APIs and cached ephemerally.
- **No permanent rate storage:** Rate time series fetched on demand from Frankfurter, cached in sessionStorage for the browser session. This avoids data staleness issues and storage costs.

---

## 10. v1 vs v2 Scope

### v1 — Build Now
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

### v2 — After First Users Validate Core
- VAT-inclusive calculator (VATComply integration) showing true cross-border cost
- Daily/weekly email digest summarizing all tracked pairs with Rate Scores and notable moves
- "I exchanged" logging: record actual rates achieved, track cumulative savings over time
- CSV export of rate history for tracked pairs
- Business tier ($29/mo) with team sharing (shared dashboard, up to 5 members)
- Multi-pair comparison view (overlay 2-3 pairs on one chart)
- Rate Score push notifications via Progressive Web App
- API access (REST) for Business tier integration with invoicing/ERP tools
- Customizable dashboard layout (drag-and-drop card reorder)
- Dark mode toggle (v1 ships light-only)
- Onboarding tour for first-time authenticated users

### Boundary Statement
v1 ships when a user can land on the site, select currency pairs, see Rate Scores on a dashboard, view historical trends for any pair, and create one email alert — all within 60 seconds of first visit with zero payment required. v2 begins when at least 50 users have created dashboards and 10 users have set active alerts, confirming that the core rate monitoring loop delivers enough value to retain users.
