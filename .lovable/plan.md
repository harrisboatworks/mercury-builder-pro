

# Fix Admin Page Scroll Issue

## Problem
The admin quotes page (and likely other admin pages) can't scroll vertically. Two issues contribute:

1. **AdminNav horizontal overflow** — 20+ nav items in a single `flex` row with no wrapping and no `overflow-x-auto`. The nav items push beyond viewport width, which can break the page layout and interfere with vertical scrolling on some browsers.

2. **No `overflow-x-hidden` on page wrapper** — The `<main>` element in `AdminQuotes.tsx` has no overflow containment, so the overflowing nav bleeds into the document width.

## Fix

### 1. AdminNav — Add horizontal scroll to nav container
Make the nav items horizontally scrollable instead of overflowing the page:

| Element | Change |
|---------|--------|
| Nav items `<div>` | Add `overflow-x-auto` and `whitespace-nowrap` so tabs scroll horizontally within the header |
| Hide scrollbar | Add CSS to hide the scrollbar visually while keeping scroll functional |

### 2. AdminQuotes — Add overflow containment
Add `overflow-x-hidden` to the `<main>` wrapper so any overflow from child elements doesn't break page scroll.

## Files Changed

| File | Change |
|------|--------|
| `src/components/admin/AdminNav.tsx` | Add `overflow-x-auto`, `flex-shrink-0`, and scrollbar-hide classes to the nav items container |
| `src/index.css` | Add a small `.admin-nav-scroll` utility to hide the horizontal scrollbar on the admin nav |

