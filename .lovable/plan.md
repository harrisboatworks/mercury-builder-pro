# Match motor image background to card

Change the motor card image area background from the cream gradient (`#F5F1EA → #ECE4D2`) to plain white, matching the card body.

## Change

**`src/components/motors/MotorCardPreview.tsx`** (~line 476):

Replace:
```tsx
<div
  className="relative aspect-[4/3] overflow-hidden"
  style={{ background: 'linear-gradient(135deg, #F5F1EA 0%, #ECE4D2 100%)' }}
>
```

With:
```tsx
<div className="relative aspect-[4/3] overflow-hidden bg-white">
```

Also update the shimmer placeholder inside (currently `bg-repower-cream`) → `bg-repower-paper` so the loading state blends with the page rather than fighting the white card.

That's it — single visual swap, no other changes.
