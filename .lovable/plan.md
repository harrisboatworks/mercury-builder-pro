

# Add Image for 50 ELPT Command Thrust Motor

## What
Copy the uploaded 50 CT product photo into the project and update the database record.

## Steps

1. **Copy image** — `user-uploads://50_elpt_ct.jpg` → `public/images/motors/50-elpt-ct-fourstroke.jpg`
2. **Update database** — Set `image_url` on model `1F51453GZ`

```sql
UPDATE motor_models
SET image_url = '/images/motors/50-elpt-ct-fourstroke.jpg', updated_at = now()
WHERE model_number = '1F51453GZ';
```

## Files Changed
| File | Change |
|------|--------|
| `public/images/motors/50-elpt-ct-fourstroke.jpg` | Copy uploaded image |
| Database | UPDATE `image_url` for model `1F51453GZ` |

