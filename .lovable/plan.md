

## Bug: Harris logo appears blacked out on cinematic intro

### Root Cause

In `QuoteRevealCinematic.tsx` (lines 355-358), the Harris logo uses a two-step CSS filter to render white on the dark cinematic background:

```css
filter: brightness(0) invert(1) drop-shadow(...)
```

The intent is: `brightness(0)` turns all pixels black, then `invert(1)` flips black to white. However, on the near-black cinematic background (`#0A0A0A`), if `invert()` doesn't fully apply (browser rendering quirk, compositing order, or the logo PNG having semi-transparent/anti-aliased edges), the result is a black silhouette on a black background — invisible / "blacked out."

Additionally, `imageUrl` on line 177 of `QuoteSummaryPage.tsx` is always `null` because the motor object stores its image as `motor.image`, not `motor.imageUrl` or `motor.thumbnail`. So the logo fallback branch always runs — confirming the logo is what the user sees.

### Fix

**File**: `src/components/quote-builder/QuoteRevealCinematic.tsx`, lines 351-359

Replace the current logo rendering with `harris-logo-black.png` (already in assets — a black-on-transparent version), and simplify the filter to just `invert(1)` plus the drop-shadow. Using a known-black source with a single `invert(1)` is more reliable across browsers than the `brightness(0) invert(1)` chain on a colored logo.

```tsx
import harrisLogoBlack from '@/assets/harris-logo-black.png';
```

Then in the fallback branch:
```tsx
<img 
  src={harrisLogoBlack}
  alt="Harris Boat Works"
  className="h-20 md:h-32 w-auto object-contain"
  style={{
    filter: 'invert(1) drop-shadow(0 4px 20px rgba(255, 255, 255, 0.15))',
    opacity: 0.9,
  }}
/>
```

Single file change, two edits (import + img src/filter).

