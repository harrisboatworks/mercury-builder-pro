
# Swap Hero Images for 2 Blog Posts

## What's Happening

You've provided the real hero images for two of the four new blog posts. I'll copy them into the project and update the article references to use them instead of the current placeholders.

## Image Mapping

| Blog Post | Current Placeholder | New Image File |
|-----------|-------------------|----------------|
| What the 2026 Boating Market Means for Ontario Boat Buyers | `2026_Mercury_Buying_Pricing_Promotions_Hero.png` (shared with another post) | `What_the_boating_market_means_blog_hero_image.png` |
| Tariffs, Trade, and Canadian Boating | `Financing_A_New_Boat_Motor_Hero.png` (shared with another post) | `Tariffs_and_Trade_Blog_Hero_Image.png` |

## Steps

1. **Copy both images** into `public/lovable-uploads/` (matching the existing pattern used by all other blog hero images)
2. **Update `src/data/blogArticles.ts`** -- change the `image` field for both articles:
   - Line ~6577: change from `2026_Mercury_Buying_Pricing_Promotions_Hero.png` to `What_the_boating_market_means_blog_hero_image.png`
   - Line ~6700: change from `Financing_A_New_Boat_Motor_Hero.png` to `Tariffs_and_Trade_Blog_Hero_Image.png`

No other files need changes -- the blog index, article pages, RSS feed, and sitemap all pull from the same `blogArticles` array automatically.

Still waiting on the other two images (Boat Rentals and Why Mercury Dominates) -- those will stay on their current placeholders until you send them.
