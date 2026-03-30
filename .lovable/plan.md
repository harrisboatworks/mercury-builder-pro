

# Add Image to 40 ELPT Command Thrust Motor

## Problem
The newly inserted 40 ELPT CT motor has no image — `image_url`, `hero_image_url`, and `images` are all empty.

## Fix
Run a data UPDATE (via insert tool) to set `image_url` to the full-size extracted URL from the ThumbGenerator link you provided.

### SQL
```sql
UPDATE motor_models
SET
  image_url = 'https://cdnmedia.endeavorsuite.com/images/organizations/873ce1ca-42a6-40ae-ac55-07757f842998/inventory/13620828/530b8e2f6515c10900e91883-large.jpg',
  updated_at = now()
WHERE model_number = '1F41453GZ';
```

Single data update — no migration needed.

