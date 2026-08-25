// Shared source of truth for the additive /harris-boat-works brand-search page.
// Imported by the React page/SEO head and by scripts/static-prerender.mjs so
// crawler HTML, Helmet tags, and JSON-LD stay aligned.

export const HARRIS_BOAT_WORKS_BRAND_PATH = '/harris-boat-works';
export const HARRIS_BOAT_WORKS_BRAND_CANONICAL =
  'https://www.mercuryrepower.ca/harris-boat-works';
export const HARRIS_BOAT_WORKS_BRAND_TITLE =
  'Harris Boat Works | Rice Lake Marina & Mercury Dealer';
export const HARRIS_BOAT_WORKS_BRAND_DESCRIPTION =
  'Harris Boat Works is a third-generation Rice Lake marina and Mercury Marine Premier Dealer in Gores Landing. Get directions, call, or request service.';
export const HARRIS_BOAT_WORKS_BRAND_H1 = 'Harris Boat Works';
export const HARRIS_BOAT_WORKS_BRAND_INTRO =
  'If you searched Harris Boat Works, this is the shop on Rice Lake. Third-generation family marina in Gores Landing. Come here for directions, a phone number, and the next step.';
export const HARRIS_BOAT_WORKS_SHOP_IMAGE_PATH =
  '/lovable-uploads/archive/hbw-building-front-shop.jpg';
export const HARRIS_BOAT_WORKS_SHOP_IMAGE_URL =
  'https://www.mercuryrepower.ca/lovable-uploads/archive/hbw-building-front-shop.jpg';
export const HARRIS_BOAT_WORKS_SHOP_IMAGE_ALT =
  'The Harris Boat Works shop in Gores Landing on Rice Lake';
export const HARRIS_BOAT_WORKS_HISTORY_HREF =
  '/blog/harris-boat-works-since-1947-rice-lake-institution';
export const HARRIS_BOAT_WORKS_HISTORY_LABEL =
  'Harris Boat Works since 1947: the Rice Lake institution';
export const HARRIS_BOAT_WORKS_QUOTE_HREF = '/quote/motor-selection';
export const HARRIS_BOAT_WORKS_SERVICE_HREF = 'https://hbw.wiki/service';
export const HARRIS_BOAT_WORKS_RENTALS_HREF = 'https://www.harrisboatworks.ca/rentals';
export const HARRIS_BOAT_WORKS_DIRECTIONS_HREF =
  'https://www.google.com/maps/dir/?api=1&destination=5369+Harris+Boat+Works+Rd,+Gores+Landing,+ON+K0K+2E0';

export const HARRIS_BOAT_WORKS_BRAND_FAQS = [
  {
    question: 'Who is Harris Boat Works?',
    answer:
      'Harris Boat Works is a third-generation family marina established in 1947 on Rice Lake in Gores Landing, Ontario. We are a Mercury Marine Premier Dealer (Mercury dealer since 1965) and an authorized Legend Boats dealer.',
  },
  {
    question: 'Where is Harris Boat Works?',
    answer:
      '5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0, on Rice Lake. Pickup and drop-off only at this address.',
  },
  {
    question: 'What does Harris Boat Works do?',
    answer:
      'Mercury outboard sales and repower, Mercury and MerCruiser service, genuine Mercury parts, boat rentals, seasonal slips, a launch ramp, ethanol-free marine fuel, and outdoor winter storage with shrinkwrap.',
  },
  {
    question: 'Can you ship a motor or come to my dock?',
    answer:
      "No. Everything happens at the Gores Landing marina. You drop off and pick up here. We don't deliver, ship, or offer mobile or dockside service.",
  },
  {
    question: 'Are you open in winter?',
    answer:
      "The marina is closed December 1 through April 1. We don't take winter visits or do winter service work.",
  },
];

