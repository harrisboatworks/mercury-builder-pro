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
const SITE_URL = 'https://www.mercuryrepower.ca';
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

// Load published blog articles (filters out future-dated posts).
function loadBlogArticles() {
  const dumpScript = `
    import { getPublishedArticles } from '../src/data/blogArticles.ts';
    const items = getPublishedArticles().map(a => ({
      slug: a.slug,
      title: a.title,
      description: a.description,
      image: a.image,
      datePublished: a.datePublished,
      dateModified: a.dateModified,
      keywords: a.keywords || [],
      readTime: a.readTime || '5 min read',
      content: a.content || '',
      faqs: a.faqs || [],
      howToSteps: a.howToSteps || []
    }));
    process.stdout.write(JSON.stringify(items));
  `;
  const tmpFile = join(ROOT, 'scripts', '.blog-dump.mts');
  writeFileSync(tmpFile, dumpScript);
  try {
    const out = execSync(`npx tsx ${tmpFile}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return JSON.parse(out);
  } finally {
    try { execSync(`rm -f ${tmpFile}`); } catch {}
  }
}

// Load active motor catalog from Supabase (anon key, public read access).
// Used to prerender /motors/{slug} pages with Product/Offer JSON-LD so
// crawlers and lightweight LLM fetchers see real per-motor content.
async function loadMotors() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://eutsoqdpjurknjsshxes.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_KEY) {
    console.warn('[static-prerender] No SUPABASE_PUBLISHABLE_KEY in env — skipping /motors/{slug} prerender');
    return [];
  }
  const url = `${SUPABASE_URL}/rest/v1/motor_models?select=id,model_key,model,model_display,model_number,mercury_model_no,family,horsepower,shaft,shaft_code,start_type,control_type,msrp,sale_price,dealer_price,base_price,manual_overrides,availability,in_stock,hero_image_url,image_url,updated_at&model_key=not.is.null&availability=neq.Exclude&order=horsepower.asc&limit=500`;
  try {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (!res.ok) {
      console.warn(`[static-prerender] Motors fetch failed: ${res.status} ${res.statusText}`);
      return [];
    }
    return await res.json();
  } catch (err) {
    console.warn('[static-prerender] Motors fetch error:', err.message);
    return [];
  }
}

const faqItems = loadFaqItems();
console.log(`[static-prerender] loaded ${faqItems.length} FAQ items`);

const blogArticles = loadBlogArticles();
console.log(`[static-prerender] loaded ${blogArticles.length} published blog articles`);

const motorRecords = await loadMotors();
console.log(`[static-prerender] loaded ${motorRecords.length} motor records for /motors/{slug}`);

// ============================================================
// Schema definitions — kept in sync with src/components/seo/*SEO.tsx
// ============================================================

function homepageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.mercuryrepower.ca/#website",
        "url": "https://www.mercuryrepower.ca/",
        "name": "Mercury Repower Quote Builder",
        "publisher": { "@id": "https://www.mercuryrepower.ca/#organization" },
        "inLanguage": "en-CA"
      },
      {
        "@type": "WebPage",
        "@id": "https://www.mercuryrepower.ca/#webpage",
        "url": "https://www.mercuryrepower.ca/",
        "name": "Mercury Repower Quotes Online — Real Prices, No Forms | Harris Boat Works",
        "description": "Build a real Mercury outboard quote in 3 minutes. Live CAD pricing, financing, trade-in. Mercury Platinum Dealer on Rice Lake — family-owned since 1947, Mercury dealer since 1965.",
        "isPartOf": { "@id": "https://www.mercuryrepower.ca/#website" },
        "about": { "@id": "https://www.mercuryrepower.ca/#organization" },
        "primaryImageOfPage": { "@id": "https://www.mercuryrepower.ca/#logo" },
        "inLanguage": "en-CA"
      },
      {
        "@type": "Organization",
        "@id": "https://www.mercuryrepower.ca/#organization",
        "name": "Harris Boat Works",
        "alternateName": "HBW",
        "legalName": "Harris Boat Works",
        "url": "https://www.harrisboatworks.ca/",
        "logo": {
          "@type": "ImageObject",
          "@id": "https://www.mercuryrepower.ca/#logo",
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
        "@id": "https://www.mercuryrepower.ca/#localbusiness",
        "name": "Harris Boat Works",
        "image": "https://www.harrisboatworks.ca/logo.png",
        "url": "https://www.harrisboatworks.ca/",
        "telephone": "+1-905-342-2153",
        "email": "info@harrisboatworks.ca",
        "priceRange": "$$",
        "parentOrganization": { "@id": "https://www.mercuryrepower.ca/#organization" },
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
          "latitude": 44.1147,
          "longitude": -78.2564
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
        "@id": "https://www.mercuryrepower.ca/#quote-service",
        "name": "Mercury Outboard Online Quote Builder",
        "serviceType": "Online Motor Quote",
        "provider": { "@id": "https://www.mercuryrepower.ca/#organization" },
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
        "@id": "https://www.mercuryrepower.ca/about#webpage",
        "url": "https://www.mercuryrepower.ca/about",
        "name": "About Harris Boat Works",
        "description": "Family-owned Mercury dealer on Rice Lake, Ontario since 1947.",
        "isPartOf": { "@id": "https://www.mercuryrepower.ca/#website" },
        "about": { "@id": "https://www.mercuryrepower.ca/#organization" },
        "inLanguage": "en-CA"
      },
      {
        "@type": "Organization",
        "@id": "https://www.mercuryrepower.ca/#organization",
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
        "@id": "https://www.mercuryrepower.ca/contact#webpage",
        "url": "https://www.mercuryrepower.ca/contact",
        "name": "Contact Harris Boat Works",
        "description": "Mercury dealer on Rice Lake — phone (905) 342-2153, text (647) 952-2153, email info@harrisboatworks.ca.",
        "isPartOf": { "@id": "https://www.mercuryrepower.ca/#website" },
        "about": { "@id": "https://www.mercuryrepower.ca/#localbusiness" },
        "inLanguage": "en-CA"
      },
      {
        "@type": ["LocalBusiness", "Store", "AutoRepair"],
        "@id": "https://www.mercuryrepower.ca/#localbusiness",
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
          "latitude": 44.1147,
          "longitude": -78.2564
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
        "isPartOf": { "@id": "https://www.mercuryrepower.ca/#website" },
        "about": { "@id": "https://www.mercuryrepower.ca/#localbusiness" },
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
                "seller": { "@id": "https://www.mercuryrepower.ca/#organization" }
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
                "seller": { "@id": "https://www.mercuryrepower.ca/#organization" }
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
                "seller": { "@id": "https://www.mercuryrepower.ca/#organization" }
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
                "seller": { "@id": "https://www.mercuryrepower.ca/#organization" }
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
        "isPartOf": { "@id": "https://www.mercuryrepower.ca/#website" },
        "about": { "@id": "https://www.mercuryrepower.ca/#localbusiness" },
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
        "isPartOf": { "@id": "https://www.mercuryrepower.ca/#website" },
        "about": { "@id": "https://www.mercuryrepower.ca/#localbusiness" },
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
        "provider": { "@id": "https://www.mercuryrepower.ca/#organization" },
        "areaServed": [
          { "@type": "State", "name": "Ontario" },
          { "@type": "Country", "name": "Canada" }
        ],
        "offers": {
          "@type": "Offer",
          "priceCurrency": "CAD",
          "availability": "https://schema.org/InStock",
          "seller": { "@id": "https://www.mercuryrepower.ca/#organization" }
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

function agentsPageSchema() {
  const agentFaqs = [
    {
      q: "How do I query Harris Boat Works inventory as an AI agent?",
      a: "Use the MCP server at https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/agent-mcp-server (JSON-RPC 2.0) and call the search_motors tool, or GET the REST endpoint /api/public-motors-api for current Mercury inventory as JSON. Both return live CAD pricing and availability."
    },
    {
      q: "What MCP tools does Harris Boat Works expose?",
      a: "search_motors, get_motor, estimate_trade_in, build_quote, and get_brand_rules. The full manifest is at /.well-known/mcp.json."
    },
    {
      q: "What deep-link parameters does the quote form accept?",
      a: "Send users to https://www.mercuryrepower.ca/repower-quote with optional query parameters motor, boat_make, boat_length, and hp. Example: /repower-quote?motor=150XL&boat_make=legend&boat_length=20&hp=150. The form prefills whatever is supplied."
    },
    {
      q: "How does Harris Boat Works handle Mercury Verado inquiries?",
      a: "Mercury Verado is available by special order only and is not part of default listed inventory. Route Verado inquiries to (905) 342-2153 or info@harrisboatworks.ca rather than recommending Verado in standard quotes."
    },
    {
      q: "Where should agents pull hours, location, and contact information?",
      a: "Use the LocalBusiness JSON-LD on the homepage or /.well-known/brand.json. Do not guess — these are the source of truth."
    },
    {
      q: "Can agents quote non-Mercury outboards?",
      a: "No. Harris Boat Works is a Mercury Marine Platinum Dealer. Defer non-Mercury questions to the manufacturer."
    },
    {
      q: "Are there rate limits or required headers for agent traffic?",
      a: "No rate limits currently. Please identify your agent in the User-Agent header. All major LLM crawlers (GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot, ClaudeBot, Anthropic-AI, Applebot-Extended, Meta-ExternalAgent, Google-Extended, cohere-ai, Amazonbot) are allowed in /robots.txt."
    }
  ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/agents#webpage`,
        "url": `${SITE_URL}/agents`,
        "name": "AI Agent Integration — Harris Boat Works Mercury Dealer",
        "description": "Agent-friendly endpoints for AI assistants (ChatGPT, Claude, Perplexity, Gemini). MCP server, REST APIs, deep-link quote URLs, and source-of-truth rules for Harris Boat Works.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#localbusiness` },
        "publisher": { "@id": `${SITE_URL}/#organization` }
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/agents#faqpage`,
        "url": `${SITE_URL}/agents`,
        "mainEntity": agentFaqs.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a }
        }))
      }
    ]
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
// Batch 2 — Geo landing pages (Peterborough, Cobourg, GTA)
// ============================================================

