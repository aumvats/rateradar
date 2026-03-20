# QA Report — RateRadar

## Build Status
- Before QA: ✅ PASS
- After QA: ✅ PASS

---

## Bugs Found & Fixed

1. **[src/app/api/alerts/route.ts:46]** — `request.json()` called without try-catch; malformed request body would throw an unhandled exception and return a 500. → Wrapped in try-catch, now returns 400 with descriptive error.

2. **[src/app/api/alerts/route.ts:93-97]** — `DELETE` handler returned 401 "Unauthorized" for both missing `userId` AND missing `alertId`. Missing `alertId` is a client mistake, not an auth failure. → Split into two checks: 401 for missing userId, 400 for missing alertId.

3. **[src/app/api/cron/check-alerts/route.ts:6-11]** — Cron auth was guarded by `if (cronSecret && ...)` — meaning if `CRON_SECRET` is not set, the check is skipped entirely and all requests are allowed through (fail open). → Changed to `if (!cronSecret || ...)` to fail closed.

4. **[src/app/pair/[from]/[to]/page.tsx:18-19]** — `useParams()` segments are typed as `string | string[]`; casting directly with `as string` crashes if the segment is an array. → Added `Array.isArray()` guard and null fallback.

5. **[src/lib/rateScore.ts:18-19]** — `Math.min(...rates)` / `Math.max(...rates)` use spread syntax on the full rates array; can throw `RangeError: Maximum call stack size exceeded` on large datasets. → Replaced with `reduce`-based min/max.

6. **[src/app/globals.css]** — `slideIn` keyframe referenced in `Toast.tsx` via `animate-[slideIn_200ms_ease-out]` was never defined; toasts appeared without animation. → Added `@keyframes slideIn` definition.

7. **[.env.example]** — `NEXT_PUBLIC_APP_URL` referenced in `src/app/api/cron/check-alerts/route.ts:125` (email link base URL) was absent from `.env.example`. → Added `NEXT_PUBLIC_APP_URL=` to `.env.example`.

8. **[src/app/api/cron/check-alerts/route.ts:129-131]** — Email send catch block had comment "logged but not blocking" but contained no actual logging. Silent email failures are invisible to operators. → Added `console.error` with alert ID context.

9. **[src/app/api/cron/check-alerts/route.ts:135-141]** — Supabase alert update result was never checked. When `notify_once=true`, a DB failure leaves the alert active and the user receives duplicate alert emails on every subsequent cron run. → Added error check with `console.error` on failure.

---

## Bugs Found & NOT Fixed

1. **[src/app/api/alerts/route.ts:12,36,92]** — Auth uses `x-user-id` request header (client-supplied, trivially forgeable). Any caller can set this header to any user ID and read/create/delete that user's alerts. This is a scaffolding limitation acknowledged by the Builder — auth requires Supabase JWT session validation, which cannot be implemented until Supabase is configured. Must fix before production launch.

2. **[src/app/dashboard/page.tsx:94]** — `pairs.length === 0` inside `useCallback([], [])` is a stale closure (always reads initial `[]`). Functionally harmless because the render gate `error && pairs.length === 0` reads from live React state, not the stale closure. No user-visible impact.

