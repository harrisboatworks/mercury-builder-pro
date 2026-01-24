

# Admin Quote Builder with Edit Capabilities

## Overview

Create an admin-only quote creation and editing system that leverages the existing customer quote builder but adds admin-specific controls for discounts, notes, and other adjustments.

---

## User Experience

### Creating a New Quote (Admin)

1. Admin clicks "Create Quote" from `/admin/quotes`
2. Navigates to `/admin/quote/new` which renders the same quote builder flow
3. Admin selects motor, boat info, etc. just like a customer
4. At the summary page, admin sees additional controls:
   - **Special Discount** field ($ amount)
   - **Admin Notes** text area (internal only, not shown on PDF)
   - **Customer Notes** field (shows on PDF)
5. Admin clicks "Save Quote" → stored with admin ID and editable flag

### Editing an Existing Quote

1. From `/admin/quotes`, admin clicks on any quote row
2. Instead of just viewing, they get an **"Edit Quote"** button
3. Quote is loaded into the quote builder with all values restored
4. Admin can modify:
   - Any step (motor, trade-in, package, etc.)
   - Add/change special discount
   - Add/update notes
5. Save overwrites the existing quote or creates a new version

---

## Technical Approach

### Option 1: Add Admin Fields to Summary Page (Recommended)

Extend the existing `QuoteSummaryPage` to detect admin users and show additional controls.

**Pros**: Minimal code changes, reuses existing flow  
**Cons**: Summary page gets slightly more complex

### Option 2: Separate Admin Quote Editor Page

Create a dedicated `/admin/quote/edit/:id` page with a form for all quote fields.

**Pros**: Full control, cleaner separation  
**Cons**: More code to maintain, duplicates logic

**Recommendation**: Option 1 with a dedicated admin entry point

---

## Implementation Plan

### Phase 1: Database & Types

**Add new fields to `customer_quotes` table:**

```sql
ALTER TABLE customer_quotes ADD COLUMN IF NOT EXISTS
  admin_discount numeric DEFAULT 0,
  admin_notes text,
  customer_notes text,
  created_by_admin uuid REFERENCES auth.users(id),
  last_modified_by uuid REFERENCES auth.users(id),
  last_modified_at timestamp with time zone,
  quote_data jsonb,  -- Store full quote state for restoration
  is_admin_quote boolean DEFAULT false;
```

### Phase 2: Admin Quote Creation Entry Point

**New page: `src/pages/admin/AdminQuoteBuilder.tsx`**

- Wrapper that sets `isAdminMode` flag in context/state
- Navigates to `/quote/motor-selection` with admin context
- Persists admin session so the full flow knows it's admin-created

**Update `QuoteContext.tsx`:**
- Add `isAdminQuote: boolean` to state
- Add `adminDiscount: number`
- Add `adminNotes: string`
- Add `customerNotes: string`

### Phase 3: Enhanced Summary Page for Admins

**Modify `src/pages/quote/QuoteSummaryPage.tsx`:**

```tsx
// Add admin detection
const { isAdmin } = useAuth();

// Render admin controls if admin
{isAdmin && (
  <Card className="p-4 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20">
    <h3 className="font-semibold mb-3 flex items-center gap-2">
      <ShieldCheck className="w-5 h-5" />
      Admin Controls
    </h3>
    
    {/* Special Discount */}
    <div className="mb-4">
      <Label>Special Discount ($)</Label>
      <Input 
        type="number" 
        value={adminDiscount} 
        onChange={(e) => setAdminDiscount(Number(e.target.value))}
      />
    </div>
    
    {/* Admin Notes (internal) */}
    <div className="mb-4">
      <Label>Internal Notes (not on PDF)</Label>
      <Textarea value={adminNotes} onChange={...} />
    </div>
    
    {/* Customer Notes (on PDF) */}
    <div>
      <Label>Customer Notes (appears on PDF)</Label>
      <Textarea value={customerNotes} onChange={...} />
    </div>
  </Card>
)}
```

