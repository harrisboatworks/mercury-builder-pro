# Colour contrast — decision for Jay

**9 September 2026**  
**Site:** mercuryrepower.ca quote builder and marketing pages  
**What this is:** a brand-colour decision, not a patch. Nothing in `src/index.css` or any component was changed.  
**Who decides:** Jay. Gold is a Harris / Mercury-repower accent. Accessibility software can measure it; it cannot choose it.

The body copy customers read (navy on paper) is already strong. The red “build a quote” button is already strong. Gold on navy — the footer, the hub pages, the promo strip — is already strong. The question is only the faint grey type and the champagne gold sitting on cream.

---

## What a customer actually notices

A Rice Lake owner building a quote is often 50 or older, outside, on a phone. They can read the motor name, the price, and the red button. Those are navy and red, and they pass by a wide margin.

What they may *not* read:

- The hint inside an empty box (“Your full name”, “your@email.com”). It is navy at 40% opacity. On a white field it measures about **2.7:1**. The label above the box is fine. The hint inside the box is the faint part.
- The gold star that marks a required field. It is the same champagne gold as the homepage “Since 1947” line. On cream it measures about **2.1:1**. If they miss it, the form just errors after they hit send.
- The small “Part: 8M0…” line on an option tile, and the “before tax” line under the big total. Same family of washed-out navy.
- Gold used as the monthly payment on the quote summary card (“From $X/mo”). The big cash total next to it is navy and readable. The monthly figure is the part that disappears.

They will not notice, and do not need, a darker line between two cream sections. Those hairlines are decoration.

---

## Recommendation in one breath

Do **not** replace the brand gold. Keep `#C9A24A` on navy, on buttons (navy type on a gold fill), and as the decorative metal on cream — eyebrows, rules, stars, check icons that sit next to readable navy type.

Do three small things, in this order:

1. Make faint navy type **60%** instead of 40–55%. Nobody will call that a rebrand. It is the same navy, less watered down.
2. Stop using gold as the *only* cue that a field is required, that a motor is in stock, or that a payment is monthly. Keep the gold if you want it; add navy or Mercury red so the meaning still lands if the gold washes out.
3. Leave hairline section dividers alone. Optionally darken **input and unselected option-tile** outlines only — those boxes are otherwise a white/cream rectangle on a cream page.

Leave `muted-foreground` alone. Leave gold-on-navy alone.

---

## Decisions (please answer these)

### 1. Faint navy type — bump to 60% opacity?

**What changes:** placeholders, helper lines, part numbers. Same colour, less water.  
**What a customer sees:** hints inside boxes and “before tax” get a bit darker. Still clearly secondary to the navy heading.  
**Cost:** none to the brand. One shared rule: “faint navy is at least 60%.”  
**Recommendation: yes.**

### 2. Keep brand gold `#C9A24A`, and stop using it as the only meaning on cream?

**What changes:** the required `*` becomes navy or Mercury red (or stays gold *and* the label says “required”). In-stock and “$X/mo” get a navy or red partner. Decorative gold on cream stays. Gold on navy stays.  
**What a customer sees:** the metal is still there. Required fields and prices no longer depend on seeing champagne on cream.  
**Cost:** a few gold moments on cream pages become two-colour instead of gold-only. The brand gold itself does not move.  
**Recommendation: yes. This is the gold option that does not rebrand.**

### 3. Darken gold on light backgrounds to `#886A2A` so the same hex passes 4.5:1?

**What changes:** every cream-page gold (eyebrows, stars, `*`, monthly) becomes a whiskey / old-brass brown. Navy-page gold can stay `#C9A24A`, so the site would have two golds.  
**What a customer sees:** “Since 1947” on the homepage no longer flashes. It reads as brown caption type. Next to the bright gold on the navy band below, they will look like two different metals.  
**Cost:** visible. Honest. Not a crisis, but it is a brand change, not a contrast tweak.  
**Recommendation: no.** Only do this if you *want* a darker metal on cream.

### 4. Use gold only on navy (remove it from cream pages)?

