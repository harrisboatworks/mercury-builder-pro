

# Add Images for 115 Pro XS Command Thrust Motors

## What
Copy the two uploaded product photos into the project and update the database records for both 115 Pro XS CT variants.

## Steps

1. **Copy images**
   - `user-uploads://115_elpt_ct_proxs.jpg` → `public/images/motors/115-elpt-ct-proxs.jpg`
   - `user-uploads://115_exlpt_ct_proxs.jpg` → `public/images/motors/115-exlpt-ct-proxs.jpg`

2. **Update database** — Set `image_url` on both motors

```sql
UPDATE motor_models
SET image_url = '/images/motors/115-elpt-ct-proxs.jpg', updated_at = now()
WHERE model_number = '1117F531D';

UPDATE motor_models
SET image_url = '/images/motors/115-exlpt-ct-proxs.jpg', updated_at = now()
WHERE model_number = '1117F631D';
```

## Files Changed
| File | Change |
|------|--------|
| `public/images/motors/115-elpt-ct-proxs.jpg` | Copy uploaded image |
| `public/images/motors/115-exlpt-ct-proxs.jpg` | Copy uploaded image |
| Database | UPDATE `image_url` for models `1117F531D` and `1117F631D` |

