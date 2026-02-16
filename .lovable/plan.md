
## Fix: "Serving Ontario Since 1965" to "Since 1947"

### Problem

The footer text reads "Serving Ontario Since 1965" but Harris Boat Works has been in business since **1947**. 1965 is when you became a Mercury dealer, not when the business started.

### Mobile Layout Check

I reviewed the entire financing page on a 390px mobile viewport. Everything looks solid:

- Hero section with promo pill, CTAs, and scroll link -- all properly stacked
- How It Works steps -- stacked vertically, clean spacing
- Benefits cards -- single column, readable
- Promo banner -- fits well, badges/pills wrap correctly
- Calculator -- full-width inputs, good touch targets
- FAQ accordion -- taps and expands cleanly
- Footer -- hours showing correctly from Google (winter schedule), contact info legible, trust badges visible

No layout issues found on mobile.

### Change

**File: `src/components/ui/site-footer.tsx` (line 141)**

Change:
```
Serving Ontario Since 1965
```
To:
```
Serving Ontario Since 1947
```

One line, one file.