**What changes:** cream pages become navy / cream / red only. Gold remains in the footer, hub pages, promo strip, and gold-fill buttons.  
**What a customer sees:** cleaner, more severe. Loses the jewelry on the heritage band and the quote-builder ticks.  
**Cost:** the cream pages feel less “finished.”  
**Recommendation: no**, unless you already want that quieter look. Option 2 keeps the jewelry and fixes the meaning.

### 5. Darken `muted-foreground` because one tool said 4.49?

**What a customer sees:** almost nothing. On the paper pages (all the `/mercury-*` landing pages) this colour already passes. On a cream card it misses 4.5:1 by **0.01** — rounding, not a readability problem.  
**Recommendation: no. Leave it.**

### 6. Darken every hairline border to pass 3:1?

**What a customer sees:** the site gets busier and a bit heavier. Most of those lines are just section breaks.  
**Recommendation: no for decorative lines.** Optional yes for **input boxes and unselected option tiles only** (raise the outline from 10% to 45% navy). Those outlines are often the only thing that makes a white box visible on paper.

---

## Verified numbers

Recalculated from the tokens in `src/index.css` (lines 357–398) using the WCAG 2 relative-luminance formula. Alpha is composited in sRGB the way the browser paints `hsl(… / 0.40)`.

The comments next to the tokens (`/* #C9A24A */`) are **one RGB step off** the live `hsl()` values. The inherited table used the comments. Both sets fail or pass the same way. Differences are in the second decimal.

| Pair | Inherited | Commented hex (what the table used) | Live `hsl()` (what CSS paints) | AA 4.5 | AA 3.0 |
|---|---|---|---|---|---|
| Gold on paper | 2.26 | **2.26** (`#C9A24A` on `#FAF8F4`) | 2.31 (`#C8A04C` on `#FBF8F4`) | fail | fail |
| Gold on cream | 2.13 | **2.13** (`#C9A24A` on `#F5F1EA`) | 2.16 | fail | fail |
| Gold on white | — | 2.40 | 2.44 | fail | fail |
| Gold on navy | 8.06 | **8.06** | 7.89 | pass | pass |
| Navy-900 on paper | 18.23 | **18.23** | 18.21 | pass | pass |
| Cream on red CTA | 5.23 | **5.23** | 5.27 | pass | pass |
| Red on paper | 5.55 | **5.55** | 5.63 | pass | pass |
| Navy-900/40 on paper | 2.66 | **2.65** | 2.64 | fail | fail |
| Navy-900/40 on white (live inputs) | — | **2.67** | 2.66 | fail | fail |
| Navy-900/45 on paper | 3.06 | **3.07** | 3.06 | fail | pass |
| Navy-900/55 on paper | 4.25 | **4.23** | 4.21 | fail | pass |
| Navy-900/55 on cream | — | **4.16** | 4.14 | fail | pass |
| `muted-foreground` on cream | 4.49 | **4.49** (`#676F7E` on `#F5F1EA`) | 4.49 | fail by 0.01 | pass |
| `muted-foreground` on paper | — | **4.77** | 4.79 | **pass** | pass |
| `muted-foreground` on white | — | **5.06** | 5.06 | **pass** | pass |
| Navy-900/10 hairline on paper | 1.23–1.56 | **1.24** | 1.24 | — | fail |
| Navy-900/20 hairline on paper | 1.23–1.56 | **1.56** | 1.56 | — | fail |

### What the inherited table got wrong, or overstated

1. **The hex comments are not the live colour.** Gold in CSS is `hsl(41 53% 54%)` → `#C8A04C`, not `#C9A24A`. Navy is `#040F1F`, not `#050E1C`. Paper is `#FBF8F4`, not `#FAF8F4`. Several components also hardcode the comment hex (`#C9A24A`, `#050E1C`). Treat them as the same colour for a brand decision; they are not bit-identical.
2. **Navy-900/55 is 4.23 on paper, not 4.25.** Same fail. On cream it is 4.16. Still a fail at 4.5, still a pass at 3.0.
3. **`muted-foreground` on cream at 4.49 is real, and it is a rounding-margin miss.** Integer RGB (`#676F7E` on `#F6F1EA`) even rounds to **4.50**. On paper — which is the background of every `/mercury-*` landing page — it already **passes at 4.77**. The inherited row reads like a site-wide problem. It is not.
4. **Placeholders are on white, not paper, in the live shared input.** `Input` and `Textarea` use `bg-white`. Ratio is 2.67, not 2.66. Same fail. The redesign `QuoteInput` (paper ground) is not imported by any page yet.
5. **A lot of gold “links and accents” already sit on navy** (footer, hub pages, promo strip) and **pass**. The inherited gold row is right about cream/paper. It is easy to over-count marketing gold as a failure.

