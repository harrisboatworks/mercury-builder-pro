

# Council Feedback Implementation (Revised — No Motor Card Disclaimer)

Four changes based on the AI council reviews.

---

## 1. Fix Broken `/financing` Nav Link

The footer and chat CTA link to `/financing` which doesn't resolve. The working page is `/finance-calculator`.

**Files**:
- `src/components/ui/site-footer.tsx` line 18: change href from `/financing` to `/finance-calculator`
- `src/components/chat/FinancingCTACard.tsx` line 70: change `to="/financing"` to `to="/finance-calculator"`
- `src/App.tsx`: add a catch-all redirect `<Route path="/financing" element={<Navigate to="/finance-calculator" replace />} />` so any other links or bookmarks still work

## 2. Promote "Save for Later" → "Email Me This Quote"

The quote summary has a buried "Save for Later" button that already triggers `SaveQuoteDialog` (captures name, email, phone, saves to Supabase, alerts admin). It just needs to be more visible and clearly named as the soft-exit action.

**File: `src/components/quote-builder/StickySummary.tsx`**:
- Rename the button label from "Save for Later" to "Email Me This Quote"
- Change icon from `Download` to `Mail`
- Move it above the "Download PDF" button in the action stack so it's the first secondary action users see

## 3. Standardize Review Count

`generateReviewCount()` currently returns a random number 150-220 per day, so different pages can show different counts.

**File: `src/lib/activityGenerator.ts`**:
- Change `generateReviewCount` to return a fixed value (e.g. `170`) so all pages are consistent
- This can be updated manually when the real Google review count changes, or later replaced with a live API call

## 4. Update Plan File

**File: `.lovable/plan.md`**: Update to reflect completed council feedback items.

---

## No build errors

The "build errors" message is just the normal Vite build output showing file sizes — the build completed successfully. No code fixes needed for that.

