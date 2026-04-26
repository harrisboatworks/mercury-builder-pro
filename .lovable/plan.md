## Status check first

- ✅ **FAQ on /quote/motor-selection** — already shipped as `MotorSelectionFAQ.tsx` last turn (includes the exact "Can I build a Mercury outboard quote online in Ontario?" Q&A, CAD + pickup-only notes, and FAQPage JSON-LD). **No work needed.**
- ✅ **Model-aware Ontario/CAD/dealer-since-1965 paragraphs** on the 9.9, 60 CT, 150 Pro XS pages — already in `MotorPage.tsx` (lines 248-273).
- ❌ **Related Motors strip + secondary "Get a quote online" CTA + Rice Lake link card** on those three pages — not done yet. This is the real remaining gap.

## What I'll add to `src/pages/MotorPage.tsx`

A single new component block, rendered only for the three target motors (9.9 FourStroke, 60 Command Thrust, 150 Pro XS), placed right after the existing model-aware paragraph. Keeps the file change small and won't disturb the prerender or other ~40 motor pages.

### 1. New `RelatedMotorsAndCTA` inline component (in same file, no new file needed)

A 3-card grid:

- **Card 1 — Build a Quote (primary CTA card)**: Headline "Build your Mercury {hp} HP quote online", one line of CAD/pickup-only copy, big primary button → `/quote/motor-selection?motor={motor.id}`. This is the second, more prominent CTA the user asked for.
- **Card 2 — Rice Lake repower context**: Headline "Repowering on Rice Lake?", short copy ("90 min east of Toronto, Mercury Platinum Dealer since 1965, pickup at Gores Landing"), link → `/locations/rice-lake-mercury-repower`.
- **Card 3 — Related motors**: Curated, hand-picked siblings per model so we don't need a DB query. Each item links to `/motors/{slug}` with a small label.
  - **For the 9.9 FourStroke** (`fourstroke-9-9hp-9-9elh-fourstroke`): show 9.9EH (manual-start sibling), 15 ELH, and "ProKicker 9.9" if available — links to their motor pages.
  - **For the 60 Command Thrust** (`fourstroke-60hp-60-elpt-command-thrust-fourstroke`): show 50 ELPT, 90 ELPT, and 115 ELPT.
  - **For the 150 Pro XS ELPT** (`proxs-150hp-150-elpt-proxs`): show 150 EXLPT Pro XS (XL shaft sibling), 115 Pro XS, and 175 Pro XS.

Each related-motor entry is a plain `<Link>` with the model name + "View motor page →" — no DB call, no images, no flicker. Slugs match `public/motors/*.md` so they resolve through the existing prerender.

### 2. Specs highlights mini-callout

Inside the primary CTA card, add a 3-pill row with the most relevant fast-fact spec for each target motor (so the user gets "key specs highlights" per the request):

- **9.9 FourStroke**: "EFI · Tiller-friendly · 84 lb"
- **60 Command Thrust**: "Big-prop gearcase · Power-trim · Best for 16–18 ft"
- **150 Pro XS**: "3.0L 4-cyl · 6300 RPM · Tournament-grade hole-shot"

These are static strings inside the model-conditional block — already-verified specs from memory (`mem://knowledge/motor-specs/voice-hardcoded-spec-data` and `proxs-vs-fourstroke-content-logic`). No new DB columns.

### 3. Internal link from the Rice Lake FAQ chip back to motor pages

Tiny addition: in `MotorSelectionFAQ.tsx`, append "Popular Mercury motors in Ontario:" line under the heading paragraph with three links to `/motors/fourstroke-9-9hp-9-9elh-fourstroke`, `/motors/fourstroke-60hp-60-elpt-command-thrust-fourstroke`, and `/motors/proxs-150hp-150-elpt-proxs`. This closes the internal link loop both directions.

## Files touched

1. `src/pages/MotorPage.tsx` — add the conditional `RelatedMotorsAndCTA` block (≈60 lines, all inside the existing model-aware `if` blocks). No prop changes, no new hooks, no DB queries.
2. `src/components/quote-builder/MotorSelectionFAQ.tsx` — add a one-line "Popular motors:" links row under the existing intro paragraph.

## What I'm NOT doing (and why)

- **Not creating a separate `RelatedMotors.tsx` component file** — only used in three places, conditional, simpler inline.
- **Not querying `motor_models` for siblings dynamically** — would add a request and risk SSR/prerender drift; hand-curated lists are stable and crawler-friendly.
- **Not touching the FAQ block on /quote/motor-selection itself** — already complete.
- **Not touching sitemap/schema/markdown** — per your instruction, leaving Codex-verified items alone. The new internal links are pure HTML `<Link>` elements; they'll be picked up by the existing prerender without any sitemap changes.
- **Not adding a "Related" block to the other ~40 motor pages** — out of scope for these 3 AI-target queries; can be generalized later if desired.

## Expected outcome

After this turn, the 9.9, 60 CT, and 150 Pro XS pages will each have:
- The existing Ontario/CAD/dealer paragraph (already shipped)
- A new specs-highlights pill row
- A prominent secondary "Build your Mercury {hp} HP quote online" CTA card
- A Rice Lake repower link card
- A 3-link "Related motors" card

…all reinforcing the AI-answer query targets and creating tight internal-link loops between the motor pages, the quote builder, and the Rice Lake location page.