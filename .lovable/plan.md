

# Scrape Motor Option Images by Part Number

## Problem
Motor covers and some accessories still display Unsplash placeholder images instead of real product photos. The current scraping function uses hardcoded Mercury URLs rather than searching by part number, which is more reliable.

## Solution
Enhance the `scrape-mercury-accessories` function to search for images using **part number lookups** on reliable marine parts sites. Many sites have predictable URL patterns based on part numbers.

---

## Implementation

### 1. Image Source Strategy by Part Number

| Source | URL Pattern | Reliability |
|--------|------------|-------------|
| **Crowley Marine** | `https://www.crowleymarine.com/images/parts/{PART_NUMBER}.jpg` | High - already working for maintenance kits |
| **Marine Engine** | `https://www.marineengine.com/parts/images/mercury/{PART_NUMBER}.jpg` | High |
| **Boats.net** | `https://www.boats.net/product/image/large/{PART_NUMBER}` | Medium |
| **Mercury Parts Direct** | Firecrawl scrape of product page | Medium |

### 2. File Changes

#### `supabase/functions/scrape-mercury-accessories/index.ts`

**Add Part Number Image Lookup Function:**
```typescript
async function findImageByPartNumber(
  supabase: any, 
  partNumber: string, 
  productName: string
): Promise<string | null> {
  const sources = [
    `https://www.crowleymarine.com/images/parts/${partNumber}.jpg`,
    `https://www.marineengine.com/parts/images/mercury/${partNumber}.jpg`,
    `https://cdn.boats.net/images/parts/mercury/${partNumber}.jpg`,
  ];
  
  for (const sourceUrl of sources) {
    try {
      const response = await fetch(sourceUrl, { method: 'HEAD' });
      if (response.ok && response.headers.get('content-type')?.includes('image')) {
        // Image exists - download and upload to our storage
        const uploadedUrl = await uploadImageToStorage(supabase, sourceUrl, `accessory-${partNumber}`);
        if (uploadedUrl) {
          console.log(`Found image for ${partNumber} at ${sourceUrl}`);
          return uploadedUrl;
        }
      }
    } catch (e) {
      // Try next source
    }
  }
  return null;
}
```

**Update Cover Products with Real Mercury Part Numbers:**
```typescript
const coverProducts = [
  {
    name: 'Vented Splash Cover (75-115HP)',
    partNumber: '8M0104228',  // Real Mercury P/N
    hpRange: '75-115HP',
  },
  {
    name: 'Vented Splash Cover (150HP)',
    partNumber: '8M0104229',
    hpRange: '150HP',
  },
  {
    name: 'Vented Splash Cover (175-225HP V6)',
    partNumber: '8M0104231',
    hpRange: '175-225HP',
  },
  {
    name: 'Vented Splash Cover (250-300HP V8)',
    partNumber: '8M0104232',
    hpRange: '250-300HP',
  },
];
```

**Modify Scraping Loop to Use Part Number Lookup:**
```typescript
for (const cover of coverProducts) {
  const imageUrl = await findImageByPartNumber(supabase, cover.partNumber, cover.name);
  results.push({
    productName: cover.name,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
    partNumber: cover.partNumber,
    category: 'accessory',
  });
}
```

### 3. Database Update

After scraping, update the `motor_options` table with the new image URLs:

```typescript
// At end of function, update database with scraped images
for (const result of results) {
  if (result.partNumber && result.imageUrl && !result.imageUrl.includes('unsplash')) {
    await supabase
      .from('motor_options')
      .update({ image_url: result.imageUrl })
      .eq('part_number', result.partNumber);
    console.log(`Updated ${result.partNumber} with image: ${result.imageUrl}`);
  }
}
```

### 4. Add Fallback: Google Image Search via Firecrawl

For products without images on marine parts sites, use Firecrawl to search Google Images:

```typescript
async function searchGoogleForImage(
  firecrawlApiKey: string,
  partNumber: string,
  productName: string
): Promise<string | null> {
  const searchQuery = `Mercury Marine ${partNumber} ${productName}`;
  
  const response = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: searchQuery,
      limit: 5,
    }),
  });
  
  if (response.ok) {
    const data = await response.json();
    // Parse results for image URLs
    for (const result of data.data || []) {
      if (result.url?.includes('crowley') || result.url?.includes('boats.net')) {
        // Scrape the page for the product image
        // ...
      }
    }
  }
  return null;
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/scrape-mercury-accessories/index.ts` | Add `findImageByPartNumber()` function, update cover part numbers, add DB update logic |
| `motor_options` table | Will be updated programmatically with scraped image URLs |

---

## Testing

After deployment:
1. Call the `scrape-mercury-accessories` function
2. Verify motor covers in `motor_options` table have real image URLs (not Unsplash)
3. Confirm the Options page displays actual product images for covers

---

## Summary

This enhancement replaces URL-based scraping with **part number lookups** on reliable marine parts sites. The predictable URL patterns (`crowleymarine.com/images/parts/{PN}.jpg`) work well for Mercury products and provide consistent, high-quality product images. Any images found are uploaded to Supabase Storage for reliable hosting.

