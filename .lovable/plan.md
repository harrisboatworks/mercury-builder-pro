

# Improve "No Active Promotions" State on Promotions Page

## Current state
The page already has a basic empty state (lines 329-343) with a Shield icon, "No Active Promotions" heading, a short message, and a "Build Your Quote" button. It works, but it's minimal and doesn't look polished compared to the rest of the page.

## Plan
Upgrade the empty state section to be visually appealing and useful. Keep all existing promo-conditional structure intact (hero, choose-one, rebate, FAQ all stay gated behind `hasActivePromos`).

### Changes in `src/pages/Promotions.tsx` (lines 328-343)

Replace the current bare empty state with a more polished section:

- **Mercury branding** — Show the Mercury logo at the top for brand continuity
- **Better icon** — Use `Sparkles` instead of `Shield` (feels more "coming soon" vs. "blocked")
- **Stronger heading** — "No Active Promotions Right Now"
- **Friendly subtext** — "Mercury promotions launch throughout the year. Sign up below to be first in line when the next deal drops."
- **Visual polish** — Soft gradient background matching the hero style (dark stone), white text, rounded container with subtle border
- **CTA buttons** — "Build Your Quote" primary + "Browse Motors" secondary link
- **Scroll nudge** — A small arrow or text pointing users down to the newsletter signup form that already exists on the page

### What stays the same
- All conditional rendering logic (`hasActivePromos`) remains
- The newsletter signup section at the bottom still renders (it's not gated)
- Testimonials and "Why Buy" sections still render (not promo-dependent)
- When a new promo is added to the DB, the hero/choose-one/rebate/FAQ all reappear automatically

### File changed
| File | Change |
|------|--------|
| `src/pages/Promotions.tsx` | Replace lines 328-343 with polished empty state |

