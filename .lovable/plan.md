## Goal

Persist user inputs on the standalone `/trade-in-value` form so that a refresh or back-navigation restores everything (brand, year, model/HP text, condition, hours, serial, and the last computed estimate).

## Approach

Use `localStorage` with a dedicated key (`tradeInValuePage:draft`) scoped to the standalone page only. The in-quote `/quote/trade-in` page already persists through the QuoteContext, so it doesn't need a separate draft.

### Changes

**1. `src/pages/TradeInValuePage.tsx`**

- On mount, hydrate `tradeInInfo` from `localStorage.getItem('tradeInValuePage:draft')` if present (merged over `INITIAL_TRADE_IN` for safety on schema drift).
- Add a `useEffect` that writes `tradeInInfo` to `localStorage` whenever it changes (debounced ~300ms via `setTimeout`/cleanup to avoid thrash on every keystroke).
- On `handleStartQuote`, after pushing into `quoteBuilder` localStorage, clear the draft key so it doesn't shadow the quote flow next visit.
- Add a small "Clear" link/button next to the form heading area only when a draft was restored, so users can wipe saved inputs (optional but low effort — include it).

**2. Restore UX signal**

- When draft is restored on mount, briefly show a subtle inline note: "Restored your previous entries" (auto-hide after ~3s) using existing toast or a local state flag rendered above the form.

### Edge cases handled

- Corrupt/invalid JSON in localStorage → wrapped in try/catch, falls back to `INITIAL_TRADE_IN`.
- Schema additions later → spread over defaults so missing fields don't break the form.
- Estimate value is persisted too, so the CTA card ("Ready to see how much you'll save…") reappears after refresh without re-running the API call.

### Out of scope

- The in-quote `/quote/trade-in` page (already persisted via QuoteContext + `quoteBuilder` localStorage).
- Server-side draft persistence (not needed for this lightweight standalone form).
