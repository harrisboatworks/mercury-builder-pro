
# Fix: Tiller Motors Loose Path & Electric Start Battery Option

## Problem Summary

Based on analysis of the codebase and the user's report, there are two distinct issues:

1. **Installation costs incorrectly added for "Loose Motor" purchases**  
   When a user selects a tiller motor and chooses "Loose Motor" (no installation), the quote still includes installation/mounting costs. This happens because:
   - The `installConfig` state is not cleared when switching to "loose" path
   - Pricing components add `state.installConfig.installationCost` unconditionally without checking the purchase path
   - Stale data from previous sessions persists in localStorage

2. **Electric start motors lack a battery choice for loose purchases**  
   Electric start tiller motors require a starting battery to operate, but users aren't prompted about whether they want to purchase one when selecting "Loose Motor" path.

---

## Technical Root Cause Analysis

### Issue 1: Installation Cost Leak

**Where it breaks:**
- `src/pages/quote/PurchasePathPage.tsx` - When user selects "loose", only sets `purchasePath` but does NOT clear `installConfig`
- `src/components/quote/GlobalStickyQuoteBar.tsx:64-67` - Adds `installConfig.installationCost` without checking `purchasePath`
- `src/components/quote-builder/UnifiedMobileBar.tsx:411-413` - Same issue
- `src/pages/quote/PackageSelectionPage.tsx:151` - Calculates `tillerInstallCost` without purchase path guard
- `src/pages/quote/QuoteSummaryPage.tsx:233` - Same issue

**Data flow:**
```text
User selects tiller motor -> 
User picks "Installed" and configures mounting ($99) ->
installConfig.installationCost = 99 saved to state and localStorage ->
User changes mind, selects "Loose Motor" ->
installConfig NOT cleared ->
$99 still shows on quote total
```

### Issue 2: Missing Battery Prompt

**Current behavior:**
- Electric start detection works via model codes (EH, ELH, ELPT, etc.)
- Battery cost ($179.99) is automatically added to "Better" and "Best" packages
- No user prompt for loose motor path about whether they want a battery

---

## Implementation Plan

### Part 1: Clear Installation Config for Loose Path

**File: `src/pages/quote/PurchasePathPage.tsx`**
- When user selects "loose" path, dispatch action to clear `installConfig`
- This prevents stale installation costs from polluting the quote

**File: `src/contexts/QuoteContext.tsx`**
- Already has `SET_INSTALL_CONFIG` action that can accept `null`

### Part 2: Add Purchase Path Guards to Pricing Calculations

Update pricing calculations to only include installation/mounting costs when `purchasePath === 'installed'`:

**Files to update:**
- `src/pages/quote/PackageSelectionPage.tsx` - Guard `tillerInstallCost` calculation
- `src/pages/quote/QuoteSummaryPage.tsx` - Guard `tillerInstallCost` calculation
- `src/components/quote/GlobalStickyQuoteBar.tsx` - Guard `installConfig.installationCost` addition
- `src/components/quote-builder/UnifiedMobileBar.tsx` - Guard `installConfig.installationCost` addition
- `src/components/quote-builder/MobileQuoteDrawer.tsx` - Guard mounting hardware line item

### Part 3: Battery Choice for Electric Start Loose Motors

**New Component: `src/components/quote-builder/BatteryOptionPrompt.tsx`**
A simple selection component that asks:
- "Your motor has electric start. Would you like to add a marine starting battery?"
- Options: "Yes, add battery ($179.99)" / "No, I have my own battery"

**File: `src/pages/quote/TradeInPage.tsx`**
- Before navigating away for electric start tiller motors on loose path, check if battery choice is needed
- Show the battery prompt inline or as a step before trade-in completion

**Alternative approach (simpler):**
- Add the battery prompt as a section within the TradeInPage for electric start loose motors
- Store choice in context (new field: `wantsBattery: boolean`)

**File: `src/contexts/QuoteContext.tsx`**
- Add new state field: `looseMotorBattery: { wantsBattery: boolean; batteryCost: number } | null`
- Add new action: `SET_LOOSE_MOTOR_BATTERY`

**Files to update for battery pricing:**
- `src/pages/quote/PackageSelectionPage.tsx` - Include battery cost if selected
- `src/pages/quote/QuoteSummaryPage.tsx` - Include battery in breakdown if selected

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/pages/quote/PurchasePathPage.tsx` | Clear `installConfig` when "loose" is selected |
| `src/contexts/QuoteContext.tsx` | Add `looseMotorBattery` state, add `SET_LOOSE_MOTOR_BATTERY` action |
| `src/pages/quote/PackageSelectionPage.tsx` | Add purchase path guard for `tillerInstallCost`, add loose motor battery cost |
| `src/pages/quote/QuoteSummaryPage.tsx` | Add purchase path guard for `tillerInstallCost`, add loose motor battery to breakdown |
| `src/components/quote/GlobalStickyQuoteBar.tsx` | Add purchase path guard for installation costs |
| `src/components/quote-builder/UnifiedMobileBar.tsx` | Add purchase path guard for installation costs |
| `src/components/quote-builder/MobileQuoteDrawer.tsx` | Add purchase path guard for mounting hardware line item |
| `src/pages/quote/TradeInPage.tsx` | Add battery option prompt for electric start loose motors |
| `src/components/quote-builder/BatteryOptionPrompt.tsx` | **NEW** - Simple yes/no battery selection component |

---

## Example Code Changes

### PurchasePathPage.tsx - Clear install config for loose path
```typescript
const handleStepComplete = (path: 'loose' | 'installed') => {
  pathSelectedOnThisPage.current = true;
  dispatch({ type: 'SET_PURCHASE_PATH', payload: path });
  
  // Clear installation config when selecting loose motor (no installation)
  if (path === 'loose') {
    dispatch({ type: 'SET_INSTALL_CONFIG', payload: null });
  }
  
  dispatch({ type: 'COMPLETE_STEP', payload: 2 });
};
```

### PackageSelectionPage.tsx - Add purchase path guard
```typescript
// Only apply tiller installation cost if purchasePath is 'installed'
const tillerInstallCost = 
  isManualTiller && state.purchasePath === 'installed' 
    ? (state.installConfig?.installationCost || 0) 
    : 0;
```

### GlobalStickyQuoteBar.tsx - Add purchase path guard
```typescript
// Add installation config costs ONLY for installed path
if (state.purchasePath === 'installed' && state.installConfig?.installationCost) {
  total += state.installConfig.installationCost;
}
```

---

## Testing Checklist

1. Select tiller motor → "Loose Motor" → Verify NO installation costs appear
2. Select tiller motor → "Installed" → Configure mounting → Go back → Select "Loose Motor" → Verify costs cleared
3. Select electric start tiller (e.g., 9.9 ELH) → "Loose Motor" → Verify battery prompt appears
4. Decline battery → Verify no battery cost on quote
5. Accept battery → Verify $179.99 appears in quote breakdown
6. Verify localStorage doesn't persist stale installation costs after path change
