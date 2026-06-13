## Goal
Embed your uploaded Mercury Boost MP4 in `/blog/mercury-boost-software-upgrade-eligibility-2026`, hosted from Lovable Assets CDN (not YouTube).

## Why a new component
`MercuryVideo.tsx` is YouTube-only (builds `youtube.com/embed/...` URLs from a `videoId`). For a self-hosted MP4 we need a native `<video>` element. Reusing/forking it keeps the click-to-load "facade" pattern so the MP4 (~several MB) doesn't hurt LCP.

## Changes

### 1. Upload the MP4 to Lovable Assets
Run once in build mode:
```bash
mkdir -p src/assets/video
lovable-assets create \
  --file /mnt/user-uploads/AQM6pHbspjy56XxqMjMj3L70GD9HmrYLEODPWCK-YPzq13aD9ecvm7vO_rYPUJ7md3_AN1EgRML_aWa6-kM-W619sxRH3SdTjaI4Q1nEvBDwXA.mp4 \
  --filename mercury-boost-demo.mp4 \
  > src/assets/video/mercury-boost-demo.mp4.asset.json
```
This writes a `.asset.json` pointer to the CDN; no binary lands in the repo.

### 2. New component: `src/components/blog/MercuryVideoFile.tsx`
- Props: `src: string`, `title: string`, `caption?: string`, `poster?: string`.
- Renders a 16:9 `<figure>` matching `MercuryVideo`'s styling.
- First paint: poster image (or solid black) + centered red play button — no video bytes fetched.
- On click: swaps in `<video controls autoPlay playsInline preload="metadata" src={src}>`.
- `loading="lazy"` semantics via `preload="metadata"` only after click.
- Optional caption rendered like the YouTube facade.

### 3. Article fields (`src/data/blogArticles.ts`)
Add three optional fields to the article object (TypeScript-permissive; existing posts unaffected):
- `videoAssetUrl?: string`
- `videoAssetTitle?: string`
- `videoAssetCaption?: string`

Populate on the `mercury-boost-software-upgrade-eligibility-2026` entry:
```ts
videoAssetUrl: mercuryBoostDemo.url, // imported from the .asset.json
videoAssetTitle: "Mercury Boost — official demo",
videoAssetCaption: "Mercury's own demonstration of Boost's mid-range acceleration response.",
```

### 4. Render in `src/pages/BlogArticle.tsx`
Just below the existing `youtubeVideoId` block (lines 356-362), add a parallel block:
```tsx
{article.videoAssetUrl && (
  <MercuryVideoFile
    src={article.videoAssetUrl}
    title={article.videoAssetTitle || 'Mercury Marine video'}
    caption={article.videoAssetCaption}
  />
)}
```
Placement is above the article body (after TOC, before prose) — same slot the YouTube embed already uses, so layout is consistent.

## Out of scope
- No edits to other Boost posts (`mercury-boost-cost-canada-2026`, `mercury-boost-upgrade-150hp-pontoon-analysis`). The same fields would let you add it there later in one line if you want.
- No inline-in-body markdown directive — kept it as an article-level field to match the existing YouTube pattern.
- Caption defaults to a neutral line since you didn't specify one; easy to change.

## Files touched
- New: `src/components/blog/MercuryVideoFile.tsx`
- New: `src/assets/video/mercury-boost-demo.mp4.asset.json` (CDN pointer)
- Edited: `src/data/blogArticles.ts` (article fields + import of pointer)
- Edited: `src/pages/BlogArticle.tsx` (render block + import)