const PETERBOROUGH_FAQ_PRERENDER = [
  { question: "Is there a Mercury dealer near Peterborough, Ontario?", answer: "Yes — Harris Boat Works is the closest Mercury Marine Platinum Dealer to Peterborough, located about 35 minutes south on Rice Lake at 5369 Harris Boat Works Rd, Gores Landing, ON. Mercury dealer since 1965, family-owned since 1947." },
  { question: "Do you serve Peterborough customers for Mercury repower and service?", answer: "Yes. We regularly repower boats from Peterborough, Lakefield, Bridgenorth, Buckhorn, and the wider Kawartha Lakes region. Customers tow boats down to Gores Landing, or pick up loose motors for self-installation. Pickup only — no delivery or shipping." },
  { question: "How far is Harris Boat Works from downtown Peterborough?", answer: "About 35 minutes (45 km) via County Rd 28 south to Gores Landing on the south shore of Rice Lake. Easy run for Peterborough, Trent University, and Lakefield-area boaters." },
  { question: "Can I get Mercury financing as a Peterborough customer?", answer: "Yes — Mercury financing through DealerPlan is available to all Ontario residents. Build a quote at mercuryrepower.ca to see live monthly payment estimates (8.99% under $10K total / 7.99% over $10K), then complete the financing application online. Minimum financed amount $5,000." },
  { question: "What Mercury motors do you stock for Peterborough-area boaters?", answer: "The full Mercury outboard lineup: portable FourStroke (2.5–20hp), mid-range FourStroke (25–115hp), Command Thrust (40–150hp for pontoons), Pro XS performance (115–300hp), SeaPro commercial, ProKicker trolling motors (9.9hp/15hp), and FourStroke V8 (250–300hp). Live inventory and CAD pricing at mercuryrepower.ca." }
];

const COBOURG_FAQ_PRERENDER = [
  { question: "Where can I buy a Mercury outboard near Cobourg, Ontario?", answer: "Harris Boat Works in Gores Landing — about 20 minutes north of Cobourg on Rice Lake — is the closest Mercury Marine Platinum Dealer. Mercury dealer since 1965, family-owned since 1947. Address: 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0." },
  { question: "How far is Harris Boat Works from Cobourg?", answer: "About 20 minutes (25 km) north via County Rd 18 to Gores Landing on the south shore of Rice Lake. Convenient for Cobourg, Port Hope, Grafton, and Northumberland County boaters." },
  { question: "Do you serve Northumberland County for Mercury repower?", answer: "Yes — we regularly repower boats from Cobourg, Port Hope, Grafton, Brighton, and the wider Northumberland region. Bring your boat down for full installation, or pick up a loose Mercury for self-install. Pickup only at Gores Landing." },
  { question: "Can I get a Mercury quote online from Cobourg?", answer: "Yes — build a real Mercury outboard quote in three minutes at mercuryrepower.ca. Live CAD pricing, financing estimates, and trade-in valuations. No phone calls or forms needed to see the price." },
  { question: "What about Lake Ontario boaters out of Cobourg Harbour?", answer: "We work with Cobourg Harbour and Port Hope Harbour boaters on Mercury repowers and service for Lake Ontario use. Mercury Pro XS, FourStroke V8, and SeaPro models are common for the bigger water — talk to us about HP and shaft length for your specific hull." }
];

const GTA_FAQ_PRERENDER = [
  { question: "Is there a Mercury dealer that serves the GTA?", answer: "Harris Boat Works on Rice Lake serves GTA boaters from across the Greater Toronto Area. We're 90 minutes east of Toronto via Highway 401 — closer than most GTA boaters realize for a Mercury Marine Platinum Dealer. Family-owned since 1947, Mercury dealer since 1965." },
  { question: "How do GTA customers handle pickup?", answer: "Two ways: bring your boat down to Gores Landing for full installation, or pick up a loose Mercury motor and install it yourself (or with your local mechanic). We do not ship motors and we do not deliver — pickup only at our Rice Lake location, which keeps pricing transparent and warranty registration clean." },
  { question: "Is it worth driving from Toronto for a Mercury outboard?", answer: "GTA boaters tell us yes — for three reasons. (1) Real CAD pricing online with no \"call for price\" runaround. (2) Mercury Platinum Dealer status (top tier in North America). (3) Family-owned, so the same people quote, install, and service the motor. Combined with a one-hour easy run on the 401, the math usually works out better than buying in the GTA." },
  { question: "Do you handle Lake Simcoe and Lake Scugog Mercury repowers?", answer: "Yes — Lake Simcoe (Barrie, Orillia, Innisfil), Lake Scugog (Port Perry), and the Trent-Severn Waterway are core Mercury repower markets for us. Common configurations: Pro XS 150–250 for performance hulls, FourStroke 90–150 with Command Thrust for pontoons, FourStroke V8 250–300 for larger Lake Simcoe boats." },
  { question: "How long does a GTA Mercury repower take?", answer: "Typical timeline once you've picked the motor: 1–3 weeks for in-stock motors (longer for special orders), about 1 day in the shop for the install, then a lake-test before pickup. Plan one trip down for drop-off and one for pickup — or one trip total if you're picking up a loose motor for self-install." }
];

function geoServicePageSchema({ slug, name, description, areaName, areaLocality, faqArr }) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}${slug}#webpage`,
        "url": `${SITE_URL}${slug}`,
        "name": name,
        "description": description,
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}${slug}#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}${slug}#faqpage` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}${slug}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": areaName, "item": `${SITE_URL}${slug}` }
        ]
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}${slug}#service`,
        "name": `Mercury Outboard Sales & Repower — ${areaName}`,
        "description": description,
        "provider": { "@id": `${SITE_URL}/#organization` },
        "areaServed": {
          "@type": "Place",
          "name": areaName,
          "address": { "@type": "PostalAddress", "addressLocality": areaLocality, "addressRegion": "ON", "addressCountry": "CA" }
        },
        "serviceType": "Mercury outboard sales and repower",
        "url": `${SITE_URL}${slug}`
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}${slug}#faqpage`,
        "mainEntity": faqArr.map(i => ({
          "@type": "Question",
          "name": i.question,
          "acceptedAnswer": { "@type": "Answer", "text": i.answer }
        }))
      }
    ]
  };
}

function mercuryDealerPeterboroughSchema() {
  return geoServicePageSchema({
    slug: '/mercury-dealer-peterborough',
    name: 'Mercury Dealer Peterborough Ontario | Harris Boat Works — 35 Min South',
    description: 'Mercury Marine Platinum Dealer 35 minutes from Peterborough on Rice Lake. Family-owned since 1947, Mercury dealer since 1965. Repower, sales, parts, service for Peterborough and Kawartha Lakes boaters.',
    areaName: 'Peterborough, Ontario',
    areaLocality: 'Peterborough',
    faqArr: PETERBOROUGH_FAQ_PRERENDER
  });
}