Nothing in the inherited fail/pass *column* for gold-on-light or the navy opacities was backwards.

---

## Ranked by what a customer actually hits

### 1. Placeholders — navy-900 at 40% (and a few worse)

**Ratio:** 2.65–2.67. Fails 4.5 and 3.0.  
**Exposure:** every shared text box on the public site.

The live default is one class on the shared input and textarea:

- `src/components/ui/input.tsx` line 11 — `placeholder:text-repower-navy-900/40` on `bg-white`
- `src/components/ui/textarea.tsx` line 13 — same

Those two files feed Contact, Save Quote, Schedule a consult, the financing application, trade-in, deposit, login, and the admin tools. Typical customer hit: `src/pages/Contact.tsx` lines 210–216 (`<RequiredMark />` plus `placeholder="Your full name"`).

The quote-builder redesign repeats the same 40% on paper, but **no page imports it yet**:

- `src/components/quote-builder/redesign/QuoteInput.tsx` line 9

Worse than 40%, same family:

- `src/components/quote-builder/PromoReminderModal.tsx` lines 144, 204, 222 — **35%** on paper (2.30)
- `src/components/motors/MotorInlineChatPanel.tsx` line 537 — **38%** (2.50)

Blog search boxes use 40% or 45% (`src/components/blog/BlogHub.tsx` line 315, `BlogIndexHub.tsx` line 172).

Most of these fields already have a navy label. The placeholder is a hint, not the only name of the field. It is still the highest-traffic fail because it is on every form.

**Minimum change that passes 4.5:1** (smallest alpha, commented navy `#050E1C`):

| Ground | Alpha that crosses 4.5 | Tailwind-friendly |
|---|---|---|
| White (live Input) | **0.564** | `/57` is 4.60 on white |
| Paper | **0.569** | `/57` is 4.52 on paper, **4.45 on cream — still shy** |
| Cream | **0.574** | **`/58` passes all three** (4.68 / 4.60 / 4.76) |

`/60` is 5.01 on paper and 4.92 on cream. That is the clean rule: **faint navy ≥ 60%.**

`/40` → `/60` is not a new colour. It is less water.

---

### 2. Required `*` and other gold that is doing a job on cream

**Ratio:** 2.13 on cream, 2.26 on paper, 2.40 on white. Fails both AA bars.  
**Exposure:** every required field a customer fills in. Smaller: quote summary monthly, in-stock, one validation line.

The shared mark:

```11:17:src/components/ui/required-mark.tsx
export const RequiredMark = ({ className }: RequiredMarkProps) => (
  <span
    aria-hidden="true"
    className={cn("text-repower-gold ml-0.5 font-medium", className)}
  >
    *
  </span>
```

Customer-facing call sites (not a complete admin list):

| Where | File and line | What it is |
|---|---|---|
| Contact form labels | `src/pages/Contact.tsx` 210, 222, 247, 299, 343 | Required name / email / topic / message |
| Save-quote dialog | `src/components/quote-builder/SaveQuoteDialog.tsx` 275, 294, 313 | Name, email, phone |
| Schedule consult | `src/components/quote-builder/ScheduleConsultation.tsx` 412, 429, 447 | Same |
| Deposit / payment | `src/components/payments/DepositPayment.tsx` 155, 165, 177; `DepositInfoDialog.tsx` 84, 96, 108 | Same |
| Financing application | `src/components/financing/ApplicantStep.tsx`, `CoApplicantStep.tsx`, `ReferencesStep.tsx`, `ReviewSubmitStep.tsx` | Dozens of required legal fields |
| Guide download | `src/components/repower/RepowerGuideDownloadDialog.tsx` 132 | Email |
| Mobile quote form | `src/components/ui/mobile-quote-form.tsx` 85, 96, 183, 193 | Name, email |

