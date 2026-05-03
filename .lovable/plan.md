## Fix testimonials section to match the new repower design

You're right — switching the section to cream `bg-repower-paper` clashed with the dark luxury navy/gold theme used by Hero, Why Repower, and the final CTA band. The shadcn `Card` defaults (light card + muted-foreground text) also looked like a stray light island in an otherwise dark page.

### What I'll change in `src/pages/Index.tsx`

Restyle the TESTIMONIALS section (lines 217–250) so it reads as part of the same dark, premium system:

- **Section background**: `bg-repower-navy-800` (one shade lighter than Why Repower's `navy-900`) so adjacent dark sections still have visual separation, with a subtle top border `border-t border-repower-cream/10`.
- **Eyebrow + heading** (matching Why Repower):
  - Gold eyebrow: `text-repower-gold` uppercase tracked label "Customers"
  - Heading: `font-display`, `text-repower-cream`, same tracking/letter-spacing as the other section titles
- **Google rating badge**: keep `GoogleRatingBadge variant="full"` but wrap in a translucent pill (`bg-repower-cream/5 border border-repower-cream/10`) so it reads on dark.
- **Testimonial cards**: drop default shadcn Card styling, use:
  - `bg-repower-navy-900/60 border border-repower-cream/10 backdrop-blur-sm rounded-xl`
  - Quote: `text-repower-cream/90 italic`
  - Name: `text-repower-cream font-medium`
  - Location: `text-repower-cream/60`
  - Stars: keep gold (`text-repower-gold`) instead of generic yellow-400 to match the palette
- Replace the `Card`/`CardContent` imports usage here with a plain `<div>` so we're not fighting shadcn defaults (Card import stays — used elsewhere if needed; otherwise leave untouched).

### Result

The reviews section becomes a continuous dark band between "Why repower" (navy-900) and the final CTA (navy + image overlay), with gold accents and cream text — consistent with the rest of the new repower landing design.

No other files change.