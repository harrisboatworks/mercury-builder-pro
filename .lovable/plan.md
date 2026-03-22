

# Expand FAQ Content + Consolidate Duplicate Data Sources

## What's changing

### 1. Add 5 new FAQ items to `src/data/faqData.ts`

Add these high-intent questions to existing categories:

**Repower Basics** — add:
- "Can I repower a pontoon boat?" — Yes, with Command Thrust recommendation, common 90-150hp range

**Choosing the Right Motor** — add:
- "What's the difference between Mercury Verado and FourStroke?" — Verado is the premium line (V6/V8, 150-400hp), FourStroke is the standard workhorse; Verado adds Advanced MidSection, stealth black cowl, smoother/quieter operation
- "What is Mercury SmartCraft Connect?" — Wireless device streaming engine data to the Mercury Marine app; available on 40hp+ (2004+) and 25hp+ (2022+); formerly called VesselView Mobile

**Process & Service** — add:
- "What boat brands can you repower?" — All brands: Lund, Tracker, Princecraft, Legend, Crestliner, Starcraft, Alumacraft, etc. Mercury fits standard transoms
- "Do you offer winterization and storage?" — Yes, full winterization service; book via hbw.wiki/service

All facts will be cross-checked against existing knowledge files (`mercury-knowledge.ts`, `smartcraft-connect-knowledge.ts`, `harris-knowledge.ts`) — no fabricated specs.

### 2. Consolidate `RepowerFAQ.tsx` to use `faqData.ts`

Currently `RepowerFAQ.tsx` has 21 hardcoded questions that overlap with `faqData.ts`. This creates maintenance burden and risks contradictions.

**Change**: Replace the hardcoded `faqItems` array in `RepowerFAQ.tsx` with an import from `faqData.ts` using `getAllFAQItems()`. Show a curated subset (8-10 most relevant repower questions) rather than all 25.

The component keeps its own styling and layout — only the data source changes.

### 3. Update SEO metadata

- **`FAQPageSEO.tsx`**: Update description from "20 questions" to "25 questions"
- **`RepowerPageSEO.tsx`**: Update the inline FAQPage schema to pull from `faqData.ts` instead of hardcoded duplicates, keeping only 5-6 key repower questions for the repower page schema

### 4. Update `public/llms.txt`

Add the new FAQ topics to the FAQ section so AI crawlers see the expanded content.

---

## Files to modify

| File | Change |
|------|--------|
| `src/data/faqData.ts` | Add 5 new Q&As across existing categories |
| `src/components/repower/RepowerFAQ.tsx` | Import from faqData.ts instead of hardcoded array |
| `src/components/seo/FAQPageSEO.tsx` | Update count in meta description |
| `src/components/seo/RepowerPageSEO.tsx` | Pull FAQ schema from shared data |
| `public/llms.txt` | Add new FAQ topics |

