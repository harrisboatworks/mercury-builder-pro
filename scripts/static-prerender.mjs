/**
 * Static HTML stamping for crawler-friendly per-route HTML.
 *
 * Reads dist/index.html (the SPA shell Vite produces), then for each
 * configured route writes dist/{route}/index.html with:
 *   - per-route <title>
 *   - per-route <meta name="description">
 *   - per-route JSON-LD <script> blocks injected before </head>
 *   - per-route <noscript> semantic fallback inside <div id="root">
 *
 * Real users still get the React SPA — it hydrates over the stamped shell.
 * Crawlers (Googlebot, Meta-ExternalAgent, Perplexity, ChatGPT) get real
 * page-specific content with no browser dependency.
 *
 * Replaces the puppeteer-based prerender pipeline, which couldn't run on
 * Vercel's build container (missing Chromium shared libs).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = join(ROOT, 'dist');
const SHELL_PATH = join(DIST, 'index.html');
const SITE_URL = 'https://mercuryrepower.ca';
const MIN_BYTES = 4 * 1024;

if (!existsSync(SHELL_PATH)) {
  console.error(`[static-prerender] FATAL: ${SHELL_PATH} not found — run vite build first`);
  process.exit(1);
}

const shell = readFileSync(SHELL_PATH, 'utf8');

// Load FAQ items via tsx subprocess (faqData.ts uses TS + lucide imports).
// We only need question/answer strings, stripped of HTML tags.
function loadFaqItems() {
  const dumpScript = `
    import { getAllFAQItems } from '../src/data/faqData.ts';
    const items = getAllFAQItems().map(i => ({
      question: i.question,
      answer: i.answer.replace(/<[^>]*>/g, '')
    }));
    process.stdout.write(JSON.stringify(items));
  `;
  const tmpFile = join(ROOT, 'scripts', '.faq-dump.mts');
  writeFileSync(tmpFile, dumpScript);
  try {
    const out = execSync(`npx tsx ${tmpFile}`, { cwd: ROOT, encoding: 'utf8' });
    return JSON.parse(out);
  } finally {
    try { execSync(`rm -f ${tmpFile}`); } catch {}
  }
}

const faqItems = loadFaqItems();
console.log(`[static-prerender] loaded ${faqItems.length} FAQ items`);

// ============================================================
// Schema definitions — kept in sync with src/components/seo/*SEO.tsx
// ============================================================

function homepageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://mercuryrepower.ca/#website",
        "url": "https://mercuryrepower.ca/",
        "name": "Mercury Repower Quote Builder",
        "publisher": { "@id": "https://mercuryrepower.ca/#organization" },
        "inLanguage": "en-CA"
      },
      {
        "@type": "WebPage",
        "@id": "https://mercuryrepower.ca/#webpage",
        "url": "https://mercuryrepower.ca/",
        "name": "Mercury Repower Quotes Online — Real Prices, No Forms | Harris Boat Works",
        "description": "Build a real Mercury outboard quote in 3 minutes. Live CAD pricing, financing, trade-in. Mercury Platinum Dealer on Rice Lake — family-owned since 1947, Mercury dealer since 1965.",
        "isPartOf": { "@id": "https://mercuryrepower.ca/#website" },
        "about": { "@id": "https://mercuryrepower.ca/#organization" },
        "primaryImageOfPage": { "@id": "https://mercuryrepower.ca/#logo" },
        "inLanguage": "en-CA"
      },
      {
        "@type": "Organization",
        "@id": "https://mercuryrepower.ca/#organization",
        "name": "Harris Boat Works",
        "alternateName": "HBW",
        "legalName": "Harris Boat Works",
        "url": "https://www.harrisboatworks.ca/",
        "logo": {
          "@type": "ImageObject",
          "@id": "https://mercuryrepower.ca/#logo",
          "url": "https://www.harrisboatworks.ca/logo.png",
          "caption": "Harris Boat Works"
        },
        "foundingDate": "1947",
        "founder": { "@type": "Person", "name": "Harris family" },
        "description": "Third-generation family marina on Rice Lake, Ontario. Mercury Marine Platinum Dealer (since 1965) and Legend Boats dealer.",
        "telephone": "+1-905-342-2153",
        "email": "info@harrisboatworks.ca",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "5369 Harris Boat Works Rd",
          "addressLocality": "Gores Landing",
          "addressRegion": "ON",
          "postalCode": "K0K 2E0",
          "addressCountry": "CA"
        },
        "sameAs": [
          "https://www.harrisboatworks.ca/",
          "https://www.facebook.com/harrisboatworks",
          "https://www.instagram.com/harrisboatworks",
          "https://www.youtube.com/@HarrisBoatWorks",
          "https://g.page/harrisboatworks"
        ]
      },
      {
        "@type": ["LocalBusiness", "Store", "AutoRepair"],
        "@id": "https://mercuryrepower.ca/#localbusiness",
        "name": "Harris Boat Works",
        "image": "https://www.harrisboatworks.ca/logo.png",
        "url": "https://www.harrisboatworks.ca/",
        "telephone": "+1-905-342-2153",
        "email": "info@harrisboatworks.ca",
        "priceRange": "$$",
        "parentOrganization": { "@id": "https://mercuryrepower.ca/#organization" },
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "5369 Harris Boat Works Rd",
          "addressLocality": "Gores Landing",
          "addressRegion": "ON",
          "postalCode": "K0K 2E0",
          "addressCountry": "CA"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 44.1122,
          "longitude": -78.0245
        },
        "areaServed": [
          { "@type": "AdministrativeArea", "name": "Rice Lake" },
          { "@type": "AdministrativeArea", "name": "Kawartha Lakes" },
          { "@type": "State", "name": "Ontario" },
          { "@type": "Country", "name": "Canada" }
        ],
        "makesOffer": [
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Mercury outboard repower" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Mercury & MerCruiser marine repair" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Winterization and spring launch" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Indoor and outdoor boat storage" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "New Legend boat sales" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Boat rentals" } }
        ],
        "brand": [
          { "@type": "Brand", "name": "Mercury Marine" },
          { "@type": "Brand", "name": "Legend Boats" }
        ],
        "award": "Mercury Marine Platinum Dealer"
      },
      {
        "@type": "Service",
        "@id": "https://mercuryrepower.ca/#quote-service",
        "name": "Mercury Outboard Online Quote Builder",
        "serviceType": "Online Motor Quote",
        "provider": { "@id": "https://mercuryrepower.ca/#organization" },
        "areaServed": [
          { "@type": "State", "name": "Ontario" },
          { "@type": "Country", "name": "Canada" }
        ]
      }
    ]
  };
}

function aboutPageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": "https://mercuryrepower.ca/about#webpage",
        "url": "https://mercuryrepower.ca/about",
        "name": "About Harris Boat Works",
        "description": "Family-owned Mercury dealer on Rice Lake, Ontario since 1947.",
        "isPartOf": { "@id": "https://mercuryrepower.ca/#website" },
        "about": { "@id": "https://mercuryrepower.ca/#organization" },
        "inLanguage": "en-CA"
      },
      {
        "@type": "Organization",
        "@id": "https://mercuryrepower.ca/#organization",
        "name": "Harris Boat Works",
        "alternateName": "HBW",
        "url": "https://www.harrisboatworks.ca/",
        "logo": "https://www.harrisboatworks.ca/logo.png",
        "foundingDate": "1947",
        "founder": { "@type": "Person", "name": "Harris family" },
        "description": "Third-generation family marina established in 1947 on Rice Lake in Gores Landing, Ontario. Mercury Marine dealer since 1965 and current Mercury Marine Platinum Dealer. Authorized Legend Boats dealer.",
        "slogan": "Real prices. Family-owned. Since 1947.",
        "telephone": "+1-905-342-2153",
        "email": "info@harrisboatworks.ca",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "5369 Harris Boat Works Rd",
          "addressLocality": "Gores Landing",
          "addressRegion": "ON",
          "postalCode": "K0K 2E0",
          "addressCountry": "CA"
        },
        "award": [
          "Mercury Marine Platinum Dealer",
          "Authorized Legend Boats Dealer"
        ],
        "knowsAbout": [
          "Mercury outboard motors",
          "MerCruiser sterndrives",
          "Marine repower",
          "Boat winterization",
          "Boat storage",
          "Legend Boats"
        ],
        "sameAs": [
          "https://www.harrisboatworks.ca/",
          "https://www.facebook.com/harrisboatworks",
          "https://www.instagram.com/harrisboatworks",
          "https://www.youtube.com/@HarrisBoatWorks",
          "https://g.page/harrisboatworks"
        ]
      }
    ]
  };
}

function contactPageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": "https://mercuryrepower.ca/contact#webpage",
        "url": "https://mercuryrepower.ca/contact",
        "name": "Contact Harris Boat Works",
        "description": "Mercury dealer on Rice Lake — phone (905) 342-2153, text (647) 952-2153, email info@harrisboatworks.ca.",
        "isPartOf": { "@id": "https://mercuryrepower.ca/#website" },
        "about": { "@id": "https://mercuryrepower.ca/#localbusiness" },
        "inLanguage": "en-CA"
      },
      {
        "@type": ["LocalBusiness", "Store", "AutoRepair"],
        "@id": "https://mercuryrepower.ca/#localbusiness",
        "name": "Harris Boat Works",
        "image": "https://www.harrisboatworks.ca/logo.png",
        "url": "https://www.harrisboatworks.ca/",
        "priceRange": "$$",
        "telephone": "+1-905-342-2153",
        "email": "info@harrisboatworks.ca",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "5369 Harris Boat Works Rd",
          "addressLocality": "Gores Landing",
          "addressRegion": "ON",
          "postalCode": "K0K 2E0",
          "addressCountry": "CA"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 44.1122,
          "longitude": -78.0245
        },
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "contactType": "sales",
            "telephone": "+1-905-342-2153",
            "email": "info@harrisboatworks.ca",
            "areaServed": "CA",
            "availableLanguage": "English"
          },
          {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "telephone": "+1-647-952-2153",
            "contactOption": "TollFree",
            "areaServed": "CA",
            "availableLanguage": "English"
          }
        ],
        "areaServed": [
          { "@type": "AdministrativeArea", "name": "Rice Lake" },
          { "@type": "AdministrativeArea", "name": "Kawartha Lakes" },
          { "@type": "State", "name": "Ontario" },
          { "@type": "Country", "name": "Canada" }
        ],
        "sameAs": [
          "https://www.harrisboatworks.ca/",
          "https://www.facebook.com/harrisboatworks",
          "https://www.instagram.com/harrisboatworks",
          "https://www.youtube.com/@HarrisBoatWorks",
          "https://g.page/harrisboatworks"
        ]
      }
    ]
  };
}

function repowerSchema() {
  const repowerQuestions = [
    'What does it mean to repower a boat?',
    'How much does a Mercury repower cost?',
    'How long does a Mercury repower take?',
    'Can I repower a pontoon boat?',
    'Is it worth repowering my boat or should I buy a new boat?',
  ];
  const items = repowerQuestions
    .map(q => faqItems.find(i => i.question === q))
    .filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `${SITE_URL}/#business`,
        "name": "Harris Boat Works",
        "description": "Mercury Certified Repower Center serving Ontario boaters since 1947. Pickup only at Gores Landing.",
        "url": SITE_URL,
        "telephone": "(905) 342-2153",
        "email": "info@harrisboatworks.ca",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "5369 Harris Boat Works Rd",
          "addressLocality": "Gores Landing",
          "addressRegion": "ON",
          "postalCode": "K0K 2E0",
          "addressCountry": "CA"
        },
        "geo": { "@type": "GeoCoordinates", "latitude": 44.1147, "longitude": -78.2564 },
        "foundingDate": "1947",
        "priceRange": "$$"
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/repower#service`,
        "name": "Mercury Outboard Repower Service",
        "serviceType": "Boat Motor Replacement",
        "provider": { "@id": `${SITE_URL}/#business` },
        "areaServed": ["Rice Lake", "Kawarthas", "Peterborough", "GTA", "Toronto", "Ontario"],
        "description": "Professional Mercury outboard motor repower service. 70% of the benefit of a new boat for 30% of the cost.",
        "offers": {
          "@type": "Offer",
          "priceRange": "$8,000 - $18,000",
          "priceCurrency": "CAD"
        }
      },
      {
        "@type": "HowTo",
        "name": "The Harris Boat Works Repower Process",
        "step": [
          { "@type": "HowToStep", "position": 1, "name": "Consultation & Quote", "text": "We assess your boat and recommend the right Mercury motor" },
          { "@type": "HowToStep", "position": 2, "name": "Scheduling", "text": "Book your installation with the shortest wait times in the area" },
          { "@type": "HowToStep", "position": 3, "name": "Professional Installation", "text": "Mercury-certified technicians install your new motor in 1-2 days" },
          { "@type": "HowToStep", "position": 4, "name": "Lake Test", "text": "We lake test on Rice Lake and walk you through every feature" }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": items.map(i => ({
          "@type": "Question",
          "name": i.question,
          "acceptedAnswer": { "@type": "Answer", "text": i.answer }
        }))
      }
    ]
  };
}

function faqPageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/faq#faqpage`,
        "name": "Mercury Outboard Repower FAQ — Harris Boat Works",
        "url": `${SITE_URL}/faq`,
        "mainEntity": faqItems.map(i => ({
          "@type": "Question",
          "name": i.question,
          "acceptedAnswer": { "@type": "Answer", "text": i.answer }
        }))
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/faq#webpage`,
        "url": `${SITE_URL}/faq`,
        "name": "Mercury Outboard Repower FAQ | Harris Boat Works"
      }
    ]
  };
}

function genericPageSchema(path, name, description) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}${path}#webpage`,
    "url": `${SITE_URL}${path}`,
    "name": name,
    "description": description
  };
}

// ============================================================
// Route configuration
// ============================================================

const routes = [
  {
    path: '/',
    title: 'Mercury Repower Quotes Online — Real Prices, No Forms | Harris Boat Works',
    description: 'Build a real Mercury outboard quote in 3 minutes. Live CAD pricing, financing, trade-in. Mercury Platinum Dealer on Rice Lake — family-owned since 1947, Mercury dealer since 1965.',
    h1: 'Mercury Outboard Quotes — Real Prices, No Forms',
    intro: 'Build a real Mercury outboard quote online in three minutes. Live CAD pricing, financing options, and trade-in estimates. Family-owned Mercury Platinum Dealer on Rice Lake since 1947, selling Mercury since 1965.',
    schemas: [homepageSchema()]
  },
  {
    path: '/repower',
    title: 'Mercury Outboard Repower Ontario | 70% of the Benefit for 30% of the Cost | Harris Boat Works',
    description: 'Expert Mercury repower in Ontario. Get 70% of a new boat experience for 30% of the cost. 30-40% better fuel economy. Lake tested on Rice Lake. Mercury dealer since 1965. $8,000-$18,000 typical.',
    h1: 'Mercury Outboard Repower in Ontario',
    intro: 'Repowering your boat with a new Mercury outboard delivers about 70 percent of the benefit of buying a new boat at roughly 30 percent of the cost. Most repowers run $8,000 to $18,000 depending on horsepower and rigging. Pickup only at Gores Landing on Rice Lake — no shipping. Mercury Marine Platinum Dealer since 1965.',
    schemas: [repowerSchema()]
  },
  {
    path: '/faq',
    title: 'Mercury Outboard Repower FAQ — Harris Boat Works | mercuryrepower.ca',
    description: "Get expert answers to 24 Mercury outboard repower questions. Choosing the right HP, SmartCraft Connect, repower costs, financing, pontoon repowers, winterization — from Ontario's Mercury Marine Platinum Dealer since 1947.",
    h1: 'Mercury Outboard Repower FAQ',
    intro: 'Comprehensive answers to the most common Mercury outboard repower questions. Choosing, buying, financing, and installing — expert advice from Ontario\'s Mercury Marine Platinum Dealer since 1947.',
    schemas: [faqPageSchema()],
    extraNoscript: () =>
      '<dl>' +
      faqItems.map(i =>
        `<dt><strong>${escapeHtml(i.question)}</strong></dt><dd>${escapeHtml(i.answer)}</dd>`
      ).join('') +
      '</dl>'
  },
  {
    path: '/about',
    title: 'About Harris Boat Works | Mercury Dealer Since 1965 — Rice Lake, Ontario',
    description: 'Family-owned Mercury Marine Platinum Dealer on Rice Lake, Ontario. Founded in 1947, selling Mercury outboards since 1965. Repower specialists serving Ontario boaters.',
    h1: 'About Harris Boat Works',
    intro: 'Harris Boat Works is a family-owned Mercury Marine Platinum Dealer on Rice Lake, Ontario. Founded in 1947 and selling Mercury since 1965, we are repower and outboard specialists serving Ontario boaters.',
    schemas: [genericPageSchema('/about', 'About Harris Boat Works', 'Family-owned Mercury dealer on Rice Lake, Ontario since 1947.')]
  },
  {
    path: '/contact',
    title: 'Contact Harris Boat Works | Mercury Dealer Rice Lake Ontario',
    description: 'Contact Harris Boat Works in Gores Landing on Rice Lake. Phone (905) 342-2153. Mercury repower quotes, service, and parts. Pickup only — no shipping.',
    h1: 'Contact Harris Boat Works',
    intro: 'Reach Harris Boat Works at 5369 Harris Boat Works Rd, Gores Landing, Ontario. Phone (905) 342-2153. Email info@harrisboatworks.ca. Pickup only at Gores Landing — no shipping.',
    schemas: [genericPageSchema('/contact', 'Contact Harris Boat Works', 'Mercury dealer on Rice Lake — phone (905) 342-2153.')]
  },
  {
    path: '/blog',
    title: 'Mercury Motor Guides & Boating Tips | Harris Boat Works Blog',
    description: 'Expert advice on Mercury outboard motors, boat maintenance, and buying guides. Mercury dealer since 1965, helping Ontario boaters make informed decisions.',
    h1: 'Mercury Motor Guides & Boating Tips',
    intro: 'Expert advice on Mercury outboard motors, repowers, boat maintenance, and buying guides from Ontario\'s Mercury Marine Platinum Dealer since 1947.',
    schemas: [genericPageSchema('/blog', 'Harris Boat Works Blog', 'Mercury motor guides and boating tips.')]
  },
  {
    path: '/agents',
    title: 'AI Voice & Chat Agents | Harris Boat Works Mercury Dealer',
    description: 'Talk or chat with Harris, the AI assistant for Harris Boat Works. Get Mercury outboard quotes, answers about repowering, and inventory checks 24/7.',
    h1: 'AI Voice & Chat Agents',
    intro: 'Harris is the Harris Boat Works AI assistant. Talk or chat for Mercury outboard quotes, repower advice, and live inventory information at any time.',
    schemas: [genericPageSchema('/agents', 'Harris AI Agents', 'Voice and chat AI for Mercury quotes and inventory.')]
  },
  {
    path: '/quote/motor-selection',
    title: 'Build Your Mercury Outboard Quote | Harris Boat Works',
    description: 'Select your Mercury outboard motor and build a real quote with live pricing, financing, and trade-in. No forms, no waiting — Harris Boat Works since 1965.',
    h1: 'Build Your Mercury Outboard Quote',
    intro: 'Select a Mercury outboard motor to build a real quote with live CAD pricing, financing, and trade-in. No forms, no waiting. Harris Boat Works — Mercury dealer since 1965.',
    schemas: [genericPageSchema('/quote/motor-selection', 'Build Your Mercury Quote', 'Live Mercury outboard pricing and quote builder.')]
  }
];

// ============================================================
// Stamping
// ============================================================

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stamp(route) {
  let html = shell;

  // <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(route.title)}</title>`);

  // <meta name="description">
  const metaDesc = `<meta name="description" content="${escapeHtml(route.description)}" />`;
  if (/<meta\s+name=["']description["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta\s+name=["']description["'][^>]*>/i, metaDesc);
  } else {
    html = html.replace(/<\/head>/i, `${metaDesc}\n  </head>`);
  }

  // canonical
  const canonical = `<link rel="canonical" href="${SITE_URL}${route.path === '/' ? '' : route.path}" />`;
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, canonical);
  } else {
    html = html.replace(/<\/head>/i, `${canonical}\n  </head>`);
  }

  // JSON-LD blocks
  const jsonLdBlocks = route.schemas
    .map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join('\n  ');
  html = html.replace(/<\/head>/i, `${jsonLdBlocks}\n  </head>`);

  // <noscript> semantic fallback inside <div id="root">
  const extra = route.extraNoscript ? route.extraNoscript() : '';
  const noscript =
    `<noscript>` +
      `<header><h1>${escapeHtml(route.h1)}</h1></header>` +
      `<main><p>${escapeHtml(route.intro)}</p>${extra}</main>` +
      `<footer><p>Harris Boat Works · 5369 Harris Boat Works Rd, Gores Landing, ON · (905) 342-2153</p></footer>` +
    `</noscript>`;
  html = html.replace(/<div id="root">\s*<\/div>/i, `<div id="root"></div>${noscript}`);

  return html;
}

let failures = 0;
for (const route of routes) {
  const html = stamp(route);
  const outDir = route.path === '/' ? DIST : join(DIST, route.path.replace(/^\//, ''));
  if (route.path !== '/') mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, 'index.html');
  writeFileSync(outFile, html, 'utf8');

  const size = statSync(outFile).size;
  const sizeKb = (size / 1024).toFixed(1);
  if (size < MIN_BYTES) {
    console.error(`[static-prerender] TOO SMALL (${sizeKb} KB < ${MIN_BYTES / 1024} KB): ${outFile}`);
    failures++;
    continue;
  }
  // Title presence check: confirm the stamping replaced the shell <title>
  if (!html.includes('<title>')) {
    console.error(`[static-prerender] NO TITLE TAG: ${outFile}`);
    failures++;
    continue;
  }
  console.log(`[static-prerender] wrote ${outFile.replace(DIST, 'dist')} (${sizeKb} KB)`);
}

if (failures > 0) {
  console.error(`[static-prerender] ${failures} route(s) failed sanity check`);
  process.exit(1);
}

console.log(`[static-prerender] ✓ ${routes.length} routes prerendered`);
