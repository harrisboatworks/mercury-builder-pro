

## Plan: Update docs + include share link in admin SMS

### 1. Add customer share link to admin SMS (code change)

In `supabase/functions/agent-quote-api/index.ts` around line 709-713, update the SMS message to include the customer `share_url` so the admin can quickly forward it:

```
🤖 AI Agent Quote Created
Customer: John Smith
Motor: Mercury 150 EFI
Price: $15,664.20
Quote: https://mercuryrepower.ca/quote/saved/uuid
Admin: https://mercuryrepower.ca/admin/quotes/uuid
```

The share link is already available via `shareUrl(data.id)` — just needs to be appended to the SMS body.

### 2. Add Section 8 to AGENT_API_INSTRUCTIONS.md

Add a new "Backend Behavior" section documenting:

- **Dual-write**: Every `create_quote` and `update_quote` writes to both `customer_quotes` (admin CRM) and `saved_quotes` (customer-facing "My Quotes" dashboard, deposit flow, PDF generation). Quotes persist for 90 days.
- **Admin SMS alerts**: On quote creation, the admin receives an SMS with customer name, motor, price, customer share link, and admin link. Non-blocking — SMS failure does not affect quote creation.
- **Lead tagging**: All agent quotes are auto-tagged with `lead_source: "ai_agent"` and `is_admin_quote: true`.

### Files changed
- `supabase/functions/agent-quote-api/index.ts` — add `shareUrl` to SMS message body
- `AGENT_API_INSTRUCTIONS.md` — add Section 8: Backend Behavior

