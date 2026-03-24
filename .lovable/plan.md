

# Admin Quote Activity Page + Phone Capture After Google Save

Two features: a new admin page to see what anonymous users are building, and a phone number prompt after Google sign-in save.

---

## 1. Admin Quote Activity Page

New page at `/admin/quote-activity` that reads from the existing `quote_activity_events` table and groups events by `session_id` to show each visitor's quote-building journey.

### New file: `src/pages/AdminQuoteActivity.tsx`
- Fetches `quote_activity_events` from last 7 days (configurable), ordered by `created_at` desc
- Groups events by `session_id` into "sessions"
- Each session row shows: timestamp, motor model, HP, quote value, device type, UTM source, furthest step reached, status badge (Active/Abandoned/Submitted)
- Expandable rows showing full event timeline for each session
- Filters: motor model, status, date range
- Auto-refresh every 60 seconds via `refetchInterval`
- Uses existing `AdminNav`, `Table`, `Badge`, `Card` components

### Session journey display
Derives the "furthest step" from event types present in the session:
```text
Motor → Package → Options → Trade-In → Summary → Submitted
  ✓        ✓         ✓         ✗           ✗          ✗
```

### Status logic
- **Submitted**: session has `quote_submitted` event
- **Active**: last event within 30 minutes
- **Abandoned**: last event older than 30 minutes, no submit

### Modified files
- **`src/App.tsx`**: Add lazy import for `AdminQuoteActivity` and route `/admin/quote-activity` with `SecureRoute requireAdmin`
- **`src/components/admin/AdminNav.tsx`**: Add `{ label: "Quote Activity", to: "/admin/quote-activity" }` to nav items

---

## 2. Phone Number Capture After Google Save

After the auto-save toast fires (from `useAutoSaveQuoteOnAuth`), show a subtle prompt asking the user to optionally add their phone number for text updates.

### New file: `src/components/quote-builder/PhoneCapture.tsx`
- Small dialog/drawer (mobile-responsive like other quote dialogs)
- Headline: "Want text updates on your quote?"
- Subtext: "We'll only text you about this quote — no spam."
- Phone input field with basic validation (10+ digits)
- "Save" and "Skip" buttons
- On save: updates `saved_quotes` row with phone, and updates `profiles` table if exists
- Triggers admin SMS notification with the phone number

### Modified file: `src/hooks/useAutoSaveQuoteOnAuth.ts`
- After successful save, instead of just showing a toast, also set a state/flag that triggers the phone capture prompt
- Since the hook can't directly control UI, use a custom event or a shared ref/state

### Modified file: `src/pages/quote/QuoteSummaryPage.tsx`
- Listen for the "quote saved via auth" event
- Show `PhoneCapture` dialog after a short delay (1-2 seconds after the save toast)
- On submit or skip, dismiss and continue normally

### Data flow
1. User clicks "Save My Quote" → Google OAuth → returns to summary
2. `useAutoSaveQuoteOnAuth` saves quote, shows toast
3. After 1.5s delay, `PhoneCapture` dialog appears
4. User enters phone → saved to `saved_quotes.quote_state` and admin notified
5. Or user skips → no friction

---

## Files summary

| File | Change |
|------|--------|
| `src/pages/AdminQuoteActivity.tsx` | **New** — admin page showing grouped quote sessions |
| `src/components/quote-builder/PhoneCapture.tsx` | **New** — optional phone prompt after Google save |
| `src/App.tsx` | Add lazy import + route for AdminQuoteActivity |
| `src/components/admin/AdminNav.tsx` | Add "Quote Activity" nav link |
| `src/hooks/useAutoSaveQuoteOnAuth.ts` | Dispatch event after save for phone prompt |
| `src/pages/quote/QuoteSummaryPage.tsx` | Listen for save event, show PhoneCapture dialog |

