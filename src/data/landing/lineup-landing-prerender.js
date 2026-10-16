// Shared Product/FAQ schema and noscript table used by static-prerender for
// /mercury/* lineup landings. Keep this mapping identical for tests.

import { formatLandingCad } from './mid-range-40-60-snapshot.js';

export function defaultEscapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildLineupLandingSchemas(cfg, siteUrl) {
  const canonical = `${siteUrl}${cfg.path || cfg.slug}`;
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: cfg.productName,
    description: cfg.productDescription,
    brand: { '@type': 'Brand', name: 'Mercury Marine' },
    category: 'Outboard Motor',
    image: cfg.ogImage,
    offers: cfg.variants.map((v) => ({
      '@type': 'Offer',
      name: v.name,
      price: String(v.hbwPrice),
      priceCurrency: 'CAD',
      availability: 'https://schema.org/InStoreOnly',
      itemCondition: 'https://schema.org/NewCondition',
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'CA',
        returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
      },
      url: canonical,
      seller: {
        '@type': 'AutoDealer',
        name: 'Harris Boat Works',
        url: 'https://www.harrisboatworks.ca',
      },
    })),
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (cfg.faq || []).map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
  return [productSchema, faqSchema];
}

export function buildLineupLandingTableBodyHtml(cfg, escapeHtml = defaultEscapeHtml) {
  return (cfg.variants || []).map((v) =>
    `<tr><th scope="row">${escapeHtml(v.name)}</th><td>${escapeHtml(v.hp)}</td><td>${escapeHtml(v.config)}</td><td>${formatLandingCad(v.msrp)}</td><td><strong>${formatLandingCad(v.hbwPrice)}</strong></td><td>${formatLandingCad(v.msrp - v.hbwPrice)}</td><td>${escapeHtml(v.availabilityLabel)}</td></tr>`
  ).join('');
}

export function buildLineupLandingNoscriptHtml(cfg, {
  escapeHtml = defaultEscapeHtml,
  crossLinksHtml = '',
} = {}) {
  const rows = buildLineupLandingTableBodyHtml(cfg, escapeHtml);
  const tableCaption = cfg.tableCaption || cfg.tableTitle;
  return (
    '<p><a href="/quote/motor-selection">Build Your Quote</a> &nbsp; <a href="tel:+19053422153">Call 905-342-2153</a></p>' +
    `<h2>${escapeHtml(tableCaption)}</h2>` +
    `<table><caption>${escapeHtml(tableCaption)}</caption>` +
    `<thead><tr><th scope="col">Model</th><th scope="col">HP</th><th scope="col">${escapeHtml(cfg.configColLabel)}</th><th scope="col">MSRP</th><th scope="col">HBW Price</th><th scope="col">You Save</th><th scope="col">Availability</th></tr></thead>` +
    `<tbody>${rows}</tbody></table>` +
    `<p><small>${escapeHtml(cfg.tableNote)}</small></p>` +
    '<h2>Which one for which boat?</h2>' +
    (cfg.whichOne || cfg.whichOneParagraphs || []).map((p) => `<p>${escapeHtml(p)}</p>`).join('') +
    '<h2>Why buy your Mercury from Harris Boat Works</h2>' +
    '<p>Mercury dealer since 1965, Mercury Premier tier today, third-generation family business on the same Rice Lake dock since 1947. We sell, rig, water-test, and service the motor every season after. And the price you see here is the price the sales desk sees.</p>' +
    '<h2>Frequently asked questions</h2>' +
    '<dl>' +
    (cfg.faq || []).map((i) =>
      `<dt><strong>${escapeHtml(i.question)}</strong></dt><dd>${escapeHtml(i.answer)}</dd>`
    ).join('') +
    '</dl>' +
    crossLinksHtml +
    `<h2>${escapeHtml(cfg.finalCtaHeading)}</h2>` +
    '<p>Real price, in writing. Pickup at Gores Landing. <a href="/quote/motor-selection">Build Your Quote</a> or call <a href="tel:+19053422153">905-342-2153</a>.</p>'
  );
}
