

# Add Image for 90 ELPT Command Thrust Motor

## What
Copy the uploaded 90 CT product photo into the project's public images directory, then update the database record for the 90 ELPT CT motor with the image path.

## Steps

1. **Copy image** — `user-uploads://90_CT.jpg` → `public/images/motors/90-elpt-ct-fourstroke.jpg`
2. **Update database** — Set `image_url` on the motor with model_number `1F904532D`

```sql
UPDATE motor_models
SET image_url = '/images/motors/90-elpt-ct-fourstroke.jpg', updated_at = now()
WHERE model_number = '1F904532D';
```

## Files Changed
| File | Change |
|------|--------|
| `public/images/motors/90-elpt-ct-fourstroke.jpg` | Copy uploaded image |
| Database | UPDATE `image_url` for model `1F904532D` |

