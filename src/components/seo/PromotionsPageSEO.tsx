import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/lib/site';

interface PromotionsPageSEOProps {
  promotions?: Array<{
    name: string;
    discount_percentage?: number;
    discount_fixed_amount?: number;
    warranty_extra_years?: number;
    end_date?: string;
    promo_options?: any;
  }>;
}

export function PromotionsPageSEO({ promotions = [] }: PromotionsPageSEOProps) {
  const hasActivePromos = promotions.length > 0;

  if (!hasActivePromos) {
    return (
      <Helmet>
        <title>Mercury Outboard Promotions | Harris Boat Works</title>
        <meta name="description" content="Check back for the latest Mercury outboard motor promotions, rebates, and financing offers. Ontario's trusted Mercury dealer since 1965." />
        <link rel="canonical" href={`${SITE_URL}/promotions`} />
        <meta property="og:title" content="Mercury Promotions | Harris Boat Works" />
        <meta property="og:description" content="Check back for the latest Mercury outboard promotions and offers." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/promotions`} />
      </Helmet>
    );
  }

  const mainPromo = promotions[0];
  const hasChooseOne = mainPromo?.promo_options?.type === 'choose_one';

  const faqData = hasChooseOne ? [
    {
      question: "What is the Mercury Get 7 + Choose One promotion?",
      answer: "This promotion gives you 7 years of factory warranty coverage (3 years standard + 4 years FREE extension) on qualifying Mercury outboard motors. PLUS, you choose one additional bonus."
    },
    {
      question: "Does this apply to repower installations?",
      answer: "Yes! This promotion applies to both new boat packages and repower installations."
    }
  ] : [
    {
      question: "What is the 7-Year Warranty promotion?",
      answer: "When you buy any new Mercury outboard from Harris Boat Works, you get 7 full years of factory-backed warranty coverage — that's 3 years standard plus 4 bonus years. No third-party insurance, just straight Mercury protection."
    },
    {
      question: "Which motors are eligible?",
      answer: "Every new Mercury outboard we sell qualifies — from a 2.5hp portable all the way up to a 300hp Verado. If it's new and it's Mercury, you're covered for 7 years."
    },
    {
      question: "Is this a third-party warranty?",
      answer: "No. This is factory-backed Mercury coverage. Your warranty is honoured at any authorized Mercury dealer, and Harris Boat Works handles all warranty service in-house as a Platinum Dealer."
    },
    {
      question: "Does this apply to repowers?",
      answer: "Yes! Whether you're buying a new package or dropping off your boat for a full repower, the 7-year warranty applies."
    },
    {
      question: "When does this promotion end?",
      answer: "This offer is available for a limited time. Check this page or contact us for current availability."
    },
    {
      question: "Do I need to do anything special to activate the warranty?",
      answer: "Nope. Buy your motor from Harris Boat Works and the 7-year coverage is automatically included. We handle all the registration."
    }
  ];

  const offerData = [
    {
      "@type": "Offer",
      "name": mainPromo.name || "7-Year Factory-Backed Warranty",
      "description": "7 years of factory warranty coverage on all new Mercury outboard motors from Harris Boat Works",
      "priceValidUntil": mainPromo.end_date || undefined,
      "seller": { "@type": "Organization", "name": "Harris Boat Works" }
    }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/promotions`,
        "url": `${SITE_URL}/promotions`,
        "name": `${mainPromo.name} | Harris Boat Works`,
        "description": "Get 7 years of factory-backed warranty coverage on every new Mercury outboard from Harris Boat Works. Platinum Dealer since 1965.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "@id": `${SITE_URL}/promotions#breadcrumblist`,
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
            { "@type": "ListItem", "position": 2, "name": "Promotions", "item": `${SITE_URL}/promotions` }
          ]
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqData.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
        }))
      },
      {
        "@type": "OfferCatalog",
        "name": mainPromo.name,
        "description": "7 years factory-backed warranty on all new Mercury outboards",
        "numberOfItems": offerData.length,
        "itemListElement": offerData
      }
    ]
  };

  return (
    <Helmet>
      <title>7-Year Factory-Backed Warranty on Every New Mercury | Harris Boat Works</title>
      <meta name="description" content="Get 7 years of factory-backed warranty coverage on every new Mercury outboard from Harris Boat Works. No third-party insurance — straight Mercury protection from a Platinum Dealer since 1965." />
      <meta name="keywords" content="Mercury 7 year warranty, Mercury outboard warranty, Harris Boat Works, Mercury dealer Ontario, boat motor warranty, Mercury Platinum Dealer, repower warranty" />
      <link rel="canonical" href={`${SITE_URL}/promotions`} />
      
      <meta property="og:title" content="7-Year Factory-Backed Warranty | Harris Boat Works" />
      <meta property="og:description" content="Get 7 years of zero-worry boating with a new Mercury outboard. Factory-backed coverage from a Platinum Dealer since 1965." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${SITE_URL}/promotions`} />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="7-Year Factory-Backed Warranty | Harris Boat Works" />
      <meta name="twitter:description" content="7 years of factory-backed warranty coverage on every new Mercury outboard." />
      
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
