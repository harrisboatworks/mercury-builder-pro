

# Swap Hero Images for Remaining 2 Blog Posts

## What's Happening

You've provided the final two hero images for the blog posts that were still on placeholders. I'll copy them into the project and update the article references.

## Image Mapping

| Blog Post | Current Placeholder | New Image File |
|-----------|-------------------|----------------|
| Why Boat Rentals and Shared Access Are Booming in 2026 | `Boaters_Trust_HBW.png` | `Why_Boat_Rentals_and_Shared_Blog_Post_Hero_Image.png` |
| Why Mercury Dominates the Outboard Market | `Comparing_Motor_Families.png` | `Why_Mercury_Dominates_The_Outboard_Market_Blog_Post_Hero_Image.png` |

## Steps

1. **Copy both images** into `public/lovable-uploads/` (same location as all other blog hero images)
2. **Update `src/data/blogArticles.ts`** -- change the `image` field for both articles:
   - Line 6850: change from `Boaters_Trust_HBW.png` to `Why_Boat_Rentals_and_Shared_Blog_Post_Hero_Image.png`
   - Line 7031: change from `Comparing_Motor_Families.png` to `Why_Mercury_Dominates_The_Outboard_Market_Blog_Post_Hero_Image.png`

No other files need changes. After this, all 4 new blog posts will have their real hero images.

