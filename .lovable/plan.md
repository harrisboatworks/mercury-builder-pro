

## Plan: Agent Quote API — Improvements

### 1. Dual-write to `saved_quotes` (High Priority)

**Problem**: Agent-created quotes only exist in `customer_quotes`. The customer's "My Quotes" page and deposit/PDF workflow read from `saved_quotes`, so agent quotes are invisible to customers.

**Fix**: In the `createQuote` function of `agent-quote-api/index.ts`, after inserting into `customer_quotes`, also insert into `saved_quotes` with the same `id` and `quote_state` (matching the shape the frontend expects). This enables:
- Customer sees their quote on "My Quotes" dashboard
- Deposit flow works seamlessly
- PDF generation and storage works

### 2. Return admin share link instead of (or alongside) public link

**Problem**: The agent currently returns `share_url` pointing to `/quote/saved/{id}` which shows the cinematic intro. The admin may want the admin-editable link too.

**Fix**: Add an `admin_url` field to the create/update response: `{SITE_URL}/admin/quotes/{id}`. No backend change needed — just add the field to the JSON response.

### 3. Trigger admin notification on agent quote creation

**Problem**: When the agent creates a quote for a real customer, no admin email/SMS alert fires (unlike the "Save for Later" flow which triggers alerts).

**Fix**: After the dual-write, invoke the existing `send-admin-notification` or `send-sms` edge functions to alert the admin that a new AI-agent quote was created, including customer name, motor, and price.

### 4. Auto-populate `lead_status` more intelligently

**Current**: Always sets `lead_status: 'scheduled'` which isn't accurate — the customer just asked for a quote via the agent.

**Fix**: Default to `'new'` for initial quotes. Only set `'scheduled'` if the agent explicitly passes a status or indicates a consultation was booked.

### 5. Minor data quality improvements

- **`share_token`**: Currently `null` for agent quotes. Generate one so legacy share flows work.
- **`quote_number`**: Not generated for agent quotes. Add auto-incrementing quote number for professional reference.
- **Financing data**: When `promo_option: special_financing`, persist `selectedPromoRate` and `selectedPromoTerm` in `quote_data` so the summary page shows the correct monthly payment (partially done, worth verifying).

### Implementation Order
1. Dual-write to `saved_quotes` — biggest customer-facing gap
2. Add `admin_url` to response — trivial, high value for you
3. Fix `lead_status` default to `'new'`
4. Add admin notifications
5. Data quality cleanup (share_token, quote_number)

### Files Changed
- `supabase/functions/agent-quote-api/index.ts` — all changes in the `createQuote` and `updateQuote` functions
- `AGENT_API_INSTRUCTIONS.md` — document new `admin_url` response field and `lead_status` options

