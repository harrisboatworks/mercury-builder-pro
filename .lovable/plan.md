
# Cron Schedule Optimization and Edge Function Security Audit

## Part 1: Cron Schedule Issues

### Current Cron Jobs in `vercel.json`

| Cron | Schedule | Frequency | Issue |
|------|----------|-----------|-------|
| `/api/cron/stock-sync` | `0 5 * * *` | Daily at 5am | Fine |
| `/api/cron/google-sheets-sync` | `0 6 * * 1` | Weekly Monday 6am | Fine |
| `/api/cron/migrate-images` | `15 */8 * * *` | Every 8 hours | **Handler file missing** |
| `/api/cron/scrape-details` | `30 */12 * * *` | Every 12 hours | **Handler file missing** |
| `/api/cron/health-check` | `45 */4 * * *` | Every 4 hours | **Handler file missing** |

### Findings

- **3 ghost cron jobs**: `migrate-images`, `scrape-details`, and `health-check` are scheduled in `vercel.json` but have no corresponding handler files in `api/cron/`. Vercel is hitting these routes every few hours and getting 404 errors. These are wasted invocations.
- **stock-sync** (daily) and **google-sheets-sync** (weekly) are appropriate frequencies.
- Since motors don't change often, the existing scraping handled by the daily stock-sync and weekly sheets-sync is sufficient. The twice-daily `scrape-details` was redundant even before its handler was removed.

### Changes

**`vercel.json`** -- Remove the 3 orphaned cron entries:
- Remove `/api/cron/migrate-images`
- Remove `/api/cron/scrape-details`
- Remove `/api/cron/health-check`

This reduces Vercel cron invocations from ~11/day to 1/day (plus 1/week).

---

## Part 2: Edge Function Security Audit

### Current State

Out of ~60 edge functions, only 4 have `verify_jwt = true`. Most have `verify_jwt = false`, which is acceptable per the Supabase signing-keys model **as long as the function validates auth internally**. However, many admin-only functions have **zero auth checks** -- anyone with the function URL could trigger them.

### Functions That Need Auth Added (Admin-Only Operations, Currently Open)

These functions modify inventory data, trigger scrapers, or use paid third-party APIs. They should only be callable by authenticated admin users.

| Function | Risk | What it does |
|----------|------|-------------|
| `update-motor-images` | **High** | Modifies motor image data in DB using service_role |
| `upload-hero-image` | **High** | Uploads files to storage using service_role |
| `attach-brochure-pdf` | **High** | Modifies motor records, uploads to storage |
| `scrape-motor-images` | **Medium** | Burns Firecrawl API credits, writes to DB |
| `scrape-mercury-catalog` | **Medium** | Burns Firecrawl/Perplexity credits, writes to DB |
| `scrape-mercury-accessories` | **Medium** | Burns API credits, writes to DB |
| `download-control-images` | **Medium** | Downloads and stores images |
| `sync-dropbox-motor-folders` | **Medium** | Accesses Dropbox, writes to DB |
| `browse-dropbox-folders` | **Medium** | Reads Dropbox contents |
| `firecrawl-inventory-agent` | **Medium** | Burns Firecrawl credits, writes to DB |
| `audit-price-list` | **Medium** | Reads pricing data (admin only) |
| `send-blog-notification` | **Medium** | Sends emails to all blog subscribers |
| `send-promo-notifications` | **Medium** | Sends emails to all promo subscribers |
| `process-notifications` | **Medium** | Sends notifications |
| `sync-elevenlabs-kb` | **Low** | Syncs knowledge base data |

### Functions That Are Correctly Open (No Auth Needed)

These are legitimately public-facing or called by external webhooks:

- `ai-chatbot` / `ai-chatbot-stream` -- public chatbot
- `capture-chat-lead` / `chat-history` -- anonymous chat
- `create-payment` / `stripe-webhook` -- payment flow
- `send-quote-email` / `send-saved-quote-email` -- customer-facing
- `send-contact-inquiry` -- public contact form
- `send-sms` -- triggered by system
- `subscribe-blog` / `unsubscribe-blog` -- public subscription
- `subscribe-promo-reminder` / `unsubscribe-promo-reminder` -- public
- `unsubscribe-email-sequence` / `track-email-event` -- email links
- `elevenlabs-conversation-token` / `voice-*` functions -- voice agent
- `realtime-session` / `realtime-sdp-exchange` -- WebRTC
- `locally-inventory` -- public inventory feed
- `google-places` -- public lookup
- `mercury-parts-lookup` -- public parts search
- `send-deposit-confirmation-email` -- triggered by Stripe webhook
- `generate-spec-sheet-insights` -- public spec sheets
- `generate-motor-spec-sheet` -- public spec sheets
- `perplexity-prefetch` -- public
- `track-share-event` -- public tracking
- `start-abandoned-quote-sequence` -- system triggered
- `send-financing-*` emails -- system triggered
- `send-repower-guide-email` -- system triggered
- `process-email-sequence` -- system triggered
- `cron-failure-notifications` -- system triggered
- `scrape-motor-prices` -- called by cron/system
- `notification-webhook` -- external webhook
- `trigger-zapier-webhooks` -- system triggered

### Changes

For each of the 15 admin-only functions listed above, add an auth guard block at the top of the handler (after the CORS check) that:

1. Reads the `Authorization` header
2. Uses `getClaims()` to verify the JWT
3. Checks the `user_roles` table for admin role
4. Returns 401/403 if unauthorized

This follows the same pattern already used successfully in `universal-pricing-import`.

The auth guard template:

```text
const authHeader = req.headers.get('Authorization');
if (!authHeader) return 401 "Missing Authorization";

// Verify JWT via getClaims()
const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, 
  { global: { headers: { Authorization: authHeader } } });
const { data, error } = await supabaseAuth.auth.getClaims(token);
if (error) return 401;

// Check admin role  
const { data: role } = await supabase.from('user_roles')
  .select('role').eq('user_id', data.claims.sub).eq('role', 'admin').single();
if (!role) return 403 "Admin required";
```

### Implementation Scope

- **1 file**: `vercel.json` (remove 3 ghost crons)
- **15 files**: Add admin auth guard to each function listed above
- **0 database changes**: `user_roles` table already exists

### Summary

| Category | Count | Action |
|----------|-------|--------|
| Ghost cron jobs removed | 3 | Saves ~10 wasted invocations/day |
| Admin functions secured | 15 | Auth + role check added |
| Public functions (no change) | ~30 | Already correctly open |
| Already secured functions | 4 | No change needed |
