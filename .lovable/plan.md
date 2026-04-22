

## Wave E — Inventory Code Cleanup + Lightspeed Sync Failure Alerts

Two small, independent pieces of work bundled together. Total estimated time: ~1 hour to ship.

---

### Part 1: Dead Scraper Code Cleanup

**Goal**: Remove the legacy DealerSpike/Harris-website scraper code that's been replaced by Lightspeed DMS direct integration. Stop the 5am cron from firing into a dead function. Eliminate broken `scrape-inventory` calls scattered through the customer-facing UI.

**Files to delete**:
- `supabase/functions/scrape-inventory-v2/` (if present — referenced in old docs)
- `supabase/functions/scrape-motor-details/` + `scrape-motor-details-batch/` + `scrape-motor-images/` + `scrape-motor-prices/` + `multi-source-scraper/` + `test-scraper-simple/` + `debug-xml-inventory/`
- `supabase/functions/firecrawl-inventory-agent/` (old scraping)
- `api/cron/stock-sync.ts` and `api/cron/scrape-motor-details.ts` (calls dead functions)
- `src/pages/TestXMLInventory.tsx` and route in `App.tsx`
- `src/pages/TestScraper.tsx` if present, route in `App.tsx`
- `README_XML_INTEGRATION.md`
- `src/hooks/useAutoImageScraping.ts` (calls dead `scrape-motor-details`)

**Files to edit (remove dead `scrape-inventory` / `scrape-motor-details` invocations)**:
- `src/components/quote-builder/MotorSelection.tsx` — remove the manual-refresh button calling `scrape-inventory` (line ~663) and the quick-view enrichment call (lines ~870, ~1921)
- `src/components/admin/InventoryDiagnostics.tsx`, `UnifiedInventoryDashboard.tsx`, `InventoryMonitor.tsx`, `ScrapeMotorSpecs.tsx` — replace the "manual refresh" buttons with a single button that calls `sync-lightspeed-inventory` instead, or remove the buttons entirely. I'll consolidate into one "Sync Lightspeed Inventory now" admin button on the existing `AdminStockSync.tsx` page.
- `src/pages/AdminStockSync.tsx` — currently calls `stock-inventory-sync` (deleted). Repoint to `sync-lightspeed-inventory`.
- `vercel.json` — remove the `0 5 * * *` cron entry pointing at `/api/cron/stock-sync`. Replace with a daily call to `sync-lightspeed-inventory` via Supabase pg_cron (cleaner than Vercel cron for this).
- `supabase/config.toml` — remove the `[functions.scrape-motor-details]` and `[functions.scrape-motor-details-batch]` `verify_jwt` blocks
- `README.md` — remove the curl examples for `scrape-inventory-v2`

**Add the daily Lightspeed sync via pg_cron** (replaces the Vercel cron):
```sql
SELECT cron.schedule(
  'lightspeed-daily-sync',
  '0 5 * * *',  -- 5am UTC daily, same as before
  $$ SELECT net.http_post(
    url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/sync-lightspeed-inventory',
    headers := jsonb_build_object('Authorization', 'Bearer <service-role-key>', 'Content-Type', 'application/json'),
    body := '{"trigger":"cron"}'::jsonb
  ) $$
);
```

---

### Part 2: Lightspeed Sync Failure Alerts

**Goal**: When the daily Lightspeed sync fails (or returns suspiciously few motors), get notified immediately so stale `in_stock` data doesn't poison the AI agent / MCP responses for days.

**Approach**: SMS via Twilio to `ADMIN_PHONE` on failure. Email is overkill — you already have ADMIN_PHONE configured and a Twilio sender, and a text gets your attention faster than email-buried-in-inbox.

**Implementation**:
1. **Edit `supabase/functions/sync-lightspeed-inventory/index.ts`** — wrap the body in try/catch. On failure (or if `motors found = 0` when there were motors yesterday), call a new `notify-admin-sms` helper with the error context. Also write a row to `cron_job_logs` (table already exists with the right schema — `job_name`, `status`, `motors_found`, `motors_updated`, `error_message`, `result`).
2. **Create `supabase/functions/notify-admin-sms/index.ts`** — small wrapper that takes `{ subject, body }` and sends an SMS via Twilio's REST API to `ADMIN_PHONE` from `TWILIO_FROM_NUMBER`. Auth uses Twilio account SID + auth token (we'll confirm secrets exist; if not, ask to add them).
   - Alternative: connect via the **Twilio connector** (`standard_connectors--connect twilio`) so we don't manage the SID/auth-token directly. Cleaner. I'll use the connector.
3. **Smart "suspiciously empty" guard**: after sync, compare `motors_found` to the most recent successful run in `cron_job_logs`. If today's count drops by more than 50%, send an SMS alert even on technical "success" — this catches Lightspeed API silently returning empty results.
4. **Optional toggle**: add a row to `admin_sources` table with `key = 'lightspeed_alerts_enabled'`, `value = 'true'` so you can mute alerts during planned maintenance without redeploying.

**SMS content** (kept short — SMS is cramped):
```
HBW Lightspeed sync FAILED 5:01am Apr 22.
Error: Failed to read mercury_motor_inventory: timeout
Last good sync: yesterday 5:02am, 47 motors.
Check: mercuryrepower.ca/admin/stock-sync
```

**Twilio secrets check**: `TWILIO_FROM_NUMBER` and `ADMIN_PHONE` exist. The Twilio account SID + auth token (or connector connection) need to be confirmed. If missing, I'll ask before proceeding.

---

### Diagram

```text
Daily 5am UTC
    │
    └──> pg_cron triggers sync-lightspeed-inventory
              │
              ├── SUCCESS (with sane motor count)
              │      └─ insert cron_job_logs row, status=completed
              │
              ├── SUCCESS but motors_found dropped >50% from yesterday
              │      ├─ insert cron_job_logs row, status=warning
              │      └─ invoke notify-admin-sms ──> Twilio SMS to ADMIN_PHONE
              │
              └── FAILURE (exception, timeout, auth error)
                     ├─ insert cron_job_logs row, status=failed, error_message=...
                     └─ invoke notify-admin-sms ──> Twilio SMS to ADMIN_PHONE
```

---

### Risk + mitigation
- **Removing `useAutoImageScraping.ts`**: This hook auto-fetches images for motors missing them. Since you've moved to Dropbox-folder-sync for images (per memory), this is dead weight. Confirmed safe to remove. Motor cards have a 7-tier fallback that doesn't depend on this hook.
- **Removing manual refresh buttons in admin**: I'll consolidate to one button on the existing Stock Sync admin page rather than scatter them across 4 components. Less surface area, less confusion.
- **Customer-facing scraper call in `MotorSelection.tsx`**: This is a stale "refresh inventory" button that's been silently failing for users. Removing it is a bug fix, not a regression.

### What you'll do
Nothing for Part 1 — pure cleanup. For Part 2, after the alert function is shipped:
1. Confirm the Twilio connector is connected (or provide Account SID + Auth Token if you want me to use them directly without the connector)
2. Wait for tomorrow's 5am sync — if it succeeds you get nothing (silent good news); if it fails you get a text within 30 seconds
3. Test manually by hitting `Sync Lightspeed Inventory now` in admin and verifying `cron_job_logs` gets a row

### Question before I start

**Twilio access**: Do you want me to use the **Twilio connector** (cleaner — no manual secret management, gateway handles auth refresh) or the **direct Twilio REST API** with raw secrets you'd add? Connector is recommended unless you already have Twilio credentials in your secrets you'd rather use.

