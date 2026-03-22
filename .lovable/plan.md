

# Council Feedback Implementation (Completed)

Changes based on AI council reviews (Gemini, GPT-5, Claude Opus).

## Completed

### 1. Fixed Broken `/financing` Nav Link
- Added redirect route `/financing` → `/finance-calculator` in App.tsx
- Updated footer link href
- Updated chat CTA card link

### 2. Promoted "Save for Later" → "Email Me This Quote"
- Renamed button label and changed icon to Mail in StickySummary.tsx
- Leverages existing SaveQuoteDialog infrastructure (name, email, phone capture + admin alerts)

### 3. Standardized Review Count
- Changed `generateReviewCount()` from random 150-220 range to fixed `170`
- All pages now show the same consistent number

### 4. AEO-Optimized Repower FAQ Content
- Replaced 50+ general FAQ questions (8 categories) with 20 AEO-optimized repower Q&As (5 categories)
- Categories: Repower Basics, Choosing the Right Motor, Cost & Financing, Process & Service, Mercury Specific
- Updated FAQPageSEO.tsx with repower-focused JSON-LD schema and meta tags
- Updated FAQ.tsx hero text and CTA to focus on repowering
- Added "Mercury Repower by Harris Boat Works" Organization schema to GlobalSEO.tsx linking mercuryrepower.ca → harrisboatworks.ca

## Skipped (by request)
- "Engine Only" price disclaimer on motor cards
- Operating hours fix on About page
