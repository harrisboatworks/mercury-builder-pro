import { Helmet } from '@/lib/helmet';
import { buildMotorPageGraph, type MotorSchemaInput } from '@/lib/seo/buildMotorProductSchema';

/**
 * Per-motor Product + Offer + Breadcrumb JSON-LD for /motors/{slug}.
 *
 * scripts/static-prerender.mjs already emits an equivalent schema at build
 * time so crawlers see it without JS. This component re-emits the same shape
 * on the React-hydrated page so users who land via SPA navigation (e.g. from
 * /quote/motor-selection) still get rich-result-eligible markup.
 */
export function MotorPageSEO(props: MotorSchemaInput) {
  const graph = buildMotorPageGraph(props);
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(graph)}</script>
    </Helmet>
  );
}