3. **[src/lib/api/*.ts, src/app/api/cron/*]** — Catch blocks bind no error variable (`catch {}` not `catch (error) {}`), leaving no log trace in production failures. These are intentional graceful-degradation patterns per spec (Frankfurter → Currency-api → cached data → hardcoded fallback). Acceptable for v1.

4. **[src/app/api/alerts/route.ts:71-80]** — No explicit schema validation on the POST body before DB insert. The Supabase `CHECK` constraint will reject invalid `thresholdType` values at the DB level. Low risk; add explicit validation before launch.

---

## Route Status

| Route | File Exists | Renders | Loading State | Error State | Empty State |
|-------|-------------|---------|---------------|-------------|-------------|
| `/` | ✅ | ✅ | ✅ (skeleton cards) | ✅ (refresh prompt) | N/A |
| `/dashboard` | ✅ | ✅ | ✅ (skeleton cards) | ✅ (retry banner) | ✅ (add pair CTA) |
| `/pair/[from]/[to]` | ✅ | ✅ | ✅ (SkeletonChart) | ✅ (retry link) | ✅ (chart "no data" message) |
| `/calculator` | ✅ | ✅ | ✅ (button "Converting...") | ✅ (inline error) | N/A |
| `/alerts` | ✅ | ✅ | N/A (static) | N/A | ✅ (sign-in prompt; empty state for auth users) |
| `/settings` | ✅ | ✅ | N/A (static) | N/A | N/A (always shows form) |

---

## API Status

| API | Proxied Via | Error Handling | Keys from ENV |
|-----|-------------|----------------|---------------|
| Frankfurter (rates) | `/api/rates` | ✅ falls back to Currency-api | N/A (no key) |
| Frankfurter (timeseries) | `/api/timeseries` | ✅ returns empty array | N/A (no key) |
| Currency-api (backup) | `/api/rates-backup` | ✅ returns 503 on failure | N/A (no key) |
| REST Countries (metadata) | `/api/countries` | ✅ falls back to hardcoded map | N/A (no key) |
| ipapi.co (geolocation) | Client-direct (once per visitor) | ✅ falls back to USD | N/A (no key) |
| Supabase (auth + alerts) | Direct from API routes | ✅ returns 503 when unconfigured | `SUPABASE_*` env vars |
| Resend (email alerts) | Inline in cron route | ✅ skips send if key absent | `RESEND_API_KEY` |

---

## Security

- [x] No hardcoded secrets
- [x] `.env*` in `.gitignore`
- [x] Server keys (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`) not exposed to client (no NEXT_PUBLIC_ prefix)
- [x] No raw HTML injection usage in codebase
- [x] Cron endpoint now fails closed when `CRON_SECRET` is not configured (fixed in this QA pass)
- [ ] **Alert API uses spoofable `x-user-id` header** — must be replaced with Supabase session JWT before production

---

## Type Design (type-design-analyzer)

| Type | Encapsulation | Invariant Expression | Usefulness | Enforcement | Action |
|------|--------------|---------------------|------------|-------------|--------|
| `Currency` | 5/10 | 3/10 | 6/10 | 2/10 | Documented |
| `CurrencyPair` | 4/10 | 2/10 | 7/10 | 1/10 | Documented |
| `RateData` | 4/10 | 3/10 | 8/10 | 2/10 | Documented |
| `TimeSeriesPoint` | 5/10 | 3/10 | 7/10 | 3/10 | Documented |
| `TimeSeries` | 4/10 | 2/10 | 7/10 | 1/10 | Documented (unused in code) |
| `PairStats` | 4/10 | 3/10 | 8/10 | 4/10 | Documented |
| `Alert` | 3/10 | 2/10 | 7/10 | 2/10 | Documented (should be discriminated union) |
| `UserPreferences` | 5/10 | 5/10 | 7/10 | 5/10 | OK |
| `CountryData` | 4/10 | 2/10 | 5/10 | 2/10 | Documented |
| `CacheTTL` | 3/10 | 2/10 | 2/10 | 1/10 | **Removed** (dead code — never used) |

**Fixed:** `CacheTTL` was dead code with no consumers. Removed.

**Documented (not fixed — type refactoring outside QA scope):**
- `Alert` should be a discriminated union: `thresholdValue`'s valid range ([0,100] for `rate_score`, any positive for `exchange_rate`) depends on `thresholdType` but is not expressed in the type
- `TimeSeries` is declared but `getTimeSeries()` returns `TimeSeriesPoint[]` directly — the type is never actually used
- Most types score low on invariant expression because `string` is used for currency codes, dates, and IDs without branded types — acceptable for v1

---

## Production-Safety Scan Results

### 4.5a — Hardcoded localhost URLs
✅ **PASS** — No localhost strings in production code.

### 4.5b — Placeholder fallbacks in env var reads
✅ **PASS** — No placeholder string fallbacks. The only fallback is `NEXT_PUBLIC_APP_URL ?? ''` in the cron route; documented and added to `.env.example`.

### 4.5c — .env.local existence
❌ **FAIL (Deployment Blocker)** — `.env.local` does not exist. Build passes at compile time, but auth, alerts, and email will be broken at runtime.

### 4.5d — Silent API client initialization
✅ **PASS** — Both Supabase clients return `null` (not a stub) when credentials are absent. All callers check for null and return 503 explicitly.

### 4.5e — Env var consistency
✅ **FIXED** — `NEXT_PUBLIC_APP_URL` was missing from `.env.example`. Added in this QA pass. All `process.env.*` references are now documented.

---

## Deployment Blockers

- [ ] **`.env.local` is missing** — must be created before deployment. Required variables:
  - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (public)
  - `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only)
  - `RESEND_API_KEY` — Resend API key for email notifications
  - `CRON_SECRET` — Token for securing `/api/cron/check-alerts`
  - `NEXT_PUBLIC_APP_URL` — Deployed base URL (e.g., `https://rateradar.app`) — used in email alert links
- [ ] **Supabase tables not created** — Run schema SQL from `IMPLEMENTATION-PLAN.md` in Supabase dashboard
- [ ] **Alert API auth** — `x-user-id` header-based auth must be replaced with Supabase JWT validation before production

---

## Verdict

**FAIL** — Build passes and all routes render correctly, but `.env.local` is absent (deployment blocker). The app will compile cleanly on Vercel but auth-dependent features (alerts, settings sync, email notifications) will be silently broken at runtime without the required environment variables.

**Once `.env.local` is populated and Supabase tables are created, the app is ready for the Designer agent.**

### Fixes applied in this QA pass:
- 7 code bugs fixed: cron auth fail-closed, `useParams()` null safety, `request.json()` error handling, DELETE 400/401 split, `Math.min/max` spread → reduce, email failure now logged, Supabase update result now checked (prevents duplicate notify-once alerts)
- 1 dead type removed: `CacheTTL` was unused dead code
- 1 CSS bug fixed: missing `slideIn` keyframe animation
- 1 documentation fix: added `NEXT_PUBLIC_APP_URL` to `.env.example`
