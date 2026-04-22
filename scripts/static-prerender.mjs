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

function motorSelectionPageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/quote/motor-selection#webpage`,
        "url": `${SITE_URL}/quote/motor-selection`,
        "name": "Mercury Outboard Motors for Sale Ontario | Build Your Quote | Harris Boat Works",
        "description": "Browse Mercury outboard motors from 2.5HP to 600HP. Configure your motor, compare options, and get instant CAD pricing online.",
        "isPartOf": { "@id": "https://mercuryrepower.ca/#website" },
        "about": { "@id": "https://mercuryrepower.ca/#localbusiness" },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/quote/motor-selection#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/quote/motor-selection#itemlist` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/quote/motor-selection#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Quote Builder", "item": `${SITE_URL}/quote/motor-selection` },
          { "@type": "ListItem", "position": 3, "name": "Motor Selection", "item": `${SITE_URL}/quote/motor-selection` }
        ]
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/quote/motor-selection#itemlist`,
        "name": "Mercury Outboard Motor Inventory",
        "description": "Complete selection of Mercury Marine outboard motors available at Harris Boat Works",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "item": {
              "@type": "Product",
              "name": "Mercury FourStroke Outboards",
              "description": "Fuel-efficient four-stroke outboard motors. Available from 2.5HP to 400HP.",
              "brand": { "@type": "Brand", "name": "Mercury Marine" },
              "category": "Outboard Motors",
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": 1500,
                "highPrice": 45000,
                "priceCurrency": "CAD",
                "availability": "https://schema.org/InStock",
                "seller": { "@id": "https://mercuryrepower.ca/#organization" }
              }
            }
          },
          {
            "@type": "ListItem",
            "position": 2,
            "item": {
              "@type": "Product",
              "name": "Mercury Pro XS Outboards",
              "description": "High-performance outboard motors designed for bass boats and tournament fishing.",
              "brand": { "@type": "Brand", "name": "Mercury Marine" },
              "category": "Performance Outboard Motors",
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": 8000,
                "highPrice": 35000,
                "priceCurrency": "CAD",
                "availability": "https://schema.org/InStock",
                "seller": { "@id": "https://mercuryrepower.ca/#organization" }
              }
            }
          },
          {
            "@type": "ListItem",
            "position": 3,
            "item": {
              "@type": "Product",
              "name": "Mercury SeaPro Outboards",
              "description": "Commercial-grade outboard motors built for heavy-duty use and reliability.",
              "brand": { "@type": "Brand", "name": "Mercury Marine" },
              "category": "Commercial Outboard Motors",
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": 3500,
                "highPrice": 30000,
                "priceCurrency": "CAD",
                "availability": "https://schema.org/InStock",
                "seller": { "@id": "https://mercuryrepower.ca/#organization" }
              }
            }
          },
          {
            "@type": "ListItem",
            "position": 4,
            "item": {
              "@type": "Product",
              "name": "Mercury ProKicker Outboards",
              "description": "Dedicated trolling and kicker motors for fishing boats with high-thrust gearcase.",
              "brand": { "@type": "Brand", "name": "Mercury Marine" },
              "category": "Kicker / Trolling Motors",
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": 4500,
                "highPrice": 6500,
                "priceCurrency": "CAD",
                "availability": "https://schema.org/InStock",
                "seller": { "@id": "https://mercuryrepower.ca/#organization" }
              }
            }
          }
        ]
      }
    ]
  };
}

function boatInfoPageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/quote/boat-info#webpage`,
        "url": `${SITE_URL}/quote/boat-info`,
        "name": "Boat Information — Mercury Quote Builder | Harris Boat Works",
        "description": "Tell us about your boat so we can confirm motor compatibility, shaft length, controls, and rigging requirements for your Mercury outboard quote.",
        "isPartOf": { "@id": "https://mercuryrepower.ca/#website" },
        "about": { "@id": "https://mercuryrepower.ca/#localbusiness" },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/quote/boat-info#breadcrumb` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/quote/boat-info#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Motor Selection", "item": `${SITE_URL}/quote/motor-selection` },
          { "@type": "ListItem", "position": 3, "name": "Boat Information", "item": `${SITE_URL}/quote/boat-info` }
        ]
      },
      {
        "@type": "HowTo",
        "@id": `${SITE_URL}/quote/boat-info#howto`,
        "name": "Build a Mercury Outboard Quote at Harris Boat Works",
        "description": "Three-step online configurator for a real Mercury outboard quote with live CAD pricing.",
        "step": [
          { "@type": "HowToStep", "position": 1, "name": "Select your Mercury motor", "text": "Choose horsepower, shaft length, start type, and controls.", "url": `${SITE_URL}/quote/motor-selection` },
          { "@type": "HowToStep", "position": 2, "name": "Tell us about your boat", "text": "Provide boat make, model, length, current motor, and rigging details so we can confirm compatibility.", "url": `${SITE_URL}/quote/boat-info` },
          { "@type": "HowToStep", "position": 3, "name": "Review your quote", "text": "Get itemized CAD pricing, financing estimates, trade-in value, and active promotions.", "url": `${SITE_URL}/quote/summary` }
        ]
      }
    ]
  };
}

function quoteSummaryPageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/quote/summary#webpage`,
        "url": `${SITE_URL}/quote/summary`,
        "name": "Your Mercury Outboard Quote Estimate | Harris Boat Works",
        "description": "Itemized Mercury outboard quote with live CAD pricing, financing estimates, trade-in credit, and current promotional savings.",
        "isPartOf": { "@id": "https://mercuryrepower.ca/#website" },
        "about": { "@id": "https://mercuryrepower.ca/#localbusiness" },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/quote/summary#breadcrumb` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/quote/summary#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Motor Selection", "item": `${SITE_URL}/quote/motor-selection` },
          { "@type": "ListItem", "position": 3, "name": "Boat Information", "item": `${SITE_URL}/quote/boat-info` },
          { "@type": "ListItem", "position": 4, "name": "Quote Summary", "item": `${SITE_URL}/quote/summary` }
        ]
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/quote/summary#estimate-service`,
        "name": "Mercury Outboard Quote Estimate",
        "serviceType": "Online Motor Quote Estimate",
        "provider": { "@id": "https://mercuryrepower.ca/#organization" },
        "areaServed": [
          { "@type": "State", "name": "Ontario" },
          { "@type": "Country", "name": "Canada" }
        ],
        "offers": {
          "@type": "Offer",
          "priceCurrency": "CAD",
          "availability": "https://schema.org/InStock",
          "seller": { "@id": "https://mercuryrepower.ca/#organization" }
        }
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
// Pilot SEO landing pages — Batch 1
// ============================================================

function mercuryRepowerFaqSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/mercury-repower-faq#webpage`,
        "url": `${SITE_URL}/mercury-repower-faq`,
        "name": "Mercury Outboard Repower FAQ — Every Question Answered | Harris Boat Works",
        "description": "Comprehensive Mercury repower FAQ covering 20+ buying, financing, installation, and warranty questions. Mercury Marine Platinum Dealer since 1965.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/mercury-repower-faq#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/mercury-repower-faq#faqpage` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/mercury-repower-faq#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Mercury Repower FAQ", "item": `${SITE_URL}/mercury-repower-faq` }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/mercury-repower-faq#faqpage`,
        "name": "Mercury Outboard Repower FAQ",
        "url": `${SITE_URL}/mercury-repower-faq`,
        "mainEntity": faqItems.map(i => ({
          "@type": "Question",
          "name": i.question,
          "acceptedAnswer": { "@type": "Answer", "text": i.answer }
        }))
      }
    ]
  };
}

const HOWTO_FAQ_PRERENDER = [
  {
    question: "How long does the full repower process take?",
    answer: "From quote to keys-in-hand, most repowers take two to four weeks. The actual install is one to three days once your boat is on site. Spring (March–May) is busiest — book in fall or winter for priority scheduling."
  },
  {
    question: "Do I need to bring my boat for the consultation?",
    answer: "No. Start by building a real quote at mercuryrepower.ca, or call us at (905) 342-2153. We can confirm motor fit from your boat's make, model, year, transom height, and capacity plate. The boat only needs to come in for the actual install."
  },
  {
    question: "Can I supply my own motor for installation?",
    answer: "We install motors purchased from Harris Boat Works only. This protects your warranty (we register it directly with Mercury) and lets us guarantee the rigging, controls, and lake-test as one complete package."
  },
  {
    question: "What if my old motor is not a Mercury?",
    answer: "We repower all brands to Mercury — Yamaha, Honda, Suzuki, Johnson, Evinrude, Tohatsu. Full controls, rigging, and gauge changeover is included so the new Mercury runs correctly. Your old motor can be traded in or disposed of through us."
  },
  {
    question: "How do I pay the deposit and final balance?",
    answer: "Deposit is paid online when you build the quote — between $200 and $1,000 depending on motor HP, fully refundable on stock motors. Final balance is due at pickup. We accept e-transfer, debit, credit card, certified cheque, and dealer financing."
  }
];

function howToRepowerSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/how-to-repower-a-boat#webpage`,
        "url": `${SITE_URL}/how-to-repower-a-boat`,
        "name": "How to Repower a Boat — 7-Step Mercury Repower Process | Harris Boat Works",
        "description": "Step-by-step guide to repowering a boat with a new Mercury outboard: quote, sizing, deposit, scheduling, install, lake-test, and pickup.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/how-to-repower-a-boat#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/how-to-repower-a-boat#howto` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/how-to-repower-a-boat#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "How to Repower a Boat", "item": `${SITE_URL}/how-to-repower-a-boat` }
        ]
      },
      {
        "@type": "HowTo",
        "@id": `${SITE_URL}/how-to-repower-a-boat#howto`,
        "name": "How to Repower a Boat with a New Mercury Outboard",
        "description": "The seven-step Harris Boat Works Mercury repower process — from online quote to lake-tested pickup at Gores Landing on Rice Lake.",
        "totalTime": "P21D",
        "estimatedCost": { "@type": "MonetaryAmount", "currency": "CAD", "value": "12000" },
        "supply": [
          { "@type": "HowToSupply", "name": "Boat capacity plate (transom HP rating)" },
          { "@type": "HowToSupply", "name": "Boat make, model, and year" },
          { "@type": "HowToSupply", "name": "Transom height measurement" },
          { "@type": "HowToSupply", "name": "Photo ID for motor pickup" }
        ],
        "tool": [
          { "@type": "HowToTool", "name": "Online quote builder at mercuryrepower.ca" }
        ],
        "step": [
          { "@type": "HowToStep", "position": 1, "name": "Build Your Quote Online", "text": "Use the configurator at mercuryrepower.ca to choose your Mercury motor (FourStroke, Pro XS, SeaPro, or ProKicker), shaft length, and controls. You'll see live CAD pricing, financing estimates, and any active promotions instantly — no forms, no waiting.", "url": `${SITE_URL}/quote/motor-selection` },
          { "@type": "HowToStep", "position": 2, "name": "Confirm Motor & Shaft Fit", "text": "Tell us your boat's make, model, transom height, and capacity plate HP rating. We'll confirm the right Mercury HP, shaft length (15\", 20\", or 25\"), and whether you need Command Thrust for a pontoon or heavy hull." },
          { "@type": "HowToStep", "position": 3, "name": "Place Your Deposit", "text": "Secure your motor with a refundable deposit ($200–$1,000 depending on HP) paid online. This locks in the price, holds your spot in the install queue, and starts the order if the motor isn't already in stock." },
          { "@type": "HowToStep", "position": 4, "name": "Schedule the Install", "text": "Book your drop-off date at Harris Boat Works in Gores Landing on Rice Lake. Most installs are 1–3 days. Submit a service request at hbw.wiki/service or call (905) 342-2153." },
          { "@type": "HowToStep", "position": 5, "name": "Professional Install & Rigging", "text": "Our Mercury-certified technicians remove your old motor, install the new Mercury, and replace throttle, shift, steering, fuel lines, and gauges as needed. Full rigging is included in every repower package — no surprise add-ons." },
          { "@type": "HowToStep", "position": 6, "name": "Lake Test on Rice Lake", "text": "Every repower is lake-tested on Rice Lake before pickup. We confirm WOT RPM, prop pitch, idle, shifting, and trim. If anything's off, we adjust before you ever see the bill." },
          { "@type": "HowToStep", "position": 7, "name": "Pickup & Walk-Through", "text": "Pickup is by appointment at Gores Landing — about 20–30 minutes. Bring photo ID and your purchase order. We register the warranty, walk you through controls and break-in, and you're on the water. Pickup only — no shipping." }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/how-to-repower-a-boat#faqpage`,
        "mainEntity": HOWTO_FAQ_PRERENDER.map(i => ({
          "@type": "Question",
          "name": i.question,
          "acceptedAnswer": { "@type": "Answer", "text": i.answer }
        }))
      }
    ]
  };
}

