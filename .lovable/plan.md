

# Agent Quote API — Full CRUD + Motor Lookup

## Overview

Build a comprehensive edge function that gives your Manus/OpenClaw agent the full quote workflow: search motors, create quotes, update quotes, get share links, and list existing quotes. One endpoint, multiple actions, secured with a dedicated API key.

## API Design

Single endpoint: `POST /functions/v1/agent-quote-api`
Auth: `x-agent-key` header matched against `AGENT_QUOTE_API_KEY` secret.

### Actions

```text
POST { "action": "list_motors", "search": "150", "limit": 10 }
→ Returns matching motors with id, model, hp, msrp, sale_price, in_stock

POST { "action": "create_quote", "customer_name": "...", "customer_email": "...", "motor_id": "uuid", ... }
→ Creates quote, returns quote_id + share_url + pricing breakdown

POST { "action": "update_quote", "quote_id": "uuid", "admin_discount": 500, "customer_notes": "..." }
→ Updates existing quote, returns updated share_url + pricing

POST { "action": "get_quote", "quote_id": "uuid" }
→ Returns full quote details including share_url

POST { "action": "list_quotes", "customer_email": "john@example.com", "limit": 10 }
→ Lists quotes, optionally filtered by customer email
```

## Technical Details

### New Files

| File | Purpose |
|------|---------|
| `supabase/functions/agent-quote-api/index.ts` | The edge function |

### Config Changes

| File | Change |
|------|--------|
| `supabase/config.toml` | Add `[functions.agent-quote-api]` with `verify_jwt = false` |

### New Secret

- `AGENT_QUOTE_API_KEY` — a random key you'll give to your Manus agent

### How Each Action Works

**`list_motors`**: Queries `motor_models` where `is_brochure = true` (your catalog motors). Supports search by HP number or model name text. Returns id, model_display, horsepower, msrp, sale_price, in_stock, model_key.

**`create_quote`**: 
- Looks up the motor by `motor_id` (required)
- Calculates: motor sale price + HST (13%) + DealerPlan fee ($299) - admin_discount = final_price
- Accepts optional: `customer_phone`, `admin_discount`, `admin_notes`, `customer_notes`, `custom_items[]`
- Inserts into `customer_quotes` with `lead_source: 'ai_agent'`, `is_admin_quote: true`
- Returns `quote_id`, `share_url`, `final_price`, motor summary

**`update_quote`**: 
- Updates an existing quote by ID
- Can change: `customer_name`, `customer_email`, `customer_phone`, `admin_discount`, `admin_notes`, `customer_notes`, `custom_items`
- Recalculates pricing if discount or items change
- Returns updated pricing + share_url

**`get_quote`**: Returns full quote record including share link, pricing, customer info, motor details.

**`list_quotes`**: Returns recent quotes, optionally filtered by `customer_email`. Shows id, customer_name, customer_email, motor info, final_price, created_at, share_url.

### Security

- API key auth only — no JWT needed
- Service role used for DB access (bypasses RLS)
- Rate limited: 30 requests/minute
- Only touches `customer_quotes` (insert/update/select) and `motor_models` (select)
- All quotes tagged `lead_source: 'ai_agent'` for tracking
- The `enforce_customer_quotes_user_id` trigger passes safely with service_role (auth.uid() is null, so the user_id check evaluates to null which doesn't raise)

### What Your Agent Can Tell You

After creating a quote, the agent gets back:
- The share URL (`https://mercuryrepower.ca/quote/saved/{id}`) — customer can view and download PDF from this link
- The quote ID — agent can use this to update the quote later
- Full pricing breakdown

The existing `SavedQuotePage` + `get-shared-quote` edge function already handles loading shared quotes, restoring state, and generating PDFs client-side. No changes needed there.

### Example Agent Workflow

```text
Agent: "Search for 150hp motors"
→ POST { action: "list_motors", search: "150" }
← Returns 3 motors with IDs and prices

Agent: "Create quote for John Smith with the 150 EFI, $500 discount"
→ POST { action: "create_quote", customer_name: "John Smith", 
         customer_email: "john@example.com", motor_id: "uuid", 
         admin_discount: 500 }
← Returns quote_id, share_url, final_price: $18,234.56

Agent: "Here's the link: https://mercuryrepower.ca/quote/saved/abc123"

Agent: "Actually, change the discount to $750"
→ POST { action: "update_quote", quote_id: "abc123", admin_discount: 750 }
← Returns updated pricing
```

### PDF Note

PDFs are generated client-side when the customer (or you) opens the share link and clicks "Download PDF". The agent doesn't need to generate PDFs — the share URL IS the delivery mechanism. When the customer opens it, they see the full quote summary with a download button.

