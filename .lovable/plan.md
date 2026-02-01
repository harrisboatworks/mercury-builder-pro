
# Fix Pages Loading Halfway Down

## The Problem

When navigating between quote builder steps, the `ScrollToTop` component is skipping its scroll reset because it detects "active modals" that don't actually exist. The console logs prove this:

```text
🧭 ScrollToTop triggered by navigation: /quote/boat-info → /quote/trade-in
⏸️ ScrollToTop skipped - active modals found: 1
🧭 ScrollToTop triggered by navigation: /quote/trade-in → /quote/installation  
⏸️ ScrollToTop skipped - active modals found: 1
```

This causes users to land partway down the new page instead of at the top.

## Root Cause

The modal detection in `ScrollToTop.tsx` uses selectors that match elements that aren't actually blocking modals:

```tsx
const modalSelectors = [
  '[role="dialog"][data-state="open"]',  // ← Matches hidden/offscreen dialogs
  '.fixed.inset-0.z-50',                  // ← Matches sticky footers
  'div.fixed.inset-0[class*="z-"]'        // ← Too broad
];
```

Elements that might trigger false positives:
- Dialog components that are in the DOM but not visually open (have `data-state="open"` before animation completes or cleanup)
- Tooltips, drawers, or other components with `role="dialog"`
- Sticky footer bars with `z-50` classes

## Solution

Simplify the modal detection to be more precise - only skip scroll-to-top for **truly blocking full-screen overlays** that cover the entire viewport and are actually visible.

### File: `src/components/ui/ScrollToTop.tsx`

**Key changes:**

1. **Remove overly broad selectors** - The current selectors match too many false positives
2. **Add proper inset-0 check** - Only elements with `inset: 0` (covering the whole screen) should block scroll
3. **Ignore small/partial elements** - Elements that don't cover the viewport shouldn't block scroll
4. **Add logging for debugging** - Log what elements are being detected to help troubleshoot

**Before (lines 28-63):**
```tsx
// Only catch actual modal dialogs, not tooltips/popovers/dropdowns
const modalSelectors = [
  '[role="dialog"][data-state="open"]',  // Actual dialogs only
  '.fixed.inset-0.z-50',  // Full-screen overlays
  'div.fixed.inset-0[class*="z-"]'  // Any fixed overlay with z-index
];

const activeModals = document.querySelectorAll(modalSelectors.join(', '));
if (activeModals.length > 0) {
  console.log('⏸️ ScrollToTop skipped - active modals found:', activeModals.length);
  return;
}

// More specific modal detection...
const modalOverlays = document.querySelectorAll('.fixed.inset-0[class*="z-"], [role="dialog"][class*="fixed"]');
const visibleModals = Array.from(modalOverlays).filter(el => {
  ...
});
```

**After:**
```tsx
// Only block scroll for TRUE full-screen modal overlays
// Check for elements that:
// 1. Cover the entire viewport (inset: 0px 0px 0px 0px)
// 2. Are fixed position
// 3. Are actually visible
// 4. Have high z-index (blocking other content)
const allFixed = document.querySelectorAll('[style*="position: fixed"], .fixed');
const blockingModals = Array.from(allFixed).filter(el => {
  const style = window.getComputedStyle(el);
  
  // Must be fixed position and visible
  if (style.position !== 'fixed') return false;
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  if (parseFloat(style.opacity) === 0) return false;
  
  // Must cover entire viewport (inset: 0 on all sides)
  const isFullScreen = 
    style.top === '0px' && 
    style.right === '0px' && 
    style.bottom === '0px' && 
    style.left === '0px';
  
  if (!isFullScreen) return false;
  
  // Must have high z-index (modal-level)
  const zIndex = parseInt(style.zIndex);
  if (isNaN(zIndex) || zIndex < 40) return false;
  
  // Extra check: Must have significant size (not a 0x0 hidden element)
  const rect = el.getBoundingClientRect();
  if (rect.width < 100 || rect.height < 100) return false;
  
  return true;
});

if (blockingModals.length > 0) {
  console.log('⏸️ ScrollToTop skipped - blocking modal detected');
  return;
}
```

This ensures only **actual full-screen blocking overlays** (like modal backdrops) prevent scroll-to-top, not sticky bars, toasts, or other fixed UI elements.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ui/ScrollToTop.tsx` | Replace modal detection with more precise full-screen overlay check |

## Result

| Before | After |
|--------|-------|
| Pages load halfway down or at bottom | Pages always start at the top |
| False positives from sticky bars and toasts | Only true modal overlays block scroll reset |
| Frustrating UX requiring manual scroll up | Clean, expected navigation behavior |
