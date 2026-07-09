# Audit: Google Sheets Inventory Sync — Deprecate in Favor of Lightspeed

**Status:** Step A + Step B executed in production on 2026-05-01. Step C repo hard-removal completed on 2026-07-08 and reverified on 2026-07-09 after the retired Vercel cron route produced fresh runtime errors on 2026-07-06.
**Date:** 2026-05-01; Step C updates 2026-07-08 and 2026-07-09
**Trigger:** Jay confirmed Lightspeed is now the source of truth for inventory.

---

## Retirement State

- ✅ **Step A done:** `cron.job` id 33 (`google-sheets-inventory-daily`, schedule `0 6 * * *`) set `active = false`.
- ✅ **Step B done:** `public.google_sheets_config.auto_sync_enabled = false`. `last_sync` remains `2026-04-07 06:00:07.63+00`.
- ✅ **Step C repo removal done:** Vercel route `api/cron/google-sheets-sync.ts` removed, Vercel cron entry removed, deployable Supabase function source/config removed, an idempotent cleanup migration added to unschedule the database cron, and the admin Google Sheets sync panel hidden by removing the dashboard tab/import.
- ⏸ **Still production-owned:** Vercel production must deploy this repo diff so the retired route and cron config disappear from the live deployment, the cleanup migration must be applied/verified so the database cron is absent, and the deployed Edge Function should be deleted or verified unreachable. Optional only: dropping `public.google_sheets_config` after confirming no production admin workflow references it. `motor_models` data was not touched.

**Earlier production verification from the May audit:**
- `public-motors-api` returns 200, 25 motors, all pass catalog rules.
- `agent-mcp-server` `tools/list` returns 5 tools.

**Business decision:** Google Sheets inventory pipeline stays disabled indefinitely. Do NOT re-enable without explicit approval from Jay. Lightspeed is the sole source of truth.

---

## TL;DR

The `google-sheets-inventory-daily` cron job is **actively conflicting** with the Lightspeed inventory sync and should be **disabled** (recommended) or **removed**. Concrete evidence below.

**Recommendation:** Keep the Google Sheets inventory pipeline retired. The repo should not expose a callable Sheets inventory sync path. Any remaining production database objects are rollback/cleanup artifacts only, not active inventory sources.

---

## Original Findings (2026-05-01)

### 1. Both syncs write to the same table, on overlapping schedules

| Job | Schedule (UTC) | Target | Writes to |
|---|---|---|---|
| `lightspeed-motor-models-sync-daily` (jobid 19) | `15 2 * * *` (02:15 UTC) | `sync-lightspeed-inventory` | `motor_models` |
| `google-sheets-inventory-daily` (jobid 33) | `0 6 * * *` (06:00 UTC) | `sync-google-sheets-inventory` | `motor_models` |

Sheets runs **3h 45m after** Lightspeed daily, so whatever Lightspeed writes can be **partially overwritten** by Sheets every morning.

### 2. The Sheets sync mutates the same fields Lightspeed owns

`sync-google-sheets-inventory/index.ts` performs:

- A bulk reset: `UPDATE motor_models SET in_stock=false, availability=NULL, stock_quantity=0` for every row not marked `Exclude`.
- Then per-match: `UPDATE motor_models SET in_stock=true, availability='In Stock', stock_quantity=<n>, inventory_source='google_sheets'`.

This means every morning at 06:00 UTC the Sheets job:
- Wipes Lightspeed's `in_stock` / `availability` / `stock_quantity` for the entire catalog,
- Repopulates only motors it can string-match from the sheet,
- Stamps `inventory_source='google_sheets'` over Lightspeed's stamping.

Any motor Lightspeed marked in stock that the Sheets parser can't match (no rigging code detected, name drift, etc.) is silently flipped to out-of-stock.

### 3. Sync log evidence — Lightspeed was the only one keeping pace before Step A/B

Last 15 entries in `sync_logs`:
- 15 `lightspeed` runs, daily through 2026-05-01, processing 25–28 motors.
- 0 `google_sheets` runs in the recent window.

