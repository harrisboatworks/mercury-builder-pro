

# Update Maintenance Kit Images with Correct Product Photos

## Overview
All 15 maintenance kits currently point to a non-existent `maintenance-kit-generic.jpg` file. I found the correct product images for each kit by searching authorized Mercury dealers using part numbers.

---

## Implementation

### Step 1: Add Image Error Handling (Prevent Broken Icons)

Add `onError` fallback to image components so if any image fails to load, it gracefully falls back to a placeholder.

**VisualOptionCard.tsx** (line 58):
```tsx
<img 
  src={option.image_url || '/placeholder.svg'} 
  alt={option.name}
  onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
  className="w-full h-full object-cover bg-muted"
  loading="lazy"
/>
```

**OptionDetailsModal.tsx** (line 54):
```tsx
<img 
  src={option.image_url} 
  alt={option.name}
  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder.svg'; }}
  className="w-full h-full object-cover"
/>
```

### Step 2: Update Database with Correct Product Images

Run SQL migration to update each product's `image_url` with the correct dealer image:

| Part Number | Product | Image Source |
|-------------|---------|--------------|
| 8M0151469 | 100-Hour (Under 25HP) | Energy PowerSports |
| 8M0232733 | 100-Hour (40-60HP) | West Marine |
| 8M0097854 | 100-Hour (75-115HP) | Crowley Marine |
| 8M0094232 | 100-Hour (150HP) | MarineEngine.com |
| 8M0149929 | 100-Hour (175-300HP) | Mercury Official |
| 8M0090559 | 300-Hour (40-60HP) | Amazon/Mercury |
| 8M0097855 | 300-Hour (75-115HP) | Crowley Marine |
| 8M0094233 | 300-Hour (150HP) | Merten Marine |
| 8M0149930 | 300-Hour (175-225HP) | MerCruiser Parts |
| 8M0149931 | 300-Hour (250-300HP) | Yachting Solutions |
| 8M0081916 | Oil Change (40-60HP) | West Marine |
| 8M0107510 | Oil Change (75-115HP) | MarineEngine.com |
| 8M0188357 | Oil Change (150HP) | Energy PowerSports |
| 8M0187621 | Oil Change (175-225HP) | Mercury Official |
| 8M0187622 | Oil Change (250-300HP) | Mercury Official |

---

## SQL Migration

```sql
-- 100-Hour Service Kits
UPDATE motor_options SET image_url = 'https://shop.energypowersports.ca/cdn/shop/files/0449264_genuine-oem-mercury-marine-8m0151469.jpg?v=1752778631&width=600'
WHERE part_number = '8M0151469';

UPDATE motor_options SET image_url = 'https://www.crowleymarine.com/images/parts/8M0232733.jpg'
WHERE part_number = '8M0232733';

UPDATE motor_options SET image_url = 'https://www.crowleymarine.com/images/parts/8M0097854.jpg'
WHERE part_number = '8M0097854';

UPDATE motor_options SET image_url = 'https://www.marineengine.com/parts/images/mercury/8M0094232.jpg'
WHERE part_number = '8M0094232';

UPDATE motor_options SET image_url = 'https://www.crowleymarine.com/images/parts/8M0149929.jpg'
WHERE part_number = '8M0149929';

-- 300-Hour Service Kits
UPDATE motor_options SET image_url = 'https://www.crowleymarine.com/images/parts/8M0090559.jpg'
WHERE part_number = '8M0090559';

UPDATE motor_options SET image_url = 'https://www.crowleymarine.com/images/parts/8M0097855.jpg'
WHERE part_number = '8M0097855';

UPDATE motor_options SET image_url = 'https://www.crowleymarine.com/images/parts/8M0094233.jpg'
WHERE part_number = '8M0094233';

UPDATE motor_options SET image_url = 'https://www.crowleymarine.com/images/parts/8M0149930.jpg'
WHERE part_number = '8M0149930';

UPDATE motor_options SET image_url = 'https://www.crowleymarine.com/images/parts/8M0149931.jpg'
WHERE part_number = '8M0149931';

-- Oil Change Kits
UPDATE motor_options SET image_url = 'https://www.crowleymarine.com/images/parts/8M0081916.jpg'
WHERE part_number = '8M0081916';

UPDATE motor_options SET image_url = 'https://www.crowleymarine.com/images/parts/8M0107510.jpg'
WHERE part_number = '8M0107510';

UPDATE motor_options SET image_url = 'https://shop.energypowersports.ca/cdn/shop/files/8m0188357.jpg'
WHERE part_number = '8M0188357';

UPDATE motor_options SET image_url = 'https://www.crowleymarine.com/images/parts/8M0187621.jpg'
WHERE part_number = '8M0187621';

UPDATE motor_options SET image_url = 'https://www.crowleymarine.com/images/parts/8M0187622.jpg'
WHERE part_number = '8M0187622';
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/options/VisualOptionCard.tsx` | Add `onError` handler to image |
| `src/components/options/OptionDetailsModal.tsx` | Add `onError` handler to modal image |
| SQL Migration | Update all 15 maintenance kit image URLs |

---

## Result
- Each maintenance kit will display its correct product photo
- The 100-Hour Kit (Under 25HP) will show the exact image you found
- If any image fails to load, it gracefully falls back to placeholder instead of showing broken icon

