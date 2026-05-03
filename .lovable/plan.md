## Pass 1 — Replace landing-page hero on /repower

### Scope
Visual layer only. Hero swap. No copy invention beyond reusing existing on-page text. No changes to calculator, FAQ, video, or any logic.

### Files touched
1. **NEW** `src/components/repower/RepowerHero.tsx` — compact, paper-background, content-page hero.
2. **EDIT** `src/pages/Repower.tsx` — remove the three duplicate landing blocks at the top, mount the new hero, keep RepowerMath in place lower (decision below).

### Removals from `src/pages/Repower.tsx`
Delete lines 62–64:
```
<HeroRepower />
<TrustStrip />
<RepowerMath />
```
- `HeroRepower` and `TrustStrip` are dropped from this page entirely (still used on `/`).
- `RepowerMath` is **kept** but moved further down, inserted between the "Repower vs New Boat" section and the "Modern Technology Benefits" section, where the math story actually fits the educational flow. (Open Q from audit, going with: keep, relocate.)

### Header shell
`RepowerLayout` currently mounts `RepowerHeader` without the `solid` prop, which means on `/` it stays transparent until scroll, but on every non-`/` route the component already auto-forces solid (line 31 of `RepowerHeader.tsx`: `forceSolid = solid || location.pathname !== '/'`). So `/repower` already renders with a solid navy header from first paint. **No layout swap needed.** Leaving `RepowerLayout` as-is.

### New hero spec (`RepowerHero.tsx`)

- **Section**: `bg-repower-paper`, `pt-28 md:pt-32 pb-20 md:pb-28`, `px-6 md:px-14`, hairline bottom border `border-repower-navy-900/10`. Top padding clears the fixed header.
- **Eyebrow**: "MERCURY OUTBOARD REPOWER · ONTARIO", Inter 600, 11–12px, uppercase, letter-spacing 0.22em, `text-repower-mercury-red`. Preceded by an 8-unit hairline `bg-repower-mercury-red/60`.
- **H1**: "Keep your boat. Upgrade your engine." Inter Tight 700, `clamp(40px, 5vw, 72px)`, `text-repower-navy-900`, tracking `-0.025em`, leading 1.05, max-width 18ch.
- **Subhead**: existing 70%/30% framing reworded into one sentence reusing on-page copy: "A new Mercury costs a fraction of a new boat, and you keep the hull you already know. Most repowers are completed in one to three days at our Gores Landing shop on Rice Lake." Inter 400, 17–18px, `text-repower-navy-900/65`, max-width 60ch. (Sourced verbatim from existing /repower content; no new copy.)
- **Hairline + 70/30 pill**: 12-unit gold hairline, then a small inline pill — `border border-repower-gold/40 bg-repower-cream rounded-full px-5 py-2`, contents: "70% of the benefit · 30% of the cost" with display numerals at 20–22px navy and labels in 12px uppercase navy at 60%.
- **CTAs**: primary mercury-red `<RepowerCta to="/quote/motor-selection">` "Build Your Quote" with chevron; ghost secondary `<a href="tel:+19053422153">` styled with navy hairline border, navy text, hover `bg-repower-navy-900/[0.03]`.
- **Background**: solid paper. No video. No photo (keeps it lightweight; we can add a static photo in a follow-up if Jay wants).

### Hard rules respected
- No em dashes; uses periods and middots.
- No Tailwind defaults; only `repower-paper / navy-900 / mercury-red / gold / cream` tokens (and existing rgba opacity variants).
- No icons in colored circles.
- Reuses existing copy. No new marketing claims.
- Phone CTA dials the same number that already appears on the page.

### Out of scope for this pass
- Restyling sections 4–14 (Pass 2/3).
- Replacing the infographic PNG (Pass 3).
- Any copy fixes to comma-as-range-separator prices (flagged for Jay separately).

After approval and implementation, screenshot the new top of /repower for review before moving to Pass 2.