export const HARRIS_BOAT_WORKS_SERVICES = [
  'Mercury outboard sales and repower',
  'Mercury and MerCruiser service',
  'Genuine Mercury parts',
  'Boat rentals',
  'Seasonal slips',
  'Launch ramp',
  'Ethanol-free marine fuel',
  'Outdoor winter storage with shrinkwrap',
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildHarrisBoatWorksBrandPageSchema() {
  const canonical = HARRIS_BOAT_WORKS_BRAND_CANONICAL;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: HARRIS_BOAT_WORKS_BRAND_TITLE,
        description: HARRIS_BOAT_WORKS_BRAND_DESCRIPTION,
        isPartOf: { '@id': 'https://www.mercuryrepower.ca/#website' },
        about: { '@id': 'https://www.mercuryrepower.ca/#organization' },
        breadcrumb: { '@id': `${canonical}#breadcrumb` },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: HARRIS_BOAT_WORKS_SHOP_IMAGE_URL,
          caption: HARRIS_BOAT_WORKS_SHOP_IMAGE_ALT,
        },
        inLanguage: 'en-CA',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mercuryrepower.ca/' },
          { '@type': 'ListItem', position: 2, name: 'Harris Boat Works', item: canonical },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${canonical}#faqpage`,
        mainEntity: HARRIS_BOAT_WORKS_BRAND_FAQS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  };
}

export function buildHarrisBoatWorksBrandPageNoscript() {
  const faqs = HARRIS_BOAT_WORKS_BRAND_FAQS.map(
    (item) =>
      `<dt><strong>${escapeHtml(item.question)}</strong></dt><dd>${escapeHtml(item.answer)}</dd>`,
  ).join('');
  const services = HARRIS_BOAT_WORKS_SERVICES.map((item) => `<li>${escapeHtml(item)}</li>`).join('');

  return (
    '<section><h2>Where we are</h2>' +
    '<p>5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0, on Rice Lake.</p>' +
    '<p>Phone <a href="tel:+19053422153">905-342-2153</a>. Text <a href="sms:+16479522153">647-952-2153</a>. Email <a href="mailto:info@harrisboatworks.ca">info@harrisboatworks.ca</a>.</p>' +
    '<p>In-season hours: Monday to Saturday 8:00 a.m. to 5:00 p.m., Sunday 9:00 a.m. to 4:00 p.m. The marina is closed December 1 through April 1. We don\'t take winter visits or do winter service work.</p>' +
    `<p><a href="${escapeHtml(HARRIS_BOAT_WORKS_DIRECTIONS_HREF)}">Get directions</a></p></section>` +
    `<section><h2>What we do</h2><ul>${services}</ul>` +
    '<p>Pickup and drop-off only at Gores Landing. No delivery, no shipping, no mobile or dockside service.</p></section>' +
    '<section><h2>Heritage, short version</h2>' +
    '<p>The Harris family has run this marina since 1947. Mercury dealer since 1965. Current Mercury Marine Premier Dealer. Authorized Legend Boats dealer.</p>' +
    "<p>This page is the brand overview: who we are, where we are, and what to do next. It's not the family history. The detailed story lives in one article.</p>" +
    `<p><a href="${HARRIS_BOAT_WORKS_HISTORY_HREF}">${escapeHtml(HARRIS_BOAT_WORKS_HISTORY_LABEL)}</a></p></section>` +
    `<section><h2>Common questions</h2><dl>${faqs}</dl></section>` +
    '<section><h2>Next steps</h2><ul>' +
    `<li><a href="${HARRIS_BOAT_WORKS_QUOTE_HREF}">Build a Mercury quote</a></li>` +
    `<li><a href="${HARRIS_BOAT_WORKS_SERVICE_HREF}">Request service</a></li>` +
    `<li><a href="${HARRIS_BOAT_WORKS_RENTALS_HREF}">Boat rentals</a></li>` +
    '</ul></section>'
  );
}

export function getHarrisBoatWorksBrandPagePrerender() {
  return {
    path: HARRIS_BOAT_WORKS_BRAND_PATH,
    title: HARRIS_BOAT_WORKS_BRAND_TITLE,
    description: HARRIS_BOAT_WORKS_BRAND_DESCRIPTION,
    h1: HARRIS_BOAT_WORKS_BRAND_H1,
    intro: HARRIS_BOAT_WORKS_BRAND_INTRO,
    ogImage: HARRIS_BOAT_WORKS_SHOP_IMAGE_URL,
    ogImageAlt: HARRIS_BOAT_WORKS_SHOP_IMAGE_ALT,
    schemas: [buildHarrisBoatWorksBrandPageSchema()],
    extraNoscript: buildHarrisBoatWorksBrandPageNoscript,
    stripInheritedShellSeo: true,
  };
}
