import { Link } from 'react-router-dom';
import { Award, Users, MapPin, Wrench } from 'lucide-react';
import { HubPage } from '@/components/hub/HubPage';

export default function MotorSelectionHub() {
  return (
    <HubPage
      path="/motor-selection"
      canonicalPath="/quote/motor-selection"
      metaTitle="Mercury Boats Canada: Browse Mercury Outboards 2.5 to 600 HP | HBW"
      metaDescription="Mercury boats and outboards in Canada: browse the full Mercury lineup by HP class, family, and boat type. Live CAD pricing from Harris Boat Works, Mercury Platinum dealer."
      breadcrumbName="Mercury Motor Selection"
      lastReviewedISO="2026-06-02"
      lastReviewedLabel="June 2026"
      h1="How to Choose the Right Mercury Outboard for Your Boat (2026)"
      subhead="Hull-by-hull, use-by-use Mercury sizing from a Mercury Platinum dealer."
      primaryCTA={{ label: 'Build Your Mercury Quote', to: '/quote/motor-selection' }}
      phoneNumber="(905) 342-2153"
      directAnswer={
        <>
          The right Mercury for your boat depends on hull length and weight,
          intended use, passenger and gear loading, and the maximum HP rating
          on your boat's capacity plate. For most Ontario freshwater boats,
          the answer falls in the Mercury 60 to 150 HP FourStroke range,
          paired with a 9.9 ProKicker if you fish. The shortcut: aim for 70
          to 90% of your maximum rated HP for typical recreational use.
          Going lower leaves you underpowered. Live pricing on every Mercury
          we sell is at{' '}
          <Link to="/quote/motor-selection" className="font-semibold text-repower-gold underline-offset-4 hover:underline">
            /quote/motor-selection
          </Link>
          .
        </>
      }
      table={{
        caption: 'Mercury HP by Boat Type',
        columns: [
          { key: 'boat', label: 'Boat Type' },
          { key: 'len', label: 'Length' },
          { key: 'rec', label: 'Recommended Mercury' },
        ],
        rows: [
          { boat: 'Aluminum tin boat', len: '12 to 14 ft', rec: '9.9 to 25 HP tiller' },
          { boat: 'Aluminum console fishing', len: '14 to 16 ft', rec: '40 to 60 HP' },
          { boat: 'Aluminum console fishing', len: '16 to 18 ft', rec: '75 to 115 HP FourStroke' },
          { boat: 'Aluminum console fishing', len: '18 to 20 ft', rec: '115 to 150 HP FourStroke or Pro XS' },
          { boat: 'Pontoon (cruising)', len: '18 to 22 ft', rec: '90 to 115 HP Command Thrust' },
          { boat: 'Pontoon (water sports)', len: '20 to 22 ft', rec: '150 HP Command Thrust' },
          { boat: 'Tritoon', len: '22 to 24 ft', rec: '150 to 200 HP Command Thrust' },
          { boat: 'Bass boat (tournament)', len: '18 to 21 ft', rec: '200 to 250 HP Pro XS' },
          { boat: 'Center console (freshwater)', len: '22 to 26 ft', rec: '250 to 300 HP V8 FourStroke' },
        ],
        footnote: (
          <>
            For specific pricing,{' '}
            <Link to="/quote/motor-selection" className="text-repower-gold hover:underline">build a quote</Link>.
          </>
        ),
      }}
      coveredIntro="The Motor Selection Hub bundles HP sizing, motor family selection, gearcase choice, and prop selection."
      articleGroups={[
        {
          heading: 'HP class selection',
          cards: [
            { title: 'How to Choose the Right Horsepower for Your Boat', description: 'HP sizing fundamentals by hull and use case.', to: '/blog/how-to-choose-right-horsepower-boat' },
            { title: 'Mercury 75 vs 90 vs 115 Comparison', description: 'Mid-range FourStroke head-to-head.', to: '/blog/mercury-75-vs-90-vs-115-comparison' },
            { title: 'Mercury 115 vs 150 HP for Ontario Boats', description: 'When to step up to 150 HP.', to: '/blog/mercury-115-vs-150-hp-outboard-ontario' },
          ],
        },
        {
          heading: 'Motor family selection',
          cards: [
            { title: 'Mercury Motor Families: FourStroke vs Pro XS vs Verado', description: 'Family-by-family Mercury overview.', to: '/blog/mercury-motor-families-fourstroke-vs-pro-xs-vs-verado' },
            { title: 'Mercury 2026 Outboard Lineup Ontario', description: 'Full 2026 Mercury lineup snapshot.', to: '/blog/mercury-2026-outboard-lineup-ontario' },
            { title: 'Portable Mercury Outboard Guide 2.5 to 20 HP', description: 'Tiller and portable picks.', to: '/blog/portable-outboard-mercury-guide-2-20hp' },
          ],
        },
        {
          heading: 'Boat-type matching',
          cards: [
            { title: 'Best Mercury Outboard for Aluminum Fishing Boats', description: 'Aluminum console pairing.', to: '/blog/best-mercury-outboard-aluminum-fishing-boats' },
            { title: 'Best Mercury Outboard for Pontoon Boats', description: 'Pontoon-specific Mercury picks.', to: '/blog/best-mercury-outboard-pontoon-boats' },
            { title: 'Mercury Command Thrust Guide for Pontoons', description: 'When you need the big gearcase.', to: '/blog/mercury-command-thrust-guide-pontoon-boats' },
          ],
        },
        {
          heading: 'Configuration',
          cards: [
            { title: 'Mercury Propeller Selection Guide', description: 'Pitch, blade count, prop materials.', to: '/blog/mercury-propeller-selection-guide' },
            { title: 'Mercury Outboard Fuel Efficiency Guide', description: 'GPH and MPG by HP class.', to: '/blog/mercury-outboard-fuel-efficiency-guide' },
            { title: 'Tiller vs Remote Steering Outboard Guide', description: 'Tiller versus console.', to: '/blog/tiller-vs-remote-steering-outboard-guide' },
          ],
        },
      ]}
      whyHbwIntro="Three generations of Mercury rigging on Rice Lake."
      whyHbw={[
        { icon: <Award className="h-5 w-5" aria-hidden="true" />, title: '60 years of Mercury rigging experience', description: 'Three generations of HBW have rigged thousands of boats.' },
        { icon: <Wrench className="h-5 w-5" aria-hidden="true" />, title: 'Sea-trial discipline', description: 'Every repower includes prop testing on the water.' },
        { icon: <Users className="h-5 w-5" aria-hidden="true" />, title: 'Honest sizing', description: "We will tell you when your existing motor is fine and you don't need to buy." },
        { icon: <MapPin className="h-5 w-5" aria-hidden="true" />, title: 'Mercury Platinum dealer access', description: 'Factory-direct support and current product knowledge.' },
      ]}
      faqs={[
        { question: 'What HP do I need for my boat?', answer: "Aim for 70 to 90% of your boat's maximum rated HP for typical recreational use. Specific answer depends on hull length, type, and use case. See our HP guide or build a quote at /quote/motor-selection for your specific boat." },
        { question: 'Should I get FourStroke or Pro XS?', answer: 'For most recreational use (fishing, cruising, family), FourStroke is the better value. Pro XS earns its premium on tournament hulls and performance applications. The Pro XS price difference is typically $1,000 to $1,500 CAD over FourStroke at the same HP.' },
        { question: 'Do I need Mercury Command Thrust?', answer: 'For pontoons 18 ft and up, yes. For aluminum console fishing boats under 18 ft, the standard gearcase is fine. Command Thrust is a gearcase option, not a separate motor family.' },
        { question: "What's the most popular Mercury at HBW?", answer: 'The 90 EXLPT FourStroke is the most-installed Mercury we sell. It fits the most common Kawartha boat (16 to 18 ft aluminum console) and the most common use case (family fishing). The 9.9 ProKicker is the most-installed kicker.' },
        { question: 'Will the wrong prop hurt my Mercury?', answer: 'Yes. A wrong prop can cost 4 mph in top speed and 15% in fuel economy. We test props on the water during sea-trial of every repower.' },
        { question: 'Is Mercury better than Yamaha or Honda?', answer: 'Mechanically, all three brands make excellent reliable outboards. In Ontario freshwater, Mercury wins on dealer network density, parts availability, and factory-OEM relationships with Canadian boat builders.' },
        { question: 'Can I run a bigger motor than my capacity plate says?', answer: 'No. The capacity plate sets the legal and warranty-backed ceiling. Mercury voids warranty on over-powered hulls. We will not install a motor above the rated HP.' },
        { question: 'Does HBW sell Verado?', answer: 'By special order. Verado is built for offshore center consoles and twin/triple installations. Most Ontario freshwater boaters do not need Verado. Contact us for special-order quotes.' },
      ]}
      secondaryCTA={{
        heading: 'Talk to HBW about your specific boat',
        body: <>Call (905) 342-2153 or use the contact form.</>,
        button: { label: 'Contact us', to: '/contact' },
      }}
    />
  );
}
