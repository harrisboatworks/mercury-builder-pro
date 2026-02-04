
# AI-Powered Trade-In Valuation via Perplexity

## Overview

Integrate Perplexity search into the trade-in valuation flow to fetch **real-time wholesale/trade values in CAD** when a customer enters their motor details. This replaces static database lookups with live market data sourced from boat trading sites, dealer listings, and valuation guides.

---

## How It Will Work

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Customer enters: 2020 Mercury 115HP Pro XS                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Edge Function: trade-value-lookup                                          │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Query Perplexity: "2020 Mercury 115HP Pro XS outboard motor                │
│                     wholesale trade-in value CAD Canadian dollars"          │
│                                                                             │
│  Search domains: boattrader.com, kijiji.ca, jdpower.com/boats,             │
│                  nada.com, boats.com, marinebluebook.com                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Perplexity returns:                                                        │
│  "Based on current market data, a 2020 Mercury 115HP Pro XS in good         │
│   condition has a wholesale/trade-in value of approximately $8,500-$9,500   │
│   CAD. Retail listings range $11,000-$13,000 CAD."                         │
│                                                                             │
│  Sources: [boattrader.com, kijiji.ca, mercurymarine.com]                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Parse response → Extract trade value range → Apply condition adjustments   │
│  → Display to customer with source citations                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Phase 1: Connect Perplexity to Project

The Perplexity connector exists in the workspace but is not linked to this project. I'll link it using the connector tool.

### Phase 2: Create Edge Function

Create `supabase/functions/trade-value-lookup/index.ts`:

- Accept motor details (brand, year, HP, model, condition)
- Build an optimized Perplexity query for Canadian trade values
- Parse the AI response to extract value ranges
- Return structured data with sources

**Query Template:**
```text
"[YEAR] [BRAND] [HP]HP [MODEL] outboard motor wholesale trade-in value CAD 
Canadian dollars dealer price. What is the fair trade value for this motor 
in [CONDITION] condition?"
```

**Perplexity Configuration:**
```typescript
{
  model: 'sonar',
  messages: [
    { 
      role: 'system', 
      content: `You are a marine valuation expert. Provide trade-in values in Canadian dollars (CAD).
                Return a low-high range for wholesale/trade-in value.
                Format: "Trade-in value: $X,XXX - $X,XXX CAD"
                Also provide retail comparison if available.
                Cite your sources.`
    },
    { role: 'user', content: query }
  ],
  search_domain_filter: [
    'boattrader.com', 
    'boats.com', 
    'kijiji.ca',
    'jdpower.com',
    'nada.com',
    'marinebluebook.com'
  ],
  search_recency_filter: 'year'
}
```

### Phase 3: Update TradeInValuation Component

Modify `src/components/quote-builder/TradeInValuation.tsx`:

1. Add "Get Live Market Value" button alongside current estimate
2. Call the new edge function when clicked
3. Display Perplexity response with source citations
4. Fall back to database values if Perplexity fails or rate-limited

### Phase 4: Hybrid Valuation Strategy

Use a layered approach:

| Priority | Source | When Used |
|----------|--------|-----------|
| 1 | Perplexity live search | Default for all valuations |
| 2 | Supabase cached values | Fallback if Perplexity fails |
| 3 | Hardcoded fallback | Last resort if DB unavailable |

---

## User Experience

**Before (current):**
```text
✓ Get Estimate → Instant static value from database
```

**After (with Perplexity):**
```text
✓ Get Estimate → 2-3 second search → Live market value with sources
   
   "Based on recent Canadian listings:
    Trade-in value: $8,500 - $9,500 CAD
    Retail price: $11,000 - $13,000 CAD
    
    Sources: Boat Trader, Kijiji, J.D. Power"
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/trade-value-lookup/index.ts` | **Create** - Perplexity integration |
| `src/components/quote-builder/TradeInValuation.tsx` | **Modify** - Add live lookup button/flow |
| `src/lib/trade-valuation.ts` | **Modify** - Add parsePerplexityValue helper |

---

## Technical Details

### Response Parsing

Extract structured values from Perplexity's natural language response:

```typescript
function parseTradeValue(response: string): { low: number; high: number } | null {
  // Match patterns like "$8,500 - $9,500" or "8500-9500 CAD"
  const patterns = [
    /\$?([\d,]+)\s*[-–to]\s*\$?([\d,]+)\s*(?:CAD|Canadian)?/i,
    /trade[- ]?in[^:]*:\s*\$?([\d,]+)\s*[-–to]\s*\$?([\d,]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match) {
      return {
        low: parseInt(match[1].replace(/,/g, '')),
        high: parseInt(match[2].replace(/,/g, ''))
      };
    }
  }
  return null;
}
```

### Error Handling

- **Rate limited**: Fall back to database values, show "Market data temporarily unavailable"
- **No results**: Use database values with lower confidence
- **Parse failure**: Log for debugging, use database fallback

### Caching Strategy

Cache Perplexity responses by motor key for 24 hours to:
- Reduce API costs
- Speed up repeat queries
- Provide offline fallback

---

## Expected Outcomes

1. **Accurate market values**: Real-time data from current Canadian listings
2. **Transparent sourcing**: Customers see where values come from (Boat Trader, Kijiji, etc.)
3. **Dealer confidence**: Staff can reference market data when negotiating trade-ins
4. **Fallback safety**: System works even when Perplexity is unavailable
