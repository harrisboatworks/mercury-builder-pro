

# Expand Agent Quote API to Support Full Quote Building

## What You're Building

Transform the agent-quote-api from a basic "motor + line items" tool into a full quote builder that matches the UI's capabilities. The agent should be able to build quotes with promotional selections, trade-in valuations, purchase path, warranty, and packages — the same selections a customer or admin can make through the website.

## New API Actions

### 1. `list_promotions` — Fetch Active Promotions & Options

Queries the `promotions` table for active promotions and returns:
- Warranty bonus years
- Choose-one options (no_payments, special_financing, cash_rebate)
- Rebate matrix (HP ranges → rebate amounts)
- Financing rates (term → APR)
- Promotion end date

The agent uses this to know what's available before building a quote.

### 2. `estimate_trade_in` — Calculate Trade-In Value

Accepts trade-in details (brand, year, HP, condition) and runs the same `estimateTradeValue()` logic from `trade-valuation.ts`, querying `trade_valuation_brackets` and `trade_valuation_config` from the database. Returns low/high/average estimate and confidence level.

This is necessary so the agent can tell you "their Mercury 2020 115HP in good condition is worth roughly $X" and apply it to the quote.

### 3. `get_warranty_pricing` — Warranty Extension Costs

Queries `warranty_pricing` table for a given HP and returns available extension years and their costs. Lets the agent recommend or apply extended warranty.

## Enhanced `create_quote` — Accept Full Selections

Expand the existing `create_quote` action to accept these new optional fields:

| Field | Type | Description |
|-------|------|-------------|
| `purchase_path` | `"loose"` or `"installed"` | Default: `"loose"` |
| `promo_option` | `"no_payments"`, `"special_financing"`, `"cash_rebate"`, or `null` | Promotion selection |
| `promo_rate` | number | APR if special_financing selected |
| `promo_term` | number | Term in months if special_financing |
| `trade_in` | object | `{ brand, year, horsepower, condition, model?, serial_number? }` |
| `warranty_years` | number | Total desired warranty years (e.g., 7 or 8) |
| `package` | `"good"`, `"better"`, `"best"` | Service package tier |

When these are provided, the API will:
1. Look up the rebate amount if `promo_option: "cash_rebate"` and subtract it from the price
2. Run trade-in estimation if `trade_in` is provided and subtract the value
3. Look up warranty pricing if `warranty_years` exceeds the base coverage
4. Embed all of these into `quote_data` so the SavedQuotePage renders them correctly

The pricing formula expands to:
```
Subtotal = Motor Price + Accessories + Warranty Cost - Trade-In Value - Rebate
HST = Subtotal × 13%
Total = Subtotal + HST + DealerPlan Fee - Admin Discount
```

## Smart Defaults for the Agent

The `create_quote` logic includes intelligence matching what you described:
- If `promo_option` is not specified, auto-select `cash_rebate` as default (best value for most customers)
- If `promo_option: "special_financing"` is requested but the total is below $5,000 (financing minimum), fall back to `cash_rebate` and include a warning in the response
- If no `trade_in` is provided, no trade-in is applied (clean default)
- If `purchase_path` not specified, default to `"loose"`

## Files Changed

### Edge Function: `supabase/functions/agent-quote-api/index.ts`
- Add `list_promotions` action — queries `promotions` table, parses `promo_options` JSONB, returns structured data
- Add `estimate_trade_in` action — queries `trade_valuation_brackets` + `trade_valuation_config`, runs valuation logic server-side (port the core algorithm from `trade-valuation.ts`)
- Add `get_warranty_pricing` action — queries `warranty_pricing` table by HP
- Expand `create_quote` to accept and process `promo_option`, `trade_in`, `warranty_years`, `package`, `purchase_path`
- Expand `update_quote` to accept the same new fields
- Update the `available_actions` list in the default case

### Documentation: `AGENT_API_INSTRUCTIONS.md`
- Document all 3 new actions with request/response examples
- Document the new `create_quote` fields
- Add workflow examples: "Quote with trade-in and rebate", "Quote with special financing", "Full quote with all options"
- Add smart defaults section explaining the auto-selection logic

## Data Flow for a Complete Agent Quote

```text
Agent                           API
  │                              │
  ├─ list_motors "150"  ────────►│ returns motor list
  │                              │
  ├─ list_promotions    ────────►│ returns active promos, rebate matrix, rates
  │                              │
  ├─ estimate_trade_in  ────────►│ returns $X trade-in value
  │  { brand, year, hp, cond }   │
  │                              │
  ├─ create_quote       ────────►│ builds full quote with all selections
  │  { motor_id, customer,       │ auto-calculates pricing
  │    promo_option: "cash_rebate",
  │    trade_in: {...},          │
  │    warranty_years: 7,        │
  │    package: "better" }       │
  │                              │
  │◄──── { quote_id, share_url,  │
  │        pricing breakdown }   │
```

