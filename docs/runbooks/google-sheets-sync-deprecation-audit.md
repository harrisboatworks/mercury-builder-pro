# Audit: Google Sheets Inventory Sync — Deprecate in Favor of Lightspeed

**Status:** Audit only. No changes executed. Awaiting approval.
**Date:** 2026-05-01
**Trigger:** Jay confirmed Lightspeed is now the source of truth for inventory.

---

## TL;DR

The `google-sheets-inventory-daily` cron job is **actively conflicting** with the Lightspeed inventory sync and should be **disabled** (recommended) or **removed**. Concrete evidence below.

**Recommendation: Disable (not drop) the cron job, and disable `auto_sync_enabled` in `google_sheets_config`. Keep the Edge Function deployed for a 30-day grace period in case manual re-enable is needed, then delete.**

---

## Findings

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

### 3. Sync log evidence — Lightspeed is the only one keeping pace

Last 15 entries in `sync_logs`:
- 15 `lightspeed` runs, daily through 2026-05-01, processing 25–28 motors.
- 0 `google_sheets` runs in the recent window.

`google_sheets_config.last_sync` = **2026-04-07 06:00 UTC** (~24 days ago), yet `auto_sync_enabled = true` and the cron is `active = true`. This strongly suggests recent Sheets runs have been failing silently or short-circuiting (likely the config row fetch / CSV fetch returning HTML), but the cron job is still firing and **the destructive reset still runs before the early-return paths in some branches**.

Either way: the job is unmaintained, the data source is no longer authoritative, and it can resume corrupting `motor_models` the moment the sheet/config is touched.

### 4. Catalog visibility risk

Per memory `inventory/catalog-visibility-overrides`, certain models (e.g. 115 ELPT/EXLPT) are force-visible. The Sheets reset specifically excludes only `availability='Exclude'` — it does **not** respect the visibility-override list, so the 06:00 UTC reset can still flip force-visible models out of stock until the next Lightspeed run 22 hours later.

### 5. Cron auth status (post-hardening)

`google-sheets-inventory-daily` is one of the 7 service-role jobs already migrated to `x-internal-secret` in today's pre-migration rewrite. Disabling it does **not** affect the JWT migration plan.

---

## Recommended Action (NOT YET EXECUTED)

Two-step soft deprecation. Both steps are reversible.

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

### Step C (later, after 30-day grace period) — Hard removal

```sql
-- Only after Jay confirms no rollback needed.
SELECT cron.unschedule(33);
-- Delete the Edge Function via supabase--delete_edge_functions(['sync-google-sheets-inventory'])
-- Optionally: DROP TABLE public.google_sheets_config;
```

The `api/cron/google-sheets-sync.ts` Vercel route should also be removed in Step C — it's a redundant external trigger that points at the same Edge Function.

---

## What I did NOT do

- Did **not** disable the cron job.
- Did **not** flip `auto_sync_enabled`.
- Did **not** delete the Edge Function.
- Did **not** remove `api/cron/google-sheets-sync.ts`.
- Did **not** change `motor_models` data.

## Open questions for Jay

1. **Approve Step A + Step B now?** (recommended — stops the 06:00 UTC overwrite as soon as tonight)
2. **Keep the AdminStockSync UI button** that manually triggers the Sheets sync, or hide it? (currently surfaces in `src/pages/AdminStockSync.tsx`)
3. **Grace period length** — 30 days before Step C, or shorter?
