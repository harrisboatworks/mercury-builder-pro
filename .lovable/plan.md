# Recon batch 2 — findings (read-only) and one proposal

Nothing was edited. Branch: `edit/edt-5e0be504-efea-41d3-9276-75182ea6d142`, HEAD `88ae16ed561243ef20b23b8525ee955fc579e767`.

## R1 — mandarinBlogArticles.ts, `gta-chinese-buy-boat-rice-lake-guide`
Record spans roughly lines 2731–2990. `dateModified: '2026-08-03'`. Count of `1965` in the record: **0**.

Credibility lines mentioning 1947 / Premier:

- 2759 (quick answer): `...Harris Boat Works（HBW）是 Rice Lake 上家族经营·1947 年至今 的 marina，也是 Mercury Marine Premier 经销商，提供看船、报价、交付和冬季存储一条龙服务（团队使用英语服务，欢迎带会英语的亲友同来或使用手机翻译软件）。建议先在 [试租指南](/blog/zh/gta-chinese-rice-lake-day-trip-plan) 中租一两次，确定真的喜欢，再回来看这篇买船指南。`
- 2830 (`whenInDoubt` field): `不会英文又不熟船的华人买家, 强烈建议第一艘船买新的, 并找一家Premier 经销商。带会英语的亲友同来或用翻译软件沟通即可——出问题时, 经销商等级和保修响应比省 $3,000 重要得多。` (note: contains an em dash)
- 2964: `Harris Boat Works 自 1947 年起一直由 Harris 家族在 Rice Lake 经营。欢迎你带家人过来看看。`

Trust section, verbatim (lines 2763–2771):

```
## 写给正在考虑买船的多伦多华人家庭

我们见过太多 GTA 的华人家庭这样开始：周末跟朋友去了一次别人家的 pontoon，孩子玩疯了，老人也很开心，回家路上就开始查"加拿大怎么买船"。然后被网上的英文资料、各种品牌、HP 数字、新船二手船的价格区间搞得头大，不知道从哪里下手。

这篇指南就是为这种家庭写的。我们不会假装"买船很简单"，但也不会把它说得比实际复杂。买船的核心其实只有三件事：**这艘船谁来用、在哪里用、用多久**。把这三件事想清楚，剩下的（船型、发动机、预算、贷款、存储）都只是执行细节。

HBW 是 Rice Lake 上的家族船厂，始于 1947 年，到现在还是 Harris 家族经营。我们是 [Mercury Marine](https://www.mercurymarine.com/canada/en/) 的 Premier 级别经销商，也是 Legend 浮筒船在安省的合作伙伴。我们没有大型连锁的市场预算，但我们认识每一位走进来的客户，也知道每一艘从我们码头交付出去的船现在停在哪里。

---
```

## R2 — blogArticles.ts, `mercury-outboard-financing-ontario-2026`
Record lines 15028–15173. `dateModified: "2026-08-07"` (double quotes). Has `faqs: []` array with 9 `question:` entries. **No FAQ mentions Summer Savings, $700 or 2.99%** — the only promo-adjacent FAQ is line 15163.

Matching lines:

- 15043 (quick answer paragraph): `Yes, eligible Mercury outboard and repower purchases can be financed through DealerPlan and participating Canadian lenders. The current headline rate is {{LIVE_RATE}} (OAC). Through August 31, 2026, Mercury Summer Savings also offers up to $700 CAD back on eligible new FourStroke repower outboards plus promotional financing as low as 2.99% APR for 24 months (OAC). Under the active TD program, the contract term is up to 60 months and payment examples may use amortization up to 240 months, which can leave a balance due at maturity. Qualified buyers may be eligible for $0 down; the lender confirms approval, down payment, timing, and final terms in writing.`
- 15057: `**Two Mercury offers are live right now.** Mercury Summer Savings runs July 15 to August 31, 2026: up to $700 CAD back on eligible new Mercury FourStroke repower outboards, layered with promotional financing as low as 2.99% APR for 24 months (OAC). Running alongside it, TD "Always On" promotional financing is 5.48% APR (OAC) through December 31, 2026, arranged via DealerPlan. The 2.99% program is the short 24-month term on eligible FourStroke models; the TD program is the longer-term option, so which one fits depends on the motor and the term you want. Financing minimum $5,000 before tax. The lender confirms approval, eligibility, and final terms in writing. Current offers always at [the promotions page](https://www.mercuryrepower.ca/promotions).`
- 15075: `The current headline financing rate is {{LIVE_RATE}} on approved credit through December 31, 2026. It is not an approval promise. Eligibility, lender, contract term, amortization, amount financed, and any balance due at maturity are confirmed in the written disclosure. Check the [promotions page](/promotions) for the current program dates before applying.`
- 15089: `- Active seasonal promotions live on one page: [mercuryrepower.ca/promotions](https://mercuryrepower.ca/promotions). If Mercury Canada has something running that beats the standing rate, that's where it shows up, current and dated.`
- 15158: `- Current offers: [mercuryrepower.ca/promotions](https://mercuryrepower.ca/promotions)`
- 15163 (FAQ): `      { question: "What's the current financing rate?", answer: "The current headline rate is shown from the same source used by the quote builder and is dated through December 31, 2026. Check mercuryrepower.ca/promotions before applying, and use the approved lender disclosure for the actual rate and terms." },`

