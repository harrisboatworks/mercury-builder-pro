const PRO_XS_HORSEPOWER = [115, 150, 200, 250];

const PRO_XS_IMAGE_PATHS = {
  115: '/images/seo/proxs-115.webp',
  150: '/images/seo/proxs-150.jpg',
  200: '/images/seo/proxs-200.jpg',
  250: '/images/seo/proxs-250.jpeg',
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// Shared by the hydrated SEO component and the crawler-facing prerender.
// The canonical pricing update date is the truthful start of this published
// offer snapshot; do not replace it with a build date or hard-coded guess.
export function buildMercuryProXSOffers({ skus, lastUpdated, siteUrl }) {
  if (!DATE_ONLY.test(String(lastUpdated))) {
    throw new Error(`Invalid canonical pricing last_updated date: ${lastUpdated}`);
  }

  const normalizedSiteUrl = String(siteUrl).replace(/\/$/, '');

  return PRO_XS_HORSEPOWER.map((hp) => {
    const matchingSkus = skus.filter((sku) => sku.family === 'ProXS' && sku.hp === hp);
    if (matchingSkus.length === 0) {
      throw new Error(`Missing canonical Pro XS pricing for ${hp} HP`);
    }

    const startingSku = matchingSkus.reduce((lowest, sku) =>
      sku.dealer < lowest.dealer ? sku : lowest
    );

    return {
      hp,
      name: `Mercury ${hp} Pro XS`,
      startingAt: startingSku.dealer,
      image: `${normalizedSiteUrl}${PRO_XS_IMAGE_PATHS[hp]}`,
      availability: startingSku.status.toLowerCase() === 'in stock'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/PreOrder',
      validFrom: lastUpdated,
    };
  });
}
