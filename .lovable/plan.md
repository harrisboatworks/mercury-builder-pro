

## What the review actually asks for vs. what we have

I read the review and audited the code. Quick reality check:

| Claim in review | Actual state |
|---|---|
| "All 32 posts have empty FAQ sections" | **False in code.** All 32 have exactly 4 FAQs each (131 total). FAQ accordion + FAQPage JSON-LD already render. The reviewer likely missed the accordion or saw a stale build. |
| "No FAQPage schema anywhere" | **False.** `BlogSEO.tsx` already emits FAQPage JSON-LD when `faqs` exist. |
| "Broken escaped-markdown CTAs" | **Not present** in `blogArticles.ts` (the only file that matters). 0 matches for `\[`. |
| "60+ years" stale references | **True** — 3 instances (1 article body, 1 conclusion, 1 in `BlogArticle.tsx` CTA). |
| Future-dated publish dates (2026-02 → 2026-04) | **True** — many articles are scheduled in the future. |
| Generic voice in 4–6 posts, missing Rice Lake / HBW anchor | **Plausible.** Worth applying the rewrites. |
| 142 new Q&As to add (4 → ~8 per post) | **Real value.** This is the actual win. |

So the review's headline ("FAQ section is empty") is wrong, but the **underlying recommendations are still valuable**: more Q&As, fix stale copy, fix dates.

## Proposed scope

**Wave 1 — biggest AEO win (do now, automated):**

1. **Add the ~142 new FAQs** from the review to the 32 covered articles. I'll parse them out of the review markdown and merge into each article's `faqs` array. Existing 4 stay; new ones append. End state: ~8 Q&As per post, ~273 total, all already feeding the FAQPage JSON-LD that's wired up.
2. **Fix "60+ years" → "Mercury dealer since 1965"** in all 3 spots (2 in blog data, 1 in `BlogArticle.tsx` CTA).
3. **Audit publish dates.** I'll list every article with a future `datePublished`/`publishDate` so you can decide per-post: keep as scheduled, or backdate. I won't silently change dates — that's an editorial call. Output is a single table in chat.

**Wave 2 — voice rewrites (only if you want):**

The review provides full rewritten body copy for posts flagged as "generic voice." Replacing 1,000+ word article bodies wholesale is a lot of churn for marginal AEO lift once the FAQs are in. My recommendation: **skip the body rewrites**, keep the original content, just take the FAQs. If you disagree, I can do the 4–6 worst offenders (the review identifies them).

**Wave 3 — net-new posts (later, separate ask):**

The review suggests 10 brand-new gap-topic posts. Out of scope for this turn — flag for a future content sprint.

## What I will NOT do

- Won't replace article body content unless you specifically ask. Keeping scope tight to FAQs + the 3 stale-copy fixes.
- Won't touch the French / Mandarin / Korean / Spanish blog data — review is English only.
- Won't change dates without your sign-off.
- Won't add per-post inline `<script type="application/ld+json">` blocks — `BlogSEO.tsx` already emits FAQPage schema globally for all articles with FAQs. Adding per-post blocks would duplicate.

## Implementation notes (technical)

- **Parser**: extract FAQs from `Mercury_Repower_Blog_AEO_Review.md` by section. Each post has a "FAQs" or "Q&A" block with `**Q:** … **A:** …` patterns or a JSON-LD block we can lift answers from. I'll use the JSON-LD blocks (cleanest, already escaped).
- **Merge strategy**: deduplicate by question text (case-insensitive, normalized). If the review's question matches an existing one ~90%, skip; otherwise append.
- **Edits**: surgical `code--line_replace` on each article's `faqs: [...]` array, one per post. ~32 edits.
- **Apostrophes**: convert curly quotes in question/answer strings to straight quotes (or escape) to avoid TS string break.

## Acceptance criteria

- Each of the 32 reviewed articles has 7–10 Q&As (was 4).
- `Frequently Asked Questions` accordion on each post renders all of them.
- View source on any post shows FAQPage JSON-LD with all questions.
- Zero "60+ years" strings remain in `src/`.
- A date audit table is posted in chat for your decision.
- No body content changed; no other articles touched.

## Open question

**Wave 2 body rewrites — yes or no?** My strong recommendation is no (low ROI vs. risk of regressions in voice/links you've already tuned). Tell me if you want them anyway and I'll add the 4–6 specific posts.

