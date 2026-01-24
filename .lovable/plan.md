
# Admin Quote Builder Enhancements

## Summary

Enhance the admin quote builder to support:
1. **Manual customer info entry** with proper validation
2. **Correct pricing calculations** including admin discount in all totals
3. **Shareable quote links** customers can use to view and complete their quote

---

## Current State

The AdminQuoteControls component already has:
- Customer name, email, phone input fields
- Admin discount field
- Internal notes and customer notes fields
- Save functionality

**Issues to fix:**
1. Pricing calculations in AdminQuoteControls don't include accessories, trade-in, promotions, or tax
2. Admin discount isn't integrated into the pricing table display
3. No "copy share link" functionality after saving
4. SavedQuotePage restoration doesn't include admin fields (discount, notes)

---

## Implementation Plan

### Phase 1: Fix Pricing Calculations in AdminQuoteControls

**File: `src/components/admin/AdminQuoteControls.tsx`**

Update the `handleSaveQuote` function to use the same pricing logic as ScheduleConsultation:

```typescript
// Calculate comprehensive pricing like ScheduleConsultation does
const accessoryTotal = state.selectedOptions?.reduce((sum, opt) => sum + (opt.price || 0), 0) || 0;
const tradeInValue = state.tradeInInfo?.estimatedValue || 0;
const hasTradeIn = state.tradeInInfo?.hasTradeIn || false;

const subtotal = motorSalePrice + accessoryTotal - (hasTradeIn ? tradeInValue : 0);
const hst = subtotal * 0.13;
const totalBeforeDiscount = subtotal + hst;
const finalPrice = totalBeforeDiscount - adminDiscount;
```

### Phase 2: Integrate Admin Discount into Summary Page Display

**File: `src/pages/quote/QuoteSummaryPage.tsx`**

Add admin discount to the pricing breakdown so it shows correctly before PDF generation:

```typescript
// After the promoSavings calculation
const adminDiscount = state.adminDiscount || 0;

// Include in package-specific totals calculation
const packageSpecificTotals = useMemo(() => {
  return calculateQuotePricing({
    motorMSRP,
    motorDiscount: motorDiscount + adminDiscount, // Include admin discount
    // ... rest of params
  });
}, [motorMSRP, motorDiscount, adminDiscount, ...]);
```

### Phase 3: Add Share Link After Save

**File: `src/components/admin/AdminQuoteControls.tsx`**

After successful save, return the quote ID and provide a copy link button:

```typescript
const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);

// In save handler, capture the returned ID
const { data, error } = await supabase
  .from('customer_quotes')
  .insert(payload)
  .select('id')
  .single();

if (!error && data) {
  setSavedQuoteId(data.id);
}

// Render share link section after save
{savedQuoteId && (
  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
    <p className="text-sm text-green-800 mb-2">Quote saved! Share with customer:</p>
    <div className="flex gap-2">
      <Input 
        readOnly 
        value={`${window.location.origin}/quote/saved/${savedQuoteId}`}
      />
      <Button variant="outline" onClick={() => copyToClipboard()}>
        <Copy className="w-4 h-4" />
      </Button>
    </div>
  </div>
)}
```

### Phase 4: Enhance SavedQuotePage for Admin Fields

**File: `src/pages/quote/SavedQuotePage.tsx`**

Restore admin-specific fields when loading a shared quote:

```typescript
// After restoring other quote data
if (quote.admin_discount) {
  dispatch({ type: 'SET_ADMIN_QUOTE_DATA', payload: { 
    adminDiscount: quote.admin_discount,
    adminNotes: quote.admin_notes || '',
    customerNotes: quote.customer_notes || ''
  }});
}

// Also restore from quote_data if present
if (quoteData.adminDiscount !== undefined) {
  dispatch({ type: 'SET_ADMIN_QUOTE_DATA', payload: {
    adminDiscount: quoteData.adminDiscount,
    adminNotes: quoteData.adminNotes || '',
    customerNotes: quoteData.customerNotes || ''
  }});
}
```

### Phase 5: Include Admin Discount in PDF

**File: `src/components/quote-pdf/ProfessionalQuotePDF.tsx`**

Add admin discount as a line item if present:

```typescript
// In the pricing section, after motor discount
{quoteData.adminDiscount > 0 && (
  <View style={styles.tableRow}>
    <Text style={[styles.itemDescription, styles.discountText]}>
      Special Discount
    </Text>
    <Text style={[styles.itemPrice, styles.discountText]}>
      -${quoteData.adminDiscount.toLocaleString()}
    </Text>
  </View>
)}
```

### Phase 6: Update getQuoteData to Include Admin Fields

**File: `src/contexts/QuoteContext.tsx`**

Ensure getQuoteData captures admin fields for restoration:

```typescript
const getQuoteData = useCallback(() => {
  return {
    selectedMotor: state.motor,
    purchasePath: state.purchasePath,
    boatInfo: state.boatInfo,
    // ... existing fields
    // Add admin fields
    adminDiscount: state.adminDiscount,
    adminNotes: state.adminNotes,
    customerNotes: state.customerNotes,
    isAdminQuote: state.isAdminQuote
  };
}, [state]);
```

---

## Customer Experience When Opening Shared Link

1. Customer clicks link: `https://site.com/quote/saved/{quote-id}`
2. SavedQuotePage loads quote data from database
3. Full quote context is restored (motor, options, trade-in, admin discount, etc.)
4. Customer sees the Summary page with complete pricing
5. Customer can proceed to Schedule → Success flow
6. Or apply for financing directly

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/AdminQuoteControls.tsx` | Fix pricing calculations, add share link UI |
| `src/pages/quote/QuoteSummaryPage.tsx` | Integrate admin discount into pricing display |
| `src/pages/quote/SavedQuotePage.tsx` | Restore admin fields from database |
| `src/contexts/QuoteContext.tsx` | Include admin fields in getQuoteData |
| `src/components/quote-pdf/ProfessionalQuotePDF.tsx` | Show admin discount on PDF |

---

## Expected Result

- Admin creates quote with all selections + special discount + notes
- System calculates accurate pricing including HST and all components
- Admin can copy shareable link
- Customer opens link and sees their complete quote
- Customer can download PDF, apply for financing, or schedule consultation
- Admin discount appears on PDF as "Special Discount"
