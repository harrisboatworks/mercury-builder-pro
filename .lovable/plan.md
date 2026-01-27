
# Fix: Stepper Route & Remove Redundant Heading

## Problems
1. **Stepper shows "Step 0 of 7 / Loading..."** because `/quote/boat-info` is missing from the stepper configuration
2. **"Boat Details Wizard" heading is redundant** - the stepper already indicates the step, and the form question is self-explanatory

---

## Changes

### 1. Add Boat Info to Stepper (QuoteProgressStepper.tsx)

Insert the "Boat Info" step after "Purchase Path" (id: 3):

```text
File: src/components/quote-builder/QuoteProgressStepper.tsx

Add new step after line 33:

  {
    id: 4,
    label: 'Boat Info',
    shortLabel: 'Boat',
    path: '/quote/boat-info',
  },
```

Then update all subsequent step IDs (Trade-In becomes 5, Fuel Tank becomes 6, etc.) to maintain proper ordering.

### 2. Remove Redundant Header (BoatInformation.tsx)

Delete the "Boat Details Wizard" header block entirely (lines 466-471):

| Before | After |
|--------|-------|
| "Boat Details Wizard" heading + subheading | No header - content starts directly |

The card's "What type of boat do you have?" question provides sufficient context.

---

## Result

| Element | Before | After |
|---------|--------|-------|
| Mobile stepper | "Step 0 of 7" / "Loading..." | "Step 4 of 7" / "Boat Info" |
| Page header | Large "Boat Details Wizard" + description | Removed (cleaner) |
| First visible content | Form question pushed down | Form question immediately visible |

---

## Technical Details

**File 1: `src/components/quote-builder/QuoteProgressStepper.tsx`**
- Insert Boat Info step with `id: 4`, `path: '/quote/boat-info'`
- Renumber subsequent steps (Trade-In: 5, Fuel Tank: 6, Installation: 7, Promo: 8, Package: 9, Summary: 10)

**File 2: `src/components/quote-builder/BoatInformation.tsx`**
- Delete lines 466-471 (the header `div` with "Boat Details Wizard" and its description)
- This removes ~6 lines of code and improves mobile scroll efficiency