const TRUST_FAQ_PRERENDER = [
  { question: "Is Harris Boat Works an authorized Mercury Marine dealer?", answer: "Yes. Harris Boat Works has been an authorized Mercury Marine dealer since 1965 — over 60 years. We currently hold Mercury Marine Platinum Dealer status, the highest tier in Mercury's North American dealer program, awarded for sales volume, technician certification, and customer service." },
  { question: "What does Mercury Platinum Dealer status mean?", answer: "Platinum is Mercury Marine's top dealer rating in North America. It requires Mercury-certified technicians, a minimum sales and service volume, full warranty registration capability, and consistently high CSI (Customer Satisfaction Index) scores. Only a small percentage of Mercury dealers reach Platinum, and re-qualification is required every year." },
  { question: "How long has Harris Boat Works been in business?", answer: "The Harris family founded the boat works in 1947 on Rice Lake in Gores Landing, Ontario. We're now a third-generation, family-owned marina with 79 years of continuous operation. Mercury dealer since 1965." },
  { question: "Where is Harris Boat Works located?", answer: "5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0 — on the south shore of Rice Lake. About 35 minutes from Peterborough, 20 minutes from Cobourg, 90 minutes from Toronto, and within 200 km of the entire GTA, Kawarthas, and Northumberland County." },
  { question: "Do you sell motors to customers across Canada?", answer: "Yes — we sell to customers across Ontario and beyond. However, all motors are pickup only at our Gores Landing location. We do not ship outboards. This is intentional: every motor includes a personal walk-through covering controls, break-in procedure, and warranty registration. That hand-off is part of why we hold Platinum Dealer status." },
  { question: "What Mercury motor lines do you carry?", answer: "We carry the full Mercury outboard lineup: portable FourStroke (2.5–20hp), mid-range FourStroke (25–115hp), Command Thrust (40–150hp for pontoons and heavy hulls), Pro XS performance (115–300hp), SeaPro commercial-duty, ProKicker trolling motors (9.9hp/15hp), and FourStroke V8 (250–300hp). We also stock genuine Mercury parts, oils, and accessories." },
  { question: "Are your prices in Canadian dollars?", answer: "Yes — all pricing on mercuryrepower.ca is in Canadian dollars (CAD), all-in. The price you see is the price you pay (plus HST). No US-dollar conversions, no hidden fees, no \"call for price\" games." },
  { question: "Do you offer Mercury financing?", answer: "Yes — financing is available on Mercury motor purchases through DealerPlan and other lenders. The configurator at mercuryrepower.ca shows monthly payment estimates (8.99% under $10K total / 7.99% over $10K total) alongside the purchase price. Minimum financed amount is $5,000." },
  { question: "What warranty comes with a new Mercury outboard?", answer: "Every new Mercury outboard comes with a 3-year limited factory warranty as standard. Right now, when you buy from Harris Boat Works, you get 7 years of full Mercury factory-backed coverage — no third-party insurance, just straight Mercury protection. We register the warranty directly with Mercury Marine at the time of pickup." },
  { question: "Are Mercury motors made in Canada?", answer: "Mercury Marine is headquartered in Fond du Lac, Wisconsin, USA, where most outboard motors are manufactured. Mercury has been building outboards since 1939 and is one of the largest marine engine manufacturers in the world. Harris Boat Works has been the authorized Canadian Mercury dealer for the Rice Lake / Kawartha region since 1965." },
  { question: "Do you service motors purchased elsewhere?", answer: "Yes — our Mercury-certified service department works on Mercury and MerCruiser motors regardless of where they were purchased. We handle warranty work, repower, winterization, spring launch, and routine maintenance. Submit a service request at hbw.wiki/service or call (905) 342-2153." },
  { question: "Why buy from Harris Boat Works instead of a big-box marine retailer?", answer: "Three reasons: (1) Platinum Dealer status means our technicians, parts inventory, and warranty access are at the highest Mercury tier. (2) Family-owned since 1947 — we answer the phone, we know our customers, and the same people sell, install, and service the motor. (3) Real online pricing with live CAD quotes — no \"call for price\" runaround. What you see at mercuryrepower.ca is what you pay." }
];

function mercuryDealerCanadaSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/mercury-dealer-canada-faq#webpage`,
        "url": `${SITE_URL}/mercury-dealer-canada-faq`,
        "name": "Why Buy from Harris Boat Works — Mercury Dealer Canada FAQ | Family-Owned Since 1947",
        "description": "Trust questions about Harris Boat Works: Mercury Platinum Dealer status, family ownership since 1947, dealer since 1965, warranty, financing, Canadian pricing, full Mercury lineup.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/mercury-dealer-canada-faq#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/mercury-dealer-canada-faq#faqpage` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/mercury-dealer-canada-faq#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Mercury Dealer Canada FAQ", "item": `${SITE_URL}/mercury-dealer-canada-faq` }
        ]
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        "name": "Harris Boat Works",
        "alternateName": "HBW",
        "url": "https://www.harrisboatworks.ca/",
        "logo": "https://www.harrisboatworks.ca/logo.png",
        "foundingDate": "1947",
        "founder": { "@type": "Person", "name": "Harris family" },
        "description": "Third-generation family marina established in 1947 on Rice Lake in Gores Landing, Ontario. Mercury Marine dealer since 1965 and current Mercury Marine Platinum Dealer.",
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
        "award": ["Mercury Marine Platinum Dealer", "Authorized Legend Boats Dealer"],
        "knowsAbout": ["Mercury outboard motors", "MerCruiser sterndrives", "Marine repower", "Boat winterization", "Boat storage"],
        "sameAs": [
          "https://www.harrisboatworks.ca/",
          "https://www.facebook.com/harrisboatworks",
          "https://www.instagram.com/harrisboatworks",
          "https://www.youtube.com/@HarrisBoatWorks",
          "https://g.page/harrisboatworks"
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/mercury-dealer-canada-faq#faqpage`,
        "mainEntity": TRUST_FAQ_PRERENDER.map(i => ({
          "@type": "Question",
          "name": i.question,
          "acceptedAnswer": { "@type": "Answer", "text": i.answer }
        }))
      }
    ]
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
    schemas: [aboutPageSchema()]
  },
  {
    path: '/contact',
    title: 'Contact Harris Boat Works | Mercury Dealer Rice Lake Ontario',
    description: 'Contact Harris Boat Works in Gores Landing on Rice Lake. Phone (905) 342-2153. Mercury repower quotes, service, and parts. Pickup only — no shipping.',
    h1: 'Contact Harris Boat Works',
    intro: 'Reach Harris Boat Works at 5369 Harris Boat Works Rd, Gores Landing, Ontario. Phone (905) 342-2153. Email info@harrisboatworks.ca. Pickup only at Gores Landing — no shipping.',
    schemas: [contactPageSchema()]
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
    title: 'Mercury Outboard Motors for Sale Ontario | 2.5HP-600HP | Harris Boat Works',
    description: 'Browse Mercury outboard motors from 2.5HP to 600HP. FourStroke, Pro XS, SeaPro, ProKicker. Configure online and get instant CAD pricing — Harris Boat Works since 1965.',
    h1: 'Build Your Mercury Outboard Quote',
    intro: 'Select a Mercury outboard motor to build a real quote with live CAD pricing, financing, and trade-in. No forms, no waiting. Harris Boat Works — Mercury dealer since 1965.',
    schemas: [motorSelectionPageSchema()]
  },
  {
    path: '/quote/boat-info',
    title: 'Boat Information — Mercury Quote Builder | Harris Boat Works',
    description: 'Tell us about your boat to confirm motor compatibility, shaft length, controls, and rigging for your Mercury outboard quote. Step 2 of the Harris Boat Works quote builder.',
    h1: 'Tell Us About Your Boat',
    intro: 'Provide your boat make, model, length, current motor, and rigging details so we can confirm Mercury motor compatibility and finalize your quote.',
    schemas: [boatInfoPageSchema()]
  },
  {
    path: '/quote/summary',
    title: 'Your Mercury Outboard Quote Estimate | Harris Boat Works',
    description: 'Review your itemized Mercury outboard quote with live CAD pricing, financing estimates, trade-in credit, and current promotions. Harris Boat Works — Mercury dealer since 1965.',
    h1: 'Your Mercury Outboard Quote',
    intro: 'Review your itemized Mercury outboard quote with live CAD pricing, financing estimates, trade-in credit, and any current promotional savings. Save it, download a PDF, or place a deposit.',
    schemas: [quoteSummaryPageSchema()]
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