The redesign field wrapper does the same `*` at `src/components/quote-builder/redesign/QuoteFormField.tsx` line 23. **No page imports that wrapper yet.** The inherited “helper text, 13px” pointer at line 30 of that file is the *pattern*, not a live funnel screen.

Gold that is carrying a number or a status on a light ground:

| Where | File and line | Ground | Why it matters |
|---|---|---|---|
| “From $X/mo” on the desktop summary | `src/components/quote-builder/StickySummary.tsx` 84 | Cream `#F5F1EA` (line 65) | Price. The cash total above it is navy and fine. |
| “✓ In Stock” | `src/pages/MotorPage.tsx` 469 | White card | Availability. “Special Order” next to it is navy/55 (also faint). |
| “Please select a rate and term above” | `src/pages/quote/PromoSelectionPage.tsx` 601 | Paper | The only instruction when financing is picked without a term. |
| Quote stepper completed ring / check | `src/components/quote-builder/QuoteProgressStepper.tsx` 64 | Paper | “You finished this step.” Shape (check vs number) still works if gold washes out. |

Gold that looks important in a search and **already passes**, because it sits on navy:

| Where | File and line | Why it is fine |
|---|---|---|
| Footer section titles and icons | `src/components/ui/site-footer.tsx` 14, 17, 50 | `bg-repower-navy-900` — gold on navy **8.06** |
| Hub “Quick answer” links | `src/components/hub/HubPage.tsx` 193–213; e.g. `RepowerHub.tsx` 117–136 | Section is `#050E1C` |
| Motor-selection promo strip | `src/pages/quote/MotorSelectionPage.tsx` 257–291 | `bg-repower-navy-900` |
| Homepage “The Process” / “Why repower” eyebrows | `src/pages/Index.tsx` 193, 236 | Navy bands |
| Gold-fill hub button (navy type on gold) | `src/components/hub/HubPage.tsx` 173 | Navy on gold is ~8:1. Different pair. Leave it. |

Gold that fails the number but is **jewelry**, not the sentence:

| Where | File and line | Why it is jewelry |
|---|---|---|
| “Since 1947” | `src/pages/Index.tsx` 169 | 10–12px eyebrow. The heading under it is navy. |
| Trust ticks “Real CAD pricing” | `src/pages/quote/MotorSelectionPage.tsx` 1476–1478 | The words are navy `/65`. Only the `✓` is gold. |
| Heritage / hours icons | `src/pages/HarrisBoatWorks.tsx` 64, 162–201 | Icons next to navy type. |
| Stars in reviews | `src/pages/Repower.tsx` 449; `src/pages/Promotions.tsx` 272 | Decorative. |
| “Changes saved” | `src/pages/quote/TradeInPage.tsx` 266 | Confirmation chrome. Brief. |

**Minimum change if we darken gold** (same hue 41°, same saturation 53%, lower lightness until 4.5:1):

| Target | On paper | On cream (use this if one hex must pass both) | On white |
|---|---|---|---|
| 3:1 (large type / UI only) | `#B28B37` (L 45.6%) | `#AC8635` (L 44.0%) | `#B78F38` |
| 4.5:1 (body / small type) | `#8D6E2B` (L 36.2%) | **`#886A2A` (L 34.8%)** | `#92722D` |

`#886A2A` next to `#C9A24A` is the difference between champagne and old brass. Lightness drops from about 39% to 16%. It will not read as the same metal. See the swatch table below.

**Minimum change that is not a rebrand:** keep `#C9A24A`. Do not load the meaning onto it on cream. Navy or Mercury red already exist and already pass.

---

### 3. Helper type — navy-900 at 55%, usually 12–13px