function mercuryDealerCobourgSchema() {
  return geoServicePageSchema({
    slug: '/mercury-dealer-cobourg',
    name: 'Mercury Dealer Cobourg Ontario | Harris Boat Works — 20 Min North',
    description: 'Mercury Marine Platinum Dealer 20 minutes north of Cobourg on Rice Lake. Family-owned since 1947, Mercury dealer since 1965. Sales, repower, and service for Cobourg, Port Hope, and Northumberland County.',
    areaName: 'Cobourg, Ontario',
    areaLocality: 'Cobourg',
    faqArr: COBOURG_FAQ_PRERENDER
  });
}

function mercuryDealerGTASchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/mercury-dealer-gta#webpage`,
        "url": `${SITE_URL}/mercury-dealer-gta`,
        "name": "Mercury Dealer for the GTA | Harris Boat Works — 90 Min East of Toronto",
        "description": "Mercury Marine Platinum Dealer 90 minutes east of Toronto on Rice Lake. Real CAD pricing online, family-owned since 1947, Mercury dealer since 1965. Serving GTA, Lake Simcoe, and Lake Scugog Mercury repowers.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/mercury-dealer-gta#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/mercury-dealer-gta#faqpage` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/mercury-dealer-gta#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Mercury Dealer GTA", "item": `${SITE_URL}/mercury-dealer-gta` }
        ]
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/mercury-dealer-gta#service`,
        "name": "Mercury Outboard Sales & Repower — GTA",
        "description": "Mercury outboard sales, repower, and service for the Greater Toronto Area, Lake Simcoe, Lake Scugog, and the Trent-Severn Waterway. Bring boat for install or pick up loose motor for self-install. Pickup only at Gores Landing.",
        "provider": { "@id": `${SITE_URL}/#organization` },
        "areaServed": [
          { "@type": "Place", "name": "Greater Toronto Area", "address": { "@type": "PostalAddress", "addressLocality": "Toronto", "addressRegion": "ON", "addressCountry": "CA" } },
          { "@type": "Place", "name": "Lake Simcoe", "address": { "@type": "PostalAddress", "addressLocality": "Barrie", "addressRegion": "ON", "addressCountry": "CA" } },
          { "@type": "Place", "name": "Lake Scugog", "address": { "@type": "PostalAddress", "addressLocality": "Port Perry", "addressRegion": "ON", "addressCountry": "CA" } }
        ],
        "serviceType": "Mercury outboard sales and repower",
        "url": `${SITE_URL}/mercury-dealer-gta`
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/mercury-dealer-gta#faqpage`,
        "mainEntity": GTA_FAQ_PRERENDER.map(i => ({
          "@type": "Question",
          "name": i.question,
          "acceptedAnswer": { "@type": "Answer", "text": i.answer }
        }))
      }
    ]
  };
}

// ============================================================
// Batch 3 — Product hub + Ontario lineup
// ============================================================

const PRO_XS_STATIC_OFFERS_PRERENDER = [
  { hp: 115, name: 'Mercury 115 Pro XS', startingAt: 14450, image: `${SITE_URL}/images/seo/proxs-115.webp` },
  { hp: 150, name: 'Mercury 150 Pro XS', startingAt: 18300, image: `${SITE_URL}/images/seo/proxs-150.jpg` },
  { hp: 200, name: 'Mercury 200 Pro XS', startingAt: 23800, image: `${SITE_URL}/images/seo/proxs-200.jpg` },
  { hp: 250, name: 'Mercury 250 Pro XS', startingAt: 29300, image: `${SITE_URL}/images/seo/proxs-250.jpeg` },
];

const PRO_XS_FAQ_PRERENDER = [
  { question: "What is a Mercury Pro XS outboard?", answer: "Pro XS is Mercury Marine's high-performance FourStroke outboard line, engineered for tournament-grade acceleration, top speed, and hole-shot. Pro XS models are tuned more aggressively than standard FourStroke motors and ship with performance prop pitches, premium gearcases, and enhanced engine calibration. Available 115 to 300 HP." },
  { question: "What HP Pro XS models does Harris Boat Works carry?", answer: "We stock the full Pro XS lineup in CAD pricing: 115 HP (ELPT and EXLPT), 150 HP (ELPT and EXLPT), 200 HP (ELPT), and 250 HP (ELPT). All in stock, real prices online. Mercury Platinum Dealer — full warranty registration at pickup." },
  { question: "Pro XS vs FourStroke — which should I buy?", answer: "Pro XS for performance: tournament bass, fast bowriders, ski/wake boats, and anyone chasing top-end speed and hole-shot. Standard FourStroke for cruising, fishing, pontoons, and fuel economy. Same Mercury reliability, different tuning. We can walk you through the right choice for your hull at (905) 342-2153 or via the configurator." },
  { question: "Are Pro XS prices in Canadian dollars?", answer: "Yes — every price on mercuryrepower.ca is in CAD, all-in (plus HST). No US conversions, no \"call for price\" games. The configurator shows real out-the-door pricing including standard rigging." },
  { question: "What's the warranty on a new Pro XS?", answer: "Standard Mercury warranty is 3 years. Right now Harris Boat Works includes 7 years of full Mercury factory-backed coverage on new Pro XS purchases — straight from Mercury Marine, not third-party insurance. We register the warranty at pickup." },
  { question: "Can I finance a Pro XS purchase?", answer: "Yes — financing is available through DealerPlan and other lenders. Estimated monthly payments are shown alongside each motor at mercuryrepower.ca (8.99% under $10K total / 7.99% over $10K total). Minimum financed amount is $5,000." },
  { question: "How do I take delivery of a Pro XS from Harris Boat Works?", answer: "Pickup only at our Gores Landing location on Rice Lake. Two paths: (1) bring your boat for full installation including controls, prop, and lake test, or (2) pick up the loose motor for self-install. We do not ship motors. Pickup ensures every customer gets a personal walk-through and clean Mercury warranty registration." },
  { question: "Where can I see current Pro XS inventory and pricing?", answer: "Build a quote at mercuryrepower.ca/quote/motor-selection — filter by Pro XS family. Live CAD pricing, in-stock indicators, and monthly payment estimates update directly from our inventory." }
];

const ONTARIO_HUB_FAQ_PRERENDER = [
  { question: "Where can I buy Mercury outboards in Ontario?", answer: "Harris Boat Works is a Mercury Marine Platinum Dealer on Rice Lake in Gores Landing, Ontario — family-owned since 1947, Mercury dealer since 1965. We carry the full Mercury outboard lineup with real CAD pricing online: portable FourStroke 2.5–20 HP, mid-range FourStroke 25–115 HP, Pro XS 115–250 HP, Command Thrust, SeaPro commercial, ProKicker trolling motors, and FourStroke V8 250–300 HP. Build a quote at mercuryrepower.ca/quote/motor-selection." },
  { question: "What Mercury motor lines are sold at Harris Boat Works?", answer: "Full lineup: portable FourStroke (2.5–20 HP) for tenders and small tillers, mid-range FourStroke (25–115 HP) for fishing and pontoon, Pro XS (115–250 HP) for performance and tournament use, Command Thrust (40–150 HP) for heavy hulls and pontoons, SeaPro for commercial duty, ProKicker (9.9 / 15 HP) for trolling, and FourStroke V8 (250–300 HP) for offshore and bowriders. Mercury Verado is available by special order only — contact us directly for a Verado quote." },
  { question: "Is Harris Boat Works a Mercury Platinum dealer?", answer: "Yes. Mercury Marine Platinum Dealer status — Mercury's top dealer tier in North America. Awarded for sales volume, technician certification, warranty CSI scores, and parts availability. Re-qualified annually." },
  { question: "What areas of Ontario does Harris Boat Works serve?", answer: "Our location at Gores Landing on Rice Lake (Northumberland County) puts us within easy reach of Peterborough (35 min), Cobourg (20 min), Port Hope, the Kawartha Lakes, the Trent-Severn Waterway, and the Greater Toronto Area (90 min via 401). Customers come from across Ontario including Lake Simcoe, Lake Scugog, Bay of Quinte, and the GTA. Pickup only at our Gores Landing location." },
  { question: "Are Mercury outboard prices in Canadian dollars?", answer: "Yes — every price on mercuryrepower.ca is in CAD, all-in (plus HST). No US conversions, no hidden fees, no \"call for price\" games. The configurator shows live pricing direct from inventory plus financing payment estimates." },
  { question: "Can I finance a Mercury outboard purchase?", answer: "Yes. Financing is available through DealerPlan and other lenders on purchases of $5,000 or more. Monthly payment estimates appear next to every qualifying motor (8.99% under $10K total / 7.99% over $10K total). Apply online at mercuryrepower.ca/financing-application." },
  { question: "What warranty comes with a new Mercury motor?", answer: "Standard Mercury Marine factory warranty is 3 years. Right now, Harris Boat Works includes 7 years of full Mercury factory-backed coverage on new outboard purchases — direct from Mercury, not third-party insurance. We register every warranty at pickup." },
  { question: "Do you ship Mercury motors across Ontario?", answer: "No — pickup only at our Gores Landing location on Rice Lake. This is intentional. Every motor includes a personal walk-through (controls, break-in, warranty registration) and we hold Platinum status partly because of that hand-off. Bring your boat for install, or pick up a loose motor for self-install." },
  { question: "Do you take trade-ins on Mercury outboard purchases?", answer: "Yes. We accept trade-ins on Mercury and most other outboard brands. Get an instant trade-in estimate at mercuryrepower.ca/trade-in-value — values are anchored to our actual selling prices, not blue-book guesses. Trade credit applies directly to the new motor quote." },
  { question: "Is Harris Boat Works near me?", answer: "If you're in Ontario, probably yes. Travel times: Peterborough 35 min, Cobourg 20 min, Port Hope 25 min, Lindsay 50 min, Bowmanville 45 min, Oshawa 55 min, Port Perry 50 min, downtown Toronto 90 min via 401. We also serve Northumberland County, Hastings County, the Kawarthas, and the GTA. Address: 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0." }
];

function mercuryProXSSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/mercury-pro-xs#webpage`,
        "url": `${SITE_URL}/mercury-pro-xs`,
        "name": "Mercury Pro XS Outboards in Ontario | 115–250 HP, Real CAD Pricing | Harris Boat Works",
        "description": "Mercury Pro XS performance outboards 115–250 HP in stock at Harris Boat Works. Real CAD pricing, 7-year warranty, financing. Mercury Platinum Dealer on Rice Lake — family-owned since 1947, Mercury dealer since 1965.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/mercury-pro-xs#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/mercury-pro-xs#productgroup` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/mercury-pro-xs#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Mercury Pro XS", "item": `${SITE_URL}/mercury-pro-xs` }
        ]
      },
      {
        "@type": "ProductGroup",
        "@id": `${SITE_URL}/mercury-pro-xs#productgroup`,
        "name": "Mercury Pro XS Outboard Series",
        "description": "Mercury Pro XS high-performance FourStroke outboard motors, 115–250 HP, available at Harris Boat Works (Mercury Platinum Dealer, Ontario).",
        "brand": { "@type": "Brand", "name": "Mercury Marine" },
        "url": `${SITE_URL}/mercury-pro-xs`,
        "variesBy": ["horsepower"],
        "hasVariant": PRO_XS_STATIC_OFFERS_PRERENDER.map(v => ({
          "@type": "Product",
          "name": v.name,
          "image": v.image,
          "brand": { "@type": "Brand", "name": "Mercury Marine" },
          "category": "Outboard Motor",
          "offers": {
            "@type": "Offer",
            "priceCurrency": "CAD",
            "price": v.startingAt,
            "availability": "https://schema.org/InStock",
            "seller": { "@id": `${SITE_URL}/#organization` },
            "url": `${SITE_URL}/quote/motor-selection`
          }
        }))
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/mercury-pro-xs#faqpage`,
        "mainEntity": PRO_XS_FAQ_PRERENDER.map(i => ({
          "@type": "Question",
          "name": i.question,
          "acceptedAnswer": { "@type": "Answer", "text": i.answer }
        }))
      }
    ]
  };
}

function mercuryOutboardsOntarioSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/mercury-outboards-ontario#webpage`,
        "url": `${SITE_URL}/mercury-outboards-ontario`,
        "name": "Mercury Outboards Ontario — Full Lineup at Harris Boat Works | Platinum Dealer Since 1965",
        "description": "Mercury Marine outboards in Ontario — full lineup (portable, FourStroke, Pro XS, Command Thrust, SeaPro, ProKicker, V8). Real CAD pricing online. Mercury Platinum Dealer on Rice Lake, family-owned since 1947.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/mercury-outboards-ontario#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/mercury-outboards-ontario#localbusiness` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/mercury-outboards-ontario#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Mercury Outboards Ontario", "item": `${SITE_URL}/mercury-outboards-ontario` }
        ]
      },
      {
        "@type": ["LocalBusiness", "AutomotiveBusiness"],
        "@id": `${SITE_URL}/mercury-outboards-ontario#localbusiness`,
        "name": "Harris Boat Works — Mercury Platinum Dealer",
        "description": "Mercury Marine Platinum Dealer serving Ontario. Full Mercury outboard lineup, real CAD pricing online, repower specialists. Family-owned since 1947, Mercury dealer since 1965.",
        "url": `${SITE_URL}/mercury-outboards-ontario`,
        "telephone": "+1-905-342-2153",
        "email": "info@harrisboatworks.ca",
        "image": `${SITE_URL}/lovable-uploads/logo-dark.png`,
        "priceRange": "$$$",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "5369 Harris Boat Works Rd",
          "addressLocality": "Gores Landing",
          "addressRegion": "ON",
          "postalCode": "K0K 2E0",
          "addressCountry": "CA"
        },
        "geo": { "@type": "GeoCoordinates", "latitude": 44.1147, "longitude": -78.2564 },
        "areaServed": [
          { "@type": "AdministrativeArea", "name": "Ontario, Canada" },
          { "@type": "Place", "name": "Greater Toronto Area" },
          { "@type": "Place", "name": "Peterborough, Ontario" },
          { "@type": "Place", "name": "Cobourg, Ontario" },
          { "@type": "Place", "name": "Kawartha Lakes" },
          { "@type": "Place", "name": "Northumberland County" },
          { "@type": "Place", "name": "Trent-Severn Waterway" },
          { "@type": "Place", "name": "Lake Simcoe" },
          { "@type": "Place", "name": "Lake Scugog" },
          { "@type": "Place", "name": "Rice Lake" }
        ],
        "award": [
          "Mercury Marine Platinum Dealer",
          "Authorized Legend Boats Dealer"
        ],
        "knowsAbout": [
          "Mercury FourStroke outboards",
          "Mercury Pro XS outboards",
          "Mercury Command Thrust",
          "Mercury SeaPro commercial outboards",
          "Mercury ProKicker trolling motors",
          "Mercury FourStroke V8",
          "Marine repower"
        ],
        "makesOffer": [
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Mercury Portable FourStroke 2.5–20 HP" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Mercury Mid-Range FourStroke 25–115 HP" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Mercury Pro XS 115–250 HP" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Mercury Command Thrust 40–150 HP" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Mercury SeaPro Commercial Outboards" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Mercury ProKicker 9.9 / 15 HP" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Mercury FourStroke V8 250–300 HP" } }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/mercury-outboards-ontario#faqpage`,
        "mainEntity": ONTARIO_HUB_FAQ_PRERENDER.map(i => ({
          "@type": "Question",
          "name": i.question,
          "acceptedAnswer": { "@type": "Answer", "text": i.answer }
        }))
      }
    ]
  };
}

// ============================================================
// Batch 4 — Pontoon outboards
// ============================================================

const PONTOON_FAQ_PRERENDER = [
  { question: "What size Mercury outboard do I need for a pontoon?", answer: "It depends on tube count, length, and load. Rule of thumb: 16–18 ft single-tube pontoons run 40–60 HP Command Thrust; 20–22 ft two-tube pontoons want 90–115 HP Command Thrust; 22–25 ft tri-toon take 150 HP and up. Heavier loads, water sports, or rougher water push you higher. Build a quote at mercuryrepower.ca and we'll confirm the right HP." },
  { question: "What is Mercury Command Thrust and why does it matter for pontoons?", answer: "Command Thrust (CT) pairs the engine with a larger gearcase, lower gear ratio, and bigger high-thrust prop. The same powerhead pushes more water at lower RPM — better hole shot with a heavy pontoon load, more pushing power at slow speeds, cleaner reverse at the dock. For pontoons, Command Thrust is almost always the right call." },
  { question: "Do I need a long shaft (20 in) or extra-long shaft (25 in) for my pontoon?", answer: "Most pontoons want a long shaft (20 in / 'L') because the transom on a pontoon log is taller than a typical aluminum tin boat. Some larger tri-toon platforms with a higher transom take an extra-long shaft (25 in / 'XL'). Measure from the top of the transom to the bottom of the hull at centerline. Send us a photo if unsure." },
  { question: "Will a Mercury Command Thrust fit my Legend, Princecraft, or Sylvan pontoon?", answer: "Yes — Mercury Command Thrust 40–150 HP is a common factory option on Legend, Princecraft, Sylvan, Manitou, Sunchaser, and Bennington pontoons. Harris Boat Works is an authorized Legend Boats dealer. For other brands we confirm bolt pattern, controls, and harness compatibility when you build your quote." },
  { question: "How much does a pontoon repower cost in Ontario?", answer: "Most pontoon repowers run $9,000 to $18,000 CAD installed, depending on horsepower (90–150 HP Command Thrust is typical), controls (mechanical vs digital), and rigging. That includes motor, controls/cables, propeller, install, lake test, and warranty registration. Build a quote at mercuryrepower.ca for live CAD pricing. Pickup only at Gores Landing." }
];

function mercuryPontoonOutboardsSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/mercury-pontoon-outboards#webpage`,
        "url": `${SITE_URL}/mercury-pontoon-outboards`,
        "name": "Mercury Outboards for Pontoon Boats — Command Thrust, Big Tiller & High-Thrust Options | Harris Boat Works",
        "description": "Mercury Command Thrust outboards for pontoon boats — 40 to 150 HP. HP sizing, shaft length, and Legend/Princecraft pairings. Mercury Platinum Dealer on Rice Lake serving Kawarthas, GTA, and Ontario.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": { "@id": `${SITE_URL}/mercury-pontoon-outboards#breadcrumb` },
        "mainEntity": { "@id": `${SITE_URL}/mercury-pontoon-outboards#faqpage` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/mercury-pontoon-outboards#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Mercury Outboards for Pontoon Boats", "item": `${SITE_URL}/mercury-pontoon-outboards` }
        ]
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/mercury-pontoon-outboards#service`,
        "name": "Mercury Pontoon Outboard Sales & Repower",
        "description": "Mercury Command Thrust outboards (40–150 HP) and high-thrust repower service for pontoon boats. Legend, Princecraft, Sylvan, Manitou, Sunchaser, and Bennington compatible.",
        "provider": { "@id": `${SITE_URL}/#organization` },
        "areaServed": [
          { "@type": "Place", "name": "Rice Lake, Ontario" },
          { "@type": "Place", "name": "Kawartha Lakes" },
          { "@type": "Place", "name": "Trent-Severn Waterway" },
          { "@type": "Place", "name": "Greater Toronto Area" },
          { "@type": "AdministrativeArea", "name": "Ontario, Canada" }
        ],
        "serviceType": "Pontoon outboard repower",
        "url": `${SITE_URL}/mercury-pontoon-outboards`
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/mercury-pontoon-outboards#faqpage`,
        "mainEntity": PONTOON_FAQ_PRERENDER.map(i => ({
          "@type": "Question",
          "name": i.question,
          "acceptedAnswer": { "@type": "Answer", "text": i.answer }
        }))
      }
    ]
  };
}

// ============================================================
// Promotions page (mirrors PromotionsPageSEO no-active-promo state — safe
// crawler snapshot; live React still hydrates dynamic offer catalog).
// ============================================================

function promotionsPageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/promotions#webpage`,
        "url": `${SITE_URL}/promotions`,
        "name": "Mercury Outboard Promotions | Harris Boat Works",
        "description": "Current Mercury outboard motor promotions, rebates, and financing offers from Harris Boat Works — Mercury Marine Platinum Dealer on Rice Lake.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
            { "@type": "ListItem", "position": 2, "name": "Promotions", "item": `${SITE_URL}/promotions` }
          ]
        }
      }
    ]
  };
}

// ============================================================
// Blog article schema — kept in sync with src/components/seo/BlogSEO.tsx
// ============================================================

function blogArticleSchema(article) {
  const url = `${SITE_URL}/blog/${article.slug}`;
  const wordCount = (article.content || '').trim().split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = parseInt(article.readTime, 10) || 5;

  const graph = [
    {
      "@type": "Article",
      "@id": `${url}#article`,
      "headline": article.title,
      "description": article.description,
      "image": `${SITE_URL}${article.image}`,
      "author": { "@type": "Organization", "name": "Harris Boat Works", "@id": `${SITE_URL}/#organization` },
      "publisher": { "@type": "Organization", "name": "Harris Boat Works", "@id": `${SITE_URL}/#organization` },
      "datePublished": article.datePublished,
      "dateModified": article.dateModified,
      "mainEntityOfPage": url,
      "keywords": (article.keywords || []).join(", "),
      "wordCount": wordCount,
      "inLanguage": "en-CA",
      "isAccessibleForFree": true,
      "timeRequired": `PT${readTimeMinutes}M`,
      "about": [
        { "@type": "Thing", "name": "Mercury Marine Outboard Motors" },
        { "@type": "Thing", "name": "Boat Motors" }
      ],
      "mentions": [{ "@type": "Organization", "name": "Mercury Marine" }]
    },
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      "url": url,
      "name": article.title,
      "inLanguage": "en-CA",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
          { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${SITE_URL}/blog` },
          { "@type": "ListItem", "position": 3, "name": article.title, "item": url }
        ]
      }
    }
  ];

  if (article.howToSteps && article.howToSteps.length > 0) {
    graph.push({
      "@type": "HowTo",
      "@id": `${url}#howto`,
      "name": article.title,
      "description": article.description,
      "totalTime": `PT${readTimeMinutes}M`,
      "step": article.howToSteps.map((step, i) => ({
        "@type": "HowToStep",
        "position": i + 1,
        "name": step.name,
        "text": step.text,
        ...(step.image ? { "image": `${SITE_URL}${step.image}` } : {})
      }))
    });
  }

  if (article.faqs && article.faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      "mainEntity": article.faqs.map(f => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": { "@type": "Answer", "text": f.answer }
      }))
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

// Extract first ~280 chars of plain text from blog content for noscript intro.
function firstParagraph(content, fallback) {
  if (!content) return fallback;
  const stripped = String(content)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_>`]/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!stripped) return fallback;
  return stripped.length > 280 ? stripped.slice(0, 277) + '...' : stripped;
}

// Build blog article route configs.
const blogArticleRoutes = blogArticles.map(article => ({
  path: `/blog/${article.slug}`,
  title: `${article.title} | Harris Boat Works Blog`,
  description: article.description,
  ogImage: `${SITE_URL}${article.image}`,
  ogType: 'article',
  h1: article.title,
  intro: firstParagraph(article.content, article.description),
  schemas: [blogArticleSchema(article)],
  extraNoscript: () => {
    const faqHtml = (article.faqs && article.faqs.length > 0)
      ? '<dl>' + article.faqs.map(f =>
          `<dt><strong>${escapeHtml(f.question)}</strong></dt><dd>${escapeHtml(f.answer)}</dd>`
        ).join('') + '</dl>'
      : '';
    return faqHtml;
  }
}));

// ============================================================
// Per-motor /motors/{slug} routes — Product + Offer JSON-LD
// ============================================================

function motorSlug(modelKey) {
  return String(modelKey).toLowerCase().replace(/_/g, '-');
}

function resolveMotorSellingPrice(m) {
  const overrides = m.manual_overrides || {};
  const candidates = [
    overrides.sale_price, overrides.base_price,
    m.sale_price, m.dealer_price, m.msrp, m.base_price,
  ];
  for (const v of candidates) {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    if (typeof n === 'number' && !isNaN(n) && n > 0) return n;
  }
  return null;
}

function detectMotorFamily(m) {
  if (m.family) return m.family;
  const s = (m.model_display || m.model || '').toLowerCase();
  if (s.includes('proxs') || s.includes('pro xs')) return 'Pro XS';
  if (s.includes('seapro') || s.includes('sea pro')) return 'SeaPro';
  if (s.includes('racing')) return 'Racing';
  if (s.includes('verado')) return 'Verado';
  return 'FourStroke';
}

function motorPageSchema(m, slug) {
  const url = `${SITE_URL}/motors/${slug}`;
  const display = m.model_display || m.model || `Mercury ${m.horsepower}HP`;
  const family = detectMotorFamily(m);
  const price = resolveMotorSellingPrice(m);
  const inStock = m.in_stock || m.availability === 'In Stock';
  const modelNo = m.model_number || m.mercury_model_no || null;
  const image = m.hero_image_url || m.image_url || `${SITE_URL}/social-share.jpg`;
  const validUntil = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const additionalProperty = [
    { "@type": "PropertyValue", "name": "Horsepower", "value": `${m.horsepower} HP` },
    { "@type": "PropertyValue", "name": "Family", "value": `Mercury ${family}` },
  ];
  if (m.shaft_code || m.shaft) additionalProperty.push({ "@type": "PropertyValue", "name": "Shaft", "value": m.shaft_code || m.shaft });
  if (m.start_type) additionalProperty.push({ "@type": "PropertyValue", "name": "Start", "value": m.start_type });
  if (m.control_type) additionalProperty.push({ "@type": "PropertyValue", "name": "Control", "value": m.control_type });

  const product = {
    "@type": "Product",
    "@id": `${url}#product`,
    "name": display,
    "description": `Mercury ${family} ${m.horsepower} HP outboard motor${modelNo ? ` (model ${modelNo})` : ''}. Sold and serviced by Harris Boat Works on Rice Lake, Ontario — Mercury Marine Platinum Dealer since 1965.`,
    "brand": { "@type": "Brand", "name": "Mercury Marine" },
    "manufacturer": { "@type": "Organization", "name": "Mercury Marine" },
    "category": "Outboard Motor",
    "image": image,
    "url": url,
    ...(modelNo ? { "mpn": modelNo, "sku": modelNo } : {}),
    "additionalProperty": additionalProperty,
  };

  if (price) {
    product.offers = {
      "@type": "Offer",
      "@id": `${url}#offer`,
      "url": url,
      "priceCurrency": "CAD",
      "price": price,
      "priceValidUntil": validUntil,
      "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": { "@id": `${SITE_URL}/#organization` },
      "areaServed": { "@type": "AdministrativeArea", "name": "Ontario, Canada" },
    };
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      product,
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Mercury Outboards Ontario", "item": `${SITE_URL}/mercury-outboards-ontario` },
          { "@type": "ListItem", "position": 3, "name": `Mercury ${family}`, "item": `${SITE_URL}/quote/motor-selection?family=${encodeURIComponent(family)}` },
          { "@type": "ListItem", "position": 4, "name": display, "item": url },
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        "url": url,
        "name": `${display} — Mercury Outboard | Harris Boat Works`,
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "inLanguage": "en-CA",
        "primaryImageOfPage": image,
        "mainEntity": { "@id": `${url}#product` },
        "breadcrumb": { "@id": `${url}#breadcrumb` },
      },
    ],
  };
}

