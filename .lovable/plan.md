

# Fix: "Start Fresh" Should Preserve Current Quote's Motor Details

## Problem Identified

When a user clicks "Apply for Financing" from the Quote Summary and a previous financing draft exists:

1. The Quote Summary saves current motor details to `quote_state` in localStorage
2. FinancingApplication loads and **immediately** detects an old `financing_draft`
3. The Resume Dialog appears **before** the quote pre-fill logic runs (lines 290-348)
4. User clicks **"Start Fresh"**
5. `handleStartFresh()` clears ALL storage including `quote_state`
6. The pre-fill logic never runs → motor details are lost

**The current `handleStartFresh` at lines 376-386:**
```typescript
const handleStartFresh = () => {
  localStorage.removeItem('financing_draft');
  localStorage.removeItem('financingApplication');
  localStorage.removeItem('quote_state');  // ← Bug: This deletes the NEW quote data
  
  financingDispatch({ type: 'RESET_APPLICATION' });
  setShowResumeDialog(false);
};
```

---

## Solution

Modify `handleStartFresh` to:
1. **Read and preserve** the current `quote_state` before clearing
2. Clear the old financing drafts
3. Reset the application state
4. **Re-apply** the preserved quote data to pre-fill the form

---

## File to Modify

| File | Change |
|------|--------|
| `src/pages/FinancingApplication.tsx` | Update `handleStartFresh` to preserve and re-apply current quote |

---

## Code Change

### Lines 376-386: Update `handleStartFresh`

**Replace with:**
```typescript
const handleStartFresh = () => {
  // IMPORTANT: Preserve the current quote_state BEFORE clearing drafts
  // This contains the motor details from the quote the user just came from
  const currentQuoteState = localStorage.getItem('quote_state');
  let quoteDataToRestore: any = null;
  
  if (currentQuoteState) {
    try {
      quoteDataToRestore = JSON.parse(currentQuoteState);
    } catch (e) {
      console.error('Failed to parse quote state for restoration:', e);
    }
  }
  
  // Clear all saved drafts (old financing progress)
  localStorage.removeItem('financing_draft');
  localStorage.removeItem('financingApplication');
  localStorage.removeItem('quote_state');
  
  // Reset context to initial state
  financingDispatch({ type: 'RESET_APPLICATION' });
  
  // Re-apply the current quote's motor details if available
  if (quoteDataToRestore?.motor) {
    const totalWithFees = quoteDataToRestore.financingAmount?.totalWithFees;
    const motorPrice = totalWithFees || quoteDataToRestore.motor.salePrice || quoteDataToRestore.motor.price || 0;
    const tradeInValue = quoteDataToRestore.financingAmount?.tradeInValue || quoteDataToRestore.tradeInInfo?.estimatedValue || 0;
    
    const motorModel = quoteDataToRestore.financingAmount?.packageName 
      ? `${quoteDataToRestore.motor.model || ''} (${quoteDataToRestore.financingAmount.packageName})`
      : quoteDataToRestore.motor.model || '';
    
    financingDispatch({
      type: 'SET_PURCHASE_DETAILS',
      payload: {
        motorModel: motorModel,
        motorPrice: motorPrice,
        downPayment: 0,
        tradeInValue: tradeInValue,
        amountToFinance: Math.max(0, motorPrice - tradeInValue),
        promoOption: quoteDataToRestore.financingAmount?.promoOption || quoteDataToRestore.selectedPromoOption || null,
        promoRate: quoteDataToRestore.financingAmount?.promoRate || quoteDataToRestore.selectedPromoRate || null,
        promoTerm: quoteDataToRestore.financingAmount?.promoTerm || quoteDataToRestore.selectedPromoTerm || null,
        promoValue: quoteDataToRestore.financingAmount?.promoValue || quoteDataToRestore.selectedPromoValue || null,
      },
    });
  }
  
  setShowResumeDialog(false);
};
```

---

## Why This Works

| Scenario | Before Fix | After Fix |
|----------|------------|-----------|
| Has old draft + new quote → Start Fresh | Motor details lost | Motor details preserved |
| Has old draft + no new quote → Start Fresh | Empty form (correct) | Empty form (correct) |
| No draft + new quote | Pre-fills correctly | Pre-fills correctly (unchanged) |
| Continue Application | Uses old draft | Uses old draft (unchanged) |

---

## User Flow After Fix

```
Quote Summary                    Financing Application
     │                                   │
     │ clicks "Apply for Financing"      │
     │───────────────────────────────────▶ Saves quote_state
     │                                   │
     │                                   ▼
     │                           Detects old draft
     │                                   │
     │                                   ▼
     │                         ┌─────────────────────┐
     │                         │   Resume Dialog     │
     │                         │                     │
     │                         │ [Start Fresh]       │
     │                         │ [Continue App]      │
     │                         └─────────────────────┘
     │                                   │
     │                         User clicks "Start Fresh"
     │                                   │
     │                                   ▼
     │                         1. Read quote_state (motor data)
     │                         2. Clear old drafts
     │                         3. Reset form
     │                         4. Pre-fill with motor data ✓
     │                                   │
     │                                   ▼
     │                         Form shows motor: "15 EH FourStroke"
     │                         Price: $4,799 + HST + fee
```

