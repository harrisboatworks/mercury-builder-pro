

# Add Admin Trade-In Override Control on Quote Detail Page

## What It Does
Adds an editable trade-in override field directly on the Admin Quote Detail page, so you can adjust the trade-in value for an existing quote without going through the full quote editor or the agent.

## Changes

### `src/pages/AdminQuoteDetail.tsx`

**1. Add trade-in override state** (near other editable field states, ~line 70):
- `tradeInOverride` (number | null) — initialized from `q.quote_data.tradeInInfo.overrideValue`

**2. Add override UI to the Trade-In card** (~line 479-524):
- When the quote has a trade-in, show an "Override Trade-In Value" input field with a save button
- Shows the formula estimate as read-only context
- A "Clear Override" button to revert to formula value

**3. Save logic** — new `handleSaveTradeInOverride` function:
- Updates `quote_data` JSONB: sets `tradeInInfo.overrideValue`, `tradeInInfo.originalEstimate`, and `tradeInInfo.estimatedValue` to the override
- Updates `tradein_value_final` column to the override value
- Recalculates `final_price` based on the new trade-in value
- Logs the change to `quote_change_log`
- Also updates the corresponding `saved_quotes` record (dual-write consistency)

### No database changes needed
The override values are stored in the existing `quote_data` JSONB blob and `tradein_value_final` column.

## UX Flow
1. Open quote detail → Trade-In card shows current value
2. Click edit icon or "Override" button → input appears pre-filled with current value
3. Enter new value → click Save → quote updates immediately
4. Card shows "Override Value: $X,XXX" in amber with "Formula estimate: $Y,YYY" below (same pattern already implemented for agent overrides)

