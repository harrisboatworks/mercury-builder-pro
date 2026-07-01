# Mercury Repower Ontario — Semrush Audit & Domination Plan

**Date:** 2026-06-29
**Prepared for:** Harris Boat Works (mercuryrepower.ca, mercuryoutboards.ca)
**Market:** Ontario, Canada (Semrush CA database)
**Source:** Semrush organic + backlink data, pulled 2026-06-29

---

## 1. Executive Summary

Harris Boat Works owns two domains in the Mercury / repower space in Ontario:

- **mercuryrepower.ca** — new (first indexed April 2026), low authority, focused on the repower funnel and quote builder.
- **mercuryoutboards.ca** — older, broader Mercury content, ranks for ~5× more keywords and drives ~125× more estimated organic traffic.

The hard truth from the Semrush data: **"mercury repower ontario" and its variants have effectively zero search volume in Canada.** "Boat repower" itself is 0/mo CA. The category is real money but the searches happen under different head terms: "Mercury outboards", "Mercury [HP]", brand+location, and intent phrases like "mercury serial number lookup" and "repower cost calculator".

To dominate this category in the next 6 months, we stop leading with "Mercury Repower" as the hero phrase, lead instead with **"Mercury Outboards Ontario"** as the head term, and let repower be the conversion funnel sitting underneath it.

---

## 2. Semrush Snapshot

| Metric | mercuryrepower.ca | mercuryoutboards.ca |
|---|---|---|
| Authority Score | 6 / 100 | n/a (small) |
| Ranked keywords (CA) | 106 | 498 |
| Est. monthly organic traffic (CA) | ~13 | ~1,613 |
| Referring domains | 6 | — |
| Total backlinks | 379 (373 from harrisboatworks.ca) | — |
| First indexed traffic | April 2026 | mature |

**Reading the numbers:** Authority Score 6 is new-site territory — pages usually start ranking after a few months. The backlink profile is the single biggest structural weakness: 6 referring domains, and 373 of 379 links come from one site. Google reads that as essentially a self-link profile.

---

## 3. What's Currently Working

Pulled from the Semrush top-pages report for both domains.

| Page | Position | Est. CA traffic / mo | Read |
|---|---|---|---|
| `/locations/rice-lake-mercury-repower` | 14 | 1,300 | Biggest single page asset; just off page 1. Improving this page is the fastest win. |
| `/blog/best-marina-rice-lake-ontario` | 8 | 170 | Local + intent. Working as designed. |
| `/blog/mercury-75-vs-90-vs-115-comparison` | 4 | 170 | HP-comparison content ranks. Template to repeat. |
| Various per-HP comparison blogs | 4–20 | 20–170 each | Pattern confirmed: specific HP + decision content wins. |

**Pattern:** Local + specific-HP + decision-stage content is what ranks. Generic "repower" pages do not.

---

## 4. The Hard Truth (Keyword Volumes, CA Database)

| Keyword | CA Volume | KDI | Notes |
|---|---|---|---|
| mercury repower ontario | 0 | — | No demand. Stop optimizing for this exact phrase. |
| boat repower ontario | 0 | — | No demand. |
| mercury dealer ontario | 0–10 | low | Almost no demand for this exact string. |
| boat repower | 0 | — | Category phrase has no CA volume. |
| mercury outboards | 1,300+ | 40s | Head term. Real demand. |
| harris boat works | 1,300 | 19 | Branded. We should own position 1 unconditionally. |
| mercury serial number lookup | 140 | low | Tool intent. We don't have this yet. |
| mercury [HP] | 20–170 each | varies | Long-tail per HP class. We rank for several. |
| trent-severn / rice lake (combined) | 3,600 | 46 | Topical authority play. Tough but already aligned with our content. |

**Implication:** Lead pages and homepage `<title>` / H1 must target the head terms that actually have search demand, not the funnel phrase "repower".

---

## 5. Competitive Read

`mercuryoutboards.ca` (our own older domain) is the closest comparable. One observation worth copying: it ranks for ~74 keywords on a single URL because the URL exact-matches "Mercury Outboards Ontario | Canadian Pricing" in the `<title>` and H1. The lesson is structural, not creative — the head term has to be in the title tag and the H1, not buried in body copy.

Other ranking competitors for Mercury queries in Ontario are dealer sites with thin SEO. None of them have a configurator, a serial-number tool, a real cost calculator, or topical authority on Rice Lake / Trent-Severn. **That gap is the moat.**

---

## 6. The 8-Move Plan (Next 6 Months)

Ordered by impact × ease. Moves 1, 2, and 8 are the fastest wins.

### Move 1 — Rewrite the mercuryrepower.ca homepage for head terms

