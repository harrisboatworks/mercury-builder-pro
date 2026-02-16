

## Financing Page Overhaul: Fast-Track to the Application

### Philosophy

The current page is a standalone calculator that invites tire-kicking. The new page flips the script: **build confidence fast, then funnel them into the quote builder or financing application**. Every section has one job -- move the customer closer to submitting a lead.

### Page Structure (Top to Bottom)

**1. Hero Section**
- Headline: "Finance Your Mercury Outboard"
- Tagline: "Low payments. Flexible terms. On the water sooner."
- Dynamic promo pill: If an active promotion with financing options exists (via `useActivePromotions`), show it (e.g., "Rates from 2.99% APR" or "6 Months No Payments Available"). If no promo is active, show the default tiered rate (e.g., "Rates from 7.99% APR").
- **Two CTAs only**: "Build Your Quote" (links to `/`) and "Apply Now" (links to `/financing-application`)
- Gradient background matching Repower page style

**2. How It Works (4 Steps -- Horizontal on Desktop, Stacked on Mobile)**
Quick visual steps with icons:
1. Choose Your Motor
2. Build Your Quote
3. Apply Online (5 minutes)
4. Get Approved and Hit the Water

Minimal text -- just enough to show it's easy. Each step gets an icon from Lucide.

**3. Benefits Strip (3-4 Cards in a Grid)**
Short, punchy selling points:
- Flexible Terms (36 to 180 months)
- Competitive Rates (tiered from 7.99%, promo rates when available)
- Weekly, Bi-weekly, or Monthly payments
- No Early Payoff Penalty

Each card: icon + 1-line headline + 1 short sentence. No walls of text.

**4. Active Promotion Banner (Dynamic, Conditional)**
If `useActivePromotions` returns a promotion with financing-related choose-one options (special financing rates, no payments, etc.), render a highlighted banner:
- Shows the promo name, end date, and available financing options
- Links to `/promotions` for full details
- If no active financing promo exists, this section simply doesn't render -- no empty space, no placeholder

**5. Compact Calculator (Existing Logic, Tighter Layout)**
Keep all existing calculation logic but reframe it:
- Section heading: "Estimate Your Payment"
- Same inputs (total financed, down payment, APR, term, frequency)
- Payment result displayed prominently
- **Primary CTA below result**: "Apply for Financing" (big, prominent)
- Secondary: "Build a Full Quote" link

**6. FAQ Accordion (5-6 Questions)**
Short, direct answers:
- What credit score do I need?
- What documents do I need?
- How long does approval take?
- What's the minimum for financing? ($5,000)
- Can I pay off early?
- What's included in the financed amount?

**7. Final CTA Bar**
- "Ready to get started?" with "Apply Now" button and phone number
- Matches the closing CTA pattern on the Repower page

### Technical Details

**File: `src/pages/FinanceCalculator.tsx`**
- Restructure into sections with the new layout above
- Import `useActivePromotions` to dynamically pull any active financing-related promotions
- Keep `useActiveFinancingPromo` for the calculator APR logic (unchanged)
- Import `Accordion` components for the FAQ section
- Import `SiteFooter` for page consistency
- Add Lucide icons for steps and benefit cards
- Add smooth scroll from hero "Estimate Payment" link to the calculator section via `useRef` and `scrollIntoView`
- All benefit/step/FAQ data defined as simple arrays at the top of the file (no new files needed)

**Promotion-Aware Logic:**
- The hero pill and promo banner section both use `useActivePromotions().getChooseOneOptions()` and `getSpecialFinancingRates()`
- If Mercury runs a financing promo, it shows automatically
- If Mercury stops running financing promos, those sections gracefully hide -- no manual updates needed
- Links to `/promotions` page for full promo details (keeps that page as the single source of truth)

**No other files are changed.** All modifications are in the single `FinanceCalculator.tsx` page.

