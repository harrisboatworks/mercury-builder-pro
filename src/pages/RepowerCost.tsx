import { Link } from 'react-router-dom';
import { DollarSign, Award, Wrench, MapPin } from 'lucide-react';
import { HubPage } from '@/components/hub/HubPage';

export default function RepowerCost() {
  return (
    <HubPage
      path="/repower/cost"
      metaTitle="Mercury Repower Cost in Canada (CAD) 2026 | Mercuryrepower.ca"
      metaDescription="See real Mercury repower prices in CAD (2026). Full job $11,000 to $40,000 at Harris Boat Works, Gores Landing ON. Build a transparent quote in 3 minutes."
      breadcrumbName="Mercury Repower Cost"
      lastReviewedISO="2026-05-26"
      lastReviewedLabel="May 2026"
      h1="Mercury Repower Cost in Canada (CAD) 2026"
      subhead="Honest CAD pricing. No loss leaders. Built in Gores Landing."
      primaryCTA={{ label: 'Build Your Mercury Quote', to: '/quote/motor-selection' }}
      phoneNumber="(905) 342-2153"
      directAnswer={
        <>
          A full Mercury repower in Canada typically costs $11,000 to $40,000 CAD (2026) at Harris Boat Works, including the motor, controls, propeller, rigging, fuel connection, old motor removal, and a water test on Rice Lake. The number is driven by horsepower, motor family (FourStroke, Pro XS, Verado), throttle type, and the condition of your existing rigging. Financing available OAC. Pickup-only at Gores Landing, ON.
        </>
      }
      table={{
        caption: 'Mercury Repower Cost by HP Class (CAD, 2026)',
        columns: [
          { key: 'hp', label: 'HP Class' },
          { key: 'motor', label: 'Motor only (CAD, 2026)' },
          { key: 'full', label: 'Full repower job (CAD, 2026)' },
        ],
        rows: [
          { hp: 'Portable (2.5 to 6 HP)', motor: '$1,271 to $2,000', full: 'typically $1,500 to $2,500' },
          { hp: 'Tiller (9.9 to 25 HP)', motor: '$2,800 to $5,500', full: '$3,500 to $7,000' },
          { hp: 'Mid (40 to 90 HP)', motor: '$8,000 to $14,000', full: '$11,000 to $18,000' },
          { hp: 'Big-block (115 to 200 HP)', motor: '$14,000 to $24,000', full: '$18,000 to $32,000' },
          { hp: 'Pro XS (115 to 300 HP)', motor: '$15,000 to $32,000', full: '$19,000 to $40,000' },
          { hp: 'Verado V8/V10 (250 to 400 HP)', motor: 'special order', full: 'special order' },
        ],
        footnote: (
          <>
            Live CAD pricing on every Mercury at{' '}
            <Link to="/quote/motor-selection" className="text-repower-gold hover:underline">
              /quote/motor-selection
            </Link>
            .
          </>
        ),
      }}
      coveredIntro="Cross-references for the full cost picture: process, financing, trade-in credits, and the detailed cost guide."
      articleGroups={[
        {
          heading: 'Pricing deep dive',
          cards: [
            {
              title: 'Mercury Repower Cost Ontario 2026 (CAD)',
              description: 'Line-item cost guide with rigging breakdown.',
              to: '/blog/mercury-repower-cost-ontario-2026-cad',
            },
            {
              title: 'Mercury Outboard Financing in Ontario',
              description: 'OAC, current rates, deposit tiers, and monthly math.',
              to: '/repower/financing',
            },
            {
              title: 'Outboard Motor Trade-In Ontario',
              description: 'How trade-in credit reduces what you finance.',
              to: '/repower/trade-in',
            },
          ],
        },
      ]}
      whyHbwIntro="Mercury-only since 1965, family-owned since 1947, and we water-test every motor on Rice Lake before pickup."
      whyHbw={[
        { icon: <Award className="h-5 w-5" aria-hidden="true" />, title: 'Mercury dealer since 1965', description: 'Current Premier tier.' },
        { icon: <DollarSign className="h-5 w-5" aria-hidden="true" />, title: 'Transparent CAD pricing', description: 'Live quote builder, no loss leaders.' },
        { icon: <Wrench className="h-5 w-5" aria-hidden="true" />, title: 'In-house rigging and warranty', description: 'Same techs price and rig your motor.' },
        { icon: <MapPin className="h-5 w-5" aria-hidden="true" />, title: 'Gores Landing, ON', description: '5369 Harris Boat Works Rd. Pickup only.' },
      ]}
      faqs={[
        {
          question: 'How much does a Mercury repower cost in CAD?',
          answer:
            'A full Mercury repower at Harris Boat Works typically costs $11,000 to $40,000 CAD (2026). A mid-range FourStroke 40 to 90 HP job runs $11,000 to $18,000. A Pro XS 200 with digital controls runs $19,000 to $25,000. A 300 HP Pro XS repower can push $35,000 to $40,000. Verado V8/V10 is special-order and starts at $25,000 for the motor before rigging.',
        },
        {
          question: "What's included in the quoted price?",
          answer:
            'The quote covers the new Mercury motor, removal of your old outboard, mechanical or digital controls and cables, propeller selection, fuel system inspection and connection, battery cables where needed, gauges or SmartCraft display per spec, and a full water test on Rice Lake before pickup. Trailer work, hull repair, and fuel tank replacement are quoted separately if needed.',
        },
        {
          question: 'Are there financing options for a Mercury repower?',
          answer:
            "Yes. Harris Boat Works arranges financing OAC through Mercury and partner lenders. Current rates and your estimated monthly payment are posted live on the quote builder at /quote/motor-selection. Deposits are $200 for portable motors, $500 for mid-range HP, and $1,000 for big-block, Pro XS, or Verado. Call (905) 342-2153 to start an application.",
        },
        {
          question: 'Can I get a written quote before I drive out?',
          answer:
            "Yes. The online quote configurator produces a transparent CAD quote in about three minutes. Pick your motor, shaft length, tiller or remote, and boat type, and you'll see the line items including rigging. A tech follows up by phone or email to confirm anything specific to your hull.",
        },
      ]}
      secondaryCTA={{
        heading: 'See your real CAD number in 3 minutes',
        body: <>Build a transparent quote with rigging, or call to talk through your specific boat.</>,
        button: { label: 'Build Your Mercury Quote', to: '/quote/motor-selection' },
      }}
      extraSchemas={[
        {
          '@type': 'Service',
          '@id': 'https://www.mercuryrepower.ca/repower/cost#service',
          name: 'Mercury Outboard Repower Pricing',
          serviceType: 'Boat Motor Replacement',
          provider: {
            '@type': 'LocalBusiness',
            name: 'Harris Boat Works',
            telephone: '(905) 342-2153',
            address: {
              '@type': 'PostalAddress',
              streetAddress: '5369 Harris Boat Works Rd',
              addressLocality: 'Gores Landing',
              addressRegion: 'ON',
              postalCode: 'K0K 2E0',
              addressCountry: 'CA',
            },
          },
          areaServed: ['Ontario'],
          offers: {
            '@type': 'Offer',
            priceCurrency: 'CAD',
            priceRange: '$11,000 - $40,000',
            availableDeliveryMethod: 'http://purl.org/goodrelations/v1#DeliveryModePickUp',
          },
        },
      ]}
      enrichedContent={
        <>
          <h2>Mercury Repower Cost in Canada (2026)</h2>
          <blockquote>
            <strong>Quick answer:</strong> A full Mercury repower at Harris Boat Works typically costs $11,000 to $40,000 CAD (2026). Where you land depends on horsepower, the Mercury family you pick, and what your existing rigging needs.
          </blockquote>

          <h3>Key facts</h3>
          <ul>
            <li>Full repower job range: $11,000 to $40,000 CAD (2026)</li>
            <li>Mid-range FourStroke (40 to 90 HP) installed: typically $11,000 to $18,000 CAD (2026)</li>
            <li>Big-block (115 to 200 HP) installed: typically $18,000 to $32,000 CAD (2026)</li>
            <li>Pro XS installed: $19,000 to $40,000 CAD (2026) depending on HP and controls</li>
            <li>Financing OAC, current rates live on the quote builder</li>
            <li>Deposit to lock the order: $200 / $500 / $1,000 by HP class</li>
            <li>Mercury dealer since 1965, current Premier tier</li>
            <li>Pickup-only at Gores Landing, ON</li>
          </ul>

          <h3>How much does a Mercury repower cost in CAD?</h3>
          <p>The real CAD range is $11,000 to $40,000 (2026). Three drivers move the number: horsepower, motor family (FourStroke, Pro XS, Verado), and the condition of your existing rigging. For your specific boat, <Link to="/quote/motor-selection">build a quote</Link> and you'll see line items in about three minutes.</p>

          <h3>What's included in the quoted price?</h3>
          <ul>
            <li>The new Mercury outboard with warranty registered to you</li>
            <li>Old motor removal, or trade-in valuation if you want credit</li>
            <li>Mechanical or digital controls and cables sized for your boat</li>
            <li>Propeller selection based on your hull and how you run the boat</li>
            <li>Fuel system inspection and connection to the new motor</li>
            <li>Battery cables and gauges or SmartCraft per spec</li>
            <li>Full water test on Rice Lake before pickup</li>
            <li>Walk-through at pickup so you know every button</li>
          </ul>
          <p>What's not in the price: trailer work, hull repair, gel-coat or aluminum patching, fuel tank replacement. Any of that gets flagged and quoted separately.</p>

          <h3>How does pricing change by horsepower?</h3>
          <p>Three buckets cover most repowers. Mid-range FourStroke 40 to 90 HP lands $11,000 to $18,000 (2026). Big-block 115 to 200 HP lands $18,000 to $32,000 (2026). Pro XS 115 to 300 HP lands $19,000 to $40,000 (2026), and the Boost upgrade on Pro XS V8 4.6L (175/200/225 HP) adds roughly $1,200 to $1,800 to the motor.</p>

          <h3>Are there financing options?</h3>
          <p>Yes. Financing OAC through Mercury and partner lenders, with current rates and your monthly payment posted live on the quote builder. Sample math is illustrative only. Deposit tiers are $200 portable, $500 mid-range, $1,000 big-block / Pro XS / Verado. Full detail on the <Link to="/repower/financing">financing page</Link>.</p>

          <h3>Why transparent pricing</h3>
          <p>We sell Mercury only and we've been a Mercury dealer since 1965 (current Premier tier). No loss-leader motor prices propped up by surprise rigging fees. Every quote shows the motor, the rigging line items, and the total in CAD before HST.</p>

          <h3>Can I get a written quote without driving out?</h3>
          <p>Yes. The configurator produces a written CAD breakdown by email in about three minutes. A tech follows up to confirm anything specific to your hull.</p>

          <h3>Related</h3>
          <ul>
            <li><Link to="/repower">Mercury Repower hub</Link></li>
            <li><Link to="/repower/process">The 7-step repower process</Link></li>
            <li><Link to="/repower/financing">Mercury repower financing</Link></li>
            <li><Link to="/repower/trade-in">Outboard trade-in</Link></li>
            <li><Link to="/blog/mercury-repower-cost-ontario-2026-cad">Detailed cost guide</Link></li>
          </ul>
        </>
      }
    />
  );
}
