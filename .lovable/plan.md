

# Fix Admin Quote Builder - Show Admin Controls

## Problem

When you go through the admin quote creation flow, the **Admin Controls panel** (yellow card with customer info, discount, notes, and save button) doesn't appear on the Summary page.

---

## Root Cause

The Summary page checks **two conditions** before showing Admin Controls:

```typescript
{isAdmin && state.isAdminQuote && (
  <AdminQuoteControls />
)}
```

The problem is that when navigating from AdminQuoteBuilder to MotorSelection:

1. `clearQuote()` clears localStorage and resets state
2. `SET_ADMIN_MODE` sets `isAdminQuote: true` in memory
3. `navigate('/quote/motor-selection')` happens immediately
4. The state save to localStorage is **debounced by 1000ms**
5. By the time the save happens, we're already on a new page
6. When the quote builder pages load, they may reload from localStorage (which is empty) or the state may not have persisted properly through React Router navigation

---

## Solution

Two changes to ensure `isAdminQuote` persists through the entire flow:

### 1. Immediate save in AdminQuoteBuilder

Instead of relying on the debounced save, force an immediate save before navigating:

```typescript
const handleStartNewQuote = () => {
  clearQuote();
  dispatch({ type: 'SET_ADMIN_MODE', payload: { isAdmin: true, editingQuoteId: null } });
  
  // Force immediate save before navigation
  const adminState = {
    ...initialState,
    isAdminQuote: true,
    editingQuoteId: null,
    isLoading: false
  };
  localStorage.setItem('quoteBuilder', JSON.stringify({
    state: adminState,
    timestamp: Date.now(),
    lastActivity: Date.now()
  }));
  
  navigate('/quote/motor-selection');
};
```

### 2. Add immediate save action to QuoteContext

Create a synchronous save option that doesn't debounce:

```typescript
// In QuoteContext
const saveImmediately = useCallback(() => {
  const dataToSave = {
    state,
    timestamp: Date.now(),
    lastActivity: Date.now()
  };
  localStorage.setItem('quoteBuilder', JSON.stringify(dataToSave));
}, [state]);
```

### 3. Preserve isAdminQuote through LOAD_FROM_STORAGE

Ensure the `LOAD_FROM_STORAGE` reducer properly restores admin fields:

```typescript
case 'LOAD_FROM_STORAGE':
  return {
    ...initialState,
    ...action.payload,
    isAdminQuote: action.payload.isAdminQuote ?? false,
    editingQuoteId: action.payload.editingQuoteId ?? null,
    adminDiscount: action.payload.adminDiscount ?? 0,
    adminNotes: action.payload.adminNotes ?? '',
    customerNotes: action.payload.customerNotes ?? '',
    isLoading: true
  };
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/AdminQuoteBuilder.tsx` | Force immediate localStorage save before navigation |
| `src/contexts/QuoteContext.tsx` | Ensure LOAD_FROM_STORAGE preserves admin fields |

---

## Where to Find Saved Quotes

After you save a quote using the Admin Controls, it appears at:

**`/admin/quotes`** - The main Admin Quotes table

The table shows all quotes from `customer_quotes`, including:
- Admin-created quotes (with `is_admin_quote: true`)
- Customer-submitted quotes
- Filter by status, source, and penalized

You can click any row to view details, or use the "Create Quote" button to start a new admin quote.

---

## Expected Result After Fix

1. Click "Create Quote" from `/admin/quotes`
2. Go through motor selection, package selection, etc.
3. Arrive at Summary page
4. **See the yellow Admin Controls panel** with:
   - Customer Name / Email / Phone fields
   - Special Discount input
   - Internal Notes (admin only)
   - Customer Notes (on PDF)
   - Save Quote button
5. After saving, get a shareable link
6. Quote appears in `/admin/quotes` table