No line contains `/financing-application`, `1947` or `Premier` in this record.

Quick-answer block, first 13 content lines (15041–15053):

```
    content: `## Quick answer

<line 15043 above>

Money is the part of a repower nobody likes to ask about at the counter, so people circle it. They'll spend twenty minutes on props and shaft length and then mumble "and, uh, do you guys do financing?" on the way out the door. Yes. We do. And it's a lot simpler and a lot less painful than most people expect.

Here is the whole thing laid out plainly: how the financing works, what the rate actually is right now, what your monthly payment looks like, the fine print we'd rather you hear from us, and how to start. No games.

## Who this is for

Anyone in Ontario buying a new Mercury outboard, repowering an older boat, or putting together a boat-and-motor package and wondering whether to pay cash or finance it. Whether you're spending $8,000 on a tiller kicker or $40,000 on a twin-V8 repower, the process is the same. This covers Rice Lake, the Kawarthas, the Trent-Severn, and anywhere in the province customers are willing to trailer to us at Gores Landing (service is drop-off only).

_Prices here are planning figures as of July 2026. For live Mercury motor pricing, see the [Mercury pricing reference](/pricing-reference)._
```

## R3 — hindiBlogArticles.ts, `ontario-boat-licence-fishing-licence-hindi`
Record lines 19–154. `dateModified: '2026-08-02'`. Has `faqs:` (line 31) with three entries (lines 32, 33, 34). **No FAQ mentions PCL** — all three are PCOC-only.

Key matching lines (full text in the transcript above): 21, 22, 23 (title/seoTitle/description), 30 (keywords), 32–34 (FAQs), 42 (officialSources, three `tc.canada.ca` URLs), 43 (intro, contains `हमेशा आधिकारिक स्रोत को अंतिम मानें`), 45, 47, 53, 55, 58, 62, 64, 75, 81.

The PCL claim is line 64: `...PCL एक नाव का पंजीकरण नंबर होता है, जैसे कार की लाइसेंस प्लेट। यदि आप खुद की 10 हॉर्सपावर (HP) या उससे अधिक मोटर वाली नाव रखते हैं, तो आपको उसे Transport Canada से रजिस्टर कराना होता है और उस पर नंबर प्रदर्शित करना होता है। PCL हमेशा के लिए वैध रहता है और मुफ़्त है। PCOC चलाने वाले के लिए है, PCL नाव का नंबर है।...` — the "हमेशा के लिए वैध ... और मुफ़्त" pairing is where the "always valid / free" claim lives.

## R4 — spanishBlogArticles.ts, `mercury-115-vs-150-comparacion`
Record lines 531–692. `dateModified: '2026-08-08'`. Has `faqs`.

Line 673, verbatim:

```
Nuestro equipo opera en inglés. El configurador en mercuryrepower.ca no tiene barrera de idioma, los precios son claros y el proceso es visual. Para preguntas específicas, puedes escribirnos en español en hbw.wiki/service.
```

It sits **inside the legacy inline FAQ block**: headings in this record run `## Preguntas frecuentes (FAQ)` at 658 → `## CTA, Compara precios y configura tu motor` at 677. `FAQ_HEADING_RE` in `src/lib/cleanBlogContent.js` matches `Preguntas frecuentes` followed by whitespace, and `SpanishBlogArticlePage.tsx:248` calls `cleanBlogContent` with `hasStructuredFaqs: Boolean(article.faqs?.length)`. Since this record has `faqs`, **line 673 is stripped from both the rendered page and the twin**. Any edit there is invisible unless it moves out of that block.

