import { Link } from 'react-router-dom';
import { Award, Users, MapPin, Wrench } from 'lucide-react';
import { HubPage } from '@/components/hub/HubPage';
import { getCurrentMercuryFinancingRate } from '@/components/promotions/TDAlwaysOnOffer';

const CURRENT_RATE = getCurrentMercuryFinancingRate();

export default function RepowerHub() {
  return (
    <HubPage
      path="/repower"
      metaTitle="Mercury Repower Ontario | Mercuryrepower.ca"
      metaDescription="Repower with a new Mercury at Harris Boat Works on Rice Lake. Full job typically $11,000 to $40,000 CAD (2026). Build your quote, pickup at Gores Landing."
      breadcrumbName="Mercury Repower"
      lastReviewedISO="2026-05-05"
      lastReviewedLabel="May 2026"
      h1="Mercury Repower Guide for Ontario Boaters (2026)"
      subhead="Live pricing, real CAD numbers, 60 years of HBW expertise."
      primaryCTA={{ label: 'Build Your Mercury Quote', to: '/quote/motor-selection' }}
      phoneNumber="(905) 342-2153"
      directAnswer={
        <>
          A Mercury repower means replacing your existing outboard with a new
          Mercury on your current boat. For most Ontario freshwater customers
          in 2026, all-in costs land between $11,000 and $40,000 CAD depending
          on HP class, hull, and rigging. The hull is the asset; the motor is
          the wear part. A repower on a solid hull gives you 80% of the
          new-boat experience for half the money. Live pricing on every
          Mercury we sell is at{' '}
          <Link
            to="/quote/motor-selection"
            className="font-semibold text-repower-gold underline-offset-4 hover:underline"
          >
            /quote/motor-selection
          </Link>
          , or see the{' '}
          <Link
            to="/pricing-reference"
            className="font-semibold text-repower-gold underline-offset-4 hover:underline"
          >
            full Mercury price list
          </Link>
          {' '}for every model in CAD.
        </>
      }
      table={{
        caption: 'Mercury Repower Cost by HP Class',
        columns: [
          { key: 'hp', label: 'HP Class' },
          { key: 'use', label: 'Typical Use' },
          { key: 'cost', label: 'All-in Cost (CAD before HST)' },
        ],
        rows: [
          { hp: '9.9 to 25 HP', use: 'Small tin boats, kickers', cost: '$3,500 to $8,500' },
          { hp: '40 to 60 HP', use: '14 to 16 ft aluminum console', cost: '$11,000 to $15,000' },
          { hp: '75 to 115 HP', use: '16 to 18 ft aluminum console (most common)', cost: '$17,000 to $22,000' },
          { hp: '150 HP', use: '18 to 20 ft, pontoons, water sports', cost: '$23,000 to $30,000' },
          { hp: '200 to 300 HP', use: 'Larger fiberglass, tritoons, performance', cost: '$35,000 to $40,000' },
        ],
        footnote: (
          <>
            Live pricing on every motor at{' '}
            <Link to="/quote/motor-selection" className="text-repower-gold hover:underline">
              /quote/motor-selection
            </Link>
            .
          </>
        ),
      }}
      coveredIntro="The Mercury Repower Hub bundles the full process: deciding to repower, choosing a motor, financing, paperwork, and execution."
      articleGroups={[
        {
          heading: 'Repower decision',
          cards: [
            {
              title: 'Boat Repowering Guide: When to Replace Your Motor',
              description: 'Warning signs, age thresholds, and the math of repower vs replace.',
              to: '/blog/boat-repowering-guide-when-to-replace-motor',
            },
            {
              title: 'Boat Hull Replacement vs Repower Decision',
              description: 'When the hull is worth keeping and when it is not.',
              to: '/blog/boat-hull-replacement-vs-repower-decision',
            },
            {
              title: 'Ontario Cottage Boat Motor Repower Guide',
              description: 'Cottage-use specifics: kickers, fishing, family runabouts.',
              to: '/blog/ontario-cottage-boat-motor-repower-guide',
            },
          ],
        },
        {
          heading: 'Cost and financing',
          cards: [
            {
              title: 'Mercury Repower Cost Ontario 2026 (CAD)',
              description: 'Detailed cost breakdown by HP class with line-item rigging.',
              to: '/blog/mercury-repower-cost-ontario-2026-cad',
            },
            {
              title: 'Mercury Outboard Financing Ontario 2026',
              description: 'Rates, term lengths, and how to apply through HBW.',
              to: '/blog/mercury-outboard-financing-ontario-2026',
            },
            {
              title: 'Cheapest Mercury Outboard Canada 2026',
              description: 'The actual lowest entry points across the Mercury lineup.',
              to: '/blog/cheapest-mercury-outboard-canada-2026',
            },
          ],
        },
        {
          heading: 'Process and execution',
          cards: [
            {
              title: 'Complete Guide to Boat Repower in the Kawarthas',
              description: 'End-to-end process for Kawartha-region boats.',
              to: '/blog/complete-guide-boat-repower-kawarthas',
            },
            {
              title: 'Evinrude to Mercury Repower Ontario Guide',
              description: 'Brand-conversion costs, rigging, and timing.',
              to: '/blog/evinrude-to-mercury-repower-ontario-guide',
            },
            {
              title: 'Pleasure Craft Licence Update During Repower',
              description: 'When to update Transport Canada paperwork.',
              to: '/blog/pleasure-craft-licence-update-repower-ontario',
            },
          ],
        },
        {
          heading: 'Repower deep dives',
          cards: [
            {
              title: 'Mercury Repower Cost (CAD, 2026)',
              description: 'Full job typically $11,000 to $40,000 CAD. See where the dollars go.',
              to: '/repower/cost',
            },
            {
              title: 'Mercury Repower Process: 7 Steps',
              description: 'Quote to pickup in 3 to 8 weeks. Water-tested on Rice Lake.',
              to: '/repower/process',
            },
            {
              title: 'Mercury Repower Financing',
              description: 'OAC. Live rates on the quote builder. Deposit tiers explained.',
              to: '/repower/financing',
            },
            {
              title: 'Outboard Motor Trade-In',
              description: 'CAD valuation in 1 business day. Reduces what you finance.',
              to: '/repower/trade-in',
            },
          ],
        },
      ]}
      whyHbwIntro="Sixty years of Mercury-only focus and three generations of family ownership in Gores Landing, Ontario."
      whyHbw={[
        {
          icon: <Award className="h-5 w-5" aria-hidden="true" />,
          title: 'Mercury dealer since 1965',
          description: '60 years of Mercury exclusive expertise.',
        },
        {
          icon: <Users className="h-5 w-5" aria-hidden="true" />,
          title: 'Three generations of family ownership',
          description: 'Founded 1947 in Gores Landing.',
        },
        {
          icon: <Wrench className="h-5 w-5" aria-hidden="true" />,
          title: 'Mercury-direct factory support',
          description: 'Platinum status gives priority parts and warranty.',
        },
        {
          icon: <MapPin className="h-5 w-5" aria-hidden="true" />,
          title: 'Local Ontario freshwater specialization',
          description: 'We rig for Rice Lake, Kawarthas, Simcoe, Lake Ontario.',
        },
      ]}
      faqs={[
        {
          question: 'How much does a Mercury repower cost in Ontario?',
          answer:
            'Typical 2026 all-in repowers land $11,000 to $40,000 CAD depending on HP class. Smaller motors (40 to 60 HP) are at the low end; larger motors (200 to 300 HP) at the high end. Most Kawartha repowers are 75 to 115 HP and land $17,000 to $22,000 CAD. See live pricing at /quote/motor-selection.',
        },
        {
          question: 'Should I repower or buy a new boat?',
          answer:
            "For most boaters with a hull less than 20 years old that's structurally solid, repower wins on the math. A new comparable boat package costs $25,000 to $50,000 CAD more than a repower. The hull is the asset; the motor is the wear part.",
        },
        {
          question: 'How long does a Mercury repower take?',
          answer:
            'Mercury-to-Mercury repowers take 2 to 4 days of shop time. Brand conversions (Evinrude, Yamaha, Honda to Mercury) take longer. Spring rush (March to May) adds wait time before the shop starts.',
        },
        {
          question: 'Can I finance a Mercury repower?',
          answer:
            `Yes. ${CURRENT_RATE.programLabel}. We process applications in-shop. See our financing guide for details.`,
        },
        {
          question: 'Should I switch from Evinrude to Mercury?',
          answer:
            'For most Evinrude owners, yes. BRP shut down Evinrude outboard production in 2020 and parts/service support is shrinking. Brand conversion adds $1,500 to $3,000 CAD in rigging but pays back over the life of the new motor.',
        },
        {
          question: 'When is the best time to book a repower?',
          answer:
            'Off-season (October through April). Mercury inventory is best, shop time is available, and the boat is ready for next season. Spring slots fill up by March.',
        },
        {
          question: 'Will my old controls and rigging work with a new Mercury?',
          answer:
            'Mercury-to-Mercury repowers usually keep existing post-2010 controls. Older or non-Mercury rigging needs replacement. Brand conversions need new everything. We assess during the hull walk-around.',
        },
        {
          question: 'Do I need to update my Pleasure Craft Licence after a repower?',
          answer:
            'Yes if motor HP, brand, or model changes. Updates are free and take 10 to 15 minutes online. We handle the paperwork for HBW customers.',
        },
      ]}
      secondaryCTA={{
        heading: 'Estimate your monthly payment',
        body: <>Try the financing calculator, or call to talk through your specific repower.</>,
        button: { label: 'Try the financing calculator', to: '/financing' },
      }}
      extraSchemas={[
        {
          '@type': 'Service',
          '@id': 'https://www.mercuryrepower.ca/repower#service',
          name: 'Mercury Outboard Repower Service',
          serviceType: 'Boat Motor Replacement',
          provider: {
            '@type': 'LocalBusiness',
            name: 'Harris Boat Works',
            address: {
              '@type': 'PostalAddress',
              streetAddress: '5369 Harris Boat Works Rd',
              addressLocality: 'Gores Landing',
              addressRegion: 'ON',
              postalCode: 'K0K 2E0',
              addressCountry: 'CA',
            },
            telephone: '(905) 342-2153',
          },
          areaServed: ['Rice Lake', 'Kawarthas', 'Peterborough', 'Northumberland County', 'GTA', 'Toronto', 'Ontario'],
          description:
            'Full Mercury outboard repower service: removal, rigging, controls, prop, fuel connection, and water test on Rice Lake. Pickup only at Gores Landing, Ontario.',
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
          <h2>Mercury Repower Ontario</h2>
          <blockquote>
            <strong>Quick answer:</strong> A Mercury repower is the job of pulling your old outboard off the transom and rigging a new Mercury in its place: motor, controls, cables, prop, fuel connection, water test, the whole package. At Harris Boat Works in Gores Landing, ON, a full repower typically runs $11,000 to $40,000 CAD (2026) depending on horsepower and rigging. We have been a Mercury dealer since 1965, family-owned since 1947, and we water-test every motor on Rice Lake before pickup. Pickup-only, no shipping, no delivery.
          </blockquote>

          <h3>Key facts</h3>
          <ul>
            <li>Full repower job: typically $11,000 to $40,000 CAD (2026) depending on horsepower</li>
            <li>Family-owned since 1947, Mercury dealer since 1965, current Platinum tier</li>
            <li>Address: 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0</li>
            <li>Timeline: 3 to 8 weeks from deposit to pickup, depending on Mercury lead time</li>
            <li>Deposit: $200 (portable), $500 (mid-range), $1,000 (big-block / Pro XS / Verado)</li>
            <li>Distance from Toronto: about 110 km, roughly 90 minutes door-to-door</li>
            <li>Warranty: Mercury Canadian warranty (3 years limited plus 3 years corrosion, running concurrently), with promotional extensions stacked on top of the base coverage when active</li>
            <li>Pickup-only at Gores Landing. Every motor water-tested on Rice Lake before you take it home</li>
          </ul>

          <h3>How much does a Mercury repower cost in Ontario?</h3>
          <p>The honest range for a full Mercury repower at Harris Boat Works is $11,000 to $40,000 CAD (2026). That covers the whole job: motor, rigging, controls and cables, propeller, fuel connection, old motor removal, and the water test on Rice Lake.</p>
          <p>Where you land in that range depends on three things: horsepower, the Mercury family you pick, and what your boat needs to accept the new motor. A mid-range FourStroke 40 to 90 HP repower usually lands $11,000 to $18,000. A Pro XS 200 with the Boost upgrade and digital controls runs closer to $19,000 to $25,000. A 300 HP Pro XS on a fishing rig with new gauges and a new prop can push $30,000 to $40,000. Verado V8/V10 is special-order and starts north of $25,000 for the motor alone before rigging.</p>
          <p>For a real CAD quote on your specific boat, <Link to="/quote/motor-selection">build a quote</Link> or read our <Link to="/blog/mercury-repower-cost-ontario-2026-cad">repower cost guide</Link> for the line-item breakdown.</p>

          <h3>What's included in a Mercury repower</h3>
          <ul>
            <li>The new Mercury outboard, factory-fresh with warranty registered to you</li>
            <li>Removal and disposal of your old motor, or trade-in valuation if you want credit toward the new one</li>
            <li>Mechanical or digital controls and cables, sized for your boat</li>
            <li>Propeller selection based on your hull, expected load, and how you actually run the boat</li>
            <li>Fuel system inspection (tanks, lines, primer bulb, water-separating filter) and connection to the new motor</li>
            <li>New battery cables and connections if the old ones are not up to spec</li>
            <li>Gauges or SmartCraft display where the motor calls for it</li>
            <li>A full water test on Rice Lake before pickup, including WOT run, trim check, and prop verification</li>
            <li>Walk-through at pickup so you know what every button does</li>
          </ul>
          <p>What's not in the price: trailer work, hull repair, gel-coat or aluminum patching at the transom, fuel tank replacement if your old tank is shot. We will flag any of that during the inspection and quote it separately, never bake it into the motor price as a surprise.</p>

          <h3>How long does a Mercury repower take?</h3>
          <p>Most repowers take 3 to 8 weeks from deposit to pickup. The variable is Mercury's lead time, not our bench. FourStrokes ship out of the factory in 2 to 4 weeks. Pro XS runs 3 to 6 weeks. Verado is the slow lane at 6 to 12 weeks because it's special-order.</p>
          <p>Once the motor lands at Gores Landing, the rigging and water test sit on the bench for roughly 3 to 5 working days. We'll call you the morning the water test passes and set a pickup time.</p>
          <p>Most Ontario boaters book their repower between January and April for a May long weekend launch. If you call in March hoping to be on the water by Victoria Day, we'll be honest with you about whether the motor can get here in time. The <Link to="/blog/what-happens-during-mercury-repower">repower process walkthrough</Link> covers the full 7-step timeline.</p>

          <h3>Where do I pick up my repowered boat?</h3>
          <p>You pick up at the shop: 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0. We're on the south shore of Rice Lake, about 110 km east of Toronto on the 401, 30 km south of Peterborough, and an easy run from Northumberland County, the Kawarthas, and the GTA.</p>
          <p>Pickup-only, every time. We don't ship motors and we don't deliver finished repowers. Two reasons. First, every motor we rig gets a real water test on Rice Lake before it leaves. That's not something a freight company can replicate. Second, the walk-through at pickup is part of the job. You meet the tech who rigged it. You see the throttle, the gauges, the kill switch, the trim. Nothing about your new motor should be a surprise the first time you push the boat away from the dock.</p>

          <h3>What Mercury motors can I repower with?</h3>
          <p>Anything in the current Mercury lineup, from a 2.5 HP portable to a 400 HP Verado. The most common repowers we see fall in three buckets:</p>
          <ul>
            <li><strong>Mid-range FourStroke (40 to 90 HP).</strong> The workhorse for 16 to 18 foot aluminum boats and small fibreglass runabouts. Quiet, fuel-stingy, low-maintenance.</li>
            <li><strong>Big-block FourStroke and Pro XS (115 to 300 HP).</strong> The repower of choice for pontoons, larger runabouts, and bass boats. Pro XS V8 4.6L (175 / 200 / 225 HP) supports the Mercury Boost upgrade, 25 extra HP on demand for 4 to 6 seconds at the press of a button. Most popular Boost customer: pontoon owner who wants holeshot without going up a full motor size.</li>
            <li><strong>Verado V8/V10 (250 to 400 HP).</strong> Special-order, current models naturally aspirated, starts north of $25,000 for the motor (2026). We rig these, but we don't promote them as a standard option. Most repowers don't need that much motor.</li>
          </ul>
          <p>Not sure what your hull can handle? Our <Link to="/blog/best-mercury-outboard-rice-lake-fishing">Rice Lake outboard guide</Link> covers the typical setups we see on local boats, and we'll match the right motor to your hull when you call.</p>

          <h3>Why pick Harris Boat Works for a Mercury repower?</h3>
          <p>We've been on this land since 1947 and we've been a Mercury dealer since 1965. Three generations. One brand. The reason that matters: when you hand us your boat, the same techs who priced the quote are the ones rigging the motor and running the water test on Rice Lake the next week. No subcontracted install, no parts farmed out, no handoff between sales and service.</p>
          <p>We sell Mercury only. We don't rig new outboards from other brands. The benefit to you is depth. Our service team has rigged thousands of Mercury motors across every family from FourStroke to Pro XS to Verado. Mercury Canadian warranty (3 years limited plus 3 years corrosion, concurrent), with promotional extensions stacked on top when active, applies to every motor we rig.</p>
          <p>The shop is on the south shore of Rice Lake, which means the water test is not a token spin around a marina basin. It's a real run on real water. By the time you back the trailer up to load, the motor has already proved it can do its job.</p>

          <h3>Related guides</h3>
          <ul>
            <li><Link to="/blog/mercury-repower-cost-ontario-2026-cad">Mercury Repower Cost Ontario 2026</Link></li>
            <li><Link to="/blog/what-happens-during-mercury-repower">What Happens During a Mercury Repower</Link></li>
            <li><Link to="/blog/mercury-outboard-financing-ontario-2026">Mercury Outboard Financing Ontario 2026</Link></li>
            <li><Link to="/blog/outboard-trade-in-value-ontario-hbw">Outboard Trade-In Value Ontario</Link></li>
            <li><Link to="/blog/best-mercury-outboard-rice-lake-fishing">Best Mercury Outboard for Rice Lake</Link></li>
          </ul>
        </>
      }
    />
  );
}
