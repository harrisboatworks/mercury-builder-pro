

# Fix: Hide Included Fuel Tank When Upgrade Selected

## Problem
When a user selects a 9.9EH motor and upgrades to the 25L fuel tank, the Quote Summary shows both:
- **12L Fuel Tank & Hose: $0** (Included with motor)
- **25L Fuel Tank & Hose: $200** (Optional upgrade)

The upgrade should replace the included tank in the display, not appear alongside it.

## Solution

Update `QuoteSummaryPage.tsx` to filter out the $0 included fuel tank when an upgraded fuel tank (price > $0) is selected.

---

## File to Modify

| File | Change |
|------|--------|
| `src/pages/quote/QuoteSummaryPage.tsx` | Filter out included fuel tanks when upgrade is selected; guard Best package fuel tank logic |

---

## Code Changes

### Lines 294-307: Add upgrade detection and filter logic

**Current code:**
```typescript
// Build accessory breakdown
const accessoryBreakdown = useMemo(() => {
  const breakdown = [];
  
  // Selected motor options
  if (state.selectedOptions && state.selectedOptions.length > 0) {
    state.selectedOptions.forEach(option => {
      breakdown.push({
        name: option.name,
        price: option.price,
        description: option.isIncluded ? 'Included with motor' : undefined
      });
    });
  }
```

**Replace with:**
```typescript
// Build accessory breakdown
const accessoryBreakdown = useMemo(() => {
  const breakdown = [];
  
  // Check if user selected an upgraded fuel tank (replaces included tank)
  const hasUpgradedFuelTank = state.selectedOptions?.some(
    opt => opt.name?.toLowerCase().includes('fuel tank') && opt.price > 0
  );
  
  // Check if user already has any fuel tank selected (for Best package logic)
  const hasAnyFuelTankSelected = state.selectedOptions?.some(
    opt => opt.name?.toLowerCase().includes('fuel tank')
  );
  
  // Selected motor options
  if (state.selectedOptions && state.selectedOptions.length > 0) {
    state.selectedOptions.forEach(option => {
      // If user selected an upgraded fuel tank, skip the included $0 tank
      const isFuelTank = option.name?.toLowerCase().includes('fuel tank');
      const isIncludedTank = isFuelTank && option.isIncluded && option.price === 0;
      
      // Skip included tank if user upgraded to a different tank
      if (isIncludedTank && hasUpgradedFuelTank) {
        return; // Don't add included tank to breakdown
      }
      
      breakdown.push({
        name: option.name,
        price: option.price,
        description: option.isIncluded ? 'Included with motor' : undefined
      });
    });
  }
```

### Lines 371-377: Guard Best package fuel tank addition

**Current code:**
```typescript
// Fuel tank for Premium
if (selectedPackage === 'best' && canAddFuelTank) {
  breakdown.push({
    name: '12L External Fuel Tank & Hose',
    price: 199,
    description: 'Portable fuel tank for extended range'
  });
}
```

**Replace with:**
```typescript
// Fuel tank for Premium - only if user hasn't already selected one
if (selectedPackage === 'best' && canAddFuelTank && !hasAnyFuelTankSelected) {
  breakdown.push({
    name: '12L External Fuel Tank & Hose',
    price: 199,
    description: 'Portable fuel tank for extended range'
  });
}
```

---

## Expected Result

| Scenario | Before | After |
|----------|--------|-------|
| 9.9EH with 12L included only | 12L: $0 ✓ | 12L: $0 ✓ |
| 9.9EH + 25L upgrade selected | 12L: $0, 25L: $200 ❌ | 25L: $200 ✓ |
| 9.9EH + Best Package (no manual tank) | 12L: $199 ✓ | 12L: $199 ✓ |
| 9.9EH + Best Package + 25L upgrade | 12L: $0, 25L: $200, 12L: $199 ❌ | 25L: $200 ✓ |

