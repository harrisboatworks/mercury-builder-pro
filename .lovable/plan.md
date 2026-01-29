

# Add Battery Cost to Running Totals

## Problem
When a user selects "Yes" for the marine starting battery on the Options page, the $179.99 cost is not reflected in:
1. **Desktop sticky bar** (`GlobalStickyQuoteBar`)
2. **Mobile sticky bar** (`UnifiedMobileBar`)
3. **Mobile breakdown drawer** (`MobileQuoteDrawer`)

The battery choice is saved to `state.looseMotorBattery`, but none of these components include it in their running total calculations.

## Solution

Add the battery cost from `state.looseMotorBattery` to the `runningTotal` calculation in all three components.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/quote/GlobalStickyQuoteBar.tsx` | Add battery cost to runningTotal |
| `src/components/quote-builder/UnifiedMobileBar.tsx` | Add battery cost to runningTotal |
| `src/components/quote-builder/MobileQuoteDrawer.tsx` | Add battery cost to pricing + line item |

---

## Code Changes

### 1. GlobalStickyQuoteBar.tsx (lines 76-84)

Add after the fuel tank config block:

```typescript
// Add fuel tank config (for small tillers)
if (state.fuelTankConfig?.tankCost) {
  total += state.fuelTankConfig.tankCost;
}

// Add battery cost (if user opted for it)
if (state.looseMotorBattery?.wantsBattery && state.looseMotorBattery?.batteryCost) {
  total += state.looseMotorBattery.batteryCost;
}

// Add warranty
if (state.warrantyConfig?.warrantyPrice) {
```

Also add to the dependency array (line 103):
```typescript
state.looseMotorBattery?.wantsBattery,
state.looseMotorBattery?.batteryCost,
```

### 2. UnifiedMobileBar.tsx (lines 416-428)

Add after the fuel tank config block:

```typescript
if (state.fuelTankConfig?.tankCost) {
  total += state.fuelTankConfig.tankCost;
}

// Add battery cost (if user opted for it)
if (state.looseMotorBattery?.wantsBattery && state.looseMotorBattery?.batteryCost) {
  total += state.looseMotorBattery.batteryCost;
}

// Add selected options (fuel tanks, accessories, etc. from Options page)
```

Also add to the dependency array.

### 3. MobileQuoteDrawer.tsx (lines 98-102)

Add after the fuel tank block:

```typescript
// Fuel tank
if (state.fuelTankConfig?.tankCost && state.fuelTankConfig?.tankSize) {
  subtotal += state.fuelTankConfig.tankCost;
  lineItems.push({ label: `${state.fuelTankConfig.tankSize} Fuel Tank`, value: state.fuelTankConfig.tankCost });
}

// Battery (if user opted for it)
if (state.looseMotorBattery?.wantsBattery && state.looseMotorBattery?.batteryCost) {
  subtotal += state.looseMotorBattery.batteryCost;
  lineItems.push({ label: 'Marine Starting Battery', value: state.looseMotorBattery.batteryCost });
}

// Trade-in
```

---

## Expected Result

| Action | Before | After |
|--------|--------|-------|
| Select battery on Options page | Bar shows motor price only | Bar updates to include +$179.99 |
| Expand mobile drawer | Battery not listed | Battery shown as line item |
| Navigate through flow | Total stays unchanged | Total reflects battery choice |