At audit time, `google_sheets_config.last_sync` = **2026-04-07 06:00 UTC** (~24 days earlier), yet `auto_sync_enabled = true` and the cron was `active = true`. This strongly suggested recent Sheets runs were failing silently or short-circuiting (likely the config row fetch / CSV fetch returning HTML), while the cron job was still firing and **the destructive reset could still run before the early-return paths in some branches**.

Either way: the job is unmaintained, the data source is no longer authoritative, and it can resume corrupting `motor_models` the moment the sheet/config is touched.

### 4. Catalog visibility risk

Per memory `inventory/catalog-visibility-overrides`, certain models (e.g. 115 ELPT/EXLPT) are force-visible. The Sheets reset specifically excludes only `availability='Exclude'` — it does **not** respect the visibility-override list, so the 06:00 UTC reset can still flip force-visible models out of stock until the next Lightspeed run 22 hours later.

### 5. Cron auth status (post-hardening context)

`google-sheets-inventory-daily` is one of the 7 service-role jobs already migrated to `x-internal-secret` in today's pre-migration rewrite. Disabling it does **not** affect the JWT migration plan.

---

## Step A/B — Executed 2026-05-01

Two-step soft deprecation. Both steps were reversible and were executed in production on 2026-05-01.

### Step A — Disable the cron job

```sql
-- Disable, do not drop, so we can re-enable in <1 minute if needed.
SELECT cron.alter_job(jobid := 33, active := false);

-- Verify
SELECT jobid, jobname, active FROM cron.job WHERE jobid = 33;
```

### Step B — Disable auto-sync at the config level (defense in depth)

```sql
UPDATE public.google_sheets_config
SET auto_sync_enabled = false
WHERE auto_sync_enabled = true;
```

This ensures that even if someone manually invokes `sync-google-sheets-inventory` (admin UI, curl, etc.), it will short-circuit with `"Auto-sync is disabled or not configured"` instead of running the destructive reset.

### Step C (after grace period) — Hard removal

```sql
-- After Jay confirms no rollback needed.
SELECT cron.unschedule(33);
-- Delete the Edge Function via supabase--delete_edge_functions(['sync-google-sheets-inventory'])
-- Optionally: DROP TABLE public.google_sheets_config;
```

The `api/cron/google-sheets-sync.ts` Vercel route should also be removed in Step C — it is a redundant external trigger that points at the same Edge Function.

---

## Step C — Repo Hard Removal Completed 2026-07-08

Jay approved finishing Step C after a fresh 2026-07-06 Vercel runtime error on `/api/cron/google-sheets-sync` showed the retired cron route was still generating operational noise.

Completed repo changes:

1. Removed `api/cron/google-sheets-sync.ts`.
2. Removed the `/api/cron/google-sheets-sync` entry from `vercel.json`.
3. Removed the deployable `supabase/functions/sync-google-sheets-inventory` source and `supabase/config.toml` function entry.
4. Added `supabase/migrations/20260708120000_unschedule_google_sheets_inventory_sync.sql` to unschedule `google-sheets-inventory-daily` without rewriting historical migrations.
5. Removed the `GoogleSheetsSyncPanel` admin component and the `Google Sheets` tab/import from `UnifiedInventoryDashboard`.
6. Kept `src/pages/AdminStockSync.tsx` visible because it is now Lightspeed-only and invokes `sync-lightspeed-inventory`, not the retired Sheets function.

Remaining production cleanup checklist:

1. Deploy this repo diff to Vercel production and verify Vercel no longer has a cron entry for `/api/cron/google-sheets-sync`.
2. Apply the cleanup migration and verify `cron.job` no longer has `google-sheets-inventory-daily`.
3. Delete the deployed Supabase Edge Function `sync-google-sheets-inventory` or verify it is unreachable.
4. Optionally drop `public.google_sheets_config` after confirming no production admin workflow references it.
