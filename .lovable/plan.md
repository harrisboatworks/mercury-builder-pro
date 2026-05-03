## Rename nav labels

Agreed — the `/` route is the marketing landing page, and `/quote/motor-selection` is where engines are actually browsed. The labels are backwards.

### Changes

1. **`src/components/repower/RepowerHeader.tsx`** (line 10)
   - Change `{ to: '/', label: 'Engines' }` → `{ to: '/', label: 'Home' }`
   - Add a new nav item: `{ to: '/quote/motor-selection', label: 'Motors' }`

2. **`src/components/repower/RepowerMobileMenu.tsx`** (line 14)
   - Same change in the mobile nav array.

### Notes
- Using "Motors" (not "Engines") to stay consistent with existing app terminology like "motor-selection", "Build Your Quote", and trust strip copy ("Mercury Motors").
- The header already has a "Build Your Quote" CTA button pointing to `/quote/motor-selection`; the new "Motors" nav link is a secondary text link for browsing without committing to the quote flow.