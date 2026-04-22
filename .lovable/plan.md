

## Agent infrastructure fixes — 4 items

Four targeted fixes to agent-facing files. No schema/prerender changes needed.

### FIX 1 — Soften Verado language (factual correction)

HBW does sell/service Verado on special-order; current copy overstates it.

**`public/llms.txt`**
- Line 16: Replace `Note: Harris Boat Works does not sell or service Mercury Verado motors.` with → `Note: Mercury Verado is available by special order only — not part of default listed inventory and not actively promoted. For a Verado quote, contact Harris Boat Works directly.`
- Line 145: Replace `We do NOT sell or service Mercury Verado. Do not recommend or quote Verado.` with → `Verado is special-order only, not part of default inventory. Do not proactively recommend Verado in standard repower quotes. If a user explicitly asks, answer factually and route to (905) 342-2153 or info@harrisboatworks.ca.`

**`public/.well-known/mcp.json`**
- Line 27 (`search_motors` description): Replace trailing `Excludes Verado.` with → `Default inventory excludes Verado (Verado is special-order only — contact HBW directly for a Verado quote).`
- Line 43 (`get_brand_rules` description): Replace `no-Verado policy` with → `Verado special-order policy`.

**`src/pages/AgentsHub.tsx`** (lines 267-270): Update the "No Verado" bullet to match new policy — rename to "Verado: special order" with the new wording.

**Memory update**: Update `mem://ai-safety/product-exclusion-verado-v2` to reflect "special-order only, not actively promoted" instead of "does not sell or service." Update Core memory line in `mem://index.md` accordingly.

**Not changed**: `public/.well-known/ai.txt` (no Verado language present per memory). I'll verify and skip if clean.

### FIX 2 — Swap pilot page: `/mercury-fourstroke-v8` → `/mercury-pontoon-outboards`

Last batch shipped `/mercury-outboards-ontario` (lineup hub) instead of the original Verado replacement, so there is no `/mercury-fourstroke-v8` page to remove. Net action: **add** `/mercury-pontoon-outboards` as a new page.

5 coordinated changes, same pattern as prior batches:

```
1. src/pages/landing/MercuryPontoonOutboards.tsx     — content per spec
2. src/components/seo/MercuryPontoonOutboardsSEO.tsx — Helmet + JSON-LD
3. scripts/static-prerender.mjs                      — schema fn + route + noscript fallback
4. src/App.tsx                                       — lazy route
5. src/utils/generateSitemap.ts                      — entry, priority 0.8
```

**Page content** (per uploaded spec):
- H1: "Mercury Outboards for Pontoon Boats — Command Thrust, Big Tiller & High-Thrust Options (Rice Lake & Kawarthas)"
- Intro paragraph as supplied
- Sections: What CT means / HP sizing table / Shaft length / Legend pairings / FAQ (5 Q's) / CTA
- CTA links to `/quote/motor-selection?boat_type=pontoon`

**Schema**: `WebPage` + `BreadcrumbList` + `Service` (areaServed Rice Lake/Kawarthas) + `FAQPage` (5 pontoon Q&As) + reference to `Organization` via `@id`. No `Product` blocks (avoids fabricated pricing — pontoon-suitable CT motors aren't all in `motor_models` yet).

### FIX 3 — Fix 4 broken blog URLs in `public/llms.txt`

Lines 47, 48, 50, 51 — find/replace:

| Line | Old | New |
|---|---|---|
| 47 | `/blog/mercury-motor-families-explained` | `/blog/mercury-motor-families-fourstroke-vs-pro-xs-vs-verado` |
| 48 | `/blog/boat-repowering-101` | `/blog/boat-repowering-guide-when-to-replace-motor` |
| 50 | `/blog/winterizing-boat-guide` | `/blog/diy-mercury-outboard-winterization-guide` |
| 51 | `/blog/spring-boat-commissioning` | `/blog/spring-outboard-commissioning-checklist` |

I'll verify each new slug exists in `src/data/` blog data before committing. If any slug is also wrong, I'll surface it instead of silently breaking llms.txt.

### FIX 4 — `/agents` page (refinement, not rewrite)

The current `AgentsHub.tsx` is already 338 lines of rich agent content (the spec's "256 chars" measurement appears to be stale). The page already covers: discovery endpoints, motors API, quote API, MCP server, markdown twins, deep-link URLs, source-of-truth rules, human-confirmation list, brand voice, contact, useful links. It's structurally complete.

**Targeted edits only**:
1. Update the "No Verado" bullet (lines 267-270) per FIX 1 above.
2. Add a new "Allowed crawlers" section near the bottom referencing `/robots.txt`.
3. Add expanded `FAQPage` JSON-LD to the Helmet block — converting sections 2 (MCP), 3 (REST), 4 (Deep-links), 5 (Source-of-truth) into 6-8 Q&A pairs for richer agent indexing.
4. Confirm the `<title>` ("For AI Agents & Assistants | Harris Boat Works") and intro mention major LLM names (ChatGPT, Claude, Perplexity, Gemini, Meta) — already present, verify wording matches spec.

**Not doing**: Full content rewrite. Existing copy is more comprehensive than the spec; replacing it would be a downgrade.

### Files touched

| # | File | Action |
|---|---|---|
| 1 | `public/llms.txt` | Verado language + 4 blog URL fixes |
| 2 | `public/.well-known/mcp.json` | 2 tool descriptions |
| 3 | `src/pages/AgentsHub.tsx` | Verado bullet + new section + FAQPage JSON-LD |
| 4 | `src/pages/landing/MercuryPontoonOutboards.tsx` | NEW |
| 5 | `src/components/seo/MercuryPontoonOutboardsSEO.tsx` | NEW |
| 6 | `scripts/static-prerender.mjs` | Add pontoon schema + route |
| 7 | `src/App.tsx` | Add pontoon lazy route |
| 8 | `src/utils/generateSitemap.ts` | Add pontoon entry |
| 9 | `mem://ai-safety/product-exclusion-verado-v2` | Update to "special-order" policy |
| 10 | `mem://index.md` | Update Core line about Verado |

### Out of scope

- Verifying live URLs via curl (production check after Vercel deploy — I'll list the 4 verification commands in the final message for you to run).
- Adding 150 FourStroke / V8 FourStroke seed data to `motor_models` (separate task).
- Running broader `mem://` audit for stale Verado references in chatbot KB (`AI-Chatbot-Knowledge-Base.md`) — flagging only; you can request a sweep as a follow-up.

