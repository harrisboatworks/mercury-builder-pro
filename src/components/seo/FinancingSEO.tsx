import { Helmet } from 'react-helmet-async';

export function FinancingSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://quote.harrisboatworks.ca/financing-application",
        "url": "https://quote.harrisboatworks.ca/financing-application",
        "name": "Mercury Outboard Motor Financing | Apply Online | Harris Boat Works",
        "description": "Apply for boat motor financing online. Competitive rates from 6.99% APR. Quick approval process. Finance your Mercury outboard purchase with flexible terms.",
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
              "name": "Financing",
              "item": "https://quote.harrisboatworks.ca/financing-application"
            }
          ]
        }
      },
      {
        "@type": "FinancialService",
        "name": "Harris Boat Works Marine Financing",
        "description": "Flexible financing options for Mercury outboard motor purchases. Competitive rates and easy online application.",
        "provider": {
          "@type": "Organization",
          "name": "Harris Boat Works"
        },
        "areaServed": {
          "@type": "Country",
          "name": "Canada"
        },
        "serviceType": "Marine Financing",
        "offers": {
          "@type": "Offer",
          "description": "Outboard motor financing",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": "6.99",
            "priceCurrency": "CAD",
            "unitText": "% APR"
          }
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What credit score do I need for boat motor financing?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We work with multiple lenders to accommodate various credit situations. While prime rates are available for excellent credit, we also have options for customers with less-than-perfect credit. Apply online for a quick assessment with no impact to your credit score."
            }
          },
          {
            "@type": "Question",
            "name": "How long does financing approval take?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Most financing applications receive a decision within 24-48 hours. Pre-approvals can often be completed the same business day. Our team will contact you promptly with your approval status and terms."
            }
          },
          {
            "@type": "Question",
            "name": "What documents do I need for boat motor financing?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "You'll need valid government ID, proof of income (recent pay stubs or tax returns), and proof of address. Self-employed applicants may need additional documentation such as business financials or CRA notices of assessment."
            }
          },
          {
            "@type": "Question",
            "name": "Is a down payment required for outboard motor financing?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Down payments vary based on the financing program and credit profile. Some programs offer zero down payment options for qualified buyers. A larger down payment typically results in better rates and lower monthly payments."
            }
          },
          {
            "@type": "Question",
            "name": "Can I pay off my boat loan early without penalty?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, all of our financing programs allow early payoff without prepayment penalties. You can make extra payments or pay off your loan in full at any time."
            }
          },
          {
            "@type": "Question",
            "name": "What are the current financing rates for Mercury outboards?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Current promotional rates start from 6.99% APR for qualified buyers. Standard rates are 8.99% APR for amounts under $10,000, and 7.99% APR for amounts $10,000 and up. Promotional rates are subject to availability and may change."
            }
          },
          {
            "@type": "Question",
            "name": "What financing terms are available?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We offer flexible terms from 36 to 180 months depending on the loan amount and program. Shorter terms offer lower total interest cost, while longer terms provide lower monthly payments. Our team will help you find the right balance for your budget."
            }
          },
          {
            "@type": "Question",
            "name": "Can I finance a repower installation?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, our financing programs cover both new motor purchases and repower installations. You can finance the motor, rigging, and installation labor as a complete package."
            }
          }
        ]
      }
    ]
  };

  return (
    <Helmet>
      <title>Boat Motor Financing | Apply Online | Rates Starting from 6.99% APR | Harris Boat Works</title>
      <meta name="description" content="Finance your Mercury outboard motor with competitive rates starting from 6.99% APR*. Easy online application, quick approval. Flexible terms from 36-180 months. *Promotional rates subject to availability." />
      <meta name="keywords" content="boat motor financing, outboard motor loan, Mercury financing, marine financing Canada, boat loan Ontario, outboard financing rates" />
      <link rel="canonical" href="https://quote.harrisboatworks.ca/financing-application" />
      
      {/* Open Graph */}
      <meta property="og:title" content="Boat Motor Financing | Harris Boat Works" />
      <meta property="og:description" content="Finance your Mercury outboard with rates starting from 6.99% APR*. Easy online application." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://quote.harrisboatworks.ca/financing-application" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Boat Motor Financing | Harris Boat Works" />
      <meta name="twitter:description" content="Competitive boat motor financing. Rates starting from 6.99% APR*." />
      
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
