# Mercury Repower — Agent Quote API Instructions

> **Purpose**: This document tells an AI agent (Manus, OpenClaw, or similar) how to search motors, build full quotes with promotions/trade-ins/warranty, and share quote links on behalf of Mercury Repower.

---

## 1. Endpoint & Authentication

| Item | Value |
|------|-------|
| **URL** | `https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/agent-quote-api` |
| **Method** | `POST` (all actions) |
| **Auth Header** | `x-agent-key: <YOUR_API_KEY>` |
| **Content-Type** | `application/json` |
| **Rate Limit** | 30 requests / minute |

Every request is a JSON body with an `"action"` field plus action-specific parameters.

---

## 2. Actions

### 2.1 `list_motors` — Search Available Motors

Find motors by horsepower or model name.

**Request:**
```json
{
  "action": "list_motors",
  "search": "150",
  "limit": 10
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `search` | string | No | Number → filters by HP; text → searches model name |
| `limit` | number | No | Max results (default 20, cap 50) |

**Response:**
```json
{
  "ok": true,
  "motors": [
    {
      "id": "uuid",
      "model_display": "Mercury 150 EFI 4-Stroke",
      "horsepower": 150,
      "msrp": 18500,
      "sale_price": 16900,
      "in_stock": true,
      "model_key": "merc-150-efi",
      "motor_type": "outboard",
      "year": 2025
    }
  ],
  "count": 1
}
```

---

### 2.2 `list_promotions` — Get Active Promotions & Options

Fetches all active promotions including warranty bonuses, choose-one options, rebate matrix, and financing rates. **Call this before creating a quote** to know what's available.

**Request:**
```json
{
  "action": "list_promotions"
}
```

**Response:**
```json
{
  "ok": true,
  "promotions": [
    {
      "id": "uuid",
      "name": "Get 7 - Winter 2026",
      "kind": "warranty_bundle",
      "start_date": "2026-01-12",
      "end_date": "2026-03-31",
      "warranty_extra_years": 4,
      "bonus_title": "Choose Your Bonus",
      "choose_one_options": ["no_payments", "special_financing", "cash_rebate"],
      "rebate_matrix": [
        { "hp_min": 2.5, "hp_max": 20, "rebate_amount": 100 },
        { "hp_min": 25, "hp_max": 75, "rebate_amount": 250 },
        { "hp_min": 75, "hp_max": 150, "rebate_amount": 500 },
        { "hp_min": 150, "hp_max": 500, "rebate_amount": 1000 }
      ],
      "financing_rates": [
        { "term": 60, "rate": 4.99 },
        { "term": 120, "rate": 6.99 }
      ],
      "financing_minimum": 5000,
      "terms_url": "https://..."
    }
  ]
}
```

---

### 2.3 `estimate_trade_in` — Calculate Trade-In Value

Estimates the value of a customer's existing motor for trade-in credit.

**Request:**
```json
{
  "action": "estimate_trade_in",
  "brand": "Mercury",
  "year": 2018,
  "horsepower": 115,
  "condition": "good"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `brand` | string | **Yes** | e.g. "Mercury", "Yamaha", "Johnson" |
| `year` | number | **Yes** | Model year |
| `horsepower` | number | **Yes** | HP rating |
| `condition` | string | No | `"excellent"`, `"good"`, `"fair"`, `"poor"` (default: `"good"`) |

**Condition definitions:**
- **Excellent**: 0–100 engine hours
- **Good**: 100–500 engine hours
- **Fair**: 500–1,000 engine hours
- **Poor**: 1,000+ engine hours

**Response:**
```json
{
  "ok": true,
  "trade_in": {
    "brand": "Mercury",
    "year": 2018,
    "horsepower": 115,
    "condition": "good",
    "estimated_value": 5250,
    "range_low": 4463,
    "range_high": 5738,
    "confidence": "high",
    "factors": ["Exact model match found"]
  }
}
```

> **Note**: Johnson, Evinrude, and OMC brands receive a 50% penalty (manufacturer out of business, limited parts availability).

---

### 2.4 `get_warranty_pricing` — Warranty Extension Costs

Returns warranty extension pricing for a given horsepower.

**Request:**
```json
{
  "action": "get_warranty_pricing",
  "horsepower": 150
}
```

**Response:**
```json
{
  "ok": true,
  "warranty_pricing": {
    "hp_range": "115-200",
    "base_warranty_years": 3,
    "extension_costs": {
      "year_4": 350,
      "year_5": 375,
      "year_6": 400,
      "year_7": 425,
      "year_8": 450
    },
    "note": "With the active Get 7 promotion, years 4-7 are included free. Only year 8 would be an additional cost."
  }
}
```

---

### 2.5 `create_quote` — Create a Full Quote

Create a complete quote with motor, promotions, trade-in, warranty, and accessories.

**Request (full example):**
```json
{
  "action": "create_quote",
  "customer_name": "John Smith",
  "customer_email": "john@example.com",
  "customer_phone": "905-555-1234",
  "motor_id": "<motor uuid from list_motors>",
  "purchase_path": "loose",
  "promo_option": "cash_rebate",
  "trade_in": {
    "brand": "Mercury",
    "year": 2015,
    "horsepower": 90,
    "condition": "good",
    "model": "FourStroke",
    "serial_number": "OT123456",
    "override_value": 5500
  },
  "warranty_years": 8,
  "package": "better",
  "admin_discount": 500,
  "admin_notes": "Returning customer, loyalty discount",
  "customer_notes": "Interested in spring delivery",
  "custom_items": [
    { "name": "Prop upgrade", "price": 450 },
    { "name": "Installation", "price": 800 }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `customer_name` | string | **Yes** | |
| `customer_email` | string | **Yes** | Must be valid email |
| `motor_id` | string | **Yes** | UUID from `list_motors` |
| `customer_phone` | string | No | |
| `purchase_path` | string | No | `"loose"` (default) or `"installed"` |
| `promo_option` | string | No | `"cash_rebate"`, `"special_financing"`, `"no_payments"`, or `null` |
| `promo_rate` | number | No | APR for special_financing (default: 2.99) |
| `promo_term` | number | No | Term in months for special_financing (default: 120) |
| `trade_in` | object | No | `{ brand, year, horsepower, condition, model?, serial_number?, override_value? }` |
| `trade_in.override_value` | number | No | Override the formula estimate with an exact trade-in dollar amount. The formula estimate is still calculated and stored for reference. |
| `warranty_years` | number | No | Total warranty years desired (e.g. 7 or 8) |
| `package` | string | No | `"good"`, `"better"`, or `"best"` |
| `admin_discount` | number | No | Dollar amount off final price |
| `admin_notes` | string | No | Internal notes (not shown to customer) |
| `customer_notes` | string | No | Notes visible to customer |
| `custom_items` | array | No | Extra line items `{ name, price }` |
| `lead_status` | string | No | Default: `"new"`. Options: `"new"`, `"contacted"`, `"scheduled"`, `"won"`, `"lost"` |

**Response:**
```json
{
  "ok": true,
  "quote_id": "uuid",
  "share_url": "https://mercuryrepower.ca/quote/saved/uuid",
  "admin_url": "https://mercuryrepower.ca/admin/quotes/uuid",
  "motor": {
    "model": "Mercury 150 EFI 4-Stroke",
    "horsepower": 150,
    "msrp": 18500
  },
  "pricing": {
    "subtotal": 18150,
    "warrantyCost": 450,
    "tradeInCredit": 4060,
    "rebateCredit": 500,
    "adjustedSubtotal": 14040,
    "hst": 1825.20,
    "totalBeforeDiscount": 15865.20,
    "adminDiscount": 500,
    "finalPrice": 15365.20
  },
  "promo_applied": {
    "option": "cash_rebate",
    "rebate_amount": 500,
    "promo_name": "Get 7 - Winter 2026"
  },
  "trade_in_applied": {
    "value": 4060,
    "brand": "Mercury",
    "condition": "good"
  },
  "warranty": {
    "total_years": 8,
    "extra_cost": 450
  }
}
```

> **Always give the customer the `share_url`** — it opens their full quote with pricing breakdown.
> The `admin_url` opens the admin edit view for the quote.

---

### 2.6 `update_quote` — Modify an Existing Quote

Only send the fields you want to change. Pricing is recalculated automatically.

**Request:**
```json
{
  "action": "update_quote",
  "quote_id": "<quote uuid>",
  "admin_discount": 750,
  "trade_in": {
    "brand": "Yamaha",
    "year": 2020,
    "horsepower": 115,
    "condition": "excellent"
  },
  "promo_option": "cash_rebate"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `quote_id` | string | **Yes** | |
| All fields from `create_quote` | various | No | Only send what changed |
| `trade_in` | object or `null` | No | Pass `null` to remove trade-in |

**Response:**
```json
{
  "ok": true,
  "quote_id": "uuid",
  "share_url": "https://mercuryrepower.ca/quote/saved/uuid",
  "admin_url": "https://mercuryrepower.ca/admin/quotes/uuid",
  "pricing": { "...recalculated..." }
}
```

---

### 2.7 `get_quote` — Retrieve Quote Details

**Request:**
```json
{
  "action": "get_quote",
  "quote_id": "<quote uuid>"
}
```

**Response includes** all quote fields plus: `purchase_path`, `promo_option`, `rebate_amount`, `trade_in`, `warranty_years`, `warranty_cost`, `package`, `financing`.

---

### 2.8 `list_quotes` — List Existing Quotes

**Request:**
```json
{
  "action": "list_quotes",
  "customer_email": "john@example.com",
  "limit": 10
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `customer_email` | string | No | Filter by email |
| `lead_source` | string | No | e.g. `"ai_agent"` |
| `limit` | number | No | Default 20, cap 50 |

---

## 3. Pricing Formula

All quotes are calculated automatically:

```
Subtotal          = Motor Sale Price + Custom Items + Extended Warranty Cost
Trade-In Credit   = min(Trade-In Value, Subtotal)
Rebate Credit     = min(Rebate Amount, Subtotal - Trade-In Credit)
Adjusted Subtotal = Subtotal - Trade-In Credit - Rebate Credit
HST               = Adjusted Subtotal × 13%
Total             = Adjusted Subtotal + HST
Final Price       = Total − Admin Discount
```

You do **not** need to calculate pricing yourself — just provide the `motor_id` and optional selections.

---

## 4. Smart Defaults & Auto-Selection

The API applies intelligent defaults so agents don't need to specify every field:

| Situation | Default Behavior |
|-----------|-----------------|
| No `promo_option` specified | Auto-selects `cash_rebate` (best value for most customers) |
| `special_financing` or `no_payments` requested but total < $5,000 | Falls back to `cash_rebate` with a warning in the response |
| No `trade_in` provided | No trade-in applied |
| No `purchase_path` specified | Defaults to `"loose"` (motor only, no installation) |
| No `lead_status` specified | Defaults to `"new"` (customer just asked for a quote) |
| No `warranty_years` specified | Uses promotion-included warranty (e.g. 7 years with Get 7) |
| No `package` specified | Defaults to `"good"` (Essential package) |

---

## 5. Example Workflows

### Customer asks "How much is a 150HP motor?"

1. `list_motors` with `search: "150"`
2. `list_promotions` to see current deals
3. Present the results with MSRP, sale price, and active rebate
4. If interested → `create_quote` with their name, email, and chosen motor
5. Share the `share_url`

### Full quote with trade-in and rebate

1. `list_motors` → find the right motor
2. `list_promotions` → confirm rebate amount for that HP
3. `estimate_trade_in` → get trade-in value for their current motor
4. `create_quote` with:
   - `motor_id`, customer info
   - `promo_option: "cash_rebate"`
   - `trade_in: { brand, year, horsepower, condition }`
5. Share the `share_url` with full breakdown

### Quote with special financing

1. `list_motors` + `list_promotions`
2. Verify the total will be ≥ $5,000 (financing minimum)
3. `create_quote` with `promo_option: "special_financing"`, `promo_rate: 2.99`, `promo_term: 120`
4. Response includes monthly payment calculation

### Check warranty extension cost

1. `get_warranty_pricing` with the motor's HP
2. Note: With Get 7 promo, years 4-7 are free. Only year 8+ costs extra.
3. Include `warranty_years: 8` in `create_quote` to add the extension

### Customer wants to add accessories to an existing quote

1. `get_quote` to retrieve current state
2. `update_quote` with new `custom_items` array (replaces previous items)
3. Share the updated `share_url`

### Check if a customer already has quotes

1. `list_quotes` with `customer_email`
2. Use `get_quote` on any relevant quote to see full details

---

## 6. Important Rules

- **Always use `list_motors` first** to get a valid `motor_id` before creating a quote.
- **Always share the `share_url`** with the customer after creating or updating a quote.
- **Never fabricate motor IDs** — they must come from `list_motors`.
- **All quotes created by this API** are tagged with `lead_source: "ai_agent"` automatically.
- **Email validation** is enforced — invalid emails will be rejected.
- **Financing minimum**: $5,000. Quotes below this cannot use `special_financing` or `no_payments`.
- **Rate limit**: 30 requests per minute. Space out bulk operations.
- **All prices are in Canadian Dollars (CAD)**.
- **Trade-in condition** is defined by engine hours: Excellent (0-100h), Good (100-500h), Fair (500-1000h), Poor (1000+h).

---

## 7. Error Handling

All errors return `{ "error": "message" }` with an appropriate HTTP status:

| Status | Meaning |
|--------|---------|
| 400 | Bad request / unknown action |
| 401 | Invalid or missing API key |
| 429 | Rate limit exceeded |
| 500 | Server error |

Always check for the `ok: true` field in successful responses. Some responses may include a `warnings` array with non-fatal issues (e.g. financing fallback).

---

## 8. Backend Behavior

These details are handled automatically — agents do **not** need to manage them, but should be aware of the behavior.

### 8.1 Dual-Write Persistence

Every `create_quote` and `update_quote` writes to **two** tables:

| Table | Purpose |
|-------|---------|
| `customer_quotes` | Admin CRM — lead management, status tracking, analytics |
| `saved_quotes` | Customer-facing — "My Quotes" dashboard, PDF generation, deposit flow |

Saved quotes expire after **90 days**. The `share_url` returned in the response opens the customer's quote summary with full pricing breakdown.

### 8.2 Admin SMS Notifications

On every `create_quote`, the dealer admin receives an SMS alert:

```
🤖 AI Agent Quote Created
Customer: John Smith
Motor: Mercury 150 EFI 4-Stroke
Price: $15,365.20
Quote: https://mercuryrepower.ca/quote/saved/<uuid>
Admin: https://mercuryrepower.ca/admin/quotes/<uuid>
```

- **Non-blocking** — SMS delivery failure does not affect quote creation or the API response.
- The **Quote** link can be forwarded directly to the customer.
- The **Admin** link opens the quote in the admin edit view.

### 8.3 Automatic Lead Tagging

All quotes created through this API are automatically tagged with:

| Field | Value |
|-------|-------|
| `lead_source` | `"ai_agent"` |
| `is_admin_quote` | `true` |

These tags allow filtering agent-created quotes in the admin dashboard and analytics.

---

## 9. Voice Agent Workflow (ElevenLabs / Harris)

The voice agent "Harris" can create quotes conversationally during live phone or in-app voice sessions. This uses the **same `agent-quote-api` endpoint** as external agents — no separate backend required.

### 9.1 How It Works

Harris has two tools for quoting:

| Tool | Type | Purpose |
|------|------|---------|
| `create_customer_quote` | **Server tool** (ElevenLabs dashboard) | Calls `agent-quote-api` with `action: "create_quote"` |
| `deliver_quote_link` | **Client tool** (runs in browser) | Displays the `share_url` on the customer's screen |

### 9.2 Conversational Flow

```
1. Customer expresses interest in a motor
2. Harris confirms the motor selection
3. Harris gathers info naturally:
   - Name: "Who should I put this quote under?"
   - Email: "What's the best email to send this to?"
   - Phone (optional): "Want me to text you the link too?"
   - Trade-in (optional): "Are you trading anything in?"
4. Harris calls create_customer_quote (server tool)
5. Harris calls deliver_quote_link (client tool) → toast + card appear
6. Harris reads back key numbers: price, rebate, warranty
```

### 9.3 Server Tool Configuration

Add this as a **Server Tool** in the ElevenLabs agent dashboard:

- **Name:** `create_customer_quote`
- **URL:** `https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/agent-quote-api`
- **Method:** POST
- **Headers:**
  - `x-agent-key: <AGENT_QUOTE_API_KEY>`
  - `Content-Type: application/json`

**Body (JSON):**
```json
{
  "action": "create_quote",
  "customer_name": "Dave Wilson",
  "customer_email": "dave@email.com",
  "customer_phone": "+16135551234",
  "motor_id": "<uuid from check_inventory>",
  "promo_option": "cash_rebate",
  "trade_in": {
    "brand": "Yamaha",
    "year": 2018,
    "horsepower": 90,
    "condition": "good"
  },
  "warranty_years": 7,
  "purchase_path": "installed",
  "customer_notes": "Voice agent quote — customer on phone"
}
```

The response includes `share_url`, `admin_url`, and full pricing breakdown — Harris passes `share_url` to `deliver_quote_link`.

### 9.4 What Happens Behind the Scenes

1. Quote is dual-written to `customer_quotes` + `saved_quotes`
2. Admin receives SMS with customer link + admin link
3. Quote is tagged `lead_source: "ai_agent"`, `is_admin_quote: true`
4. Customer can open `share_url` to view pricing, download PDF, or place a deposit

### 9.5 System Prompt Section (for ElevenLabs dashboard)

Add this to Harris's system prompt:

```text
## PHONE QUOTING WORKFLOW
When a customer wants a quote, gather info naturally through conversation:
1. Motor selection — you likely already know this from the conversation
2. Name — "Who should I put this quote under?"
3. Email — "What's the best email to send this to?"
4. Phone (optional) — "Want me to text you the link too?"
5. Trade-in (optional) — "Are you trading anything in?"
6. Then call create_customer_quote with all collected info
7. After creating, use deliver_quote_link to show the link on screen
8. Read back the key numbers: price, any rebate, warranty coverage

RULES:
- Don't ask all questions at once — keep it conversational
- If they already told you their name/phone (e.g. from schedule_callback), reuse it
- Always confirm the motor before creating the quote
- After creating, say something like "Your quote is ready — I've put the link on your screen"
```
