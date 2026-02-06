

# Fix: Mobile FAQ Category Navigation

## Problem

On mobile, the 8 category navigation buttons are rendering as full-width, vertically-stacked cards that consume the entire screen. Each card shows the icon above the category name, taking up massive vertical space. When a category is tapped, the page scrolls behind this wall of cards but the actual FAQ content is hidden.

## Root Cause

The `flex` container with `overflow-x-auto` and `shrink-0` on each button should create a horizontal scroll row, but on narrow mobile viewports each button stretches to fill the container width because there is no explicit `flex-nowrap` constraint and no `max-width` or size constraint on individual buttons. The buttons end up reflowing vertically.

## Solution

Redesign the category navigation to work properly on mobile by:

1. **On mobile (below `md`)**: Show a compact, single-row, horizontally-scrollable chip bar with small pill-shaped buttons. Each chip shows the icon next to the text (inline), is compact, and the whole row scrolls horizontally with hidden scrollbar.

2. **On desktop (above `md`)**: Keep the current horizontal chip layout, which already works fine.

3. **Reduce the sticky nav height** so it doesn't obscure content when a category is tapped.

## Technical Changes

### File: `src/pages/FAQ.tsx`

**Category Navigation Section (lines 100-130)**

Update the chip container and button styles:

- Add `flex-nowrap` explicitly to the flex container to prevent wrapping on any viewport
- Set a mobile-optimized size for each chip: smaller padding (`px-3 py-1.5`), smaller text (`text-xs`), and smaller icon (`h-3.5 w-3.5`) on mobile
- Use responsive classes: `text-xs md:text-sm`, `px-3 md:px-4`, `py-1.5 md:py-2`, `gap-1.5 md:gap-2`
- Add `min-w-0` to the container to allow proper overflow behavior
- Reduce nav padding on mobile from `py-3` to `py-2`

**Scroll offset (line 43)**

Adjust the scroll offset to account for the now-compact sticky nav height (reduce from 120px to a responsive value or keep 120px which covers header + nav).

### Expected Result

The category navigation becomes a compact, horizontally-scrollable chip bar on mobile (similar to filter pills on Google Search or food delivery apps). Tapping a chip smoothly scrolls to the correct FAQ section, which is now fully visible below the compact nav bar. The entire FAQ content is accessible without the nav consuming the screen.

