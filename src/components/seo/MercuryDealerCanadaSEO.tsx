import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { BUSINESS_SAME_AS } from '@/lib/companyInfo';
import { getMercuryFinancingFaqAnswer } from '@/components/promotions/TDAlwaysOnOffer';

const TRUST_FAQ = [
  {
    question: "Is Harris Boat Works an authorized Mercury Marine dealer?",
    answer: "Yes. Harris Boat Works has been an authorized Mercury Marine dealer since 1965, over 60 years. We currently hold Mercury Marine Premier Dealer status, the highest tier in Mercury's North American dealer program, awarded for sales volume, technician certification, and customer service."
  },
  {
    question: "What does Mercury Premier Dealer status mean?",
    answer: "Premier is Mercury Marine's top dealer rating in North America. It requires Mercury-certified technicians, a minimum sales and service volume, full warranty registration capability, and consistently high CSI (Customer Satisfaction Index) scores. Only a small percentage of Mercury dealers reach Premier, and re-qualification is required every year."
  },
  {
    question: "How long has Harris Boat Works been in business?",
    answer: "The Harris family founded the boat works in 1947 on Rice Lake in Gores Landing, Ontario. We're now a third-generation, family-owned marina with 79 years of continuous operation. Mercury dealer since 1965."
  },
  {
    question: "Where is Harris Boat Works located?",
    answer: "5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0, on the south shore of Rice Lake. About 35 minutes from Peterborough, 20 minutes from Cobourg, 90 minutes from Toronto, and within 200 km of the entire GTA, Kawarthas, and Northumberland County."
  },
  {
    question: "Do you sell motors to customers across Canada?",
    answer: "Yes, we sell to customers across Ontario and beyond. However, all motors are pickup only at our Gores Landing location. We do not ship outboards. This is intentional: every motor includes a personal walk-through covering controls, break-in procedure, and warranty registration. That hand-off is part of why we hold Premier Dealer status."
  },
  {
    question: "What Mercury motor lines do you carry?",
    answer: "We carry the full Mercury outboard lineup: portable FourStroke (2.5–20hp), mid-range FourStroke (25–115hp), Command Thrust (40–150hp for pontoons and heavy hulls), Pro XS performance (115–300hp), SeaPro commercial-duty, ProKicker trolling motors (9.9hp/15hp), and FourStroke V8 (250–300hp). We also stock genuine Mercury parts, oils, and accessories."
  },
  {
    question: "Are your prices in Canadian dollars?",
    answer: "Yes, all pricing on mercuryrepower.ca is in Canadian dollars (CAD), all-in. The price you see is the price you pay (plus HST). No US-dollar conversions, no hidden fees, no \"call for price\" games."
  },
  {
    question: "Do you offer Mercury financing?",
    answer: `Yes, financing is available on Mercury motor purchases through DealerPlan and other lenders. The configurator at mercuryrepower.ca shows monthly payment estimates alongside the purchase price. ${getMercuryFinancingFaqAnswer()} Minimum financed amount is $5,000.`
  },
  {
    question: "What warranty comes with a new Mercury outboard?",
    answer: "Every new Mercury outboard comes with a 3-year limited factory warranty as standard. Bonus warranty extensions are offered from time to time at Harris Boat Works; check mercuryrepower.ca/promotions for current offers. We register every warranty directly with Mercury Marine at the time of pickup."
  },
  {
    question: "Are Mercury motors made in Canada?",
    answer: "Mercury Marine is headquartered in Fond du Lac, Wisconsin, USA, where most outboard motors are manufactured. Mercury has been building outboards since 1939 and is one of the largest marine engine manufacturers in the world. Harris Boat Works has been the authorized Canadian Mercury dealer for the Rice Lake / Kawartha region since 1965."
  },
  {
    question: "Do you service motors purchased elsewhere?",
    answer: "Yes, our Mercury-certified service department works on Mercury and MerCruiser motors regardless of where they were purchased. We handle warranty work, repower, winterization, spring launch, and routine maintenance. Submit a service request at hbw.wiki/service or call (905) 342-2153."
  },
  {
    question: "Why buy from Harris Boat Works instead of a big-box marine retailer?",
    answer: "Three reasons: (1) Premier Dealer status means our technicians, parts inventory, and warranty access are at the highest Mercury tier. (2) Family-owned since 1947, we answer the phone, we know our customers, and the same people sell, install, and service the motor. (3) Real online pricing with live CAD quotes, no \"call for price\" runaround. What you see at mercuryrepower.ca is what you pay."
  }
];

export function MercuryDealerCanadaSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/mercury-dealer-canada-faq#webpage`,
        "url": `${SITE_URL}/mercury-dealer-canada-faq`,
        "name": "Why Buy from Harris Boat Works, Mercury Dealer Canada FAQ | Family-Owned Since 1947",
        "description": "Trust questions about Harris Boat Works: Mercury Premier Dealer status, family ownership since 1947, dealer since 1965, warranty, financing, Canadian pricing, full Mercury lineup.",
        "isPartOf": { "@id": "https://www.mercuryrepower.ca/#website" },
        "about": { "@id": "https://www.mercuryrepower.ca/#organization" },
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
        "@id": "https://www.mercuryrepower.ca/#organization",
        "name": "Harris Boat Works",
        "alternateName": "HBW",
        "url": "https://www.harrisboatworks.ca/",
        "logo": "https://www.mercuryrepower.ca/pwa-512x512.png",
        "foundingDate": "1947",
        "founder": { "@type": "Person", "name": "Harris family" },
        "description": "Third-generation family marina established in 1947 on Rice Lake in Gores Landing, Ontario. Mercury Marine dealer since 1965 and current Mercury Marine Premier Dealer.",
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
          "Mercury Marine Premier Dealer",
          "Authorized Legend Boats Dealer"
        ],
        "knowsAbout": [
          "Mercury outboard motors",
          "MerCruiser sterndrives",
          "Marine repower",
          "Boat winterization",
          "Boat storage"
        ],
        "sameAs": BUSINESS_SAME_AS
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/mercury-dealer-canada-faq#faqpage`,
        "mainEntity": TRUST_FAQ.map(item => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": { "@type": "Answer", "text": item.answer }
        }))
      }
    ]
  };

  return (
    <Helmet>
      <title>Why Buy from Harris Boat Works, Mercury Dealer Canada FAQ | Family-Owned Since 1947</title>
      <meta
        name="description"
        content="Mercury Marine Premier Dealer on Rice Lake, Mercury dealer since 1965. Family-owned since 1947. Real CAD pricing, 3-year factory warranty, full Mercury lineup, financing available. 12 trust questions answered."
      />
      <meta
        name="keywords"
        content="Mercury dealer Canada, Mercury Premier Dealer Ontario, Harris Boat Works trust, family-owned marine dealer, Mercury dealer since 1965, Rice Lake Mercury, authorized Mercury dealer"
      />
      <link rel="canonical" href={`${SITE_URL}/mercury-dealer-canada-faq`} />

      <meta property="og:title" content="Why Buy from Harris Boat Works, Mercury Dealer Canada" />
      <meta property="og:description" content="Mercury Premier Dealer. Family-owned since 1947, Mercury dealer since 1965. Real CAD pricing." />
      <meta property="og:url" content={`${SITE_URL}/mercury-dealer-canada-faq`} />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Why Buy from Harris Boat Works" />
      <meta name="twitter:description" content="Mercury Premier Dealer. Family-owned since 1947." />

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}

export { TRUST_FAQ };
