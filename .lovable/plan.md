

# Fix BreadcrumbList "Missing itemListElement" Across All SEO Components

## Problem
Google Search Console reports a critical error on `/faq`: the BreadcrumbList schema is missing `itemListElement`. The data is actually present, but GSC fails to resolve `@id` references when the BreadcrumbList is a separate `@graph` node. The working pages (Promotions, Financing, Motor Selection) all inline the BreadcrumbList directly inside the WebPage's `breadcrumb` property.

## Fix
Move the BreadcrumbList from a standalone `@graph` node into the WebPage's `breadcrumb` property for all 7 affected SEO components. Also add `breadcrumb` references where the WebPage node is missing one.

## Affected Files

| File | Current Issue |
|------|--------------|
| `FAQPageSEO.tsx` | Separate @graph node; WebPage references via @id but GSC doesn't resolve it |
| `HomepageSEO.tsx` | Separate @graph node; WebPage has no `breadcrumb` property at all |
| `ContactPageSEO.tsx` | Separate @graph node; WebPage has no `breadcrumb` property |
| `FinanceCalculatorSEO.tsx` | Separate @graph node; WebPage has no `breadcrumb` property |
| `BlogIndexSEO.tsx` | Separate @graph node; CollectionPage has no `breadcrumb` property |
| `BlogSEO.tsx` | Separate @graph node; WebPage has no `breadcrumb` property |
| `RepowerPageSEO.tsx` | Separate @graph node; no WebPage node exists at all |

## Change Pattern (same for each file)

1. Remove the BreadcrumbList object from the `@graph` array
2. Inline it as the `breadcrumb` property on the WebPage (or CollectionPage) node
3. For RepowerPageSEO: also add a WebPage node to hold the breadcrumb

```text
BEFORE:
@graph: [
  { "@type": "WebPage", ... },
  { "@type": "BreadcrumbList", "@id": "...#breadcrumblist", "itemListElement": [...] }
]

AFTER:
@graph: [
  { "@type": "WebPage", ..., "breadcrumb": { "@type": "BreadcrumbList", "itemListElement": [...] } }
]
```

No content changes, no new fields — just restructuring so Google can find `itemListElement` without needing to resolve `@id` cross-references.

