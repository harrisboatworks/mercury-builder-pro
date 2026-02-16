

## Save Remaining Vented Cover Images + New Cover Type Images

### Part 1: Save 3 remaining vented cover images

These 3 images complete the vented cover set from the original document:

| Part Number | Description | File |
|---|---|---|
| 8M0228522 | 300HP Vented Cover Black (V8 FourStroke) | 8M0228522.jpeg |
| 8M0228535 | 250HP Pro XS Vented Cover | 8M0228535.jpeg |
| 8M0228536 | 300HP Pro XS Vented Cover | 8M0228536.jpeg |

Each will be copied to `public/images/options/` and the `image_url` updated in the database.

**Still missing** (no images uploaded): 8M0228521 (250HP FourStroke) and 8M0228517 (300HP L6 Verado). These records exist but will remain without images until uploaded.

### Part 2: Save 7 new cover images for later use

The following 7 images have part numbers NOT in the vented covers document (8M022149x series). These appear to be a different product line (possibly storage or trailering covers). I will save the images to the project now so they're ready, but I won't create database records until you provide the details (name, price, HP/motor fit) for each:

| Part Number | File |
|---|---|
| 8M0221490 | 8M0221490.jpeg |
| 8M0221491 | 8M0221491.jpeg |
| 8M0221492 | 8M0221492.jpeg |
| 8M0221494 | 8M0221494.jpeg |
| 8M0221495 | 8M0221495.jpeg |
| 8M0221496 | 8M0221496.webp |
| 8M0221499 | 8M0221499.jpeg |

### What you'll need to provide next

For the 8M022149x covers, please share:
- The cover type name (e.g. "Storage Cover", "Trailering Cover")
- MSRP for each part number
- Which HP and motor family each one fits

This can be a document, list, or just typed out -- whatever is easiest.

### Steps
1. Copy all 10 images to `public/images/options/`
2. Update `image_url` in `motor_options` for the 3 vented covers (8M0228522, 8M0228535, 8M0228536)
3. No database records created for 8M022149x covers until details are provided
4. No code changes needed

