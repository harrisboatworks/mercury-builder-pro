

# Add HBW API Key to Valuation Fetch

## What
Add the `X-API-Key` header to the direct client-side fetch call in `fetchHBWValuation()` to authenticate with the HBW API and get the full AI-powered valuation response.

## Change

**`src/lib/trade-valuation.ts` ~line 697**

Add the API key header to the existing fetch headers:

```typescript
headers: {
  'Content-Type': 'application/json',
  'X-API-Key': 'hbw-val-44489cc7ed5d13d2cebcd5fc143fa249',
},
```

That's it — one line added. The 401 error goes away, the full HBW response comes through, and the richer UI (HST savings, report link, confidence) will appear.

## Files changed
| File | Change |
|------|--------|
| `src/lib/trade-valuation.ts` | Add `X-API-Key` header to fetch call |

