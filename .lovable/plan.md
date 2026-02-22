

# Fix Washed-Out Text Across All Quote Builder Pages

## Problem
The same faded/washed-out issue from the Boat Info page affects multiple pages throughout the quote flow. The Installation page (screenshot) shows "Transom Bolt Mount" and "Permanent bolt-through mounting" looking light and hard to read on iPhone.

The root cause: many components use raw Tailwind classes like `text-gray-500`, `text-gray-600`, and `text-muted-foreground` combined with `font-light`, producing low-contrast text that's hard to read on mobile screens in daylight.

## Solution
Apply the same contrast-boosting approach across all affected quote builder components, upgrading gray text from lighter shades to darker ones and bumping `font-light` to `font-normal` on key labels.

### Color Upgrade Map

| Current | Replacement | Reason |
|---------|-------------|--------|
| `text-gray-500` | `text-gray-700` | Too faint for body text on mobile |
| `text-gray-600` | `text-gray-700` | Slightly too light in bright conditions |
| `text-gray-600 font-light` | `text-gray-700 font-normal` | Double penalty -- light color + light weight |
| `text-muted-foreground font-normal` (in OptionGallery helper) | `text-gray-600` | Bump the helper text contrast |
| `border-gray-200` (price badges) | `border-gray-300` | Match the border fix from Boat Info |

### Files to Update

1. **`src/components/OptionGallery.tsx`** (Installation cards)
   - Helper text: `text-muted-foreground` to `text-gray-600`
   - Price badge border: `border-gray-200` to `border-gray-300`
   - Card background: ensure `bg-white` instead of `bg-card`

2. **`src/components/quote-builder/InstallationConfig.tsx`**
   - Subtitle: `text-gray-600 font-light` to `text-gray-700 font-normal`

3. **`src/components/quote-builder/TradeInValuation.tsx`**
   - Multiple `text-gray-600 font-light` descriptions to `text-gray-700 font-normal`
   - `text-gray-500` hints to `text-gray-600`

4. **`src/components/quote-builder/PurchasePath.tsx`**
   - Card body text: `text-muted-foreground` with `font-light` to `font-normal`
   - Button text: `font-light` to `font-normal`

5. **`src/components/quote-builder/PricingTable.tsx`**
   - `text-gray-600` to `text-gray-700`
   - `text-gray-500` to `text-gray-600`
   - `border-gray-200` to `border-gray-300`

6. **`src/components/quote-builder/MotorSelection.tsx`**
   - `text-gray-600` descriptor text to `text-gray-700`
   - Filter button `text-gray-600` to `text-gray-700`

7. **`src/components/quote-builder/MotorRecommendationQuiz.tsx`**
   - Icon colors: `text-gray-600` to `text-gray-700`
   - Step counter: `text-gray-500` to `text-gray-600`
   - Back button: `text-gray-600` to `text-gray-700`, `font-light` to `font-normal`

8. **`src/components/quote-builder/CurrentStepIndicator.tsx`**
   - `text-gray-600` to `text-gray-700`
   - Dot separator: `text-gray-400` to `text-gray-500`

9. **`src/components/quote-builder/ScheduleConsultation.tsx`**
   - Helper/hint text: `font-light` to `font-normal` where paired with gray text

## Impact
- Every step of the quote builder will be more readable on mobile
- No layout or structural changes
- Consistent darker text throughout the entire flow
- The same clean, premium look -- just easier to read outdoors

