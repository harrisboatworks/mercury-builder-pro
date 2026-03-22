

# Remove Verado References from FAQ & LLMs Content

Since you don't sell Verado, the "Verado vs FourStroke" FAQ question should be removed entirely, and the Verado product line should be dropped from `llms.txt`.

## Changes

### 1. `src/data/faqData.ts`
- Remove the entire "What's the difference between Mercury Verado and FourStroke?" Q&A (lines 72-75), bringing the FAQ count from 25 to 24

### 2. `public/llms.txt`
- Remove the `Mercury Verado: 175-600HP...` line from the Products section
- Remove the `What's the difference between Mercury Verado and FourStroke?` line from the FAQ Topics section

### 3. `src/components/seo/FAQPageSEO.tsx`
- Update meta description: remove "Verado vs FourStroke" mention, change "25" to "24"

### 4. `src/components/seo/RepowerPageSEO.tsx`
- Already pulls dynamically from `faqData.ts`, so removing the Q&A from the data file handles this automatically

