

# Auto-Dismiss the Floating CTA

**File: `src/components/motors/MobileQuoteCTA.tsx`**

Add a `useEffect` that starts a timer once `visible` becomes `true`. After ~8 seconds (long enough to be noticed but not annoying), automatically set `dismissed` to `true`, fading the CTA out via the existing exit animation.

If the user taps the CTA or manually dismisses it before the timer fires, the timer is cleared on cleanup — no conflict.

Single small change, one file.

