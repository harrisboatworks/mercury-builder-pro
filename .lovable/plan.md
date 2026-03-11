

# Unit Tests + Agent API Instructions Update

## 1. Unit Tests (`src/lib/trade-valuation.test.ts`)

The current tests only cover `medianRoundedTo25`. Need to add coverage for:

**New test suites:**

- **`getBrandPenaltyFactor`** — already imported but untested
  - Returns 1 for Mercury, Yamaha
  - Returns 0.5 for Johnson, Evinrude, OMC
  - Config override works

- **`estimateTradeValue` with 2-stroke penalty**
  - 4-stroke returns normal range
  - 2-stroke applies 0.825 factor
  - OptiMax applies same 0.825 factor
  - Factor note appears in `factors` array

- **`estimateTradeValue` with hours adjustment**
  - Low hours (≤100) gets +7.5% bonus
  - Moderate hours (500-999) gets -10% penalty
  - High hours (≥1000) gets -17.5% penalty
  - No hours provided → no adjustment

- **`estimateTradeValue` HP-class floors**
  - 10HP motor with poor condition doesn't drop below $200
  - 50HP motor doesn't drop below $1,000
  - 115HP motor doesn't drop below $1,500
  - 250HP motor doesn't drop below $2,500

- **Combined scenarios**
  - 2-stroke + high hours + brand penalty (Johnson) — verify all stack correctly

## 2. Agent API Instructions (`AGENT_API_INSTRUCTIONS.md`)

The `estimate_trade_in` action (section 2.3) and `create_quote` trade-in object (section 2.5) need two new optional fields:

**`estimate_trade_in` request table (line 123-128):**
- Add `engine_type` — string, optional — `"4-stroke"`, `"2-stroke"`, `"optimax"` (default: `"4-stroke"`)
- Add `engine_hours` — number, optional — actual engine hours if known

**`create_quote` trade-in object (line 281):**
- Update the trade_in field description to include `engine_type?` and `engine_hours?`

**Add notes after condition definitions (line 134):**
- 2-stroke/OptiMax engines receive a ~17.5% haircut regardless of brand
- Low hours (≤100h) receive a ~7.5% bonus; high hours (500-1000h) receive ~10% penalty; very high hours (1000+h) receive ~17.5% penalty
- HP-class minimum floors apply: <25HP ($200), 25-75HP ($1,000), 90-150HP ($1,500), 200HP+ ($2,500)

**Update the example request** to show the new fields.

### Files to modify

| File | Change |
|------|--------|
| `src/lib/trade-valuation.test.ts` | Add test suites for 2-stroke penalty, hours adjustment, HP-class floors, and combined scenarios |
| `AGENT_API_INSTRUCTIONS.md` | Add `engine_type` and `engine_hours` fields to estimate_trade_in and create_quote trade-in docs |

