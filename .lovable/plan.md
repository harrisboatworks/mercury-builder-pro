
# Fix Customer Info Restoration on Edit Quote

## Problem

When clicking "Edit Full Quote" from the Admin Quote Detail page, the customer's name, email, and phone are not pre-populated in the Admin Controls panel on the Summary page. The admin has to re-enter this information even though it's already saved in the database.

---

## Root Cause

The customer identity fields (`customer_name`, `customer_email`, `customer_phone`) are:
- ✅ **Saved correctly** to the `customer_quotes` table during save
- ❌ **Not restored** when loading a quote for editing
- ❌ **Not stored** in the `QuoteContext` state

The `AdminQuoteControls` component uses local `useState` for these fields, initialized to empty strings, instead of reading from context.

---

## Solution

### 1. Add Customer Fields to QuoteState

Update `QuoteContext.tsx` to include customer identity in the state:

```typescript
interface QuoteState {
  // ... existing fields ...
  
  // Admin quote fields
  isAdminQuote: boolean;
  editingQuoteId: string | null;
  adminDiscount: number;
  adminNotes: string;
  customerNotes: string;
  customerName: string;     // NEW
  customerEmail: string;    // NEW
  customerPhone: string;    // NEW
}
```

### 2. Update Initial State

```typescript
const initialState: QuoteState = {
  // ... existing ...
  customerName: '',
  customerEmail: '',
  customerPhone: ''
};
```

### 3. Update SET_ADMIN_QUOTE_DATA Action

Extend the action to accept customer info:

```typescript
case 'SET_ADMIN_QUOTE_DATA':
  return {
    ...state,
    adminDiscount: action.payload.adminDiscount ?? state.adminDiscount,
    adminNotes: action.payload.adminNotes ?? state.adminNotes,
    customerNotes: action.payload.customerNotes ?? state.customerNotes,
    customerName: action.payload.customerName ?? state.customerName,
    customerEmail: action.payload.customerEmail ?? state.customerEmail,
    customerPhone: action.payload.customerPhone ?? state.customerPhone
  };
```

### 4. Update AdminQuoteDetail handleEditQuote

Pass customer info when restoring:

```typescript
dispatch({ type: 'SET_ADMIN_QUOTE_DATA', payload: { 
  adminDiscount: q.admin_discount || 0,
  adminNotes: q.admin_notes || '',
  customerNotes: q.customer_notes || '',
  customerName: q.customer_name || '',      // NEW
  customerEmail: q.customer_email || '',    // NEW
  customerPhone: q.customer_phone || ''     // NEW
}});

// Also include in localStorage save
const adminState = {
  ...q.quote_data,
  isAdminQuote: true,
  editingQuoteId: q.id,
  adminDiscount: q.admin_discount || 0,
  adminNotes: q.admin_notes || '',
  customerNotes: q.customer_notes || '',
  customerName: q.customer_name || '',      // NEW
  customerEmail: q.customer_email || '',    // NEW
  customerPhone: q.customer_phone || ''     // NEW
};
```

### 5. Update AdminQuoteControls

Initialize local state from context:

```typescript
const [customerName, setCustomerName] = useState(state.customerName || '');
const [customerEmail, setCustomerEmail] = useState(state.customerEmail || '');
const [customerPhone, setCustomerPhone] = useState(state.customerPhone || '');

// Sync when context changes
useEffect(() => {
  setCustomerName(state.customerName || '');
  setCustomerEmail(state.customerEmail || '');
  setCustomerPhone(state.customerPhone || '');
}, [state.customerName, state.customerEmail, state.customerPhone]);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/QuoteContext.tsx` | Add `customerName`, `customerEmail`, `customerPhone` to state, initial state, and `SET_ADMIN_QUOTE_DATA` reducer |
| `src/pages/AdminQuoteDetail.tsx` | Pass customer info in `handleEditQuote` |
| `src/components/admin/AdminQuoteControls.tsx` | Initialize local state from context |

---

## Expected Result

1. Admin opens a saved quote from `/admin/quotes`
2. Clicks "Edit Full Quote"
3. Arrives at Summary page with:
   - ✅ Motor, options, packages pre-loaded
   - ✅ Admin discount, notes pre-filled
   - ✅ **Customer Name pre-filled**
   - ✅ **Customer Email pre-filled**
   - ✅ **Customer Phone pre-filled**
4. Can make changes and save (updates existing quote)
