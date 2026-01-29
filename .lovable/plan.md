

# Fix: Purchase Path Page Not Scrolling to Top

## Problem
When navigating from `/quote/options` to `/quote/purchase-path`, the page doesn't scroll to the top. Users land somewhere in the middle of the page.

## Root Cause
The console logs reveal:
```
🧭 ScrollToTop triggered by navigation: /quote/options → /quote/purchase-path
⏸️ ScrollToTop skipped - active modals found: 1
```

The `ScrollToTop` component uses an overly broad modal detection selector:
```javascript
const modalSelectors = [
  '[role="dialog"]',
  '.fixed.inset-0.z-50',
  'div.fixed.inset-0[class*="z-"]',
  '[data-state="open"]'  // ← PROBLEM: Too broad!
];
```

The `[data-state="open"]` selector catches **any** open Radix UI component, including:
- Tooltips (from `MotorCodeTooltip`)
- Popovers
- Dropdowns in the header
- Select components

These are NOT blocking modals and shouldn't prevent scroll-to-top.

---

## Solution

Refine the modal detection to only catch **actual modal dialogs**, not every open Radix component.

### Changes to `ScrollToTop.tsx`

1. **Remove the overly broad `[data-state="open"]` selector** from the initial check
2. **Add more specific modal detection** that checks for actual dialog overlays with proper z-index and visibility
3. **Keep the existing refined detection** (lines 42-64) which already does proper visibility and z-index checks

### Updated Modal Detection Logic

```typescript
// Only check for actual modal dialogs, not tooltips/popovers/dropdowns
const modalSelectors = [
  '[role="dialog"][data-state="open"]',  // Actual dialogs only
  '.fixed.inset-0.z-50',  // Full-screen overlays
  'div.fixed.inset-0[class*="z-"]'  // Any fixed full-screen overlay
];
```

The key change is from `[data-state="open"]` (which matches any open Radix component) to `[role="dialog"][data-state="open"]` (which only matches actual dialog components that are open).

---

## Technical Details

| Before | After |
|--------|-------|
| `[data-state="open"]` catches tooltips, popovers, selects, dropdowns | `[role="dialog"][data-state="open"]` only catches actual dialogs |
| Navigation to purchase-path was blocked by tooltip residue | Navigation proceeds normally |

---

## File to Modify

| File | Change |
|------|--------|
| `src/components/ui/ScrollToTop.tsx` | Update `modalSelectors` to be more specific, removing the overly broad `[data-state="open"]` selector |

## Result
After this fix:
- Navigating from Options → Purchase Path will scroll to the top correctly
- Actual modal dialogs will still correctly prevent scroll-to-top
- Tooltips, popovers, dropdowns, and select components will NOT block scroll behavior

