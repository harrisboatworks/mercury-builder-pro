

# Replace Placeholder Control Box Images with Real Mercury Photos

## What's Changing

The three control box options in the quote builder currently use generic Unsplash stock photos. You've provided actual Mercury product images to replace them:

| Option | Current Image | New Image |
|--------|--------------|-----------|
| Side-Mount Control | Unsplash stock photo | Mercury Side Mount Control Box |
| Binnacle Control | Unsplash stock photo | Mercury Binnacle Mount Control Box |
| DTS Digital Control | Unsplash stock photo | Mercury Panel Mount Control Box |

## Technical Details

### 1. Copy uploaded images to `public/images/options/`

This matches the existing pattern used for installation mount images. Files:
- `public/images/options/mercury-side-mount-control.png`
- `public/images/options/mercury-binnacle-control.jpeg`
- `public/images/options/mercury-panel-mount-control.jpeg`

### 2. Update `src/config/visualChoices.ts`

Replace the three Unsplash URLs in `controlChoices` with paths to the new local images:

```
// Line 7:  image: "/images/options/mercury-side-mount-control.png"
// Line 17: image: "/images/options/mercury-binnacle-control.jpeg"
// Line 27: image: "/images/options/mercury-panel-mount-control.jpeg"
```

No other files need to change -- the `OptionGallery` component already renders whatever `image` URL is in the config.

