

## Fix: Hide Monthly Payment on Motor Cards Under $5,000

Two files need a minor guard added — no logic removed, just gated behind the existing $5,000 threshold so it's easy to re-enable later.

### Changes

**File 1: `src/components/motors/MotorCardPreview.tsx`** (~line 329)

Change the `calculateMonthlyPayment` function's early return from `price <= 0` to `price < 5000`:

```typescript
const calculateMonthlyPayment = () => {
  if (!price || price < 5000) return null;  // was: price <= 0
  // rest stays the same
};
```

The `{monthlyPayment && (...)}` render block already handles `null` — no template changes needed.

**File 2: `src/components/motors/MotorCardPremium.tsx`** (~line 117-119)

Gate the `financingDisplay` variable:

```typescript
const financingDisplay = price && price >= 5000
  ? getFinancingDisplay((price) * 1.13, promo?.rate || null)
  : null;
```

Both changes align with the existing `FINANCING_MINIMUM = 5000` constant used throughout the rest of the app.

