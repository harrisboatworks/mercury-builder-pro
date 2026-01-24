
# Use Custom Domain for Shared Quote Links

## Problem

When copying a quote share link from the admin panel, it uses `window.location.origin` - which means it generates a link to whatever domain you're currently on (e.g., the Lovable preview URL). You want it to always use your public domain: `quote.harrisboatworks.ca`

---

## Solution

1. **Add environment variable** for your public site URL
2. **Update AdminQuoteControls** to use the `SITE_URL` constant instead of `window.location.origin`

---

## Implementation

### 1. Add Environment Variable

Add to `.env`:
```
VITE_SITE_URL=https://quote.harrisboatworks.ca
```

### 2. Update AdminQuoteControls.tsx

Import and use the SITE_URL:

```typescript
import { SITE_URL } from "@/lib/site";

// In handleCopyLink function (line 182):
const shareUrl = `${SITE_URL}/quote/saved/${savedQuoteId}`;

// In the Input display (line 321):
value={`${SITE_URL}/quote/saved/${savedQuoteId}`}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `.env` | Add `VITE_SITE_URL=https://quote.harrisboatworks.ca` |
| `src/components/admin/AdminQuoteControls.tsx` | Import `SITE_URL` and use it instead of `window.location.origin` |

---

## Expected Result

1. Admin creates/saves a quote
2. Clicks "Copy Link"  
3. Link copied is: `https://quote.harrisboatworks.ca/quote/saved/{uuid}`
4. Customer clicks link → lands on your public site with the quote loaded
