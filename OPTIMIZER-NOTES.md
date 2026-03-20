# Optimizer Notes — RateRadar

## Code Cleanup (Plugin-Assisted)

### Code Simplifier Findings Applied
- Removed 3 dead exports from `utils.ts`: `formatCurrency`, `getScoreColor`, `getScoreLabel`
- Removed dead file: `src/lib/api/currency-api.ts` (never imported, backup logic already in `frankfurter.ts`)
- Removed dead import: `useRouter` in `dashboard/page.tsx` (imported but never used)
- Removed unused dependencies: `date-fns` (never imported), `resend` (SDK unused — cron uses raw fetch)

### Comment Analyzer Findings Applied
- Fixed misleading QA comment in `pair/[from]/[to]/page.tsx` — incorrectly referenced "catch-all routes"
- Removed stale QA changelog comments (8 occurrences across `alerts/route.ts`, `cron/check-alerts/route.ts`, `rateScore.ts`, `types/index.ts`)
- Rewrote misleading cron update comment to reflect actual behavior (logging, not prevention)
- Fixed misplaced "Check if already detected" comment in `ipapi.ts` (was on SSR guard, not cache check)
- Improved `rateScore.ts` comments: volatility formula now notes percentage output, daily change explains data point selection
- Added rationale to eslint-disable in `CalculatorForm.tsx`

### Code Reviewer Findings Applied
- Fixed `Math.min/max` spread in `Sparkline.tsx` and `RateChart.tsx` — now uses `reduce()` consistent with QA fix in `rateScore.ts`
- Applied `encodeURIComponent()` to DB-sourced currency values in cron route URLs (SSRF prevention)

## Performance
- Images optimized: 0 (no images in app — uses SVG icons and emoji flags)
- Dynamic imports added: 0 (Recharts is the heaviest dep but used on primary pages)
- Server Components converted: 1 (`calculator/page.tsx` — removed unnecessary `'use client'`)
- Font optimization: ✅ (all 3 fonts use `next/font/google` with `display: 'swap'`)
- Dead dependencies removed: 2 (`date-fns`, `resend`)
- Dead code removed: 1 file, 3 exports

## SEO
- Root metadata: ✅ (title template, description, keywords, OG, Twitter)
- Per-page titles: ✅ (calculator via metadata export; others use root default via client pages)
- OG tags: ✅ (title, description, type: website)
- Sitemap: ✅ (`src/app/sitemap.ts` — 4 public routes)
- Robots: ✅ (`src/app/robots.ts` — allows all, disallows /api/ and /settings)

## Accessibility
- Semantic HTML: ✅ (`<header>`, `<main>`, `<nav>` in layout)
- ARIA labels: ✅ (alert button, remove button, modals with `role="dialog"` + `aria-modal` + `aria-labelledby`)
- Keyboard nav: ✅ (global focus-visible ring in CSS, logical tab order)
- Color contrast: ✅ (dark text on light backgrounds per design system spec)
- Alt text: ✅ (Sparkline SVGs have `role="img"` + `aria-label`, RateScoreBadge has `role="meter"` with aria-value attributes)

## Error Handling
- Global error boundary: ✅ (`src/app/error.tsx` — friendly message + "Try again" button)
- 404 page: ✅ (`src/app/not-found.tsx` — branded page with "Go home" link)
- Loading UI: ✅ (`src/app/loading.tsx` — spinner for route transitions)
- API fallbacks: ✅ (Frankfurter → Currency-api → cached data → hardcoded fallback, per builder)

## Deployment Ready
- .env.example complete: ✅ (all 6 variables with descriptions)
- README exists: ✅ (project name, description, setup instructions, spec link)
- Build passes: ✅

## Security Fixes
- Cron route URLs now use `encodeURIComponent()` for DB-sourced currency values

## Build Output
- Total pages: 16 (10 static, 6 dynamic)
- Build time: ~4.5s
- Any warnings: none
