

# Fix QR Code + Mobile Save Button Issues

## Issue 1: QR Code Goes to Motor Selection Page

**Root cause**: In `QuoteSummaryPage.tsx` (line 434), when the quote total is below $5,000 (the `FINANCING_MINIMUM`), the QR code URL defaults to just `SITE_URL` — the homepage. So scanning it dumps you at motor selection with no context.

**Fix**: For sub-threshold quotes, the QR code should point to the **saved quote** resume link instead. If the quote hasn't been saved yet, point it to the summary page URL or a shareable quote link. The system already generates `resumeToken` values when quotes are saved — use that.

**Change in `src/pages/quote/QuoteSummaryPage.tsx`** (around line 434):
- If quote total < FINANCING_MINIMUM, set `qrTargetUrl` to the site URL + `/quote/saved/{quoteId}` (if a saved quote ID exists) or to the summary page URL
- This way scanning the QR on a printed PDF actually takes the customer back to their quote, not to a blank motor selection page

## Issue 2: Mobile "Save for Later" Skips Google Sign-In

**Root cause**: The mobile CTA grid (line 944-952) has a "Save for Later" button that calls `setShowSaveDialog(true)` directly — opening the old email/phone form. It doesn't check auth state first like the desktop StickySummary button does (lines 997-1004).

**Fix in `src/pages/quote/QuoteSummaryPage.tsx`** (line 945):
- Change the mobile button's `onClick` to use the same auth-check logic as the desktop button:
  - If `user` exists → `setShowSaveDialog(true)` (pre-filled email form)
  - If no `user` → `setShowAuthSaveDialog(true)` (Google sign-in dialog)

This is a one-line fix — just replace `() => setShowSaveDialog(true)` with the same handler used on the desktop side.

---

## Files

| File | Change |
|------|--------|
| `src/pages/quote/QuoteSummaryPage.tsx` | Fix mobile save button to check auth state; fix QR URL for sub-threshold quotes |

