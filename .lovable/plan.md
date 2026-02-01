

# Add Mercury Products with Images to Database

## Overview
You're right - I created the UI components but haven't added the actual products to the database yet. We need to:
1. Create a new edge function to scrape images from Mercury's SmartCraft and Maintenance Kit pages
2. Add the 17 Mercury products to `motor_options` with their scraped images
3. Create the HP-based rules in `motor_option_rules`

---

## Implementation Steps

### Step 1: Create Edge Function to Scrape Mercury Accessory Images

Create a new edge function `scrape-mercury-accessories` that uses the existing Firecrawl integration to:

- Scrape the SmartCraft Connect Mobile page: `https://www.mercurymarine.com/us/en/gauges-and-controls/smartcraft/smartcraft-connect-mobile`
- Scrape the Maintenance Kits page: `https://www.mercurymarine.com/ca/en/parts-and-service/parts-and-lubricants/maintenance-kits`
- Extract product images and upload them to Supabase Storage
- Return the public URLs for each product

**Technical approach:**
```text
1. Use Firecrawl v1/scrape with formats: ['markdown', 'html', 'links']
2. Extract image URLs using regex patterns for Mercury CDN
3. Download best images and upload to 'motor-images' bucket
4. Return mapping of product name -> image URL
```

### Step 2: Create SQL Migration for Motor Options

Insert 17 products into `motor_options` table:

| Category | Name | Part # | Price | Image |
|----------|------|--------|-------|-------|
| electronics | SmartCraft Connect Mobile | 8M0173128 | $325 | (scraped) |
| maintenance | 100-Hour Service Kit (Under 25HP) | 8M0151469 | $95 | (scraped or placeholder) |
| maintenance | 100-Hour Service Kit (40-60HP) | 8M0232733 | $80 | (scraped or placeholder) |
| maintenance | 100-Hour Service Kit (75-115HP) | 8M0097854 | $55 | (scraped or placeholder) |
| maintenance | 100-Hour Service Kit (150HP) | 8M0094232 | $65 | (scraped or placeholder) |
| maintenance | 100-Hour Service Kit (175-300HP) | 8M0149929 | $105 | (scraped or placeholder) |
| maintenance | 300-Hour Service Kit (40-60HP) | 8M0090559 | $340 | (scraped or placeholder) |
| maintenance | 300-Hour Service Kit (75-115HP) | 8M0097855 | $440 | (scraped or placeholder) |
| maintenance | 300-Hour Service Kit (150HP) | 8M0094233 | $510 | (scraped or placeholder) |
| maintenance | 300-Hour Service Kit (175-225HP) | 8M0149930 | $500 | (scraped or placeholder) |
| maintenance | 300-Hour Service Kit (250-300HP) | 8M0149931 | $700 | (scraped or placeholder) |
| maintenance | Oil Change Kit (40-60HP) | 8M0081916 | $90 | (scraped or placeholder) |
| maintenance | Oil Change Kit (75-115HP) | 8M0107510 | $125 | (scraped or placeholder) |
| maintenance | Oil Change Kit (150HP) | 8M0188357 | $140 | (scraped or placeholder) |
| maintenance | Oil Change Kit (175-225HP) | 8M0187621 | $180 | (scraped or placeholder) |
| maintenance | Oil Change Kit (250-300HP) | 8M0187621 | $215 | (scraped or placeholder) |

Each product includes:
- `name`, `description`, `short_description`
- `category` (electronics or maintenance)
- `base_price`, `part_number`
- `image_url` (from scraper or placeholder)
- `features` (JSONB array)
- `is_active: true`, `is_taxable: true`

### Step 3: Create SQL Migration for Option Rules

Insert 17 rules into `motor_option_rules`:

| Product | Conditions | Assignment |
|---------|------------|------------|
| SmartCraft Connect Mobile | `{"hp_min": 8}` | recommended |
| 100-Hour Kit (Under 25HP) | `{"hp_min": 8, "hp_max": 24}` | available |
| 100-Hour Kit (40-60HP) | `{"hp_min": 40, "hp_max": 60}` | available |
| 100-Hour Kit (75-115HP) | `{"hp_min": 75, "hp_max": 115}` | available |
| 100-Hour Kit (150HP) | `{"hp_min": 150, "hp_max": 150}` | available |
| 100-Hour Kit (175-300HP) | `{"hp_min": 175, "hp_max": 300}` | available |
| 300-Hour Kit (40-60HP) | `{"hp_min": 40, "hp_max": 60}` | available |
| ... (same pattern for remaining kits) |

---

## File Changes

### New Files
| File | Purpose |
|------|---------|
| `supabase/functions/scrape-mercury-accessories/index.ts` | Scrape SmartCraft and maintenance kit images from Mercury |

### Database Migrations
| Migration | Purpose |
|-----------|---------|
| `add_mercury_accessories.sql` | Insert 17 products into motor_options |
| `add_mercury_accessory_rules.sql` | Insert 17 HP-based rules into motor_option_rules |

---

## Image Strategy

**For SmartCraft Connect Mobile:**
- Scrape from Mercury's official product page
- High priority - this is a visual "hero" item
- Will display in the premium grid layout

**For Maintenance Kits:**
- Scrape from Mercury's maintenance kits page
- These display in compact list format (not visual grid)
- Having images is nice-to-have for the details modal
- Can use placeholder if scraping is difficult

---

## Execution Order

1. **Create edge function** - `scrape-mercury-accessories` to fetch images
2. **Deploy and test** - Run the scraper to get image URLs
3. **Run SQL migration** - Insert products with scraped image URLs
4. **Run rules migration** - Create HP-based filtering rules
5. **Test end-to-end** - Verify products appear on Options page with images

