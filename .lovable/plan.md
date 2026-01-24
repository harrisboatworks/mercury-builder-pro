

# Fix Admin Quote Detail Issues

## Summary

Fix two issues in the Admin Quote Detail page:
1. **Trade-in data not displaying** - The page reads from empty database columns instead of the `quote_data` JSONB where trade-in is actually saved
2. **"Edit Full Quote" wrong destination** - Button navigates to motor selection instead of the summary page

---

## Issue 1: Trade-In Not Showing

### Root Cause
- The `AdminQuoteControls` saves trade-in inside `quote_data.tradeInInfo` (JSONB)
- But `AdminQuoteDetail` reads from `q.tradein_value_pre_penalty` (database columns)
- These columns are never populated by admin quote saves

### Solution
Update `AdminQuoteDetail.tsx` to read trade-in from `quote_data.tradeInInfo` as a fallback:

```typescript
// Extract trade-in from quote_data if not in top-level columns
const tradeIn = q.quote_data?.tradeInInfo || {};
const hasTradeInData = tradeIn.hasTradeIn || q.tradein_value_pre_penalty;

// In render:
<div>Pre-penalty value: {fmt(q.tradein_value_pre_penalty ?? tradeIn.tradeinValuePrePenalty ?? tradeIn.estimatedValue)}</div>
<div>Final value: {fmt(q.tradein_value_final ?? tradeIn.tradeinValueFinal ?? tradeIn.estimatedValue)}</div>
<div>Brand/Make: {tradeIn.brand || '-'}</div>
<div>HP: {tradeIn.horsepower || '-'}</div>
<div>Year: {tradeIn.year || '-'}</div>
```

---

## Issue 2: Edit Full Quote Navigation

### Root Cause
- `handleEditQuote` navigates to `/quote/motor-selection` (line 86)
- User expects to land on `/quote/summary` to see admin controls

### Solution
Change navigation to go directly to the summary page:

```typescript
const handleEditQuote = () => {
  if (!q) return;
  
  if (q.quote_data) {
    dispatch({ type: 'RESTORE_QUOTE', payload: q.quote_data });
    dispatch({ type: 'SET_ADMIN_MODE', payload: { isAdmin: true, editingQuoteId: q.id } });
    dispatch({ type: 'SET_ADMIN_QUOTE_DATA', payload: { 
      adminDiscount: q.admin_discount || 0,
      adminNotes: q.admin_notes || '',
      customerNotes: q.customer_notes || ''
    }});
    
    // Force immediate save so state persists through navigation
    const adminState = {
      ...q.quote_data,
      isAdminQuote: true,
      editingQuoteId: q.id,
      adminDiscount: q.admin_discount || 0,
      adminNotes: q.admin_notes || '',
      customerNotes: q.customer_notes || ''
    };
    localStorage.setItem('quoteBuilder', JSON.stringify({
      state: adminState,
      timestamp: Date.now(),
      lastActivity: Date.now()
    }));
    
    // Navigate to summary instead of motor selection
    navigate('/quote/summary');
  } else {
    setIsEditing(true);
  }
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/AdminQuoteDetail.tsx` | Read trade-in from `quote_data` JSONB, change navigation to `/quote/summary` |

---

## Enhanced Trade-In Display

The Trade-In card will show more useful info:

```text
Trade-In
---------
Year: 2022
Brand: Mercury  
HP: 9.9
Condition: Excellent

Estimated Value: $1,550
Penalty Applied: No
```

---

## Expected Result

1. **Trade-in displays correctly** - Shows brand, year, HP, condition, and estimated value from saved quote data
2. **Edit Full Quote works** - Navigates to summary page with admin controls visible and pre-populated
3. **Admin can make edits** - Customer info, discount, and notes are loaded for quick changes

