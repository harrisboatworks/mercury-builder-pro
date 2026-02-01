
# Transom Height Step UI Cleanup

## Issues Identified

Looking at the screenshot and code, there are four problems:

1. **"Previous" button on step 1+** - Redundant since the page has a top-level back button
2. **"Need help measuring transom height?" section** - Looks clunky as a full-width outline button with collapsible content
3. **Useless tip at bottom** - "Tip: You can tap a preset above to speed things up" references presets that don't exist
4. **Overall button styling** - Can be more refined

---

## Solution

### 1. Remove "Previous" button entirely from wizard footer

Since the page-level "Back to Purchase Path" button handles navigation, and we already removed the back button on step 0, let's hide it on ALL steps. Users can use the page header navigation.

**File:** `src/components/quote-builder/BoatInformation.tsx` (lines 1018-1027)

```tsx
// BEFORE: Show "Previous" button on step 1+
{currentStep > 0 ? (
  <Button ...>Previous</Button>
) : (
  <div />
)}

// AFTER: Remove entirely, just use spacer
<div />
```

### 2. Redesign the transom help section

Replace the clunky collapsible button with a cleaner, inline text link approach.

**File:** `src/components/quote-builder/BoatInformation.tsx` (lines 741-760)

```tsx
// BEFORE: Full-width outline button with Collapsible
<Collapsible>
  <CollapsibleTrigger asChild>
    <Button variant="outline" className="w-full justify-between">
      <HelpCircle /> Need help measuring transom height?
      <ChevronDown />
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent>...</CollapsibleContent>
</Collapsible>

// AFTER: Simple text link that opens the TransomHeightCalculator modal
<button
  type="button"
  onClick={() => setShowTransomCalculator(true)}
  className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors flex items-center gap-1.5"
>
  <HelpCircle className="w-4 h-4" />
  Need help measuring?
</button>
```

This leverages the existing `TransomHeightCalculator` modal that already has a proper measurement guide with a visual diagram.

### 3. Remove the useless mobile tip

**File:** `src/components/quote-builder/BoatInformation.tsx` (lines 1041-1044)

```tsx
// DELETE this entire block:
{isMobile && <div className="rounded-lg border border-border bg-protected p-4">
  <div className="text-sm text-protected-subtle">Tip: You can tap a preset above to speed things up.</div>
</div>}
```

### 4. Clean up footer layout

With no "Previous" button, simplify the footer to just center/right-align the "Next" button.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/quote-builder/BoatInformation.tsx` | Remove Previous button from all steps, redesign transom help as text link, remove useless tip |

---

## Result

| Before | After |
|--------|-------|
| Redundant "Previous" button | Single page-level back navigation |
| Clunky full-width collapsible | Clean text link opening modal |
| Useless "tap a preset" tip | Removed |
| Cluttered footer | Clean, single-action footer |
