# Mercury Repower — Agent Quote API Instructions

> **Purpose**: This document tells an AI agent (Manus, OpenClaw, or similar) how to search motors, create/update quotes, and share quote links on behalf of Mercury Repower.

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

### 2.2 `create_quote` — Create a New Quote

**Request:**
```json
{
  "action": "create_quote",
  "customer_name": "John Smith",
  "customer_email": "john@example.com",
  "customer_phone": "905-555-1234",
  "motor_id": "<motor uuid from list_motors>",
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
| `admin_discount` | number | No | Dollar amount off final price |
| `admin_notes` | string | No | Internal notes (not shown to customer) |
| `customer_notes` | string | No | Notes visible to customer |
| `custom_items` | array | No | Extra line items `{ name, price }` |

**Response:**
```json
{
  "ok": true,
  "quote_id": "uuid",
  "share_url": "https://mercuryrepower.ca/quote/saved/uuid",
  "motor": {
    "model": "Mercury 150 EFI 4-Stroke",
    "horsepower": 150,
    "msrp": 18500
  },
  "pricing": {
    "subtotal": 18150,
    "hst": 2359.50,
    "dealerplanFee": 299,
    "totalBeforeDiscount": 20808.50,
    "adminDiscount": 500,
    "finalPrice": 20308.50
  }
}
```

> **Always give the customer the `share_url`** — it opens their full quote with pricing breakdown.

---

### 2.3 `update_quote` — Modify an Existing Quote

Only send the fields you want to change. Pricing is recalculated automatically.

**Request:**
```json
{
  "action": "update_quote",
  "quote_id": "<quote uuid>",
  "admin_discount": 750,
  "customer_notes": "Updated delivery preference"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `quote_id` | string | **Yes** | |
| `customer_name` | string | No | |
| `customer_email` | string | No | Must be valid if provided |
| `customer_phone` | string | No | |
| `admin_discount` | number | No | Replaces previous discount |
| `admin_notes` | string | No | |
| `customer_notes` | string | No | |
| `custom_items` | array | No | Replaces all custom items |

**Response:**
```json
{
  "ok": true,
  "quote_id": "uuid",
  "share_url": "https://mercuryrepower.ca/quote/saved/uuid",
  "pricing": { "...recalculated..." }
}
```

---

### 2.4 `get_quote` — Retrieve Quote Details

**Request:**
```json
{
  "action": "get_quote",
  "quote_id": "<quote uuid>"
}
```

**Response:**
```json
{
  "ok": true,
  "quote": {
    "id": "uuid",
    "customer_name": "John Smith",
    "customer_email": "john@example.com",
    "customer_phone": "905-555-1234",
    "base_price": 16900,
    "final_price": 20308.50,
    "admin_discount": 500,
    "admin_notes": "...",
    "customer_notes": "...",
    "lead_status": "scheduled",
    "lead_source": "ai_agent",
    "created_at": "2026-03-09T...",
    "share_url": "https://mercuryrepower.ca/quote/saved/uuid",
    "motor": {
      "id": "uuid",
      "model_display": "Mercury 150 EFI 4-Stroke",
      "horsepower": 150,
      "msrp": 18500,
      "sale_price": 16900
    },
    "custom_items": [
      { "name": "Prop upgrade", "price": 450 }
    ]
  }
}
```

---

### 2.5 `list_quotes` — List Existing Quotes

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
Subtotal      = Motor Sale Price + Sum of Custom Items
HST           = Subtotal × 13%
DealerPlan    = $299 (flat fee, always applied)
Total         = Subtotal + HST + DealerPlan Fee
Final Price   = Total − Admin Discount
```

You do **not** need to calculate pricing yourself — just provide the `motor_id` and optional `admin_discount` / `custom_items`.

---

## 4. Example Workflows

### Customer asks "How much is a 150HP motor?"

1. `list_motors` with `search: "150"`
2. Present the results with MSRP and sale price
3. If interested → `create_quote` with their name, email, and chosen motor
4. Share the `share_url` so they can view the full breakdown

### Customer wants to add accessories to an existing quote

1. `get_quote` to retrieve current state
2. `update_quote` with new `custom_items` array (replaces previous items)
3. Share the updated `share_url`

### Check if a customer already has quotes

1. `list_quotes` with `customer_email`
2. Use `get_quote` on any relevant quote to see full details

---

## 5. Important Rules

- **Always use `list_motors` first** to get a valid `motor_id` before creating a quote.
- **Always share the `share_url`** with the customer after creating or updating a quote.
- **Never fabricate motor IDs** — they must come from `list_motors`.
- **All quotes created by this API** are tagged with `lead_source: "ai_agent"` automatically.
- **Email validation** is enforced — invalid emails will be rejected.
- **Rate limit**: 30 requests per minute. Space out bulk operations.

---

## 6. Error Handling

All errors return `{ "error": "message" }` with an appropriate HTTP status:

| Status | Meaning |
|--------|---------|
| 400 | Bad request / unknown action |
| 401 | Invalid or missing API key |
| 429 | Rate limit exceeded |
| 500 | Server error |

Always check for the `ok: true` field in successful responses.
