import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/lib/site';

export function FinanceCalculatorSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/finance-calculator#webpage`,
        "url": `${SITE_URL}/finance-calculator`,
        "name": "Mercury Repower Financing Calculator | Monthly Payment Estimator | Harris Boat Works",
        "description": "Estimate monthly payments on a Mercury outboard repower. Flexible financing options available at Harris Boat Works, Ontario's family-owned Mercury dealer since 1947.",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "speakable": {
          "@type": "SpeakableSpecification",
          "cssSelector": ["h1", ".calculator-intro"]
        },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": SITE_URL
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Finance Calculator",
              "item": `${SITE_URL}/finance-calculator`
            }
          ]
        }
      },
      {
        "@type": "FinancialProduct",
        "name": "Mercury Outboard Motor Financing",
        "description": "Flexible financing for Mercury outboard motor purchases and repowers. Calculate monthly payments with different terms and rates.",
        "provider": {
          "@type": "Organization",
          "name": "Harris Boat Works",
          "@id": `${SITE_URL}/#organization`
        },
        "feesAndCommissionsSpecification": "No early payoff penalties. $299 finance administration fee included.",
        "interestRate": {
          "@type": "QuantitativeValue",
          "minValue": 7.99,
          "unitText": "% APR"
        },
        "amount": {
          "@type": "MonetaryAmount",
          "minValue": 5000,
          "currency": "CAD"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What are the current financing rates for Mercury outboards?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Standard rates start at 7.99% APR for purchases $10,000 and up, and 8.99% APR for purchases under $10,000. Promotional rates may be available — check the calculator for current offers."
            }
          },
          {
            "@type": "Question",
            "name": "What is the minimum amount for financing?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Financing is available on purchases of $5,000 or more. For smaller purchases, cash purchase or other payment options are available."
            }
          },
          {
            "@type": "Question",
            "name": "Can I pay off my boat loan early?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, all financing programs allow early payoff without prepayment penalties. You can make extra payments or pay off your loan in full at any time."
            }
          }
        ]
      }
    ]
  };

  return (
    <Helmet>
      <title>Mercury Repower Financing Calculator | Monthly Payment Estimator | Harris Boat Works</title>
      <meta name="description" content="Estimate monthly payments on a Mercury outboard repower. Flexible financing from 7.99% APR, terms from 36–180 months. No early payoff penalties. Harris Boat Works, Ontario Mercury dealer since 1947." />
      <meta name="keywords" content="Mercury financing calculator, outboard motor financing, boat motor payment estimator, Mercury repower financing, marine financing Ontario" />
      <link rel="canonical" href={`${SITE_URL}/finance-calculator`} />

      {/* Open Graph */}
      <meta property="og:title" content="Mercury Repower Financing Calculator | Harris Boat Works" />
      <meta property="og:description" content="Estimate monthly payments on a Mercury outboard. Flexible terms from 36–180 months." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${SITE_URL}/finance-calculator`} />
      <meta property="og:image" content={`${SITE_URL}/social-share.jpg`} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mercury Financing Calculator | Harris Boat Works" />
      <meta name="twitter:description" content="Estimate monthly payments on Mercury outboard motors." />

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
