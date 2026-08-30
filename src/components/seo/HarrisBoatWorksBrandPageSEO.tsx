import { Helmet } from '@/lib/helmet';
import {
  HARRIS_BOAT_WORKS_BRAND_CANONICAL,
  HARRIS_BOAT_WORKS_BRAND_DESCRIPTION,
  HARRIS_BOAT_WORKS_BRAND_TITLE,
  HARRIS_BOAT_WORKS_SHOP_IMAGE_ALT,
  HARRIS_BOAT_WORKS_SHOP_IMAGE_URL,
  buildHarrisBoatWorksBrandPageSchema,
} from '@/data/harrisBoatWorksBrandPage.js';

export function HarrisBoatWorksBrandPageSEO() {
  const structuredData = buildHarrisBoatWorksBrandPageSchema();

  return (
    <Helmet>
      <title>{HARRIS_BOAT_WORKS_BRAND_TITLE}</title>
      <meta name="description" content={HARRIS_BOAT_WORKS_BRAND_DESCRIPTION} />
      <link rel="canonical" href={HARRIS_BOAT_WORKS_BRAND_CANONICAL} />

      <meta property="og:title" content={HARRIS_BOAT_WORKS_BRAND_TITLE} />
      <meta property="og:description" content={HARRIS_BOAT_WORKS_BRAND_DESCRIPTION} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={HARRIS_BOAT_WORKS_BRAND_CANONICAL} />
      <meta property="og:image" content={HARRIS_BOAT_WORKS_SHOP_IMAGE_URL} />
      <meta property="og:image:alt" content={HARRIS_BOAT_WORKS_SHOP_IMAGE_ALT} />
      <meta property="og:locale" content="en_CA" />
      <meta property="og:site_name" content="Harris Boat Works" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={HARRIS_BOAT_WORKS_BRAND_TITLE} />
      <meta name="twitter:description" content={HARRIS_BOAT_WORKS_BRAND_DESCRIPTION} />
      <meta name="twitter:image" content={HARRIS_BOAT_WORKS_SHOP_IMAGE_URL} />

      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>
  );
}