**Why:** Biggest single lever. The homepage currently targets "Mercury Repower Cost Ontario", a phrase with near-zero CA volume.
**Do:**
- `<title>`: "Mercury Outboards Ontario — Real CAD Pricing & Live Quote | Harris Boat Works"
- H1: "Mercury Outboards in Ontario"
- Above-fold copy: lead with "Mercury Outboards Ontario", let "repower" appear as the conversion path, not the headline.
- Keep the existing structured data, quote-builder CTA, and 70/30 positioning.

### Move 2 — Capture the brand term "harris boat works" properly

**Why:** 1,300/mo in CA, KDI 19, branded. We should be position 1 with a rich result.
**Do:**
- Make sure the homepage `<title>` ends with "| Harris Boat Works".
- Confirm the `Organization` + `LocalBusiness` JSON-LD has `name`, `sameAs`, `logo`, `address`, `telephone`, `aggregateRating` if we have reviews.
- Internal-link "Harris Boat Works" as anchor text from blog and location pages to `/`.

### Move 3 — Build a Mercury serial-number decoder tool

**Why:** 140/mo CA, low competition, perfect intent for a dealer. Tool pages get linked.
**Do:**
- New route `/tools/mercury-serial-decoder`.
- Input: serial. Output: model year, HP class, plant, then a CTA into the quote builder if the engine is repower-age.
- Title-tag it for "mercury serial number lookup" + "mercury outboard year by serial number".
- Link from `/repower`, `/pricing-reference`, and the homepage.

### Move 4 — HP hub pages, one per HP class

**Why:** 20–170/mo each. 12 hub pages = a 600–1,000/mo ceiling. We already proved the pattern with the 75 vs 90 vs 115 post.
**Do:** One page per class: 9.9, 15, 20, 25, 40, 60, 90, 115, 150, 200, 250, 300. Each page covers: who it's for, hull match, real CAD price, repower cost vs new, a comparison to the adjacent HP, and a CTA to the quote builder.

### Move 5 — Repower cost calculator

**Why:** ~80/mo combined CA volume on "repower cost calculator" and variants. Low competition, converts directly.
**Do:** New route `/tools/repower-cost-calculator`. Inputs: current HP, boat type, year. Output: realistic CAD range pulling from the same canonical pricing the quote builder uses. End the result with the same "Build Your Quote" CTA.

### Move 6 — Trent-Severn + Rice Lake topical authority

**Why:** Combined 3,600/mo CA, KDI 46. Tough but we already publish here and the local angle is defensible.
**Do:** Build a `/trent-severn` hub linking out to existing blog posts, lock pages, fishing posts, and the Rice Lake location page. Add 4–6 new posts in this cluster over Q3.

### Move 7 — Fix the backlink profile

**Why:** 6 referring domains, 373 of 379 from a single site. This caps how high anything can rank regardless of content.
**Goal:** 25 new referring domains in 90 days.
**Do:** Mercury Marine dealer locator, Legend Boats dealer locator, Northumberland Tourism, Kawarthas Northumberland, Cobourg / Port Hope / Gores Landing chambers, local fishing clubs, marine guides, Trent-Severn boater forums, a press release on Platinum Dealer status, sponsorships of local fishing tournaments.

### Move 8 — Stop cannibalization

**Why:** "Mercury boats canada" currently ranks the same `/motor-selection` URL at positions 46–84 — Google can't decide which page is the answer.
**Do:** Audit which URLs target which head terms, consolidate duplicates with 301 redirects, and make sure each head term has exactly one canonical landing page.

---

## 7. What to Deprioritize

- More translated blog content (FR/ZH/KO) until English head-term coverage is fixed.
- Hyper-local "Mercury dealer [GTA city]" pages beyond what exists. The traffic is in head terms, not in 30 city variants.
- "Mercury repower" as the hero phrase anywhere above the fold. Use it inside the funnel only.

---

## 8. Suggested Sequencing

| Window | Focus |
|---|---|
| Week 1–2 | Move 1 (homepage rewrite), Move 8 (cannibalization cleanup), spec out Move 3 (serial decoder). |
| Week 3–4 | Move 4 (HP hub pages, first 4), Move 5 (cost calculator). |
| Month 2 | Move 6 (Trent-Severn hub), start Move 7 (backlink outreach), finish remaining HP hubs. |
| Month 3 | Move 2 (brand consolidation pass), double down on whatever moved the most in Search Console. |

---

## 9. Tracking

Re-pull these every 30 days and log in `/docs/seo/`:

- Authority Score, ranked-keyword count, est. CA traffic for both domains (`semrush--domain_analysis`).
- Position for: "mercury outboards ontario", "harris boat works", "mercury [HP]" per class, "mercury serial number lookup", "repower cost calculator".
- Referring domain count (target: 6 → 30 by end of Q3).
- Top-pages report — confirm `/locations/rice-lake-mercury-repower` moves from position 14 toward page 1.

---

*Source: Semrush CA database, pulled 2026-06-29. Numbers are Semrush estimates of Google organic only — actual visitor counts (including direct, social, ads, email) will be higher; pull GA / Search Console for exact traffic.*
