## Homepage copy refresh — premium tone

Apply audit-approved copy changes to the homepage. Tone: quiet confidence, ≤14 words above the fold over video.

### 1. `src/components/repower/HeroRepower.tsx`

- **Eyebrow**: `Ontario's Mercury Repower Centre · Rice Lake` → **`Mercury Repower · Rice Lake · Since 1947`**
- **H1**: unchanged ("Keep your boat. Get your weekends back.")
- **Sub**: replace the two-sentence "nearly-new boat experience…" line with a single line — **"New motor. Same boat. Way better mornings."** Bump size to `text-xl md:text-2xl` so the shorter line still anchors the hero.

### 2. `src/components/repower/TrustStrip.tsx`

Reorder + relabel the items array to lead with human/local trust and translate Mercury jargon:

1. `Family-Owned Since 1947` (HBW logo)
2. `Mercury Certified Dealer` (Award icon — was "Mercury Platinum Dealer")
3. `Mercury Repower Centre` (Mercury Repower logo)
4. `7-Year Warranty Available` (warranty graphic — was "7-Year Warranty")
5. `CSI Award Winner` (BadgeCheck icon)

### 3. `src/pages/Index.tsx` — How It Works section (lines 122–159)

- **Eyebrow**: `How It Works` → **`The Process`**
- **H2**: "Three steps. *Real prices* the whole way through." → **"See your real price. *Lock it.* Pick it up."** (keep the red-italic accent on the middle phrase)
- **Sub**: "No 'call for quote.' No surprises. Build it, lock it, pick it up." → **"No phone tag. No fine print. No surprises."**
- **CTA button**: `Start Building` → **`Build Your Quote`** (matches hero CTA wording)

### Out of scope this round

- Testimonials section copy — waiting on real Google reviews from user before swapping the placeholder Mike R. / Sandra L. / Dave K. quotes. Will handle in a follow-up.
- All other pages (Repower, Promotions, Trade-in, About, FAQ, Contact) — handled page-by-page in subsequent approvals.

### Files edited

- `src/components/repower/HeroRepower.tsx`
- `src/components/repower/TrustStrip.tsx`
- `src/pages/Index.tsx`