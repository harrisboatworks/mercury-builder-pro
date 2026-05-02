# Targeted Security Plan

Scoped exactly to the five priorities. No changes to `/quote/motor-selection`, pricing logic, inventory filters, or motor data.

---

## 1. Storage policies — restrict writes to admins only

**Current state on `storage.objects`:**

| Policy | Op | Who |
|---|---|---|
| `Authenticated users can upload hero images` | INSERT | any authenticated → `motor-images/mercury/heroes/%` |
| `Authenticated users can upload inventory images` | INSERT | any authenticated → `motor-images/mercury/inventory/%` |
| `Authenticated users can update motor images` | UPDATE | any authenticated → `motor-images/mercury/{heroes,inventory}/%` |
| `Authenticated users can delete motor images` | DELETE | any authenticated → `motor-images/mercury/{heroes,inventory}/%` |
| `Authenticated users can upload inventory photos` | INSERT | any authenticated → `inventory-photos` |
| `Admins can upload motor images` | INSERT | admin → `motor-images` (already correct) |
| `Admins can delete inventory photos` | DELETE | admin → `inventory-photos` (already correct) |
| `Public can view motor images` / `Public read access for motor images` / `public read motor-images` | SELECT | public → `motor-images` (KEEP — site needs this) |
| `Public can view inventory photos` | SELECT | public → `inventory-photos` (KEEP) |

**Action (migration):**
- DROP the four `Authenticated users can {upload hero,upload inventory,update,delete} motor images` policies.
- DROP `Authenticated users can upload inventory photos`.
- ADD admin-gated equivalents using `has_role(auth.uid(), 'admin'::app_role)`:
  - `Admins can upload hero images` (INSERT, `motor-images`, path `mercury/heroes/%`)
  - `Admins can upload inventory images` (INSERT, `motor-images`, path `mercury/inventory/%`)
  - `Admins can update motor images` (UPDATE, `motor-images`, those paths)
  - `Admins can delete motor images` (DELETE, `motor-images`, those paths)
  - `Admins can upload inventory photos` (INSERT, `inventory-photos`)
- Public SELECT policies left untouched.

Service-role uploads (Edge Functions like `update-motor-images`, `scrape-motor-images`, Dropbox sync) bypass RLS and continue to work.

---

## 2. Auth health summary — add admin gate

`supabase/functions/auth-health-summary/index.ts` currently returns placeholder zeros, but is structurally designed to expose lockouts/IPs. Already `verify_jwt = true` in config, but that allows any signed-in user.

**Action:**
- Add `requireAdmin(req, corsHeaders)` at the top of the handler (same pattern as `update-motor-images`). Internal cron calls already supported via `EDGE_INTERNAL_SECRET` / `CRON_SECRET` header inside `requireAdmin`.

---

## 3. Dealer pricing — audit result: FALSE POSITIVE, no removal

**Audit findings** (sampled `motor_models` rows + code search):

| Field | Sample (2.5MH FourStroke) | Role |
|---|---|---|
| `msrp` | 1385 | Manufacturer suggested retail |
| `base_price` | 2075 | Legacy/base reference (often inflated) |
| `dealer_price` | 1271 | **Customer sale price** (what we charge — below MSRP) |
| `dealer_price_live` | 1385 | Lightspeed-synced live price (matches retail) |
| `sale_price` | null | Promotional override |

This matches the documented pricing hierarchy in project memory:
`manual_overrides > sale_price > dealer_price > msrp > base_price`

`dealer_price` is consumed as the customer-facing selling price across:
- `src/pages/quote/MotorSelectionPage.tsx` (the protected page)
- `src/pages/MotorPage.tsx`, `Compare.tsx`, `account/MyQuotesPage.tsx`
- `src/hooks/useTradeValuationData.ts`
- `src/pages/landing/MercuryProXS.tsx`
- Edge function `public-motors-api` exposes it as `dealerPrice` and resolves `sellingPrice` from it
- Spec sheet PDF, admin pages

The column name is misleading (it implies wholesale cost) but the actual values are the **selling price to customers**. The scanner flagged it based on the column name, not the data.

**Action:** Mark `motor_models_dealer_price_exposed` as **ignored** with a clear explanation in the security memory:
- "`dealer_price` and `dealer_price_live` in `motor_models` are misnamed — they hold the customer-facing selling price (typically ≤ MSRP), not wholesale cost. They are intentionally readable by anonymous users so the public quote builder, motor pages, landing pages, and `public-motors-api` can resolve `sellingPrice`. Do not restrict or remove."
- Optional follow-up (NOT in this PR): rename to `selling_price` / `selling_price_live` in a future migration with full code sweep. Flag for user approval separately.

