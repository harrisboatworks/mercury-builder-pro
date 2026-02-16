

## Add Mercury Vented Running/Splash Covers as Motor Options

### Summary
Replace the 5 existing generic covers with 15 new model-specific Mercury vented covers from the document. Each cover targets a specific HP and motor family (FourStroke vs Pro XS), using the existing rule-based conditions system.

### Existing Covers to Deactivate
These 5 broad-range covers will be marked inactive since they're being replaced by precise OEM covers:
- Attwood Motor Cover (40-60HP)
- Vented Splash Cover (75-115HP)
- Vented Splash Cover (150HP)
- Vented Splash Cover (175-225HP V6)
- Vented Splash Cover (250-300HP V8)

### New Covers to Add (15 total)
Each gets a `motor_options` record and a `motor_option_rules` record with HP and family conditions.

| Part Number | Name | HP | Family Filter | MSRP |
|---|---|---|---|---|
| 8M0228502 | Vented Cover - 40HP FourStroke | 40 | FourStroke | $292.84 |
| 8M0228507 | Vented Cover - 90HP FourStroke | 90 | FourStroke | $312.54 |
| 8M0228509 | Vented Cover - 115HP FourStroke | 115 | FourStroke | $312.54 |
| 8M0228530 | Vented Cover - 115HP Pro XS | 115 | ProXS | $365.57 |
| 8M0228531 | Vented Cover - 150HP Pro XS | 150 | ProXS | $401.62 |
| 8M0228532 | Vented Cover - 175HP Pro XS | 175 | ProXS | $461.09 |
| 8M0228511 | Vented Cover - 200HP V6 FourStroke | 200 | FourStroke | $335.20 |
| 8M0228533 | Vented Cover - 200HP Pro XS | 200 | ProXS | $456.82 |
| 8M0228512 | Vented Cover - 225HP V6 FourStroke | 225 | FourStroke | $338.55 |
| 8M0228534 | Vented Cover - 225HP Pro XS | 225 | ProXS | $461.41 |
| 8M0228521 | Vented Cover - 250HP FourStroke | 250 | FourStroke | $401.42 |
| 8M0228535 | Vented Cover - 250HP Pro XS | 250 | ProXS | $489.35 |
| 8M0228517 | Vented Cover - 300HP FourStroke | 300 | FourStroke | $386.42 |
| 8M0228536 | Vented Cover - 300HP Pro XS | 300 | ProXS | $494.27 |
| 8M0228522 | Vented Cover - 300HP V8 FourStroke | 300 | FourStroke | $401.42 |

### Covers NOT Added (no matching motors in catalog)
- 8M0228506 - 80HP (no 80HP motors)
- 8M0228508 - 100HP (no 100HP motors)
- 8M0228516 - 275HP Verado (no 275HP motors)
- 8M0228524 - 350HP V10 (no 350HP motors)

### 300HP FourStroke Note
There are two 300HP FourStroke covers in the document: L6 Verado (8M0228517, $386.42) and V8 (8M0228522, $401.42). The rule system cannot distinguish these by engine displacement. Since all 300HP FourStroke models in your catalog appear to be the V8 platform, I will assign 8M0228522 (V8) to 300HP FourStroke motors. I will still create 8M0228517 as a record but won't create a rule for it unless you want both shown. Let me know if you'd prefer a different approach.

### Images
You mentioned you'll upload images in the next message with part numbers as filenames. Once received, each image will be saved to `public/images/options/{part_number}.jpg` and the `image_url` field updated accordingly.

### Rule Conditions
Each rule uses the existing conditions format:
```json
{"hp_min": 200, "hp_max": 200, "motor_family": "ProXS"}
```
All assigned as `assignment_type: "available"`.

### What Changes
- **Database**: 15 new rows in `motor_options`, 14-15 new rows in `motor_option_rules`, 5 existing covers set to `is_active = false`
- **Images**: Up to 15 image files copied to `public/images/options/`
- **Code**: No code changes needed -- the existing rule engine handles everything

### Steps
1. Deactivate the 5 existing generic cover options and their rules
2. Insert 15 new `motor_options` records with part numbers, prices, category "accessory"
3. Insert matching `motor_option_rules` records with HP and family conditions
4. Wait for image uploads, then copy images and update `image_url` fields