### Phase 4: Admin Quote Detail Page Enhancement

**Modify `src/pages/AdminQuoteDetail.tsx`:**

- Add "Edit Quote" button
- Load full `quote_data` and restore to context
- Navigate to `/quote/summary` with edit mode flag

```tsx
const handleEditQuote = async () => {
  // Load quote_data and dispatch to context
  if (quote.quote_data) {
    dispatch({ type: 'RESTORE_QUOTE', payload: quote.quote_data });
    dispatch({ type: 'SET_ADMIN_EDIT_MODE', payload: { quoteId: quote.id } });
  }
  navigate('/quote/motor-selection');
};
```

### Phase 5: Save Logic Updates

**Modify quote save flow:**

When admin saves a quote, store additional metadata:

```tsx
const saveAdminQuote = async () => {
  const payload = {
    ...existingQuoteData,
    admin_discount: adminDiscount,
    admin_notes: adminNotes,
    customer_notes: customerNotes,
    quote_data: getQuoteData(), // Full state for restoration
    created_by_admin: user.id,
    is_admin_quote: true,
    last_modified_by: user.id,
    last_modified_at: new Date().toISOString(),
  };
  
  // Upsert to customer_quotes
  await supabase.from('customer_quotes').upsert(payload);
};
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/xxx_admin_quote_fields.sql` | Create | Add admin fields to customer_quotes |
| `src/contexts/QuoteContext.tsx` | Modify | Add admin state (discount, notes, edit mode) |
| `src/pages/admin/AdminQuoteBuilder.tsx` | Create | Entry point for admin quote creation |
| `src/pages/quote/QuoteSummaryPage.tsx` | Modify | Add admin controls panel |
| `src/pages/AdminQuoteDetail.tsx` | Modify | Add Edit Quote button and restore logic |
| `src/pages/AdminQuotes.tsx` | Modify | Add "Create Quote" button |
| `src/components/admin/AdminNav.tsx` | Modify | Add link to quote builder |
| `src/App.tsx` | Modify | Add route for `/admin/quote/new` |

---

## Admin Quote Flow Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│                     /admin/quotes                           │
│  ┌──────────────┐                      ┌─────────────────┐  │
│  │ Create Quote │────────────────────▶ │ Quote Builder   │  │
│  │    Button    │                      │ (Admin Mode)    │  │
│  └──────────────┘                      └────────┬────────┘  │
│                                                 │           │
│  ┌──────────────────────────────────────────────┼───────┐   │
│  │ Existing Quote Row                           │       │   │
│  │ ┌────────────┐   ┌─────────────┐            │       │   │
│  │ │ View       │   │ Edit Quote  │◀───────────┘       │   │
│  │ │ Details    │   │   Button    │                    │   │
│  │ └────────────┘   └──────┬──────┘                    │   │
│  └─────────────────────────│────────────────────────────┘   │
│                            │                                │
│                            ▼                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Quote Summary Page                       │   │
│  │  ┌────────────────────────────────────────────────┐   │   │
│  │  │ ADMIN CONTROLS (yellow border)                  │   │   │
│  │  │ • Special Discount: $____                       │   │   │
│  │  │ • Internal Notes: ___________                   │   │   │
│  │  │ • Customer Notes: ___________                   │   │   │
│  │  └────────────────────────────────────────────────┘   │   │
│  │                                                        │   │
│  │  [Save Quote]  [Download PDF]  [Send to Customer]      │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Considerations

- All admin-only fields gated by `isAdmin` check
- RLS policies on new columns to ensure only admins can write
- Audit trail via `last_modified_by` and `last_modified_at`
- Admin discount visible in PDF but not editable by customers

---

## Summary

This feature allows admins to:
1. Create quotes just like customers, with the same smooth flow
2. Add special discounts that apply to the final price
3. Add internal notes (for sales team) and customer-facing notes
4. Edit any previously created quote
5. Download PDFs and send to customers

All while reusing the existing quote builder infrastructure with minimal duplication.