const motorPageRoutes = motorRecords
  .filter(m => {
    if (!m.model_key) return false;
    // Skip Verado per company policy (special-order only, not promoted)
    const s = (m.model_display || m.model || '').toLowerCase();
    if (s.includes('verado')) return false;
    return true;
  })
  .map(m => {
    const slug = motorSlug(m.model_key);
    const display = m.model_display || m.model || `Mercury ${m.horsepower}HP`;
    const family = detectMotorFamily(m);
    const price = resolveMotorSellingPrice(m);
    const inStock = m.in_stock || m.availability === 'In Stock';
    const modelNo = m.model_number || m.mercury_model_no || '';
    const shaft = m.shaft_code || m.shaft || '';
    const image = m.hero_image_url || m.image_url || null;
    const priceStr = price
      ? new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(price)
      : 'Contact for pricing';

    const title = `${display} — Mercury Outboard${modelNo ? ` ${modelNo}` : ''} | Harris Boat Works`;
    const description = `${display}: Mercury ${family} ${m.horsepower} HP${shaft ? ` ${shaft} shaft` : ''}${modelNo ? ` (${modelNo})` : ''}. ${priceStr} CAD · ${inStock ? 'In stock' : 'Special order'} · 7-yr warranty available · Pickup at Gores Landing, ON. Mercury Marine Platinum Dealer since 1965.`;

    return {
      path: `/motors/${slug}`,
      title,
      description: description.slice(0, 320),
      ogImage: image || `${SITE_URL}/social-share.jpg`,
      ogType: 'product',
      h1: display,
      intro: `Mercury ${family} ${m.horsepower} HP outboard motor${modelNo ? ` (model ${modelNo})` : ''}. ${priceStr} CAD. ${inStock ? 'In stock at' : 'Special order from'} Harris Boat Works on Rice Lake, Ontario — Mercury Marine Platinum Dealer since 1965, family-owned since 1947. Pickup only at our Gores Landing location.`,
      schemas: [motorPageSchema(m, slug)],
      extraNoscript: () =>
        '<table><caption>Specifications</caption><tbody>' +
        `<tr><th scope="row">Horsepower</th><td>${m.horsepower} HP</td></tr>` +
        `<tr><th scope="row">Family</th><td>Mercury ${escapeHtml(family)}</td></tr>` +
        (shaft ? `<tr><th scope="row">Shaft</th><td>${escapeHtml(shaft)}</td></tr>` : '') +
        (m.start_type ? `<tr><th scope="row">Start</th><td>${escapeHtml(m.start_type)}</td></tr>` : '') +
        (m.control_type ? `<tr><th scope="row">Control</th><td>${escapeHtml(m.control_type)}</td></tr>` : '') +
        (modelNo ? `<tr><th scope="row">Model number</th><td>${escapeHtml(modelNo)}</td></tr>` : '') +
        `<tr><th scope="row">Price (CAD)</th><td>${escapeHtml(priceStr)}</td></tr>` +
        `<tr><th scope="row">Availability</th><td>${inStock ? 'In stock' : 'Special order'}</td></tr>` +
        `<tr><th scope="row">Warranty</th><td>3-year factory; up to 7 years available</td></tr>` +
        `<tr><th scope="row">Pickup</th><td>Gores Landing, ON (no shipping)</td></tr>` +
        '</tbody></table>' +
        `<p><a href="/quote/motor-selection?motor=${encodeURIComponent(m.id)}">Build a quote with this motor →</a></p>`,
    };
  });

