

# Fix: Remove Duplicate Arrow from Reserve Button

## Problem

The Reserve button on mobile displays two arrows (`Reserve $200 → →`) because:

1. **Line 518**: `getPrimaryLabel()` returns `Reserve $${deposit} →` with a hardcoded arrow character
2. **Line 1449**: An `<ArrowRight />` Lucide icon is rendered after the label

## Solution

Remove the hardcoded arrow character from the string in `getPrimaryLabel()` since the `<ArrowRight />` icon already provides the visual indicator.

---

## File to Modify

| File | Change |
|------|--------|
| `src/components/quote-builder/UnifiedMobileBar.tsx` | Remove `→` from reserve label string |

---

## Code Change

### Line 518: Remove Arrow Character

**Current:**
```typescript
return `Reserve $${deposit} →`;
```

**Replace with:**
```typescript
return `Reserve $${deposit}`;
```

---

## Expected Result

| Before | After |
|--------|-------|
| `Reserve $200 → →` | `Reserve $200 →` |

The button will display cleanly with a single arrow icon.

