
# Display Maintenance Kits as Visual Cards

## Problem
The 100-Hour Service Kit (and other maintenance items) appear in a compact list format without a visible image, while items like SmartCraft Connect Mobile display as attractive visual cards with images.

## Root Cause
In `OptionsPage.tsx`, line 19 defines which categories display as visual cards:
```javascript
const VISUAL_CATEGORIES = ['electronics', 'accessory'];
```

Maintenance kits have `category: 'maintenance'`, so they're excluded from the visual grid and rendered as list items instead.

## Solution
Add `'maintenance'` to the `VISUAL_CATEGORIES` array:
```javascript
const VISUAL_CATEGORIES = ['electronics', 'accessory', 'maintenance'];
```

## File Change

| File | Change |
|------|--------|
| `src/pages/quote/OptionsPage.tsx` | Add `'maintenance'` to `VISUAL_CATEGORIES` array (line 19) |

## Result
- All maintenance kits (100-Hour, 300-Hour, Oil Change) will display as visual cards with their product images
- Same attractive card layout as SmartCraft Connect Mobile
- Consistent visual experience across all options with images
