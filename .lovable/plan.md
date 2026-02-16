

## Fix 7 Missing Option Images via Firecrawl

### Problem
7 motor option records still point to dead external URLs (Crowley Marine and Energy Power Sports are returning 404s). These are service kits and oil change kits that need local images.

### Approach
Use Firecrawl's scrape API with screenshot format to capture product images from Mercury's parts pages, then download and save them locally.

### Step 1: Link Firecrawl connector
The Firecrawl connector exists in your workspace but isn't linked to this project. We'll connect it so edge functions can use the API key.

### Step 2: Create a new edge function `fetch-part-images`
A simple edge function that:
1. Takes an array of part numbers
2. For each part number, calls Firecrawl's scrape API on Mercury's parts lookup page (or a dealer site like `mercuryparts.com/part/{partNumber}`) to extract product images
3. Returns the image URLs found

### Step 3: Download images and update DB
For each of the 7 parts, download the found image to `public/images/options/{partNumber}.jpg` and update the `image_url` in the database.

### Parts needing images

| Part Number | Name |
|---|---|
| 8M0094233 | 300-Hour Service Kit (150HP) |
| 8M0149930 | 300-Hour Service Kit (175-225HP) |
| 8M0149931 | 300-Hour Service Kit (250-300HP) |
| 8M0107510 | Oil Change Kit (75-115HP) |
| 8M0188357 | Oil Change Kit (150HP) |
| 8M0187621 | Oil Change Kit (175-225HP) |
| 8M0187622 | Oil Change Kit (250-300HP) |

### Technical details

**Edge function** (`fetch-part-images/index.ts`):
- Uses Firecrawl scrape API to hit Mercury's parts page for each part number
- URL pattern: `https://www.mercuryparts.com/part/{partNumber}` or fallback to Google image search via Firecrawl search
- Extracts image URLs from the scraped page content
- Returns downloadable image URLs

**Scrape strategy** (in priority order):
1. Try `mercurymarine.com` product pages with Firecrawl scrape + `links` format to find image URLs
2. Fallback: Use Firecrawl `search` to find `"{partNumber}" mercury service kit image` and extract image URLs from results
3. Fallback: Use Firecrawl scrape with `screenshot` format on any found product page

**After images are found:**
- Download each to `public/images/options/{partNumber}.jpg`
- Run a single SQL migration to update all 7 `image_url` values to local paths

### Steps
1. Connect Firecrawl connector to project
2. Create `fetch-part-images` edge function
3. Deploy and call the function for all 7 part numbers
4. Download returned images to `public/images/options/`
5. Update database `image_url` for all 7 records
6. Verify all motor_options now use local images

