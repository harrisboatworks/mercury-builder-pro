import { Helmet } from 'react-helmet-async';

interface PromotionsPageSEOProps {
  promotions?: Array<{
    name: string;
    discount_percentage?: number;
    discount_fixed_amount?: number;
    warranty_extra_years?: number;
    end_date?: string;
  }>;
}

export function PromotionsPageSEO({ promotions = [] }: PromotionsPageSEOProps) {
  const faqData = [
    {
      question: "How do I claim a Mercury promotion?",
      answer: "Mercury promotions are automatically applied when you build your quote on our website. Simply select your motor, and any applicable promotions will be shown in your quote summary. Our team will also verify all eligible promotions when you finalize your purchase."
    },
    {
      question: "Can I combine multiple Mercury promotions?",
      answer: "Some Mercury promotions can be stacked, while others cannot. Stackable promotions will automatically combine in your quote. Our sales team can help identify all eligible promotions for your specific motor purchase."
    },
    {
      question: "What is the Mercury Get 5 Extended Warranty promotion?",
      answer: "The Mercury Get 5 promotion extends your factory warranty to 5 years of coverage at no additional cost when you purchase qualifying Mercury outboard motors. This includes comprehensive coverage for parts and labor."
    },
    {
      question: "Do promotions apply to all Mercury motors?",
      answer: "Promotions vary by motor model and horsepower range. Most promotions apply to specific motor families like FourStroke, Pro XS, or Verado. Check our promotions page or use our quote builder to see which promotions apply to your selected motor."
    },
    {
      question: "How long do Mercury promotions last?",
      answer: "Mercury runs seasonal promotions that typically last 1-3 months. We display countdown timers on our promotions page so you know exactly how long each deal is available. Sign up for our newsletter to be notified of new promotions."
    },
    {
      question: "Are there financing promotions available?",
      answer: "Yes! Mercury and our financing partners offer promotional financing rates as low as 6.99% APR on qualifying purchases. Promotional rates and terms are available through our online financing application."
    },
    {
      question: "Can I get a promotion on a repower installation?",
      answer: "Yes, most Mercury promotions apply to repower installations as well as new boat packages. Our Certified Repower Center can help you maximize savings on your engine replacement project."
    },
    {
      question: "What documents do I need to claim a rebate?",
      answer: "For mail-in rebates, you'll need your original purchase receipt, completed rebate form, and proof of purchase (typically the motor serial number). We help our customers complete all paperwork to ensure successful rebate claims."
    }
  ];

  const offerData = promotions.map(promo => ({
    "@type": "Offer",
    "name": promo.name,
    "description": promo.warranty_extra_years 
      ? `${promo.warranty_extra_years} years extended warranty included`
      : promo.discount_percentage 
        ? `${promo.discount_percentage}% off` 
        : promo.discount_fixed_amount 
          ? `$${promo.discount_fixed_amount} off`
          : "Special promotion",
    "priceValidUntil": promo.end_date || undefined,
    "seller": {
      "@type": "Organization",
      "name": "Harris Boat Works"
    }
  }));

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://quote.harrisboatworks.ca/promotions",
        "url": "https://quote.harrisboatworks.ca/promotions",
        "name": "Mercury Outboard Promotions & Rebates | Harris Boat Works",
        "description": "Current Mercury Marine promotions, rebates, and extended warranty offers. Save on FourStroke, Pro XS, and Verado outboard motors at Harris Boat Works.",
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
        "name": "Mercury Outboard Motor Promotions",
        "description": "Current promotions and special offers on Mercury outboard motors",
        "numberOfItems": promotions.length,
        "itemListElement": offerData
      }
    ]
  };

  return (
    <Helmet>
      <title>Mercury Outboard Promotions & Rebates 2024 | Harris Boat Works</title>
      <meta name="description" content="Save on Mercury outboard motors with current promotions, rebates, and extended warranty offers. Get 5 years warranty FREE on qualifying motors. Ontario's trusted Mercury dealer since 1965." />
      <meta name="keywords" content="Mercury promotions, Mercury rebates, outboard motor deals, Mercury Get 5, extended warranty, Mercury dealer Ontario, boat motor promotions" />
      <link rel="canonical" href="https://quote.harrisboatworks.ca/promotions" />
      
      {/* Open Graph */}
      <meta property="og:title" content="Mercury Outboard Promotions & Rebates | Harris Boat Works" />
      <meta property="og:description" content="Current Mercury Marine promotions and rebates. Save on FourStroke, Pro XS, and Verado outboards." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://quote.harrisboatworks.ca/promotions" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Outboard Promotions | Harris Boat Works" />
      <meta name="twitter:description" content="Save on Mercury outboard motors with current promotions and rebates." />
      
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
