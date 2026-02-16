

## Replace Hardcoded Pinning with Dynamic In-Stock-First Sort

### What changes

**File: `src/pages/quote/MotorSelectionPage.tsx`**

1. **Remove** the `CRITICAL_MODELS` constant (line 128)
2. **Update** the `filteredMotors` memo (lines 566-577) to replace the hardcoded pinning with a dynamic sort:
   - In-stock motors appear first, sorted by HP ascending
   - Out-of-stock / order-only motors follow, also sorted by HP ascending
   - This applies only when there's no active search query (search results keep relevance-based ordering)

### Before (current logic)

```
const CRITICAL_MODELS = ['1A10201LK', '1C08201LK'];
// ...
const criticalMotors = processedMotors.filter(motor =>
  CRITICAL_MODELS.includes(motor.model_number || '') && motor.in_stock
);
const nonCritical = processedMotors.filter(m =>
  !criticalMotors.some(cm => cm.id === m.id)
);
return [...criticalMotors, ...nonCritical];
```

### After (new logic)

```
if (!searchQuery) {
  const inStock = processedMotors.filter(m => m.in_stock);
  const outOfStock = processedMotors.filter(m => !m.in_stock);
  // Both groups keep their existing HP sort
  return [...inStock, ...outOfStock];
}
```

### Why this is better

- No hardcoded model numbers to maintain -- works automatically as inventory changes
- Customers immediately see what they can buy today
- HP ordering is preserved within each group for easy browsing
- Stock badges already provide clear visual distinction, no extra UI needed

### Scope

One file, ~10 lines changed. No new dependencies.

