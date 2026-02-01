

# Enhance Options Page: Pre-Selection Logic, Images, and Motor Covers

## Overview
Three enhancements to the Options page based on your feedback:

1. **Fix Pre-Selection Logic**: Only pre-select items that are truly "included" (like the 12L fuel tank) - NOT all recommended items
2. **Add Images for All Options**: Scrape higher-quality, product-specific images for 100-hour kits, 300-hour kits, and oil change kits
3. **Add Motor Covers**: New category of Mercury motor covers (Tow-n-Stow and Vented Splash covers) with images

---

## Change 1: Fix Pre-Selection Logic

### Current Behavior (Problem)
Currently in `OptionsPage.tsx` lines 73-74:
```javascript
// Include recommended options by default  <-- THIS IS THE PROBLEM
categorizedOptions.recommended.forEach(opt => initialIds.add(opt.id));
```

This pre-selects ALL recommended items (like SmartCraft Connect Mobile) regardless of whether they're actually included in the price.

### New Behavior
Only pre-select options that are:
- **Required** (assignment_type = 'required')
- **Included in price** (is_included = true, like the 12L fuel tank)
- **Previously selected** (when returning to the page)

### Code Change
Update `OptionsPage.tsx` initialization logic:
```javascript
useEffect(() => {
  if (categorizedOptions) {
    const initialIds = new Set<string>();
    
    // Always include required options
    categorizedOptions.required.forEach(opt => initialIds.add(opt.id));
    
    // Include previously selected options
    state.selectedOptions?.forEach(opt => initialIds.add(opt.optionId));
    
    // ONLY pre-select recommended items that are INCLUDED in price
    categorizedOptions.recommended.forEach(opt => {
      if (opt.is_included) {
        initialIds.add(opt.id);
      }
    });
    
    setLocalSelectedIds(initialIds);
  }
}, [categorizedOptions, state.selectedOptions]);
```

---

## Change 2: Add Product-Specific Images

### Current State
All maintenance kits use the same generic image: `maintenance-kit-generic.jpg`

### Enhancement
Scrape individual product images from Mercury's product pages for:

| Product Type | Source | Images Needed |
|--------------|--------|---------------|
| 100-Hour Service Kits | Mercury parts catalog | 5 unique images |
| 300-Hour Service Kits | Mercury maintenance page | 5 unique images |
| Oil Change Kits | Mercury oil change kits page | 5 unique images |

### Implementation
1. **Update Edge Function**: Enhance `scrape-mercury-accessories` to scrape specific product pages:
   - `https://www.mercurymarine.com/us/en/product/mercury-8m0097854-21l-4-cyl-100-hour-maintenance-kit` (example)
   - Oil change kits: `https://www.mercurymarine.com/ca/en/category/parts-and-maintenance/oils-and-lubricants/oil-change-kits`

2. **Upload Unique Images**: Store each kit with its own image file:
   - `accessories/100hr-kit-75-115hp.jpg`
   - `accessories/300hr-kit-v6.jpg`
   - `accessories/oil-kit-2.1l.jpg`

3. **Update Database**: SQL to update `motor_options.image_url` for each product

---

## Change 3: Add Motor Covers

### Products to Add
Based on Mercury's product line:

| Cover Type | HP Range | Est. Price | Part # | Category |
|------------|----------|------------|--------|----------|
| Tow-n-Stow Cover | 40-60HP | $85 | TBD | accessory |
| Tow-n-Stow Cover | 75-115HP | $95 | TBD | accessory |
| Tow-n-Stow Cover | 150HP | $105 | TBD | accessory |
| Tow-n-Stow Cover | 175-225HP V6 | $120 | TBD | accessory |
| Tow-n-Stow Cover | 250-300HP V8 | $140 | TBD | accessory |
| Vented Splash Cover | 75-115HP | $75 | TBD | accessory |
| Vented Splash Cover | 150HP+ | $95 | TBD | accessory |

### Implementation
1. **Scrape Motor Cover Images**: Add to edge function to scrape from:
   - `https://www.mercurymarine.com/us/en/product/mercury-vented-splash-cover`
   - Mercury Dockstore accessory pages

2. **Database Migration**: Insert motor cover products with:
   - Category: `accessory` (so they display in visual grid)
   - Features: ["UV-resistant", "Marine-grade material", "Custom fit", "Easy install"]
   - Image URLs from scraper

3. **HP-Based Rules**: Create rules in `motor_option_rules` to show appropriate covers based on motor HP:
   - 40-60HP motors see 40-60HP covers
   - 75-115HP motors see 75-115HP covers
   - etc.

---

## File Changes Summary

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/quote/OptionsPage.tsx` | Update pre-selection logic to only select `is_included` items |
| `supabase/functions/scrape-mercury-accessories/index.ts` | Add motor covers scraping, improve kit-specific image scraping |

### Database Migrations

| Table | Action |
|-------|--------|
| `motor_options` | Insert 5-7 motor cover products |
| `motor_options` | Update image_url for existing maintenance kits |
| `motor_option_rules` | Insert HP-based rules for motor covers |

---

## Visual Result

### Before
- SmartCraft Connect Mobile: Pre-selected (wrong)
- All maintenance kits: Same generic image

### After
- SmartCraft Connect Mobile: NOT pre-selected (user chooses)
- 12L Fuel Tank (if included): Pre-selected (correct)
- Maintenance kits: Each has its own product image
- Motor covers: New visual cards in the grid with product images

---

## Technical Details

### Pre-Selection Logic Change
Location: `src/pages/quote/OptionsPage.tsx` lines 62-78

```text
BEFORE:
- Required options → pre-selected
- Previously selected → pre-selected  
- ALL recommended options → pre-selected (WRONG)

AFTER:
- Required options → pre-selected
- Previously selected → pre-selected
- Recommended options ONLY if is_included=true → pre-selected
```

### Image Scraping Enhancement
The edge function will be enhanced to:
1. Scrape individual product pages for high-res images
2. Upload each product's image with a unique filename
3. Update the database with new image URLs

### Motor Covers Data
New category of products with:
- `category: 'accessory'` → displays in visual grid (since they have images)
- HP-based filtering rules → only show relevant covers for selected motor
- `assignment_type: 'available'` → shown in Available Options section