**Ratio:** 4.23 on paper, 4.16 on cream. Fails 4.5 by a little. Passes 3.0.  
**Exposure:** quote summary, trade-in, options, finance calculator. Not every keystroke, but it is the small print under money.

Live examples (the inherited 13px helper *is* this family; it does not only live in the unused `QuoteFormField`):

- `src/components/quote-builder/StickySummary.tsx` 75 — “Before tax: …” at 13px on cream
- `src/components/quote-builder/StickySummary.tsx` 89 — package label at 12px
- `src/pages/quote/QuoteSummaryPage.tsx` 1092, 1095 — deposit / rebate caveats at `text-xs` on white
- `src/pages/quote/OptionsPage.tsx` 234 — “Options Total” at 11px; 448 — feature list at `text-xs`
- `src/components/quote-builder/TradeInValuation.tsx` 377 — “Most customers skip this step.”
- `src/components/quote-builder/PurchasePath.tsx` 34, 102
- `src/pages/FinanceCalculator.tsx` 351, 413, 464 — APR help and “includes HST”

**Minimum alpha for 4.5:1:** 0.569 on paper, 0.574 on cream. **`/58` or `/60`.**  
From `/55` to `/60` is a small step. Same colour.

12px and 13px are **not** “large text.” Large text in WCAG is 24px regular or ~19px bold. These lines need 4.5:1 if we are being strict. They are already close. They are not a crisis. They are worth including in the one “faint navy ≥ 60%” rule so nobody maintains three opacities.

---

### 4. Part numbers — navy-900 at 45%, 12px

**Ratio:** 3.07 on paper, 3.04 on cream. Fails 4.5. Passes 3.0.  
**Exposure:** one step of the funnel (options), one line per tile.

- `src/pages/quote/OptionsPage.tsx` 431 — `Part: {option.part_number}`
- Same file, 439 — struck MSRP at 11px, same 45%

The option *name* and *price* are navy and readable. The part number is for the customer who wants to match a Mercury book. Faint, but not the thing they are choosing.

**Minimum alpha for 4.5:1:** same as helpers, **`/58` or `/60`.** Fold into the one rule.

Related faint navy at 40% that is real copy, not a placeholder:

- `src/pages/quote/PackageSelectionPage.tsx` 442 — subhead at `text-lg` (16–18px) and 40%. That one is a paragraph, not a hint. It should not stay at 40% even if we ignore placeholders. (That page also has leftover broken classes — `cream0`, a white `h1` on cream — which is a layout leftover, not a gold decision. Flagged at the bottom. Not part of this vote.)

---

### 5. `muted-foreground` on cream — 4.49

**Ratio:** 4.49 on cream. **4.77 on paper. 5.06 on white.**  
**Exposure:** the scary-looking row. Most of the traffic is on paper.

`--muted-foreground` is `220 10% 45%` → `#676F7E` (`src/index.css` line 374).

Landing pages that use it heavily sit on paper:

- `src/pages/landing/MercuryOutboardsOntario.tsx` line 102 — `bg-repower-paper`, then muted body (e.g. 122, 163–164)
- Same pattern: `MercuryProXS.tsx` 87, `HowToRepower.tsx` 55, `MercuryDealerGTA.tsx` 23, and the rest of `src/pages/landing/*`

The cream miss that matches the inherited 4.49 is the small print *on a cream card*, e.g. `src/pages/quote/PromoSelectionPage.tsx` 405 (`text-muted-foreground text-sm` inside `bg-repower-cream` at 383). The page itself is paper (`QuotePageShell` line 14), so the lead paragraph at line 374 is on paper and **passes**.

**Do not treat 4.49 as a crisis.** It is a rounding-margin miss on one surface. Integer RGB already reports 4.50. Leave the token.

---

### 6. Hairline borders — navy-900 at 10–20%

**Ratio:** 1.24–1.56. Fails 3:1.  
**Exposure:** everywhere. Almost none of it is the thing a customer must see to use the page.

Decorative separators (skip):

