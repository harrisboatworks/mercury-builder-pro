

# Premium Back Button for Options Page

## Current Issues

1. **Faint Styling**: Uses `text-muted-foreground` which makes it barely visible
2. **Icon Only**: No label text - premium sites use "← Back" or "← Back to Motors"
3. **Inconsistent**: Other components in this codebase (MotorDetailsSheet, MotorDetailsPremiumModal) use bold, labeled back buttons

## Premium Patterns (Tesla/Porsche/Apple)

- **Always use Icon + Label** - never a lone chevron
- **High contrast** - `text-gray-700` or darker, not muted
- **Generous touch targets** - min 44px height
- **Subtle feedback** - `active:scale-95` press animation
- **Left-aligned** - clear visual anchor at top-left

## Solution

Follow the existing premium pattern from `MotorDetailsPremiumModal`:

```text
Before (faint, icon-only):
  [ < ]  Options for your 9.9MH FourStroke

After (premium, labeled):
  [ < Back ]  
  Options for your 9.9MH FourStroke
```

Or inline (cleaner):
```text
  [ < Back ]   Options for your 9.9MH FourStroke
```

---

## Implementation

### File: `src/pages/quote/OptionsPage.tsx`

**Replace lines 250-260 with:**

```tsx
{/* Compact Header with Mobile Back */}
<div className="mb-4">
  {/* Mobile Back Button - Premium Style */}
  <button 
    onClick={handleBack}
    className="md:hidden flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors active:scale-95 touch-action-manipulation min-h-[44px] mb-2"
    aria-label="Back to motor selection"
  >
    <ChevronLeft className="h-5 w-5" />
    <span className="text-sm font-medium">Back</span>
  </button>
  
  <p className="text-muted-foreground">
    Options for your {state.motor?.model || 'motor'}
  </p>
</div>
```

---

## Key Changes

| Aspect | Before | After |
|--------|--------|-------|
| Color | `text-muted-foreground` (faint gray) | `text-gray-600` (visible, high contrast) |
| Label | None (icon only) | "Back" text |
| Touch Target | ~28px | `min-h-[44px]` |
| Feedback | None | `active:scale-95` |
| Layout | Inline with subtitle | Stacked (Back above subtitle) |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/quote/OptionsPage.tsx` | Upgrade back button to premium style with label and proper contrast |

