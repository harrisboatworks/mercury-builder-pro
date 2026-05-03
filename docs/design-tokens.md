# Design Tokens — Surface Colors & Gradients

All page, card, and image background colors flow from a single set of CSS
variables defined in `src/index.css`. Tailwind utilities in `tailwind.config.ts`
read from those variables, so updating the variable updates every consuming
component automatically.

> **Rule:** never write a raw hex (`#F5F1EA`, `#FAF8F4`, `#ECE4D2`) or a
> hardcoded `linear-gradient(...)` for a surface. Always use a token.
> The `scripts/check-design-tokens.mjs` script enforces this.

---

## The tokens

Defined in `src/index.css` under `:root`:

| Token (CSS var)            | Hex equivalent | Tailwind class           | Purpose |
| -------------------------- | -------------- | ------------------------ | ------- |
| `--repower-paper`          | `#FAF8F4`      | `bg-repower-paper`       | Lightest cream — page background |
| `--repower-cream`          | `#F5F1EA`      | `bg-repower-cream`       | Slightly warmer cream — card body / elevated surface |
| `--repower-cream-deep`     | `#ECE4D2`      | _(gradient stop only)_   | Deeper cream — only as a gradient stop |
| `--surface-page`           | → paper        | `bg-surface-page`        | **Semantic alias** for the page background |
| `--surface-card`           | → cream        | `bg-surface-card`        | **Semantic alias** for card bodies |
| `--surface-image`          | → paper        | `bg-surface-image`       | **Semantic alias** for the area behind motor images |
| `--gradient-image-bg`      | paper → cream  | `style={{ background: 'var(--gradient-image-bg)' }}` | Subtle 135° gradient used behind motor product images |

---

## Which token do I use?

### Page-level backgrounds → `bg-surface-page`
The body of any page or full-bleed section should match the motor selection
page background. Use `bg-surface-page` (or `bg-repower-paper` if you prefer the
literal name). Examples: page wrappers, sticky bars that should disappear into
the page (e.g. `RecentlyViewedBar`), large empty states.

### Card bodies → `bg-surface-card`
Anything that should sit *on top of* the page as an elevated surface — motor
cards, modal panels, accordion bodies — uses `bg-surface-card`. This gives the
slight warm tint that visually separates content blocks from the page.

### Behind a motor image → `var(--gradient-image-bg)`
Motor PNGs ship with white backgrounds. To make them blend cleanly into both
page and card surfaces, wrap them in a container with the shared gradient and
apply `mix-blend-multiply` to the `<img>`:

```tsx
<div style={{ background: 'var(--gradient-image-bg)' }}>
  <img src={motorUrl} className="mix-blend-multiply ..." />
</div>
```

Use this in:
- Motor card thumbnails (`MotorCardPremium`, `MotorCardPreview`, `HPMotorCard`)
- Detail-page image sections (`MotorDetailsImageSection`, `MotorImageGallery`)
- Modals showing motor imagery (`MotorDetailsPremiumModal`, Build & Price)

> Why a gradient and not a flat color? The 135° paper→cream sweep matches the
> slight tonal shift the motor card itself uses, so the image area never looks
> like a flat box stamped on top of the card.

### Decorative gradients elsewhere
If you need a different decorative gradient (hero overlays, promo banners),
add a new named token to `src/index.css` (e.g. `--gradient-hero-overlay`)
rather than inlining hex values. The check script will continue to flag any
new hardcoded `#F5F1EA` / `#FAF8F4` / `#ECE4D2` usage.

---

## Enforcement

`scripts/check-design-tokens.mjs` greps `src/` for:

1. `linear-gradient(... #F5F1EA / #FAF8F4 / #ECE4D2 ...)` — must be replaced with `var(--gradient-image-bg)` or a new named gradient token.
2. Bare hex literals `#F5F1EA`, `#FAF8F4`, `#ECE4D2` — must be replaced with the corresponding Tailwind class or CSS variable.

Allowlist (files where these literals are *defined*):
- `src/index.css`
- `tailwind.config.ts`
- `scripts/check-design-tokens.mjs`

Run locally:

```bash
node scripts/check-design-tokens.mjs
```

The script exits non-zero on any violation, so it can be wired into a pre-commit
hook or CI step.
