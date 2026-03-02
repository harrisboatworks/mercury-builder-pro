

## Fix: Use the actual white Harris logo on cinematic intro

The user has provided a proper white-on-transparent Harris Boat Works logo. The previous approach of using CSS filters (`invert`, `brightness`) on a black logo was producing a distorted result that doesn't match the real logo.

### Fix

1. **Copy** the uploaded white logo to `src/assets/harris-logo-white.png`
2. **Update** `QuoteRevealCinematic.tsx`:
   - Import `harrisLogoWhite` from the new asset
   - Replace the fallback `<img>` to use `harrisLogoWhite` directly with **no CSS filter tricks** — just a subtle drop-shadow
   - Remove the `harrisLogoBlack` import (no longer needed)

```tsx
import harrisLogoWhite from '@/assets/harris-logo-white.png';

// In the fallback branch:
<img 
  src={harrisLogoWhite}
  alt="Harris Boat Works"
  className="h-20 md:h-32 w-auto object-contain"
  style={{
    filter: 'drop-shadow(0 4px 20px rgba(255, 255, 255, 0.15))',
    opacity: 0.9,
  }}
/>
```

Single file change + one asset copy. No more filter hacks.

