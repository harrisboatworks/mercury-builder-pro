import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/lib/site';

const HOWTO_FAQ = [
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

export function HowToRepowerSEO() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/how-to-repower-a-boat#webpage`,
        "url": `${SITE_URL}/how-to-repower-a-boat`,
        "name": "How to Repower a Boat — 7-Step Mercury Repower Process | Harris Boat Works",
        "description": "Step-by-step guide to repowering a boat with a new Mercury outboard: quote, sizing, deposit, scheduling, install, lake-test, and pickup. Mercury Marine Platinum Dealer since 1965 on Rice Lake, Ontario.",
        "isPartOf": { "@id": "https://mercuryrepower.ca/#website" },
        "about": { "@id": "https://mercuryrepower.ca/#organization" },
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
        "estimatedCost": {
          "@type": "MonetaryAmount",
          "currency": "CAD",
          "value": "12000"
        },
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
          {
            "@type": "HowToStep",
            "position": 1,
            "name": "Build Your Quote Online",
            "text": "Use the configurator at mercuryrepower.ca to choose your Mercury motor (FourStroke, Pro XS, SeaPro, or ProKicker), shaft length, and controls. You'll see live CAD pricing, financing estimates, and any active promotions instantly — no forms, no waiting.",
            "url": `${SITE_URL}/quote/motor-selection`
          },
          {
            "@type": "HowToStep",
            "position": 2,
            "name": "Confirm Motor & Shaft Fit",
            "text": "Tell us your boat's make, model, transom height, and capacity plate HP rating. We'll confirm the right Mercury HP, shaft length (15\", 20\", or 25\"), and whether you need Command Thrust for a pontoon or heavy hull."
          },
          {
            "@type": "HowToStep",
            "position": 3,
            "name": "Place Your Deposit",
            "text": "Secure your motor with a refundable deposit ($200–$1,000 depending on HP) paid online. This locks in the price, holds your spot in the install queue, and starts the order if the motor isn't already in stock."
          },
          {
            "@type": "HowToStep",
            "position": 4,
            "name": "Schedule the Install",
            "text": "Book your drop-off date at Harris Boat Works in Gores Landing on Rice Lake. Most installs are 1–3 days. Submit a service request at hbw.wiki/service or call (905) 342-2153."
          },
          {
            "@type": "HowToStep",
            "position": 5,
            "name": "Professional Install & Rigging",
            "text": "Our Mercury-certified technicians remove your old motor, install the new Mercury, and replace throttle, shift, steering, fuel lines, and gauges as needed. Full rigging is included in every repower package — no surprise add-ons."
          },
          {
            "@type": "HowToStep",
            "position": 6,
            "name": "Lake Test on Rice Lake",
            "text": "Every repower is lake-tested on Rice Lake before pickup. We confirm WOT RPM, prop pitch, idle, shifting, and trim. If anything's off, we adjust before you ever see the bill."
          },
          {
            "@type": "HowToStep",
            "position": 7,
            "name": "Pickup & Walk-Through",
            "text": "Pickup is by appointment at Gores Landing — about 20–30 minutes. Bring photo ID and your purchase order. We register the warranty, walk you through controls and break-in, and you're on the water. Pickup only — no shipping."
          }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/how-to-repower-a-boat#faqpage`,
        "mainEntity": HOWTO_FAQ.map(item => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": { "@type": "Answer", "text": item.answer }
        }))
      }
    ]
  };

  return (
    <Helmet>
      <title>How to Repower a Boat — 7-Step Mercury Repower Process | Harris Boat Works</title>
      <meta
        name="description"
        content="Complete 7-step guide to repowering your boat with a new Mercury outboard. Quote online, confirm fit, deposit, install, lake-test, pickup. Mercury Platinum Dealer on Rice Lake since 1965."
      />
      <meta
        name="keywords"
        content="how to repower a boat, Mercury repower process, boat motor replacement, repower steps, Mercury install Ontario, boat repower guide, Harris Boat Works"
      />
      <link rel="canonical" href={`${SITE_URL}/how-to-repower-a-boat`} />

      <meta property="og:title" content="How to Repower a Boat — 7-Step Mercury Process" />
      <meta property="og:description" content="Quote, fit, deposit, install, lake-test, pickup. The complete Mercury repower process at Harris Boat Works." />
      <meta property="og:url" content={`${SITE_URL}/how-to-repower-a-boat`} />
      <meta property="og:type" content="article" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="How to Repower a Boat — 7 Steps" />
      <meta name="twitter:description" content="Mercury Platinum Dealer's full repower process, start to finish." />

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}

export { HOWTO_FAQ };
