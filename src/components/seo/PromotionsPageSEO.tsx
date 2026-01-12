import { Helmet } from 'react-helmet-async';

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
  const faqData = [
    {
      question: "What is the Mercury Get 7 + Choose One promotion?",
      answer: "This promotion gives you 7 years of factory warranty coverage (3 years standard + 4 years FREE extension) on qualifying Mercury outboard motors. PLUS, you choose one additional bonus: 6 months no payments, special financing rates as low as 2.99% APR, OR a factory rebate up to $1,000 based on your motor's horsepower."
    },
    {
      question: "How do I choose my bonus?",
      answer: "When you finalize your purchase with us, our sales team will help you select the bonus option that works best for your situation. All three options provide great value — it just depends on whether you prefer deferred payments, lower monthly payments with promotional rates, or cash back."
    },
    {
      question: "Can I combine the warranty with all three bonuses?",
      answer: "No, you get to choose ONE of the three bonuses (no payments, special financing, or rebate) in addition to the 7-year warranty. However, the 7-year warranty is included with ALL options automatically."
    },
    {
      question: "What is the minimum for special financing rates?",
      answer: "The special promotional financing rates (2.99% for 24 months, 3.99% for 36 months, 4.49% for 48 months, 5.49% for 60 months) require a minimum financed amount of $5,000. Credit approval required."
    },
    {
      question: "How much is the factory rebate for my motor?",
      answer: "Rebates range from $100 to $1,000 based on horsepower: 2.5-6HP ($100), 8-20HP ($250), 25HP ($300), 30-60HP ($350), 65-75HP ($400), 80-115HP ($500), 150-200HP ($650), 225-425HP ($1,000)."
    },
    {
      question: "When does this promotion end?",
      answer: "The Mercury Get 7 + Choose One promotion runs from January 12, 2026 through March 31, 2026. Don't wait — build your quote today to lock in these savings!"
    },
    {
      question: "Does this apply to repower installations?",
      answer: "Yes! This promotion applies to both new boat packages and repower installations. Our Certified Repower Center can help you maximize savings on your engine replacement project."
    },
    {
      question: "Can I combine multiple Mercury promotions?",
      answer: "The Get 7 + Choose One promotion is a comprehensive package. The 7-year warranty is automatic, and you select one of the three bonuses. Additional manufacturer rebates may be available on select models."
    }
  ];

  const offerData = [
    {
      "@type": "Offer",
      "name": "Mercury Get 7 + Choose One: 7-Year Warranty",
      "description": "7 years of factory warranty coverage included with all qualifying Mercury outboard motors",
      "priceValidUntil": "2026-03-31",
      "seller": {
        "@type": "Organization",
        "name": "Harris Boat Works"
      }
    },
    {
      "@type": "Offer",
      "name": "Mercury Get 7 + Choose One: 6 Months No Payments",
      "description": "Defer your first payment for 6 months when you choose this bonus option",
      "priceValidUntil": "2026-03-31",
      "seller": {
        "@type": "Organization",
        "name": "Harris Boat Works"
      }
    },
    {
      "@type": "Offer",
      "name": "Mercury Get 7 + Choose One: Special Financing",
      "description": "Promotional financing rates as low as 2.99% APR for 24 months on $5,000+ purchases",
      "priceValidUntil": "2026-03-31",
      "seller": {
        "@type": "Organization",
        "name": "Harris Boat Works"
      }
    },
    {
      "@type": "Offer",
      "name": "Mercury Get 7 + Choose One: Factory Rebate",
      "description": "Get up to $1,000 cash back based on your motor horsepower",
      "priceValidUntil": "2026-03-31",
      "seller": {
        "@type": "Organization",
        "name": "Harris Boat Works"
      }
    }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://quote.harrisboatworks.ca/promotions",
        "url": "https://quote.harrisboatworks.ca/promotions",
        "name": "Mercury Get 7 + Choose One Promotion | Harris Boat Works",
        "description": "Get 7 years warranty PLUS your choice: 6 months no payments, special financing as low as 2.99% APR, or up to $1,000 factory rebate on Mercury outboards.",
        "isPartOf": {
          "@id": "https://quote.harrisboatworks.ca/#website"
        },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://quote.harrisboatworks.ca"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Promotions",
              "item": "https://quote.harrisboatworks.ca/promotions"
            }
          ]
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqData.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      },
      {
        "@type": "OfferCatalog",
        "name": "Mercury Get 7 + Choose One Promotion",
        "description": "7 years warranty plus your choice of bonus: no payments, special financing, or factory rebate",
        "numberOfItems": 4,
        "itemListElement": offerData
      }
    ]
  };

  return (
    <Helmet>
      <title>Mercury Get 7 + Choose One Promotion 2026 | 7-Year Warranty + Bonus | Harris Boat Works</title>
      <meta name="description" content="Get 7 years factory warranty PLUS choose your bonus: 6 months no payments, 2.99% APR financing, or up to $1,000 factory rebate. January 12 - March 31, 2026. Ontario's trusted Mercury dealer." />
      <meta name="keywords" content="Mercury Get 7, Mercury promotions, outboard motor rebate, Mercury 7 year warranty, Mercury financing, 6 months no payments, Mercury dealer Ontario, boat motor promotions 2026, Mercury Choose One" />
      <link rel="canonical" href="https://quote.harrisboatworks.ca/promotions" />
      
      {/* Open Graph */}
      <meta property="og:title" content="Mercury Get 7 + Choose One | 7-Year Warranty + Your Choice of Bonus" />
      <meta property="og:description" content="7 years factory coverage PLUS choose: no payments for 6 months, special financing from 2.99% APR, or up to $1,000 rebate. Ends March 31, 2026." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://quote.harrisboatworks.ca/promotions" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Get 7 + Choose One Promotion | Harris Boat Works" />
      <meta name="twitter:description" content="7 years warranty + your choice of bonus. Ends March 31, 2026." />
      
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
