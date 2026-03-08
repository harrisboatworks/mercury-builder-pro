

## Add "+ HST" label after price counter completes

### What changes

**File: `src/components/quote-builder/QuoteRevealCinematic.tsx`**

After the price text (line 473, after `{money(displayPrice)}`), add a small `+ HST` label that fades in only when `priceComplete` is true. This keeps the counter animation untouched and adds the tax note as a subtle suffix.

Insert right after the closing `</motion.span>` of the price text (after line 473), still inside the `relative` div:

```tsx
{/* "+ HST" suffix - appears after price counter completes */}
<AnimatePresence>
  {priceComplete && (
    <motion.span
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 0.5, x: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="absolute -right-16 md:-right-20 bottom-1 md:bottom-2 text-xs md:text-sm font-medium tracking-wide"
      style={{ color: '#9CA3AF' }}
    >
      + HST
    </motion.span>
  )}
</AnimatePresence>
```

This positions "+ HST" to the right of the price, small and muted, fading in 300ms after the counter finishes. No existing animations or logic are modified.

