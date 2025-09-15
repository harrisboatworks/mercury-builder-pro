# DealerSpike XML Integration for Mercury Outboard Motors

## Overview
The scraper now prioritizes DealerSpike XML feed for inventory discovery, with fallback to enhanced page scraping.

## Filters Applied
Only records that meet ALL criteria are processed:
1. **Mercury Brand**: Must be Mercury branded
2. **New Condition**: Excludes used/pre-owned inventory
3. **Outboard Motors**: Filters out boats, trailers, PWCs, parts, and accessories

## Manual Testing Commands

### Discovery Mode (XML first, pages fallback)
```bash
curl -s -X POST \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/scrape-inventory-v2 \
  -d '{"mode":"discovery"}'
```

### Full Run (Small Batch - Gentle)
```bash
curl -s -X POST \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/scrape-inventory-v2 \
  -d '{"mode":"full","batch_size":12,"concurrency":3}'
```

### Full Run (Production Settings)
```bash
curl -s -X POST \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/scrape-inventory-v2 \
  -d '{"mode":"full","batch_size":20,"concurrency":4}'
```

## Expected Log Output

**XML Success:**
- `"XML feed: X total, Y after filters, Z unique URLs."`
- `"✅ Using XML feed URLs: Z"`
- Response includes `"source": "xml"`

**XML Fallback:**
- `"XML feed empty or blocked. Falling back to enhanced page discovery..."`
- Response includes `"source": "pages"`

**Final Filter:**
- `"Filter: X/Y records kept (new Mercury outboards only)."`

## Cron Schedule
Automated runs at 5AM daily with production settings:
- Payload: `{"mode":"full","batch_size":20,"concurrency":4}`
- Schedule: `0 5 * * *`

## Environment Variables
Required:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` 
- `FIRECRAWL_API_KEY`