-- Remove redundant inventory sync cron jobs (replaced by firecrawl-inventory-agent-weekly)
SELECT cron.unschedule('daily-inventory-update');
SELECT cron.unschedule('daily-inventory-scrape');
SELECT cron.unschedule('daily-scrape-inventory-6am-et');
SELECT cron.unschedule('mercury-daily-inventory-sync');