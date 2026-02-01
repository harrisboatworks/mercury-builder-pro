
# Streamline Options Page Header & Add Mobile Back Button

## Issues Identified

1. **Too Much Text**: The current header uses both a large `h1` ("Customize Your Motor Package") and a paragraph subtitle ("Select additional options and accessories for your {motor}"), which consumes valuable vertical space on mobile.

2. **No Back Button on Mobile**: The desktop sticky footer includes a Back button, but it's hidden behind the `UnifiedMobileBar` on mobile devices. Users have no way to return to motor selection.

---

## Solution

### 1. Simplify the Header

Remove the large `h1` heading and keep only a cleaner, context-aware subtitle. The section headers ("Recommended Add-Ons", "Available Options") already explain what the page contains.

**Before:**
```
Customize Your Motor Package          ← Remove this
Select additional options...          ← Keep, but shorter
```

**After:**
```
Options for your 9.9MH FourStroke     ← Single clean line
```

Or even simpler - just remove the header entirely since the section titles are self-explanatory.

### 2. Add Back Button Above Content on Mobile

Add a simple back link at the top of the page (below the stepper) that only shows on mobile. This follows the pattern used on other quote pages and provides a clear way to navigate back.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/quote/OptionsPage.tsx` | Simplify header, add mobile-only back link, hide desktop footer on mobile |

---

## Implementation Details

### Header Simplification
Replace the `mb-8` header block with a more compact version:

```tsx
{/* Compact Header - Mobile-friendly */}
<div className="mb-4 flex items-center gap-3">
  {/* Mobile Back Button */}
  <button 
    onClick={handleBack}
    className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
    aria-label="Back to motor selection"
  >
    <ChevronLeft className="h-5 w-5" />
  </button>
  
  <p className="text-muted-foreground">
    Options for your {state.motor?.model || 'motor'}
  </p>
</div>
```

### Desktop Footer Visibility
Add `hidden md:flex` to ensure the sticky footer only shows on desktop:

```tsx
<div className="hidden md:block fixed bottom-0 ...">
```

---

## Visual Result

**Mobile:**
- Clean back arrow at top left
- Single line "Options for your 9.9MH FourStroke"
- Immediately shows first section ("Recommended Add-Ons")
- UnifiedMobileBar handles Continue/Skip navigation

**Desktop:**
- Compact header text
- Sticky footer with Back, Total, and Continue buttons (unchanged)

---

## Technical Notes

- The `handleBack` function already exists (lines 197-199)
- Mobile users rely on `UnifiedMobileBar` for forward navigation
- Desktop users continue using the sticky footer
- Reduces vertical scroll distance by ~60px on mobile
