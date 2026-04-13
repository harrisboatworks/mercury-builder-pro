

# Fix All Motor Pricing — Full Database Correction

## Problem
26 motors have corrupted `msrp` and/or `dealer_price` values. Some are catastrophically wrong (115 ProXS CT showing $8,599 instead of $20,190). The correct values are already in two CSV files in the project.

## Data sources
- `public/mercury-dealer-prices.csv` — has MSRP (col 3) and Our Price (col 4, labeled "Base Price +10%") for all 133 motors
- `src/data/mercury-official-pricing.csv` — has Our Price (col 3) for all motors (cross-reference)

## Plan

### 1. Migration: Update all 133 motors from CSV data
Write a SQL migration that sets correct `msrp` and `dealer_price` for every brochure motor using model_number as the key. Values come directly from `mercury-dealer-prices.csv`:
- `msrp` = CSV column 3 (MSRP)
- `dealer_price` = CSV column 4 (Our Price)

This fixes all 26 corrupted motors AND ensures the other 107 are still correct.

**Will preserve your 9.9 manual override pricing** — those use `manual_overrides->sale_price` which is a separate field and takes priority in the UI. The migration only touches `msrp` and `dealer_price`.

### 2. Remove artificial 10% MSRP inflation from `src/lib/pricing.ts`
Once every motor has `dealer_price < msrp`, the fake inflation in `getDisplayPrices()` is unnecessary. Remove that branch so the site only shows real prices.

### 3. Verify the 4 motors with manual override sale prices
Confirm these still display correctly after the fix:
- 1A10301LK (9.9hp) — override sale $3,299
- 1A10201LK (9.9hp) — override sale $2,999
- 1A10311LK (9.9hp) — override sale $3,399
- 1A10211LK (9.9hp) — override sale $2,999

These will now show: MSRP (from CSV) struck through → Our Price (from override) → SAVE (real difference).

## Result
- Every motor shows accurate MSRP and Our Price from the official price list
- Red SAVE badge shows real savings on every motor
- No fake/inflated pricing anywhere
- Your 9.9 override promotions continue working
- Quote math, financing, and saved records unchanged

| Change | Detail |
|--------|--------|
| Migration | UPDATE `msrp` and `dealer_price` for all 133 brochure motors from CSV |
| `src/lib/pricing.ts` | Remove artificial 10% inflation — real data only |
| Files touched | 1 migration + 1 code file |

