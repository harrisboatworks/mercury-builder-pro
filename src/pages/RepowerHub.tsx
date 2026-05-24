import { Link } from 'react-router-dom';
import { Award, Users, MapPin, Wrench } from 'lucide-react';
import { HubPage } from '@/components/hub/HubPage';

export default function RepowerHub() {
  return (
    <HubPage
      path="/repower"
      metaTitle="Mercury Repower Ontario 2026: Cost, Process, Financing | HBW"
      metaDescription="Mercury repowers in Ontario typically run $11,000 to $40,000 CAD all-in. Get live pricing, the full repower process, and 7.99% financing options at Harris Boat Works."
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
          .
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
            'Yes. Mercury Repower Financing offers 7.99% APR for qualified buyers. We process applications in-shop. See our financing guide for details.',
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
    />
  );
}
