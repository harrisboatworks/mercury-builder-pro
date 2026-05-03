## Add Vintage Jim Harris Photo (Approved + Timeline Preserved)

### 1. Save the asset
Copy upload to `src/assets/heritage/jim-harris-mercury-1960s.jpg`, import as ES6 module.
Alt: *"Jim Harris working on a Mercury outboard at Harris Boat Works, mid-1960s"*

### 2. Homepage — new "Heritage" band
Insert between `<TrustStrip />` and `<RepowerMath />` in `src/pages/Index.tsx`:

- 2-col on desktop (photo left, copy right), stacked on mobile (photo first)
- Cream background (`bg-repower-cream`) so the B&W photo reads as intentional
- Framed look: rounded corners, thin navy border, soft shadow
- Caption: *"Jim Harris, Gores Landing — c.1965"* (xs italic, muted)
- Eyebrow `SINCE 1947` in gold (`#C9A24A`)
- H2: **"Three generations. *One* Mercury dealer."** (display font, navy, italic-red accent matching "Lock it." treatment)
- Body: "Jim Harris started rigging Mercurys in Gores Landing in the mid-1960s. We've been a Mercury dealer ever since — same family, same lake, same handshake. The motors got faster. The promise didn't."
- CTA: outline `Read our story →` linking to `/about`

### 3. About page — keep the timeline, restyle to new look
**Keep `timelineEvents` array and the alternating-side timeline structure** — you love it, it stays. Restyle only:

- Section background: `bg-repower-cream` (was plain background)
- Eyebrow above H2: `OUR HERITAGE` in gold caps tracking
- H2 in display font, navy, with italic-red accent: *"Our **story**, in milestones."*
- Timeline spine: thin navy line (was border default)
- Year dots: gold (`#C9A24A`) instead of primary blue
- Year text: gold uppercase tracking, display font weight
- Card titles: display font, navy
- Body copy: navy at 75% opacity, light weight, relaxed leading

**Embed Jim's photo inside the 1965 "Mercury Marine Partnership" timeline card** — photo sits above the description, framed to match the homepage treatment, with caption "Jim Harris — Mercury rigging, mid-1960s."

### 4. About page hero
Add the photo as a secondary image inside the hero band (right of/below the H1+badges block on desktop, below on mobile). Caption: "Jim Harris, mid-1960s — Mercury dealer since 1965." Same framed treatment.

### Technical notes
- Files edited: `src/pages/Index.tsx`, `src/pages/About.tsx`
- File added: `src/assets/heritage/jim-harris-mercury-1960s.jpg`
- No new components; inline JSX. Reuses existing `RepowerCta` + design tokens (`repower-cream`, `repower-navy-900`, gold `#C9A24A`, accent red `#C8102E`).
- Timeline data and ordered-list semantics preserved for SEO/accessibility — purely a visual restyle.
- No SEO schema changes required.

### Skipped (can revisit)
- PDF cover / email signature heritage mark — not doing now per default.
