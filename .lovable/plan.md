
# Verify and Harden Quote Restoration Flow

## Current Status

Based on my analysis, the quote restoration logic **should work correctly**:

1. **Database contains full data** - The `quote_data` JSONB includes motor, trade-in, options, package, promo, and admin fields
2. **Restoration dispatches are correct** - `RESTORE_QUOTE` + `SET_ADMIN_MODE` + `SET_ADMIN_QUOTE_DATA` 
3. **localStorage is written synchronously** - Before navigation, all data is saved
4. **LOAD_FROM_STORAGE handles admin fields** - It spreads the payload and explicitly sets admin fields

---

## Potential Issue: State Timing

There may be a subtle race condition:
- The dispatches run in the current context
- Navigation happens immediately 
- The new page mounts a fresh QuoteProvider that reads localStorage
- The localStorage write might not be visible to the new context immediately

---

## Improvements to Implement

### 1. Ensure Complete State in localStorage Save

Update `AdminQuoteDetail.tsx` to include ALL state fields, not just spreading `quote_data`:

```typescript
const adminState = {
  // Spread the quote data first (contains motor, options, trade-in, etc.)
  ...q.quote_data,
  
  // Explicitly set critical fields to ensure they're present
  motor: q.quote_data?.motor || null,
  selectedOptions: q.quote_data?.selectedOptions || [],
  selectedPackage: q.quote_data?.selectedPackage || null,
  selectedPromoOption: q.quote_data?.selectedPromoOption || null,
  tradeInInfo: q.quote_data?.tradeInInfo || null,
  purchasePath: q.quote_data?.purchasePath || null,
  
  // Admin mode flags
  isAdminQuote: true,
  editingQuoteId: q.id,
  
  // Admin data from database columns
  adminDiscount: q.admin_discount || 0,
  adminNotes: q.admin_notes || '',
  customerNotes: q.customer_notes || '',
  customerName: q.customer_name || '',
  customerEmail: q.customer_email || '',
  customerPhone: q.customer_phone || '',
  
  // Ensure loading is false
  isLoading: false
};
```

### 2. Add Console Logging for Debugging

Add logging to track the restoration flow:

```typescript
// In AdminQuoteDetail.tsx handleEditQuote
console.log('🔧 Admin Edit: Restoring quote', {
  quoteId: q.id,
  hasMotor: !!q.quote_data?.motor,
  hasPackage: !!q.quote_data?.selectedPackage,
  hasPromo: !!q.quote_data?.selectedPromoOption
});
```

### 3. Verify the Summary Page Waits for Loading

The Summary page should check `state.isLoading` before redirecting:

```typescript
useEffect(() => {
  if (isMounted && !state.isLoading) {
    if (!state.motor) {
      navigate('/quote/motor-selection');
    } // ... rest of checks
  }
}, [isMounted, state.isLoading, state.motor, ...]);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/AdminQuoteDetail.tsx` | Ensure complete state in localStorage save with explicit field mapping |
| `src/pages/quote/QuoteSummaryPage.tsx` | Add `state.isLoading` check to redirect guard |

---

## Expected Result

After clicking "Edit Full Quote":
1. Navigate to Summary page
2. See the full quote with:
   - Motor details and pricing
   - Selected options/accessories
   - Trade-in value (if any)
   - Selected promo and package
   - Admin Controls panel with customer info pre-filled
3. Admin can make any changes and save/update the quote
