
# Add Quote Change Log to Admin Panel

## Overview

Create an audit trail that tracks all changes made to quotes by admins. Every time a quote is saved or updated, a log entry will be created showing what changed, who made the change, and when.

---

## Database Design

### New Table: `quote_change_log`

```text
+-------------------+------------------+--------------------------------+
| Column            | Type             | Purpose                        |
+-------------------+------------------+--------------------------------+
| id                | uuid             | Primary key                    |
| quote_id          | uuid             | Link to customer_quotes table  |
| changed_by        | uuid             | Admin user who made the change |
| change_type       | text             | Type: created, updated, status |
| changes           | jsonb            | Before/after values            |
| notes             | text             | Optional change notes          |
| created_at        | timestamptz      | When the change was made       |
+-------------------+------------------+--------------------------------+
```

### Changes JSONB Structure

```json
{
  "admin_discount": { "old": 0, "new": 500 },
  "admin_notes": { "old": "", "new": "Customer requested additional discount" },
  "lead_status": { "old": "scheduled", "new": "contacted" }
}
```

---

## Implementation

### 1. Database Migration

Create a new table with proper RLS policies:

- Only admins can read/write to this table
- Foreign key link to `customer_quotes`
- Index on `quote_id` for fast lookups

### 2. New Component: `QuoteChangeLog`

Similar to the existing `StatusHistorySection` for financing applications:

- Fetches change history for a specific quote
- Displays timeline with admin name, date, and changed fields
- Shows old vs new values with visual differentiation
- Color-coded by change type (create = green, update = blue, status = yellow)

### 3. Update Save Functions

Modify the two update locations to log changes:

| File | Function | Changes |
|------|----------|---------|
| `AdminQuoteDetail.tsx` | `handleSaveChanges` | Log discount/notes updates |
| `AdminQuoteControls.tsx` | `handleSaveQuote` | Log full quote creates/updates |

### 4. UI Integration

Add the change log section to the `AdminQuoteDetail.tsx` page, positioned below the "Admin Controls" card.

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/xxx_quote_change_log.sql` | Create | New table with RLS |
| `src/components/admin/QuoteChangeLog.tsx` | Create | Timeline UI component |
| `src/pages/AdminQuoteDetail.tsx` | Modify | Add change log section, update save logic |
| `src/components/admin/AdminQuoteControls.tsx` | Modify | Log changes on save/update |

---

## What Gets Logged

| Field | Tracked | Display Format |
|-------|---------|----------------|
| Quote created | Yes | "Quote created" (green) |
| Admin discount changed | Yes | "$0 → $500" |
| Admin notes changed | Yes | Shows new value |
| Customer notes changed | Yes | Shows new value |
| Lead status changed | Yes | Badge with old → new |
| Customer info changed | Yes | Name, email, phone |
| Motor/package edited | Yes | "Full quote updated" summary |

---

## Visual Design

The change log will display as a vertical timeline:

```text
┌─────────────────────────────────────────────┐
│ Change Log                                  │
├─────────────────────────────────────────────┤
│ ● Admin Discount Updated                    │
│   $0 → $700                                 │
│   📅 Jan 23, 2026 9:15 PM  👤 John Doe     │
├─────────────────────────────────────────────┤
│ ● Quote Created                             │
│   Initial quote for Mercury 75HP            │
│   📅 Jan 23, 2026 3:30 PM  👤 John Doe     │
└─────────────────────────────────────────────┘
```

---

## Security

- RLS enabled on `quote_change_log` table
- Only authenticated admins can read/insert logs
- Uses `has_role()` function for permission checks
- Logs capture `auth.uid()` for audit accountability
