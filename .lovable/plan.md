

# Add ProKicker Hero Image to the Blog Post

## What's Happening

The ProKicker blog post is currently using a placeholder image path (`/lovable-uploads/ProKicker_Rice_Lake_Hero.png`). The actual hero image has now been uploaded and needs to be copied into the project and wired up.

## Changes

### 1. Copy the uploaded image into the project

Copy `user-uploads://hf_20260206_123514_7aee489a-91c7-4d6d-93de-364e0a187c1b.png` to `public/lovable-uploads/ProKicker_Rice_Lake_Hero.png`.

This matches the path already set in the blog article data, so the image will immediately appear on:
- The blog index card
- The blog article hero
- Open Graph / Twitter social previews
- Schema.org structured data

### 2. No code changes required

The blog article entry in `src/data/blogArticles.ts` already has `image: '/lovable-uploads/ProKicker_Rice_Lake_Hero.png'` -- which will resolve correctly once the file is in place. No file edits needed.