No DB or code changes here.

---

## 4. SECURITY DEFINER audit + search_path

**Scope:** all SECURITY DEFINER functions in `public` schema (~80+). Almost all already have `SET search_path = public` (or `public, pg_temp`). A handful do not.

**Plan:**
1. **List + classify** (deliverable in PR description, not the migration):
   - **Intentionally callable by anon/authenticated** — gateway-secret-guarded RPCs (`add_customer_memory`, `archive_customer_memory`, `claim_openclaw_slack_fallback_jobs`, `complete_openclaw_slack_fallback_job`, `cleanup_openclaw_slack_fallback_jobs`, customer_* lookup helpers, etc.). These take a `p_gateway_secret` first arg and validate it inside the function. Keep as-is.
   - **Trigger functions** (`enforce_*_user_id`, validation triggers). Not directly callable in practice. Keep as-is.
   - **Maintenance/cron** (`cleanup_expired_sessions`, `cleanup_old_data`, `cleanup_motor_duplicates_by_display`, `audit_orphaned_customer_data`). Should not be public-EXECUTE.
   - **Sensitive helpers** (`encrypt_sin`, `decrypt_sin`, `check_rate_limit`, `bulk_upsert_*`). Should not be anon-EXECUTE.
2. **Migration actions:**
   - For every SECURITY DEFINER function in `public` where `proconfig` is NULL or doesn't include `search_path`: `ALTER FUNCTION ... SET search_path = public, pg_temp;` — fixes Supabase linter `0011_function_search_path_mutable` and is safe.
   - For `bulk_upsert_deals`, `bulk_upsert_open_ros`, `bulk_upsert_parts_invoices`, `cleanup_expired_sessions`, `cleanup_old_data`, `cleanup_motor_duplicates_by_display`, `audit_orphaned_customer_data`, `encrypt_sin`, `decrypt_sin`: `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated;` (service role retains access). This addresses the Supabase `0028`/`0029` linter findings without touching gateway-secret-guarded RPCs the app or external integrations rely on.
   - Do NOT change `SECURITY DEFINER` → `SECURITY INVOKER` on anything.
3. **Views** flagged by `0010_security_definer_view`: enumerate via linter output and report inline; no automatic recreation in this PR. Recreating views requires verifying every column-level dependency. Will be a separate, explicit follow-up if needed.

---

## 5. Admin read policies on SMS / customer_memory / trade_valuation_leads

**Decision:** Keep `service_role`-only. The admin UIs for these areas (chat history, customer memory, trade valuation leads) already go through Edge Functions that use the service-role client — they don't need direct JWT SELECT from the browser. Adding `has_role(auth.uid(), 'admin')` SELECT policies would expose phone numbers and PII to whatever JWT path the SDK is using and broaden the attack surface for no functional gain.

**Action:** Mark these four findings as **ignored** with a note in the security memory:
- `sms_conversations_service_role_bypass`
- `customer_memory_no_admin_read`
- `sms_conversation_archive_no_admin_read`
- `trade_valuation_leads_no_admin_select`

Reason recorded: "Admin access to these PII tables flows through service-role Edge Functions, not direct JWT SELECT. Keeping service-role-only RLS is intentional to minimize the surface for phone/email exposure."

---

## Out of scope (NOT touched)

- HTML/SMS injection findings (`html_injection_email`, `sms_injection_admin`) — not in your priority list.
- Any change to `motor_models` columns, RLS, or selects.
- Any change to `/quote/motor-selection`, pricing hierarchy, or inventory filters.
- Any view recreation.
- Changing `SECURITY DEFINER` to `SECURITY INVOKER`.

---

## Deliverables

1. One DB migration:
   - Storage policies swap (drop 5, add 5).
   - `ALTER FUNCTION ... SET search_path` on the SECURITY DEFINER functions missing it.
   - `REVOKE EXECUTE` on the sensitive maintenance/crypto/bulk-upsert functions.
2. Edit `supabase/functions/auth-health-summary/index.ts` to call `requireAdmin`.
3. Update security memory: mark dealer_price + the four service-role PII findings as accepted-risk with reasons.
4. Mark findings as `fixed` / `ignored` via the security tool.
5. Post the SECURITY DEFINER classification table in the chat reply for your review.