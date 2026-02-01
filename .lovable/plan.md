
# Real-Time Price Updates in Bottom Bar

## The Problem

When you select or unselect options on the Options page, the bottom bar stays at $2,999 instead of updating. This happens because:

1. **Local State Only**: Option toggles update a local state (`localSelectedIds`) within the page
2. **Delayed Sync**: The QuoteContext (which the bar reads from) only gets updated when you click "Continue"
3. **Bar Reads Context**: `UnifiedMobileBar` displays `state.selectedOptions` from the context, which is stale during browsing

## The Solution

Sync selections to QuoteContext immediately on each toggle, so the bar reflects changes in real-time.

### How It Works

```text
User taps option card
       ↓
toggleOption() updates localSelectedIds (for UI checkmarks)
       ↓
NEW: Also dispatches SET_SELECTED_OPTIONS to QuoteContext
       ↓
UnifiedMobileBar re-calculates total (already has this logic)
       ↓
Price updates instantly in the bar
```

---

## Implementation

### File: `src/pages/quote/OptionsPage.tsx`

**Add a `useEffect` that syncs local selections to context on every change:**

```tsx
// After localSelectedIds changes, sync to QuoteContext for real-time bar updates
useEffect(() => {
  if (!categorizedOptions) return;
  
  const allOptions = [
    ...categorizedOptions.required,
    ...categorizedOptions.recommended,
    ...categorizedOptions.available,
  ];

  const selectedOptions = allOptions
    .filter(opt => localSelectedIds.has(opt.id))
    .map(opt => ({
      optionId: opt.id,
      name: opt.name,
      price: opt.is_included ? 0 : (opt.price_override ?? opt.base_price),
      category: opt.category,
      assignmentType: opt.assignment_type,
      isIncluded: opt.is_included,
    }));

  dispatch({ type: 'SET_SELECTED_OPTIONS', payload: selectedOptions });
}, [localSelectedIds, categorizedOptions, dispatch]);
```

This effect:
- Runs whenever `localSelectedIds` changes (i.e., after every toggle)
- Builds the selectedOptions array from the current selections
- Dispatches to QuoteContext immediately
- The bar's `useMemo` dependency on `state.selectedOptions` triggers a re-render

---

## Battery Choice Sync

Similarly, sync the battery choice immediately so the bar updates when you select "Yes, include battery":

```tsx
// Sync battery choice to context for real-time bar updates
useEffect(() => {
  if (isElectricStart && batteryChoice !== null) {
    dispatch({ 
      type: 'SET_LOOSE_MOTOR_BATTERY', 
      payload: { wantsBattery: batteryChoice, batteryCost: BATTERY_COST } 
    });
  }
}, [batteryChoice, isElectricStart, dispatch]);
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/quote/OptionsPage.tsx` | Add two `useEffect` hooks to sync selections and battery choice to QuoteContext in real-time |

---

## Result

- **Before**: Bar shows $2,999 (base motor) until you click Continue
- **After**: Bar updates to $3,324 as soon as you tap SmartCraft Connect ($325)

This makes the bottom bar a true "live companion" that reflects every choice as you make it.
