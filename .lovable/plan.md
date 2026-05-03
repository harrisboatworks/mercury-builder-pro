# Remove white halo around motor images

The motor PNGs have a baked-in white background that clashes with the cream card. Fix by blending the image into the cream surface.

## Change

**`src/components/motors/MotorCardPreview.tsx`** (line 489):

Add `mix-blend-multiply` to the motor `<img>` className so its white background drops out and the cream shows through:

```tsx
className={`max-h-full max-w-full object-contain mix-blend-multiply transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${!inStock ? 'grayscale-[0.5]' : ''}`}
```

This is a one-line fix. `mix-blend-multiply` is the standard CSS technique for knocking out white product-photo backgrounds against a non-white surface — black/dark motor parts stay intact, white pixels disappear into the cream.

If any image still shows a faint edge, fallback is to swap to white card body instead, but blend should handle it cleanly.
