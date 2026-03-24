

# Verification: Propeller Trade-In Logic

## Code Review — Logic is Correct

I reviewed all three touch-points and the logic is properly wired:

### Mercury same-HP trade-in → $0 prop
1. **`build-accessory-breakdown.ts` (line 152-168)**: Checks `tradeInInfo.brand === 'mercury'` AND `tradeInInfo.horsepower === hp`. If both match, pushes "Propeller — Use Existing" at $0 with the compatibility message.
2. **`QuoteSummaryPage.tsx` (line 410-414)**: Same `isMercuryTradeMatch` check — skips adding the prop allowance to `augmentedOptions`, so the running total stays consistent.

### Non-Mercury trade-in → full prop charge
When brand is Yamaha, Honda, etc., `isMercuryTradeMatch` is `false`, so the standard `propAllowance` ($350 or $1,200) is added normally. This is correct — other brand props won't fit Mercury.

### PDF
The breakdown array flows directly into the PDF via `accessoryBreakdown`, so "Propeller — Use Existing" will appear with its description on the PDF automatically.

## Manual Test Steps

Since I can't build quotes in read-only mode, here's exactly what to test:

### Test 1: Mercury 9.9HP trade-in (should show $0 prop)
1. Select a **9.9HP Mercury** motor
2. In trade-in, enter: **Mercury**, **9.9HP**, any year/condition
3. On the summary page, verify the line item shows:
   - **"Propeller — Use Existing" — $0.00**
   - Description: *"Your current Mercury propeller should be compatible..."*
4. Download PDF and confirm same line appears

### Test 2: Yamaha 9.9HP trade-in (should charge prop)
1. Same 9.9HP Mercury motor
2. Trade-in: **Yamaha**, **9.9HP**
3. Summary should show: **"Propeller Allowance (Aluminum)" — $350.00**
4. PDF should match

### Test 3: Mercury different HP (should charge prop)
1. Select a **40HP Mercury** motor
2. Trade-in: **Mercury**, **9.9HP** (different HP)
3. Should show full prop allowance since HP doesn't match

No code changes needed — the implementation is already correct for all cases.