- Quote page header rule — `src/components/quote-builder/redesign/QuotePageShell.tsx` 36
- Trust-strip bottom edge — `src/components/quote-builder/QuoteLayout.tsx` 51
- Summary card divider — `src/components/quote-builder/StickySummary.tsx` 80
- Homepage cream-band edges — `src/pages/Index.tsx` 141

These are not buttons, not the only edge of a control, and not the thing that says “this is the price.” Failing 3:1 on a 1px rule between two cream surfaces is normal. Fixing every one would make the site look ruled, like a spreadsheet.

The two places a hairline *is* doing UI work:

1. **Text boxes.** Live input is white (`#FFFFFF`) on paper (`#FAF8F4`). White-on-paper is **1.06:1**. The 10% navy outline is the box.  
   `src/components/ui/input.tsx` line 11 — `border-repower-navy-900/10`.
2. **Unselected option tiles.** Tile fill is cream on paper — also **1.06:1**. Unselected state is a 1px 10% outline; selected is a 2px solid navy.  
   `src/components/quote-builder/redesign/QuoteRadioTile.tsx` lines 53–56.

**Minimum alpha for 3:1 on those outlines:** 0.442 on paper, 0.446 on cream, 0.439 on white. **`/45`.**  
That is a form-control tweak, not a sitewide border darkening.

---

## Gold — the honest options

Do not abandon `#C9A24A`. The colour is already correct in the places that look like Harris Boat Works: navy bands, footer, hub pages, promo strip, gold-fill buttons.

### Option A — Two golds (darken only on cream)

Add a “gold on light” token at **`#886A2A`** for cream/paper type. Keep `#C9A24A` on navy.

| | Hex | On cream | On paper | On navy |
|---|---|---|---|---|
| Today (brand gold) | `#C9A24A` | 2.13 | 2.26 | **8.06** |
| Passes 3:1 on cream | `#AC8635` | 3.00 | 3.20 | higher |
| Passes 4.5:1 on both light grounds | `#886A2A` | **4.51** | 4.81 | higher |

**Looks like:** `#886A2A` is whiskey, saddle, old brass. It keeps the hue. It loses the flash. On a page that also has `#C9A24A` on a navy band, they will not look like one metal.

Use this only if you want cream-page gold to be *readable as type* and you accept a darker metal.

### Option B — Keep one gold, never make it the only meaning on cream *(recommended)*

`#C9A24A` stays. On cream it is decoration: eyebrows, rules, stars, ticks beside navy words. Meaning uses navy or Mercury red, which already pass (navy 18:1, red 5.55).

**Looks like:** the site you have now, with a navy or red `*` and a navy monthly. Gold still shows up. It just does not have to carry the plot.

**Cost:** a few fewer gold letters on cream. Not a rebrand.

### Option C — Gold only on navy

Remove gold type from cream pages. Keep navy bands, footer, hubs, gold-fill buttons.

**Looks like:** more severe. Cream pages become navy / cream / red. Fine if you want that. You lose the jewelry on “Since 1947” and the quote-builder ticks.

**Cost:** quieter cream pages. The brand gold does not go away; it just lives on dark ground, where it already works.

---

## What does not need fixing

Say this plainly so the list stays short.

- **Navy body copy.** 18.23:1. The motor names, prices, and headings are not the problem.
- **The red CTA.** Cream type on Mercury red is 5.23. Red on paper is 5.55. Leave it.
- **Gold on navy.** 8.06. Footer, hubs, promo strip, “Learn more.” Leave it. This is the gold working as designed.
- **Gold-fill buttons with navy type.** ~8:1. Leave them.
- **`muted-foreground` as a site token.** 4.49 on cream is a rounding miss. On paper it already passes. Do not spend a brand meeting on the 45th percentile of grey.
- **Decorative hairlines.** Section rules and card edges that are not the only outline of a control. Extremely common to fail 3:1. Customers are not failing to quote a motor because a 1px rule is light.
- **Jewelry gold on cream** (eyebrows, stars, ticks next to navy words), *if* you take Option B. The heading is the sentence. The gold is the stitch.

---

## Before / after swatches

Hex values so this can be judged without running the site. Ratios use the commented brand hexes (the ones already in the file comments and in a few hardcoded class names). Live `hsl()` is one step off and does not change the decision.

