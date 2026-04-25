## Plan: Use your uploaded images where they fit best

### Recommended image mapping

**Strongest immediate matches**
- `1a.png` → Aluminum fishing boat content or aluminum-fishing case study hero
- `1-2.png` → Aluminum fishing detail shot or transom/install detail image
- `cuddy_115.png` → Walkaround/cuddy article or case study hero
- `cuddy_115_2.png` → Walkaround/cuddy detail shot
- `bass_with_150_proxs.png` → Performance/bass boat hero image
- `bass_with_150_proxs_2.png` → Bass boat detail/close-up image

**Usable with caveats**
- `pontoon_115_ct.png` → Pontoon detail image only. Good mechanical/product shot, but weak as a wide hero because it is a straight-on stern view.

### Best implementation options

1. **Blog/article image upgrade**
   Replace existing article images in `src/data/blogArticles.ts` for the pages that already match these scenarios:
   - `best-mercury-outboard-aluminum-fishing-boats`
   - `best-mercury-outboard-pontoon-boats`
   - `mercury-115-vs-150-hp-outboard-ontario`
   - optionally `bass-boat-mercury-motor-buying-guide` if its article record uses a weaker image now

2. **Case-study asset set**
   Copy the approved images into a dedicated folder such as `public/case-studies/` and wire them into the future case-study data layer once that file is identified or created in build mode.

3. **Catalog/admin motor imagery**
   Use selected uploads as motor-specific media only if you want them attached to exact motor records. This would require uploading them into the existing media flow instead of only referencing them as static site assets.

### What I can do with these images

**Good enough to use now**
- Aluminum set: yes
- Cuddy/walkaround set: yes
- Bass/Pro XS set: yes
- Pontoon stern detail: yes, but as supporting image rather than hero

**What is still missing if you want a full 5-case-study real-photo rollout**
- A stronger wide pontoon hero shot
- A cedar-strip / small 9.9 shot set

### Quality notes

- These are real and much stronger than illustrative placeholders for trust.
- Several images contain visible Mercury branding and exact horsepower badging, which is fine for real dealership content but means they should be matched to truthful scenarios only.
- The bass hero includes a visible person. That is acceptable for real editorial/blog use, but if you want a stricter no-identifiable-people standard for case studies, I would avoid using that one in the case-study card grid.
- `pontoon_115_ct.png` includes dealership branding on the pontoon panel, which is strong for authenticity but means it should be used intentionally in Harris Boat Works content rather than generic stock-style placements.

### Implementation sequence once approved

1. Copy the selected uploaded images into project assets.
2. Create stable filenames for each approved use.
3. Update the matching entries in `src/data/blogArticles.ts` to point at the new assets.
4. If desired, add a dedicated `public/case-studies/` folder and reserve filenames for future real-photo replacements.
5. Leave unmatched scenarios unchanged until better photos arrive.

## Technical details

- The current content system already references article hero images directly from `src/data/blogArticles.ts`.
- Motor catalog images use a different priority system (`hero_media_id`, `hero_image_url`, `images`, `motor_media`) and should only be changed if you want these photos tied to actual motor records.
- Since I am in read-only mode, I cannot copy or wire the files yet. After approval, I can implement the image mapping directly.

## Suggested default mapping

```text
1a.png                    -> aluminum-fishing-hero
1-2.png                   -> aluminum-fishing-detail
cuddy_115.png             -> walkaround-cuddy-hero
cuddy_115_2.png           -> walkaround-cuddy-detail
bass_with_150_proxs.png   -> bass-boat-hero
bass_with_150_proxs_2.png -> bass-boat-detail
pontoon_115_ct.png        -> pontoon-detail
```

### Outcome

After implementation, the site would use your real photos for the strongest matching aluminum, bass, and cuddy scenarios immediately, while leaving the weaker/missing scenarios pending better source photos.