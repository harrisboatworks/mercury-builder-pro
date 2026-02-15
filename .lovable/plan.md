

# Weekly Quote Activity Report

## What You'll Get

Every Monday morning, you'll receive an SMS and/or email with a summary like:

```
Weekly Quote Report (Feb 8 - Feb 15)
- 12 new quotes created
- Total value: $187,400
- Top models: Mercury 150HP (4), Mercury 250HP (3)
- 3 hot leads (score 70+)
- Avg quote value: $15,617
```

## How It Works

A scheduled Edge Function runs every Monday at 8am EST. It queries the `customer_quotes` table for the past 7 days, builds a summary, and sends it via your existing Twilio SMS and Resend email integrations.

---

## Technical Details

### New Edge Function: `weekly-quote-report`

Queries `customer_quotes` for records created in the last 7 days and computes:
- Total quote count
- Total and average quote value
- Top quoted motor models (from `quote_data` JSONB field)
- Hot lead count (lead_score >= 70)
- Lead source breakdown
- Comparison to previous week (up/down)

Sends the report via:
1. **SMS** to `ADMIN_PHONE` (already stored as a secret) using the existing `send-sms` function
2. **Email** to a configured address using Resend (`RESEND_API_KEY` already stored)

### Scheduling with pg_cron

A `pg_cron` job calls the edge function every Monday at 8am EST:

```text
cron.schedule('weekly-quote-report', '0 13 * * 1', ...)
```

(13:00 UTC = 8:00 AM EST)

### New Files

- `supabase/functions/weekly-quote-report/index.ts` -- the report function

### Configuration

- Uses existing `ADMIN_PHONE` secret for SMS delivery
- A new secret `ADMIN_EMAIL` will be added for email delivery (you'll provide the address)
- No new database tables needed -- reads from existing `customer_quotes`

### What the Email Version Includes (richer than SMS)

- Formatted HTML email with a table of top quotes
- Week-over-week comparison
- Direct links to the admin dashboard
- List of hot leads requiring follow-up