### Faint navy (recommended: one jump to 60%)

| Token | Composed on paper | Ratio now | After `/60` on paper | Ratio after | After `/60` on cream | Ratio after |
|---|---|---|---|---|---|---|
| Placeholder `/40` | `#989A9E` | 2.65 | `#676C72` | **5.01** | `#65696E` | **4.92** |
| Promo-reminder placeholder `/35` | `#A4A6A8` | 2.30 | same `/60` | **5.01** | same | **4.92** |
| Part number `/45` | `#8C8F93` | 3.07 | `#676C72` | **5.01** | `#65696E` | **4.92** |
| Helper `/55` | `#73777D` | 4.23 | `#676C72` | **5.01** | `#65696E` | **4.92** |
| Label `/70` (already fine) | `#4E545D` | 7.17 | no change | — | — | — |

`/58` is the mathematical minimum that clears cream at 4.5. `/60` is the one you can say out loud.

### Input / tile outline only (optional)

| Token | On paper now | Ratio | After `/45` | Ratio |
|---|---|---|---|---|
| Input / tile border `/10` | `#E2E1DE` | 1.24 | `#8E9195` | **3.07** |

### Gold (do not do this unless you pick Option A)

| Role | Hex | On cream | On paper | On navy | How it looks |
|---|---|---|---|---|---|
| Brand gold today | `#C9A24A` | 2.13 | 2.26 | **8.06** | Champagne / antique gold. The one you have. |
| Live CSS gold | `#C8A04C` | 2.16 | 2.31 | 7.89 | Same metal. One digit off the comment. |
| Dark enough for 3:1 on cream | `#AC8635` | **3.00** | 3.20 | higher | Mustard / muted gold. Still a gold. |
| Dark enough for 4.5:1 on cream *and* paper | `#886A2A` | **4.51** | 4.81 | higher | Whiskey / old brass. Reads brown next to `#C9A24A`. |

Navy body `#050E1C` on paper stays **18.23**. Red `#C8102E` on paper stays **5.55**. Those are the colours that already do the reading.

---

## How the numbers were done

- Tokens: `src/index.css` lines 357–398 (`--repower-paper`, `--repower-cream`, `--repower-navy-900`, `--repower-gold`, `--repower-mercury-red`, `--muted-foreground`).
- Contrast: WCAG 2 relative luminance, `(L1 + 0.05) / (L2 + 0.05)`.
- Alpha: `C = gold_or_navy × α + background × (1 − α)` in sRGB, then the same contrast formula on the composed colour.
- “Large text” is 24px regular or ~19px bold. Almost all the failing type is 11–15px. It needs 4.5:1 if we treat it as text. 3:1 is the bar for UI outlines and for type that is actually large.
- File and line claims above were read in this checkout. `QuoteFormField` / `QuoteInput` are real files and are **not** mounted on a public page yet; the live funnel uses `Input`, `Textarea`, `RequiredMark`, `StickySummary`, and `OptionsPage`.

---

## Out of scope (seen while reading, not a colour vote)

`src/pages/quote/PackageSelectionPage.tsx` still has leftover classes from a dark layout (`text-white` heading on a cream page at line 439, `bg-repower-cream0/30`, `border-repower-gold/300/50`). That can make the package step look broken for reasons that have nothing to do with gold vs cream. Separate fix, if it is still like that on production. Not part of the brand-colour question.

---

## Suggested vote

| # | Question | Recommendation |
|---|---|---|
| 1 | Faint navy type to 60%? | **Yes** |
| 2 | Keep `#C9A24A`; do not let it be the only required / in-stock / monthly cue on cream? | **Yes** |
| 3 | Darken light-background gold to `#886A2A`? | **No** |
| 4 | Remove gold from cream pages entirely? | **No** |
| 5 | Touch `muted-foreground`? | **No** |
| 6 | Darken decorative hairlines sitewide? | **No.** Optional `/45` on input and unselected tile outlines only. |

Once those are marked, a later pass can change tokens and components. Not this file.
