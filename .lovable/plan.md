
# Fix Admin Quote Builder - Admin Controls Not Appearing

## Problem
When starting a new quote from `/admin/quote/new`, clicking "Start New Quote" navigates to the motor selection screen and the user builds a quote through the normal flow. But when they reach the summary page, the **Admin Controls panel never appears**.

The admin controls are gated by this condition on the summary page:
```
{isAdmin && state.isAdminQuote && ( <AdminQuoteControls /> )}
```

The `isAdminQuote` flag is getting lost due to a race condition in the quote initialization.

## Root Cause

In `AdminQuoteBuilder.tsx`, `handleStartNewQuote` does this:

1. Calls `clearQuote()` which dispatches `RESET_QUOTE` (sets `isAdminQuote: false`) and removes localStorage
2. Dispatches `SET_ADMIN_MODE` (sets `isAdminQuote: true`)
3. Manually writes to localStorage with `isAdminQuote: true`
4. Navigates to `/quote/motor-selection`

The problem: both `RESET_QUOTE` and `SET_ADMIN_MODE` trigger the debounced save effect (1000ms). When navigation occurs, the QuoteProvider on the new page loads from localStorage (the manual write), but the debounced save from the *old* QuoteProvider may fire and overwrite it, or the new page's QuoteProvider starts fresh and the manual localStorage write conflicts with the state initialization sequence.

## Solution

### 1. Add a new reducer action: `RESET_TO_ADMIN_MODE`

In `src/contexts/QuoteContext.tsx`, add a single atomic action that resets state AND sets admin mode simultaneously, eliminating the race condition.

```
case 'RESET_TO_ADMIN_MODE':
  return {
    ...initialState,
    isLoading: false,
    isAdminQuote: true,
    editingQuoteId: action.payload.editingQuoteId
  };
```

### 2. Simplify `AdminQuoteBuilder.tsx`

Replace the fragile 3-step sequence with:

```
const handleStartNewQuote = () => {
  localStorage.removeItem('quoteBuilder');

  dispatch({
    type: 'RESET_TO_ADMIN_MODE',
    payload: { editingQuoteId: null }
  });

  // Small delay to let the debounced save persist the new state
  setTimeout(() => {
    navigate('/quote/motor-selection');
  }, 50);
};
```

This removes the manual localStorage hack entirely and lets the normal save mechanism handle persistence.

### 3. Add an admin mode banner to QuoteLayout

To give admins visual confirmation they're in admin mode throughout the flow, add a small yellow banner at the top of `QuoteLayout.tsx` when `state.isAdminQuote` is true:

```
{state.isAdminQuote && isAdmin && (
  <div className="bg-yellow-500 text-yellow-950 text-center text-sm py-1 font-medium">
    Admin Mode -- Quote controls will appear on summary page
  </div>
)}
```

## Files to Change

| File | Change |
|------|--------|
| `src/contexts/QuoteContext.tsx` | Add `RESET_TO_ADMIN_MODE` action type and reducer case |
| `src/pages/admin/AdminQuoteBuilder.tsx` | Replace `clearQuote` + `SET_ADMIN_MODE` + manual localStorage with single `RESET_TO_ADMIN_MODE` dispatch + short delay before navigate |
| `src/components/quote-builder/QuoteLayout.tsx` | Add admin mode banner for visual feedback |