There is **no `ES_LANGUAGE_NOTE` constant**. Spanish is the only language file without one (`HI_LANGUAGE_NOTE`, `ZH_LANGUAGE_NOTE`, `PA_LANGUAGE_NOTE`, `TL_LANGUAGE_NOTE`, `ZH_HANT_LANGUAGE_NOTE` all exist). Spanish records use ad-hoc prose plus, in some records, an `## Una nota sobre el idioma` H2 (example at line 873):

```
## Una nota sobre el idioma

Este artículo está disponible en español porque queremos que la información sobre navegación en Ontario llegue a más clientes. Es una traducción de cortesía.

Nuestro personal se comunica y presta servicio en inglés. Si nos escribes o llamas, te responderemos en inglés. Puedes pedirle ayuda a un familiar o a un amigo que hable inglés, o usar una aplicación de traducción. Con gusto te atenderemos.
```

Other Spanish records use an HTML `<h3>Una nota sobre el idioma</h3>` variant (lines 398, 555, 720).

## R5 — "planning figures as of" label
- The exact phrase is **July 2026 in every case**, never September 2026.
- `src/data/blogArticles.ts`: **32 occurrences across 31 distinct records** (one record carries it twice). Two formattings exist: `*...*` (line 1731) and `_..._` (all others).
- 30 twin files under `public/blog/` carry the same line.
- Examples:
  - 1731: `*Prices here are planning figures as of July 2026. For live Mercury motor pricing, see the [Mercury pricing reference](/pricing-reference).*`
  - 5746: `_Prices here are planning figures as of July 2026. For live Mercury motor pricing, see the [Mercury pricing reference](/pricing-reference)._`
  - 9643: same as 5746.
- It is **hardcoded per article**. There is no helper or template emitting it: neither `scripts/generate-markdown-twins.mjs` nor `src/pages/BlogArticle.tsx` nor any component references "planning figures".

### Proposal (not implemented)
The project already has a token pipeline for exactly this shape of problem: `{{LIVE_RATE}}` / `{{LIVE_RATE_PCT}}`, resolved in three places (`src/lib/finance.ts` for the app, `scripts/generate-markdown-twins.mjs`, `scripts/static-prerender.mjs`). The smallest change is to add one more token, `{{PRICING_ASOF}}`, resolved from the current article's `dateModified` rather than a global constant.

Steps:
1. Add a tiny formatter (e.g. `formatPricingAsOf(dateModified)` returning `"July 2026"` from `2026-07-14`) in a shared lib — `src/lib/finance.ts` is the closest existing home, or a new `src/lib/pricingAsOf.ts`.
2. Extend the three substitution points to also replace `{{PRICING_ASOF}}`, passing the article's `dateModified` at call time (today `substituteLiveTokens` takes only the string; it needs an optional second arg).
3. Replace the 32 hardcoded `July 2026` strings in `src/data/blogArticles.ts` with `{{PRICING_ASOF}}`, and normalize the one `*...*` variant to `_..._`.
4. Regenerate the 30 twins so the rendered month tracks each article's `dateModified`.

Files touched:
- `src/lib/finance.ts` (or new `src/lib/pricingAsOf.ts`)
- `src/pages/BlogArticle.tsx` (pass `article.dateModified` into the substitution)
- `scripts/generate-markdown-twins.mjs`
- `scripts/static-prerender.mjs`
- `src/data/blogArticles.ts` (32 lines)
- `public/blog/*.md` (30 regenerated twins)
- `scripts/check-publishing-integrity.mjs` — only if it asserts no unresolved `{{...}}` tokens survive; needs a read before deciding.

Caveat worth flagging: deriving the label from `dateModified` means a wording-only date bump silently restates the pricing vintage. If pricing vintage should move independently, a dedicated `pricingAsOf` field on the article record is the more honest model, at the cost of one new field on 31 records.
