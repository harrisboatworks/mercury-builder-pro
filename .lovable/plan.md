

# Update Boat Rentals Blog Post CTAs to Drive Self-Serve Booking

## Problem
The boat rentals blog post (`boat-rentals-shared-access-booming-2026`) tells readers to "call or stop by" for rentals. The business now has a self-serve rentals page at `https://www.harrisboatworks.ca/rentals` where customers can browse models, check availability, read FAQs, and book online.

One other post (`rice-lake-fishing-boating-guide-2026`, ~line 7525) also mentions rentals without linking to the rentals page.

## Changes — `src/data/blogArticles.ts`

### 1. "Real Service From Real People" section (lines 6961-6969)
Reframe: keep the personal touch messaging but note that booking starts online, with in-person walkthroughs happening at pickup. Remove the "not a purely self-serve, phone-only transaction" framing since it now IS self-serve online.

### 2. Closing CTA (line 7003)
Replace "Give us a call at (905) 342-2153, stop by the marina..." with a CTA driving to the rentals page:
> "Browse our rental fleet, check availability, and book online at [harrisboatworks.ca/rentals](https://www.harrisboatworks.ca/rentals) — no phone call needed."

### 3. "A Fit for Many Types of Boaters" section (line 6981)
Add a link to the rentals page after the list.

### 4. Rice Lake 2026 guide post — rentals mention (line 7525)
Add a link: "via our [rental fleet](https://www.harrisboatworks.ca/rentals)"

### 5. FAQ answer about what's included (line 7014)
Add mention of online booking: "Start by browsing models and availability at harrisboatworks.ca/rentals."

