

# Fix Trade-In Page: Wrong Value + Unresponsive Condition Buttons

## Bug 1: $200 value on a 60HP motor — auto-estimate fires too early

**Root cause**: When you type "60" in the HP field on mobile, the `onChange` fires on every keystroke. After typing "6", `horsepower` becomes 6 (truthy). Since brand, year, and condition are already filled, the auto-estimate `useEffect` fires immediately with HP=6 — before you can type "0".

With HP=6: Evinrude, 2012, 2-stroke, "Good" → tiered base $2,100 × 0.3 age × 0.75 condition × 0.5 brand penalty = ~$200 (the under-25HP floor). That matches exactly what you saw.

**Fix**: Add a debounce (800ms) to the auto-estimate `useEffect` so it waits for the user to finish typing before calculating. Clear the timer on each keystroke.

## Bug 2: Condition buttons unresponsive on mobile

**Root cause**: Condition cards use `motion.div` with `whileHover` + `onClick`. On touch devices, Framer Motion's hover gesture intercepts touch events, making buttons require multiple taps or feel broken.

**Fix**: Change `motion.div` to `motion.button` with `type="button"`, replace `onClick` with Framer Motion's `onTap` handler, and remove `whileHover` (replace with CSS hover via Tailwind so it only applies on hover-capable devices).

## Technical details

### File: `src/components/quote-builder/TradeInValuation.tsx`

**Debounce auto-estimate** (lines 58-72):
```typescript
useEffect(() => {
  if (!tradeInInfo.hasTradeIn) {
    autoEstimateTriggered.current = false;
    return;
  }
  const { brand, year, horsepower, condition } = tradeInInfo;
  const allFilled = brand && year && horsepower && condition;
  if (allFilled && !isLoading && !estimate && !autoEstimateTriggered.current) {
    const timer = setTimeout(() => {
      autoEstimateTriggered.current = true;
      handleGetEstimate();
    }, 800);
    return () => clearTimeout(timer);
  }
}, [tradeInInfo.brand, tradeInInfo.year, tradeInInfo.horsepower, tradeInInfo.condition, tradeInInfo.hasTradeIn]);
```

**Fix condition buttons** (lines 440-458):
- Change `motion.div` → `motion.button type="button"`
- Replace `whileHover={{ scale: 1.02, y: -2 }}` → remove (use Tailwind `hover:scale-[1.02] hover:-translate-y-0.5` instead)
- Replace `onClick` → `onTap`
- Stack single-column on small screens: change `grid-cols-2 md:grid-cols-4` → `grid-cols-1 sm:grid-cols-2 md:grid-cols-4` for bigger tap targets on mobile

## Files changed

| File | Change |
|------|--------|
| `src/components/quote-builder/TradeInValuation.tsx` | Debounce auto-estimate (800ms); fix condition buttons for mobile touch |

