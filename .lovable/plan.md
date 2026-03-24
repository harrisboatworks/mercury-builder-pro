

# Trade-In Valuation: Fair Anchor Point

## The Math

Current MSRP percentages by age bracket (stored in `trade_valuation_config`):

| Age | Excellent | Good | Fair | Poor |
|-----|-----------|------|------|------|
| 1-3yr | 55% | 50% | 40% | 25% |
| 4-7yr | 44% | 40% | 32% | 20% |
| 8-12yr | 29% | 26% | 21% | 13% |

For a **2020 Mercury 15hp** (6 years old → 4-7yr bracket):

| Anchor | Excellent (44%) | Good (40%) | Fair (32%) |
|--------|----------------|------------|------------|
| Max MSRP (~$5,572) | **$2,452** | $2,229 | $1,783 |
| Median MSRP (~$4,480) | **$1,971** | $1,792 | $1,434 |
| Selling price (~$3,800) | **$1,672** | $1,520 | $1,216 |

## My Recommendation: Use Selling Price, Keep Percentages

**Anchor to your selling price** — this is what a customer actually pays for a new replacement at your shop. It's the most defensible number if a customer ever asks "how'd you get that?"

The percentages themselves are already reasonable and aligned with wholesale/dealer trade-in guides. The problem was never the percentages — it was the inflated anchor.

With selling price as the anchor:
- A 2020 15hp in "excellent" comes in around **$1,675** (range ~$1,425–$1,925)
- In "good" (what most motors actually are): **$1,520** (range ~$1,290–$1,750)
- That gives you room to resell at $2,000–2,500 or put it to work as a shop/loaner motor

This is competitive enough that customers won't walk away, but realistic enough that you're not overpaying. And since everyone claims "excellent," the "good" value is really what matters — and $1,500 for a 6-year-old 15hp feels right.

## The Change

### File: `src/hooks/useTradeValuationData.ts`
- Already updated to use **median** MSRP — now change to use **selling price** instead
- Query `sale_price`, `dealer_price`, `base_price` alongside `msrp`
- Resolve each motor's price using the existing hierarchy: `sale_price → dealer_price (if < msrp) → base_price → msrp`
- Compute median of resolved selling prices per HP class

This is a ~15-line change in one file. The percentages in the database stay the same — only the anchor shifts.

