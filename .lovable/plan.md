
## Track Anonymous Quote-Building Activity

### The Problem
Right now you only see leads when someone downloads a PDF, saves a quote, or schedules a consultation. If someone spends 20 minutes configuring a 200HP Pro XS with options and financing, then closes their browser -- that activity is invisible.

### The Solution
Add a lightweight background tracker that silently saves "snapshots" of what people are building in the quote tool, without requiring any action from the visitor. You'll be able to see in your admin dashboard what motors people are looking at and how far they get in the quote process.

### How It Works

1. **New database table: `quote_activity_events`**
   - Stores events like: motor viewed, motor selected, options configured, trade-in entered, financing calculated, quote abandoned
   - Includes the session ID (anonymous or logged-in user), motor details, quote value, and timestamp
   - Lightweight -- just key moments, not every click

2. **Background event tracker (new hook: `useQuoteActivityTracker`)**
   - Watches the QuoteContext state for meaningful changes
   - Fires events at key milestones:
     - Motor selected (which model, HP, price)
     - Options/accessories added
     - Purchase path chosen (loose vs installed)
     - Trade-in entered (value range)
     - Financing calculated
     - Quote abandoned (user navigates away without saving)
   - Uses a stable anonymous session ID stored in localStorage so repeat visitors are grouped together
   - Debounced to avoid spamming the database

3. **Weekly report enhancement**
   - The weekly report edge function will include a new section: "Browsing Activity"
   - Shows: total quote sessions, most-viewed motors, average quote value built (even unsaved), and drop-off points (where people abandon)

4. **Admin dashboard section (future)**
   - A simple "Recent Activity" feed showing what visitors are building in real-time

### What You'll See in Reports

Example additions to your weekly email/SMS:
- "47 quote sessions started (only 12 saved)"
- "Most configured: Pro XS 200 (18 sessions), FourStroke 115 (14 sessions)"
- "Average unsaved quote value: $18,400"
- "Drop-off: 60% leave after motor selection, 25% leave after options"

### Technical Details

**New table: `quote_activity_events`**
- `id` (uuid, primary key)
- `session_id` (text) -- anonymous visitor ID from localStorage
- `user_id` (uuid, nullable) -- linked if logged in
- `event_type` (text) -- motor_viewed, motor_selected, options_configured, trade_in_entered, financing_calculated, quote_abandoned
- `motor_model` (text)
- `motor_hp` (integer)
- `quote_value` (numeric) -- running total at time of event
- `event_data` (jsonb) -- flexible payload for extra context (options selected, trade-in value, etc.)
- `page_path` (text) -- which step they were on
- `created_at` (timestamptz)
- RLS: insert-only for anonymous users, admin-readable

**New hook: `src/hooks/useQuoteActivityTracker.ts`**
- Subscribes to QuoteContext state changes
- Generates/retrieves a stable `visitor_id` from localStorage
- Inserts events to `quote_activity_events` via Supabase client
- Debounced (waits 2 seconds of inactivity before writing)
- Fires `quote_abandoned` via `beforeunload` event if quote is in progress

**Modified files:**
- `src/components/quote-builder/QuoteLayout.tsx` -- mount the tracker hook
- `supabase/functions/weekly-quote-report/index.ts` -- add browsing activity section to email/SMS

**No new dependencies required.**
