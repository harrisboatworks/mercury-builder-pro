

## Complete Motor Options Cleanup + New Tow N Stow Covers

### Task 1: Update MSRP for 15 existing records

Set CAD MSRP values from your provided list. The `base_price` will also be updated to match for records where it's currently null or inconsistent.

| Part Number | Name | MSRP (CAD) |
|---|---|---|
| 8M0151469 | 100-Hour Service Kit (Under 25HP) | $95.12 |
| 8M0232733 | 100-Hour Service Kit (40-60HP) | $74.71 |
| 8M0097854 | 100-Hour Service Kit (75-115HP) | $53.15 |
| 8M0094232 | 100-Hour Service Kit (150HP) | $64.22 |
| 8M0149929 | 100-Hour Service Kit (175-300HP) | $128.17 |
| 8M0090559 | 300-Hour Service Kit (40-60HP) | $331.73 |
| 8M0097855 | 300-Hour Service Kit (75-115HP) | $463.22 |
| 8M0094233 | 300-Hour Service Kit (150HP) | $527.95 |
| 8M0149930 | 300-Hour Service Kit (175-225HP) | $507.61 |
| 8M0149931 | 300-Hour Service Kit (250-300HP) | $569.07 |
| 8M0081916 | Oil Change Kit (40-60HP) | $89.78 |
| 8M0107510 | Oil Change Kit (75-115HP) | $132.53 |
| 8M0188357 | Oil Change Kit (150HP) | $141.09 |
| 8M0187621 | Oil Change Kit (175-225HP) | $165.49 |
| 8M0173128 | SmartCraft Connect Mobile | $326.81 |

**Note on 8M0187622 (Oil Change Kit 250-300HP):** Your lookup returned "LANYARD - $3.13" which is clearly a mismatch. This record will be skipped until you can confirm the correct CAD MSRP for the 250-300HP Oil Change Kit.

---

### Task 2: Create 7 new Tow N Stow cover records

These are a new cover category -- storage/trailering covers (distinct from the vented running covers already in the system). Images are already saved locally. New records will be created in `motor_options` with category `accessory`.

| Part Number | Name | MSRP | Image |
|---|---|---|---|
| 8M0221490 | Tow N Stow Cover (40-60HP FourStroke) | $303.37 | 8M0221490.jpeg |
| 8M0221491 | Tow N Stow Cover (75-115HP FourStroke) | $324.35 | 8M0221491.jpeg |
| 8M0221492 | Tow N Stow Cover (150HP FourStroke) | $350.06 | 8M0221492.jpeg |
| 8M0221494 | Tow N Stow Cover (225-400HP Verado) | $443.05 | 8M0221494.jpeg |
| 8M0221495 | Tow N Stow Cover (175-225HP FourStroke) | $490.88 | 8M0221495.jpeg |
| 8M0221496 | Tow N Stow Cover (200-300HP FourStroke) | $510.83 | 8M0221496.webp |
| 8M0221499 | Tow N Stow Cover (200-300HP Pro XS) | $529.56 | 8M0221499.jpeg |

Each will have `msrp` and `base_price` set to the MSRP value, `is_active = true`, `is_taxable = true`, and `image_url` pointing to the already-saved local file.

---

### Task 3: Localize 16 external images

Download images currently hosted on third-party sites and save them to `public/images/options/`, then update `image_url` in the database. This covers fuel tanks, SmartCraft, service kits, and oil change kits that still reference Scepter, Crowley Marine, Energy Power Sports, or Supabase storage URLs.

---

### Task 4: Delete 5 inactive legacy records

Permanently remove these superseded records:

| Part Number | Name |
|---|---|
| ATT-10541 | Attwood Motor Cover (40-60HP) |
| 8M0104228 | Vented Splash Cover (75-115HP) |
| 8M0104229 | Vented Splash Cover (150HP) |
| 8M0104231 | Vented Splash Cover (175-225HP V6) |
| 8M0104232 | Vented Splash Cover (250-300HP V8) |

---

### Action needed from you

Please confirm the correct CAD MSRP for **8M0187622** (Oil Change Kit, 250-300HP). The Mercury site returned "LANYARD - $3.13" which is a different product.

---

### Steps
1. Update MSRP and base_price for 15 existing records via SQL
2. Insert 7 new Tow N Stow cover records with prices and local image paths
3. Fetch and save 16 external images to `public/images/options/`
4. Update 16 `image_url` values in the database to local paths
5. Delete 5 inactive legacy records
6. No code changes needed
