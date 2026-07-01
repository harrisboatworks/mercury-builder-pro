#!/usr/bin/env node
/**
 * DEPRECATED / DISABLED — 2026-07-01.
 *
 * The cluster-driven `<RelatedGuides />` React component (see
 * src/components/blog/RelatedGuides.tsx) plus the SSG aside emitted by
 * scripts/static-prerender.mjs and the `## Related guides` section
 * appended to blog .md twins by scripts/generate-markdown-twins.mjs is
 * now the single source of truth for related-guide internal linking.
 *
 * This script previously injected duplicate hard-coded blocks into
 * src/data/blogArticles.ts / frenchBlogArticles.ts. Those in-content
 * blocks have been removed to eliminate duplication (14 dealer pages
 * were sharing an identical block, several pages rendered 3 variants
 * simultaneously). Re-running the old injector would resurrect the
 * duplication, so the injection step is now a no-op.
 *
 * The file is kept for git history and in case a future task needs the
 * scoring / description logic. Do not re-enable without a deliberate
 * decision to move away from cluster-driven related guides.
 */
console.log('[inject-related-guides] disabled: cluster-driven RelatedGuides is the source of truth. No-op.');
process.exit(0);
