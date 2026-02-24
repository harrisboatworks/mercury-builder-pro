

# Replace Placeholder Steering Images with Real Product Photos

## What's Changing

Replace the two Unsplash stock photos for steering options with the real product images you provided:

| Option | New Image |
|--------|-----------|
| Cable Steering | Safe-T QC Rotary Steering System |
| Hydraulic Steering | SeaStar Pro Hydraulic Steering Kit |

## Technical Details

### 1. Copy uploaded images to `public/images/options/`

- `public/images/options/cable-steering.jpg` (from Cable_Steering.jpg)
- `public/images/options/hydraulic-steering.jpg` (from Hydraulic_Steering.jpg)

### 2. Update `src/config/visualChoices.ts`

Replace the Unsplash URLs in `steeringChoices`:

- Cable: `"/images/options/cable-steering.jpg"`
- Hydraulic: `"/images/options/hydraulic-steering.jpg"`