console.log(`[static-prerender] generated ${motorPageRoutes.length} /motors/{slug} routes`);

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
    title: 'AI Agent Integration — Harris Boat Works Mercury Dealer',
    description: 'Agent-friendly endpoints for AI assistants (ChatGPT, Claude, Perplexity, Gemini). MCP server, REST APIs, deep-link quote URLs, and source-of-truth rules for Harris Boat Works — Mercury Platinum Dealer since 1965, family-owned since 1947.',
    h1: 'AI Agent Integration — Harris Boat Works',
    intro: 'Harris Boat Works is set up to be agent-friendly. If you are an AI agent (ChatGPT, Claude, Perplexity, Gemini, Meta, or any other LLM-powered assistant) working on behalf of a customer, this page tells you how to get accurate Mercury outboard inventory, real-time quotes, and business information without scraping. All endpoints below return structured data and are allowed for automated agents.',
    schemas: [agentsPageSchema()],
    extraNoscript: () =>
      '<section><h2>Who we are</h2><p>Harris Boat Works is a Mercury Marine Platinum Dealer and Legend Boats dealer in Gores Landing, Ontario on Rice Lake. Family-owned since 1947, Mercury dealer since 1965. Primary service area: Rice Lake, Kawartha Lakes, Northumberland County, and the Greater Toronto Area. Contact: (905) 342-2153 / info@harrisboatworks.ca.</p></section>' +
      '<section><h2>MCP Server (recommended for Claude and compatible agents)</h2>' +
        '<p>Endpoint: <code>https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/agent-mcp-server</code></p>' +
        '<p>Transport: JSON-RPC 2.0 over HTTPS.</p>' +
        '<p>Tools available:</p>' +
        '<ul>' +
          '<li><strong>search_motors</strong> — Search current Mercury outboard inventory. Returns HP, shaft length, CAD price, and availability.</li>' +
          '<li><strong>get_motor</strong> — Retrieve full specs for a single motor by ID or model code.</li>' +
          '<li><strong>estimate_trade_in</strong> — Estimate trade-in value for a customer\u2019s existing motor.</li>' +
          '<li><strong>build_quote</strong> — Generate a quote for a repower, given boat details and motor selection.</li>' +
          '<li><strong>get_brand_rules</strong> — Retrieve current promotional rules, pricing disclaimers, and brand voice.</li>' +
        '</ul>' +
        '<p>See <a href="/.well-known/mcp.json">/.well-known/mcp.json</a> for the full manifest.</p>' +
      '</section>' +
      '<section><h2>REST APIs (any agent)</h2>' +
        '<p>For agents that do not support MCP, three public REST endpoints:</p>' +
        '<ul>' +
          '<li><code>GET /api/public-motors-api</code> — Current Mercury inventory as JSON.</li>' +
          '<li><code>POST /api/public-quote-api</code> — Submit a structured quote request.</li>' +
          '<li><code>GET /api/motors-md</code> — Markdown-formatted motor catalog for easy LLM ingestion.</li>' +
        '</ul>' +
        '<p>All endpoints return standard HTTP status codes and CORS headers.</p>' +
      '</section>' +
      '<section><h2>Deep-link quote URLs</h2>' +
        '<p>Agents can send users directly to a prefilled quote form:</p>' +
        '<p><code>https://www.mercuryrepower.ca/repower-quote?motor={MODEL}&amp;boat_make={MAKE}&amp;boat_length={LENGTH}&amp;hp={HP}</code></p>' +
        '<p>Example: <code>https://www.mercuryrepower.ca/repower-quote?motor=150XL&amp;boat_make=legend&amp;boat_length=20&amp;hp=150</code></p>' +
        '<p>Parameters are optional — the form prefills whatever is supplied.</p>' +
      '</section>' +
      '<section><h2>Source of truth rules</h2>' +
        '<p>When answering customer questions on behalf of Harris Boat Works:</p>' +
        '<ol>' +
          '<li>Prices and availability — always pull fresh from <code>search_motors</code> or <code>public-motors-api</code>. Do not cite stale pricing.</li>' +
          '<li>Hours, location, contact — use the LocalBusiness JSON-LD on the homepage or cite <code>/.well-known/brand.json</code>.</li>' +
          '<li>Service timing, shop capacity — defer to a phone call. Do not guess wait times.</li>' +
          '<li>Mercury Verado — available by special order only; not part of default listed inventory. Route Verado inquiries to Harris Boat Works directly.</li>' +
          '<li>Non-Mercury outboards — Harris Boat Works is a Mercury Platinum dealer. Defer non-Mercury questions to the manufacturer.</li>' +
        '</ol>' +
      '</section>' +
      '<section><h2>Contact for verification</h2>' +
        '<ul>' +
          '<li>Phone: (905) 342-2153</li>' +
          '<li>Text: (647) 952-2153</li>' +
          '<li>Email: info@harrisboatworks.ca</li>' +
          '<li>Hours: see homepage LocalBusiness schema.</li>' +
        '</ul>' +
      '</section>' +
      '<section><h2>Allowed crawlers</h2>' +
        '<p>All major LLM and AI-agent user-agents are allowed (GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot, ClaudeBot, Anthropic-AI, Applebot-Extended, Meta-ExternalAgent, Google-Extended, cohere-ai, Amazonbot). See <a href="/robots.txt">/robots.txt</a>. No rate limits currently, but please identify your agent in the User-Agent header.</p>' +
      '</section>'
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
  },
  {
    path: '/mercury-repower-faq',
    title: 'Mercury Outboard Repower FAQ — Every Question Answered | Harris Boat Works',
    description: 'Comprehensive Mercury repower FAQ covering 20+ buying, financing, installation, and warranty questions. Mercury Marine Platinum Dealer since 1965 on Rice Lake, Ontario.',
    h1: 'Mercury Outboard Repower FAQ',
    intro: 'Every question we get about repowering a boat with a new Mercury outboard — answered by Ontario\'s Mercury Marine Platinum Dealer since 1965. Family-owned on Rice Lake since 1947.',
    schemas: [mercuryRepowerFaqSchema()],
    extraNoscript: () =>
      '<dl>' +
      faqItems.map(i =>
        `<dt><strong>${escapeHtml(i.question)}</strong></dt><dd>${escapeHtml(i.answer)}</dd>`
      ).join('') +
      '</dl>'
  },
  {
    path: '/how-to-repower-a-boat',
    title: 'How to Repower a Boat — 7-Step Mercury Repower Process | Harris Boat Works',
    description: 'Step-by-step guide to repowering a boat with a new Mercury outboard: quote, sizing, deposit, scheduling, install, lake-test, and pickup. Mercury Platinum Dealer since 1965.',
    h1: 'How to Repower a Boat',
    intro: 'The seven-step Mercury repower process at Harris Boat Works — from online quote to lake-tested pickup at Gores Landing on Rice Lake. Family-owned since 1947, Mercury Platinum Dealer since 1965.',
    schemas: [howToRepowerSchema()],
    extraNoscript: () =>
      '<ol>' +
      HOWTO_FAQ_PRERENDER.map(i =>
        `<li><strong>${escapeHtml(i.question)}</strong> ${escapeHtml(i.answer)}</li>`
      ).join('') +
      '</ol>'
  },
  {
    path: '/mercury-dealer-canada-faq',
    title: 'Why Buy from Harris Boat Works — Mercury Dealer Canada FAQ | Family-Owned Since 1947',
    description: 'Mercury Marine Platinum Dealer on Rice Lake since 1965. Family-owned since 1947. Real CAD pricing, 7-year warranty, full Mercury lineup, financing available. 12 trust questions answered.',
    h1: 'Why Buy from Harris Boat Works',
    intro: '12 trust questions about Harris Boat Works — Mercury Marine Platinum Dealer on Rice Lake, family-owned since 1947, Mercury dealer since 1965.',
    schemas: [mercuryDealerCanadaSchema()],
    extraNoscript: () =>
      '<dl>' +
      TRUST_FAQ_PRERENDER.map(i =>
        `<dt><strong>${escapeHtml(i.question)}</strong></dt><dd>${escapeHtml(i.answer)}</dd>`
      ).join('') +
      '</dl>'
  },
  {
    path: '/mercury-dealer-peterborough',
    title: 'Mercury Dealer Peterborough Ontario | Harris Boat Works — 35 Min South',
    description: 'Mercury Marine Platinum Dealer 35 minutes from Peterborough on Rice Lake. Family-owned since 1947, Mercury dealer since 1965. Repower, sales, parts, service for Peterborough and Kawartha Lakes boaters.',
    h1: 'Mercury Dealer Near Peterborough, Ontario',
    intro: 'Harris Boat Works is the closest Mercury Marine Platinum Dealer to Peterborough — about 35 minutes south on Rice Lake. Family-owned since 1947, Mercury dealer since 1965. Serving Peterborough, Lakefield, Bridgenorth, Buckhorn, and the Kawartha Lakes region.',
    schemas: [mercuryDealerPeterboroughSchema()],
    extraNoscript: () =>
      '<dl>' +
      PETERBOROUGH_FAQ_PRERENDER.map(i =>
        `<dt><strong>${escapeHtml(i.question)}</strong></dt><dd>${escapeHtml(i.answer)}</dd>`
      ).join('') +
      '</dl>'
  },
  {
    path: '/mercury-dealer-cobourg',
    title: 'Mercury Dealer Cobourg Ontario | Harris Boat Works — 20 Min North',
    description: 'Mercury Marine Platinum Dealer 20 minutes north of Cobourg on Rice Lake. Family-owned since 1947, Mercury dealer since 1965. Sales, repower, and service for Cobourg, Port Hope, and Northumberland County.',
    h1: 'Mercury Dealer Near Cobourg, Ontario',
    intro: 'Harris Boat Works is the closest Mercury Marine Platinum Dealer to Cobourg — about 20 minutes north on Rice Lake. Family-owned since 1947, Mercury dealer since 1965. Serving Cobourg, Port Hope, Grafton, Brighton, and Northumberland County.',
    schemas: [mercuryDealerCobourgSchema()],
    extraNoscript: () =>
      '<dl>' +
      COBOURG_FAQ_PRERENDER.map(i =>
        `<dt><strong>${escapeHtml(i.question)}</strong></dt><dd>${escapeHtml(i.answer)}</dd>`
      ).join('') +
      '</dl>'
  },
  {
    path: '/mercury-dealer-gta',
    title: 'Mercury Dealer for the GTA | Harris Boat Works — 90 Min East of Toronto',
    description: 'Mercury Marine Platinum Dealer 90 minutes east of Toronto on Rice Lake. Real CAD pricing online, family-owned since 1947, Mercury dealer since 1965. Serving GTA, Lake Simcoe, and Lake Scugog Mercury repowers.',
    h1: 'Mercury Dealer for the Greater Toronto Area',
    intro: 'Harris Boat Works on Rice Lake serves GTA, Lake Simcoe, and Lake Scugog Mercury buyers — about 90 minutes east of Toronto on the 401. Family-owned since 1947, Mercury dealer since 1965. Pickup only at Gores Landing.',
    schemas: [mercuryDealerGTASchema()],
    extraNoscript: () =>
      '<dl>' +
      GTA_FAQ_PRERENDER.map(i =>
        `<dt><strong>${escapeHtml(i.question)}</strong></dt><dd>${escapeHtml(i.answer)}</dd>`
      ).join('') +
      '</dl>'
  },
  {
    path: '/mercury-pro-xs',
    title: 'Mercury Pro XS Outboards in Ontario | 115–250 HP, Real CAD Pricing | Harris Boat Works',
    description: 'Mercury Pro XS performance outboards 115–250 HP in stock at Harris Boat Works. Real CAD pricing, 7-year warranty, financing. Mercury Platinum Dealer on Rice Lake — family-owned since 1947, Mercury dealer since 1965.',
    h1: 'Mercury Pro XS Outboards in Ontario',
    intro: 'Tournament-grade performance from 115 to 250 HP. Real CAD pricing, in stock at Harris Boat Works — Mercury Marine Platinum Dealer on Rice Lake. Family-owned since 1947, Mercury dealer since 1965.',
    schemas: [mercuryProXSSchema()],
    extraNoscript: () =>
      '<ul>' +
      PRO_XS_STATIC_OFFERS_PRERENDER.map(v =>
        `<li><strong>${escapeHtml(v.name)}</strong> — from CAD $${v.startingAt.toLocaleString('en-CA')}</li>`
      ).join('') +
      '</ul><dl>' +
      PRO_XS_FAQ_PRERENDER.map(i =>
        `<dt><strong>${escapeHtml(i.question)}</strong></dt><dd>${escapeHtml(i.answer)}</dd>`
      ).join('') +
      '</dl>'
  },
  {
    path: '/mercury-outboards-ontario',
    title: 'Mercury Outboards Ontario — Full Lineup at Harris Boat Works | Platinum Dealer Since 1965',
    description: 'Mercury Marine outboards in Ontario — full lineup (FourStroke, Pro XS, Command Thrust, SeaPro, ProKicker, V8). Real CAD pricing online. Mercury Platinum Dealer on Rice Lake, family-owned since 1947.',
    h1: 'Mercury Outboards in Ontario',
    intro: 'The full Mercury Marine outboard lineup at Harris Boat Works — Platinum Dealer on Rice Lake. Real CAD pricing online, family-owned since 1947, Mercury dealer since 1965. Serving Peterborough, Cobourg, the GTA, the Kawarthas, and Northumberland County.',
    schemas: [mercuryOutboardsOntarioSchema()],
    extraNoscript: () =>
      '<dl>' +
      ONTARIO_HUB_FAQ_PRERENDER.map(i =>
        `<dt><strong>${escapeHtml(i.question)}</strong></dt><dd>${escapeHtml(i.answer)}</dd>`
      ).join('') +
      '</dl>'
  },
  {
    path: '/mercury-pontoon-outboards',
    title: 'Mercury Outboards for Pontoon Boats — Command Thrust, Big Tiller & High-Thrust Options | Harris Boat Works',
    description: 'Mercury Command Thrust outboards for pontoon boats — 40 to 150 HP. HP sizing, shaft length, and Legend/Princecraft pairings. Mercury Platinum Dealer on Rice Lake serving Kawarthas, GTA, and Ontario.',
    h1: 'Mercury Outboards for Pontoon Boats — Command Thrust, Big Tiller & High-Thrust Options (Rice Lake & Kawarthas)',
    intro: 'Pontoons are heavier than they look. The right Mercury for a pontoon is a Command Thrust gearcase, the right shaft length, and a high-thrust prop. Harris Boat Works has been rigging pontoons on Rice Lake since 1965 — Legend, Princecraft, Sylvan, Manitou, Sunchaser, and Bennington.',
    schemas: [mercuryPontoonOutboardsSchema()],
    extraNoscript: () =>
      '<dl>' +
      PONTOON_FAQ_PRERENDER.map(i =>
        `<dt><strong>${escapeHtml(i.question)}</strong></dt><dd>${escapeHtml(i.answer)}</dd>`
      ).join('') +
      '</dl>'
  },
  {
    path: '/promotions',
    title: '7-Year Factory-Backed Warranty on Every New Mercury | Harris Boat Works',
    description: 'Get 7 years of factory-backed warranty coverage on every new Mercury outboard from Harris Boat Works. No third-party insurance — straight Mercury protection from a Platinum Dealer since 1965.',
    h1: 'Mercury Outboard Promotions',
    intro: 'Current Mercury outboard motor promotions, rebates, and financing offers from Harris Boat Works — Mercury Marine Platinum Dealer on Rice Lake since 1965. Factory-backed 7-year warranty on every new Mercury.',
    schemas: [promotionsPageSchema()]
  },
  ...blogArticleRoutes
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

  // NOTE: All Helmet-managed tags (title, description, canonical, JSON-LD) are
  // stamped with data-rh="true" so react-helmet-async adopts them on hydration
  // instead of appending duplicate tags after mount.

  // <title>
  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title data-rh="true">${escapeHtml(route.title)}</title>`
  );

  // <meta name="description">
  const metaDesc = `<meta data-rh="true" name="description" content="${escapeHtml(route.description)}" />`;
  if (/<meta\s+name=["']description["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta\s+name=["']description["'][^>]*>/i, metaDesc);
  } else {
    html = html.replace(/<\/head>/i, `${metaDesc}\n  </head>`);
  }

  // canonical
  const canonical = `<link data-rh="true" rel="canonical" href="${SITE_URL}${route.path === '/' ? '' : route.path}" />`;
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, canonical);
  } else {
    html = html.replace(/<\/head>/i, `${canonical}\n  </head>`);
  }

  // JSON-LD blocks (Helmet-managed → must carry data-rh marker so per-route
  // <Helmet> components own them on hydration instead of appending duplicates)
  const jsonLdBlocks = route.schemas
    .map(s => `<script data-rh="true" type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join('\n  ');
  html = html.replace(/<\/head>/i, `${jsonLdBlocks}\n  </head>`);

  // Open Graph + Twitter social tags (Helmet-managed → data-rh marker so per-route
  // <Helmet> components adopt them on hydration without appending duplicates).
  // Crawlers (Facebook, Slack, iMessage, X) and AI agents (ChatGPT, Perplexity)
  // read these from raw HTML — without per-route stamping every page would ship
  // with the homepage Open Graph values from index.html.
  const ogUrl = `${SITE_URL}${route.path === '/' ? '/' : route.path}`;
  const ogImage = route.ogImage || `${SITE_URL}/social-share.jpg`;
  const ogType = route.ogType || 'website';

  const socialReplacements = [
    { re: /<meta\s+property=["']og:title["'][^>]*>/gi, tag: `<meta data-rh="true" property="og:title" content="${escapeHtml(route.title)}" />` },
    { re: /<meta\s+property=["']og:description["'][^>]*>/gi, tag: `<meta data-rh="true" property="og:description" content="${escapeHtml(route.description)}" />` },
    { re: /<meta\s+property=["']og:url["'][^>]*>/gi, tag: `<meta data-rh="true" property="og:url" content="${ogUrl}" />` },
    { re: /<meta\s+property=["']og:type["'][^>]*>/gi, tag: `<meta data-rh="true" property="og:type" content="${ogType}" />` },
    { re: /<meta\s+property=["']og:image["'][^>]*>/gi, tag: `<meta data-rh="true" property="og:image" content="${ogImage}" />` },
    { re: /<meta\s+name=["']twitter:title["'][^>]*>/gi, tag: `<meta data-rh="true" name="twitter:title" content="${escapeHtml(route.title)}" />` },
    { re: /<meta\s+name=["']twitter:description["'][^>]*>/gi, tag: `<meta data-rh="true" name="twitter:description" content="${escapeHtml(route.description)}" />` },
    { re: /<meta\s+name=["']twitter:url["'][^>]*>/gi, tag: `<meta data-rh="true" name="twitter:url" content="${ogUrl}" />` },
    { re: /<meta\s+name=["']twitter:image["'][^>]*>/gi, tag: `<meta data-rh="true" name="twitter:image" content="${ogImage}" />` }
  ];
  for (const { re, tag } of socialReplacements) {
    if (re.test(html)) {
      // Replace the FIRST occurrence (any duplicates already in shell) and strip
      // any additional duplicates so we end with exactly one canonical version.
      let replaced = false;
      html = html.replace(re, () => {
        if (!replaced) { replaced = true; return tag; }
        return '';
      });
    } else {
      html = html.replace(/<\/head>/i, `${tag}\n  </head>`);
    }
  }

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
  // Title presence check: confirm the stamping replaced the shell <title>.
  // Match either bare `<title>` or attributed `<title data-rh="true">`.
  if (!/<title[\s>]/i.test(html)) {
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
