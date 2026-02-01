

# Fix Purchase Path Back Button - Style & Navigation

## Issues Identified

1. **Inconsistent Styling**: The Purchase Path page uses a boxed `Button variant="outline"` with "Back to Motor Selection", while the Options page (and premium patterns) use a clean, unboxed text link with just "< Back"

2. **Wrong Navigation Target**: Currently navigates to `/quote/motor-selection` (Step 1) instead of `/quote/options` (Step 2 - the immediate previous page)

## Quote Flow Reference

| Step | Page | Previous Page |
|------|------|---------------|
| 1 | Motor Selection | — |
| 2 | Options | Motor Selection |
| 3 | **Purchase Path** | **Options** ← Should go here |
| 4 | Boat Info | Purchase Path |

## Solution

Update `PurchasePathPage.tsx` to match the premium styling from OptionsPage and fix the navigation target.

### File: `src/pages/quote/PurchasePathPage.tsx`

**Current (lines 89-101):**
```tsx
const handleBack = () => {
  navigate('/quote/motor-selection');  // Wrong!
};

return (
  <PageTransition>
    <QuoteLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack} className="border-gray-300...">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Motor Selection
          </Button>
        </div>
```

**After:**
```tsx
const handleBack = () => {
  navigate('/quote/options');  // Correct previous step
};

return (
  <PageTransition>
    <QuoteLayout>
      <div className="space-y-6">
        {/* Premium Back Button - matches Options page style */}
        <button 
          onClick={handleBack}
          className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors active:scale-95 touch-action-manipulation min-h-[44px]"
          aria-label="Back to options"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        
        <PurchasePath ... />
      </div>
    </QuoteLayout>
  </PageTransition>
);
```

## Changes Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Navigation** | `/quote/motor-selection` (skips Options) | `/quote/options` (correct previous step) |
| **Style** | Boxed outline button | Clean text link with icon |
| **Icon** | `ArrowLeft` | `ChevronLeft` (matches Options page) |
| **Label** | "Back to Motor Selection" | "Back" |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/quote/PurchasePathPage.tsx` | Fix navigation target & update button style |

## Additional Notes

- Import `ChevronLeft` from lucide-react (replace `ArrowLeft`)
- Remove the `Button` component usage for back navigation
- The premium style uses a native `<button>` element with Tailwind classes for a cleaner, unboxed look

