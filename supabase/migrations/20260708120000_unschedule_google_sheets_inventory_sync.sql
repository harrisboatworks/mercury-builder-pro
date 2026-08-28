-- Step C Google Sheets inventory deprecation cleanup.
-- Keep historical migrations intact, but ensure the retired cron is absent after
-- current migrations are applied.
DO $$
BEGIN
  IF to_regclass('cron.job') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM cron.job
      WHERE jobname = 'google-sheets-inventory-daily'
    )
  THEN
    PERFORM cron.unschedule('google-sheets-inventory-daily');
  END IF;
END $$;
