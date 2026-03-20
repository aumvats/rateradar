# Design Notes — RateRadar

## Design System Applied
- Color tokens: ✅ All match spec exactly (#1E3A5F, #F8FAFC, #FFFFFF, #E2E8F0, #0F172A, #64748B, #2563EB, #10B981, #EF4444, #F59E0B)
- Typography: ✅ Plus Jakarta Sans (headings), Inter (body), JetBrains Mono (data). Sizes aligned to spec (h1: 28px/700, h2: 22px/600, h3: 18px/600, body: 15px)
- Spacing: ✅ 4px base unit respected throughout, scale: 4-8-12-16-24-32-48-64
- Border radii: ✅ sm: 4px, md: 8px, lg: 12px, full: 9999px
- Animations: ✅ fast: 120ms, normal: 200ms, slow: 400ms, all ease-out

## Changes Made
1. **globals.css** — Added animation keyframes (fade-in, slide-up, scale-in), staggered animation tokens, focus-visible ring styles, custom range slider styling, selection color, smooth scroll
2. **DashboardHeader.tsx** — Sticky header, hover scale on logo, active states on nav links, replaced `<details>` mobile nav with controlled state + backdrop dismiss + scale-in animation + close icon toggle
3. **CurrencyPairCard.tsx** — Added hover lift (-translate-y-0.5), shadow-md on hover, active press-down, alert button active:scale-90
4. **PairPickerModal.tsx** — Added fade-in backdrop + scale-in modal animation, active:scale-95 on currency chips, active states on action buttons
5. **AlertModal.tsx** — Added fade-in backdrop + scale-in animation, hover states on toggle buttons, active states on action buttons
6. **RateChart.tsx** — Improved lookback toggle with active/hover states and shadow on active tab
7. **CalculatorForm.tsx** — Convert button shadow + active press, slide-up animation on result display, active state on share link
8. **page.tsx (landing)** — Staggered reveal on hero (h1 → subtitle → CTA), increased vertical spacing between sections (py-16 → py-20), h2 sizes aligned to 22px spec, pricing cards get hover shadow + border highlight, feature icons scale on group hover, CTA buttons get active press + shadow
9. **dashboard/page.tsx** — h1 aligned to 28px spec, Add Pair button active states, remove button hover border-error
10. **pair/[from]/[to]/page.tsx** — h1 aligned to 28px, h2 aligned to 18px spec
11. **calculator/page.tsx** — h1 aligned to 28px, body text aligned to 15px
12. **alerts/page.tsx** — Sign-in button active press + shadow, alert rows get hover border highlight
13. **settings/page.tsx** — Button active states on Sign-in, Upgrade, and Sign-out actions

## Responsive Status
| Page | Desktop | Mobile (390px) |
|------|---------|----------------|
| `/` | ✅ | ✅ grid stacks to 1-col, proper padding |
| `/dashboard` | ✅ | ✅ cards stack 1-col, remove button accessible |
| `/pair/:from/:to` | ✅ | ✅ header wraps, chart responsive container |
| `/calculator` | ✅ | ✅ max-w-lg centered, currency pickers full-width |
| `/alerts` | ✅ | ✅ content centered, button full-width visual weight |
| `/settings` | ✅ | ✅ max-w-lg, cards stack naturally |

## Microinteractions Added
- **Page load (landing):** Staggered slide-up reveals — h1 enters first, subtitle at 50ms, CTA button at 100ms
- **Modal entry:** Backdrop fades in, modal content scales in from 95% with fade
- **Mobile nav:** Scale-in animation on dropdown, backdrop for click-outside dismiss
- **Card hover:** Cards lift 2px (-translate-y-0.5) with shadow-md, returns on mouse leave
- **Button feedback:** All primary buttons have active:scale-[0.97-0.98] press effect
- **Icon hover:** Feature block icons scale to 110% on group hover
- **Calculator result:** Slide-up animation when conversion result appears
- **Remove button:** Reveals on card hover, border turns error-red on hover
- **Focus rings:** Global focus-visible with 2px accent outline on all interactive elements
- **Range slider:** Custom thumb with hover scale-up and active scale-down
- **Header logo:** Scale-105 hover, scale-95 active

## Build Status
- After design pass: ✅ PASS
