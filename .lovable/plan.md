

## Two Issues to Fix

### Issue 1: Continue button not appearing after estimate
The Continue button code exists in `TradeInValuation.tsx` (lines 479-487) but I need to verify it's actually rendering. Looking at the code structure, the button is correctly placed inside the `{estimate && (...)}` block. However, there's a possible issue: the `luxuryModern` variant on the Button may not be rendering visibly, or the button could be obscured by the floating chat widget. I'll verify the button variant exists and ensure it renders properly.

### Issue 2: Desktop floating chat button overlaps trade-in buttons
The `AIChatButton` component (in `src/components/chat/AIChatButton.tsx`) is positioned at `fixed bottom-24 right-4 z-40` (96px from bottom, 16px from right). This directly overlaps with the "Get Trade-In Estimate" and "Continue" buttons on the trade-in page.

**Fix**: Hide the `AIChatButton` on quote builder pages (specifically `/quote/` routes) where it interferes with the flow, or reposition it higher. The cleanest approach is to hide it on `/quote/trade-in` and other quote flow pages where full-width CTAs exist at the bottom.

### Files to Change

**`src/components/chat/AIChatButton.tsx`** (line 65):
- Add route-based hiding: check if current path starts with `/quote/` and hide the button on quote builder pages where it conflicts with in-page CTAs. This keeps the chat accessible via the header/menu while removing the overlap.

**`src/components/quote-builder/TradeInValuation.tsx`** (lines 479-487):
- The Continue button code is already present. I'll verify the `luxuryModern` variant works and add additional styling to ensure visibility — making it more prominent with explicit dark background styling as a fallback.

