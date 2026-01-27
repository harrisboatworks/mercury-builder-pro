
# Fix: Remove Redundant Heading on Purchase Path Page

## Problem
The Purchase Path page (`/quote/purchase-path`) displays a redundant "Great Choice! 60 ELPT FourStroke" heading and "How would you like to purchase this motor?" subheading. This is unnecessary because:
- The stepper already indicates the user is on the "Purchase Path" step
- The user just selected this motor so a confirmation is redundant
- The card titles ("Loose Motor" / "Professional Installation") are self-explanatory

## Solution
Remove the header section from `PurchasePath.tsx` to let the cards speak for themselves.

---

## File to Modify

| File | Change |
|------|--------|
| `src/components/quote-builder/PurchasePath.tsx` | Delete lines 59-64 (header block) |

---

## Change Details

### Remove Header Block (lines 59-64)

**Delete this entire block:**
```tsx
<div className="text-center mb-12">
  <h2 className="text-3xl md:text-4xl font-light tracking-wide text-foreground mb-3">
    Great Choice! {selectedMotor?.model}
  </h2>
  <p className="text-muted-foreground font-light">How would you like to purchase this motor?</p>
</div>
```

### Adjust Container Spacing

With the header removed, update the container padding from `py-8` to `py-4` since we no longer need as much top spacing:

```tsx
// Line 57: before
className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"

// After
className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4"
```

---

## Result

| Before | After |
|--------|-------|
| "Great Choice! 60 ELPT FourStroke" heading | Removed |
| "How would you like to purchase this motor?" subheading | Removed |
| Cards pushed down by header | Cards immediately visible |

---

## Visual Impact

The two purchase option cards ("Loose Motor" and "Professional Installation") will now be the first visible content, providing a cleaner experience consistent with the Boat Info page design.
