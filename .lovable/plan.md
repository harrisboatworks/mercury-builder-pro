
## What changed since the last time publishing worked (and why it now “never works”)

From the build output you pasted, **Vite successfully builds your app bundle** (it lists all `dist/assets/...` and then the log gets truncated). That strongly suggests the failure happens **after bundling**, during a post-step like **PWA/Workbox service worker generation** (this is the most common “it prints the chunk list and then dies” pattern).

The key change that correlates with your failures is:

1) **You have `vite-plugin-pwa` enabled with Workbox precaching**
   - `vite.config.ts` includes `VitePWA({ workbox: { globPatterns: ... } })`
   - Workbox will **precache every file matched by `globPatterns`**.

2) **Your Workbox `globPatterns` includes `png`**
   - Current config:  
     `globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']`

3) **Your build contains a PNG bigger than Workbox’s default maximum precache size**
   - Your build output shows:
     - `dist/assets/mercury-get7-promo-mobile-....png` = **2,350.28 kB (~2.35 MB)**
   - Workbox has a default `maximumFileSizeToCacheInBytes` (commonly ~2 MB).  
     If any matched file exceeds this, **service worker generation can fail**.
   - This would happen *after* “computing gzip size…” and the asset list—exactly where your logs get truncated.

So compared to a “previously published” version, what likely changed is:
- **PWA precache rules now include images**, and/or
- **This specific large promo image was added (or grew past ~2 MB)**, and Workbox now tries to precache it and fails.

## Why the error text is useless right now
Lovable’s build output is being truncated (“Build errors truncated: too large to display completely”), which hides the actual Workbox error message (it’s usually something like “File is larger than maximumFileSizeToCacheInBytes”).

Given your logs and config, we can proceed with a fix that directly addresses this failure mode.

---

## Fix strategy (most reliable)

### Goal
Stop Workbox from trying to precache large images (especially that 2.35MB PNG), while keeping images cached at runtime via your existing runtimeCaching rules.

### Change 1 (recommended): Remove images from precache `globPatterns`
Update:
- `globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']`
to something like:
- `globPatterns: ['**/*.{js,css,html,ico,svg,woff2}']`  
(Notice: remove `png` and we can also avoid `jpg/jpeg` if present later.)

Rationale:
- Precache is best for the **app shell** (HTML/CSS/JS) and critical small icons.
- You already have `runtimeCaching` for images:
  - `urlPattern: /\.(png|jpg|jpeg|svg|webp|gif)$/` with `CacheFirst`
- That means images will still be cached, just not forced into precache (which is what is breaking the build).

### Change 2 (optional fallback): Increase the Workbox size limit
If you want to keep some images precached (I generally don’t recommend it here), add:
- `maximumFileSizeToCacheInBytes: 5 * 1024 * 1024` (5 MB), or similar.

This is less ideal because it can bloat your precache and slow down SW generation/installs, but it can work.

### Change 3 (targeted alternative): Exclude only the one large asset
Add a Workbox ignore for that promo image (hash varies per build, so we’d likely match by filename prefix):
- `globIgnores: ['**/mercury-get7-promo-mobile*.png']`

This can work, but it’s more brittle than simply removing images from precache.

---

## How we’ll confirm the fix
1) Publish again.
2) If publishing succeeds, we’ve confirmed it was the Workbox precache size limit.
3) Quick sanity check in the deployed app:
   - The promotions page and quote motor selection banner images load.
   - Offline behavior still works for the app shell (if you rely on offline).

---

## Files that will change
- `vite.config.ts` (Workbox config only)

---

## Notes on your other recent changes (not the current blocker, but relevant context)
- The “dev-only gating” for Transformers/WASM was the right move to keep production bundles smaller.
- Adding the missing PWA icons and stable `/public/assets/*` was also correct, but it doesn’t address the core symptom of “build completes then fails at the end.”

---

## Implementation steps I will take once you approve
1) Edit `vite.config.ts`:
   - Remove `png` from Workbox `globPatterns` (and ensure `jpg/jpeg` are not included either if we decide to keep precache minimal).
   - Keep your runtime caching rule for images unchanged.
2) Publish again.

If this still fails after that, the next most likely culprit would be a different post-build gate (security scan, edge function deploy, etc.), but the evidence you posted overwhelmingly points to Workbox choking on the 2.35MB promo PNG during SW generation.
