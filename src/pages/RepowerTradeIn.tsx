import { Link } from 'react-router-dom';
import { Repeat, Award, Wrench, MapPin } from 'lucide-react';
import { HubPage } from '@/components/hub/HubPage';

export default function RepowerTradeIn() {
  return (
    <HubPage
      path="/repower/trade-in"
      metaTitle="Outboard Motor Trade-In Ontario (2026) | Mercuryrepower.ca"
      metaDescription="Trade in your old outboard at Harris Boat Works. Mercury trades standard, other brands case-by-case. Valuation in 1 business day. Gores Landing ON."
      breadcrumbName="Outboard Trade-In"
      lastReviewedISO="2026-05-26"
      lastReviewedLabel="May 2026"
      h1="Outboard Motor Trade-In Ontario (2026)"
      subhead="CAD valuation in 1 business day. Credit applied to your repower."
      primaryCTA={{ label: 'Get a Trade-In Quote', to: '/trade-in-value' }}
      phoneNumber="(905) 342-2153"
      directAnswer={
        <>
          Harris Boat Works accepts Mercury outboard trade-ins as standard practice and considers other-brand trade-ins case-by-case for resale or wholesale. Submit your motor's brand, model, HP, year, shaft length, and condition through our form. We email a CAD figure within 1 business day. Trade-in value reduces what you finance on the new motor. Old motor comes in when you pick up the new one (pickup-only, no shipping). Final value confirmed after inspection at Gores Landing.
        </>
      }
      table={{
        caption: 'Typical Non-Running Trade Ranges (CAD, 2026)',
        columns: [
          { key: 'brand', label: 'Brand / class' },
          { key: 'range', label: 'Non-running range (CAD, 2026)' },
        ],
        rows: [
          { brand: 'Mercury 9.9 to 25 HP', range: '$300 to $1,200' },
          { brand: 'Mercury 40 to 90 HP', range: '$800 to $2,500' },
          { brand: 'Mercury 115 HP and up', range: '$1,200 to $4,000' },
          { brand: 'Other brands non-running', range: '$200 to $1,500' },
        ],
        footnote: <>Running motors retail or wholesale higher depending on age, hours, and condition.</>,
      }}
      coveredIntro="Use trade-in alongside cost planning, financing, and the full process pages."
      articleGroups={[
        {
          heading: 'Plan the full job',
          cards: [
            { title: 'Mercury Repower Cost (CAD)', description: 'What the new motor and rigging cost.', to: '/repower/cost' },
            { title: 'Mercury Repower Financing', description: 'How trade-in shifts your financed amount.', to: '/repower/financing' },
            { title: 'Mercury Repower hub', description: 'Everything that goes into a repower.', to: '/repower' },
          ],
        },
      ]}
      whyHbwIntro="Mercury trades come into our used inventory or get refurbished, which usually means a stronger number than a wholesale-only buyer."
      whyHbw={[
        { icon: <Award className="h-5 w-5" aria-hidden="true" />, title: 'Mercury dealer since 1965', description: 'Current Platinum tier.' },
        { icon: <Repeat className="h-5 w-5" aria-hidden="true" />, title: 'Mercury trade-ins standard', description: 'Other brands case-by-case.' },
        { icon: <Wrench className="h-5 w-5" aria-hidden="true" />, title: 'Refurb and resale in-house', description: 'Lets us offer competitive trade values.' },
        { icon: <MapPin className="h-5 w-5" aria-hidden="true" />, title: 'Drop with the new motor pickup', description: 'Pickup-only at Gores Landing.' },
      ]}
      faqs={[
        {
          question: 'What outboards does Harris Boat Works take in trade?',
          answer:
            'We take Mercury outboard trade-ins as standard practice on every repower. Other brands (Yamaha, Honda, Suzuki, Evinrude) considered case-by-case for resale or wholesale. Two-stroke motors typically have less resale value than four-stroke, but most usable motors trade in fine. Non-running motors are evaluated for parts or wholesale value rather than retail.',
        },
        {
          question: 'How do I find out what my old motor is worth?',
          answer:
            'Submit six pieces of information: brand, model, HP, year, shaft length, and condition. The form on our site sends the request to our team, and we email you a CAD figure within 1 business day. The number you receive is subject to a final inspection at Gores Landing when you drop the motor, but the email value is what we expect to confirm in 9 out of 10 cases.',
        },
        {
          question: 'How does the trade-in apply to my new motor?',
          answer:
            "Trade-in value comes off the total before we calculate what you finance. So if your repower quote is $14,000 and your trade-in is valued at $3,500, you finance $10,500 instead of $14,000. That can shift you to a better rate tier. We'll show you the math both ways on your quote.",
        },
        {
          question: "What if my old motor doesn't run?",
          answer:
            "We still consider it. Non-running outboards usually trade in at parts or wholesale value rather than retail, depending on the motor's age and brand. That's often $200 to $1,500 (2026) against the new motor. If the lower unit is intact and the powerhead has rebuildable bones, the value goes up.",
        },
        {
          question: 'How long does a trade-in valuation take?',
          answer:
            'Typically 1 business day from form submission to CAD figure in your inbox. Submissions before noon usually get answered same day. The final value is confirmed at physical inspection in Gores Landing.',
        },
      ]}
      secondaryCTA={{
        heading: 'Get your trade-in number first',
        body: <>Submit your motor details and we email a CAD figure within 1 business day.</>,
        button: { label: 'Get a Trade-In Quote', to: '/trade-in-value' },
      }}
      enrichedContent={
        <>
          <h2>Outboard Motor Trade-In at Harris Boat Works</h2>
          <blockquote>
            <strong>Quick answer:</strong> Mercury trade-ins accepted standard on every repower. Other brands case-by-case. CAD valuation in 1 business day. Final value confirmed at Gores Landing.
          </blockquote>

          <h3>Key facts</h3>
          <ul>
            <li>Mercury trade-ins: accepted standard on every repower</li>
            <li>Other brands (Yamaha, Honda, Suzuki, Evinrude): case-by-case</li>
            <li>Valuation turnaround: typically 1 business day</li>
            <li>6 inputs needed: brand, model, HP, year, shaft length, condition</li>
            <li>Trade-in value reduces financed amount before rate tier is calculated</li>
            <li>Final value confirmed on inspection at Gores Landing</li>
            <li>Pickup-only at 5369 Harris Boat Works Rd</li>
          </ul>

          <h3>What outboards does Harris Boat Works take in trade?</h3>
          <p>Anything Mercury, every time. We've been a Mercury dealer since 1965 (current Premier tier). Mercury trade-ins go into our used inventory or get refurbished and resold, which is why we can usually give you a stronger number than a wholesale-only buyer. Other brands (Yamaha, Honda, Suzuki, Evinrude) considered case-by-case. What we don't take: cracked blocks, badly corroded mid-sections, severe saltwater damage past resale.</p>

          <h3>How do I find out what my old motor is worth?</h3>
          <p>Submit 6 inputs: brand, model, HP, year, shaft length, condition. Photos help (cowl plate, powerhead, lower unit). CAD figure in your inbox within 1 business day. Submissions before noon usually get answered same day.</p>

          <h3>Do you take non-Mercury motors?</h3>
          <p>Yes, case-by-case. Newer four-stroke Yamaha or Honda (post-2010, under 200 HP) usually retail or near-retail. Older four-strokes (1998 to 2009) wholesale. Two-stroke Evinrude, Suzuki, or older Yamaha wholesale or parts. Non-running typically $200 to $1,500 (2026).</p>

          <h3>What if my old motor doesn't run?</h3>
          <p>Still consider it. Typical non-running Mercury ranges (2026): 9.9 to 25 HP $300 to $1,200; 40 to 90 HP $800 to $2,500; 115 HP and up $1,200 to $4,000. Other brands non-running usually $200 to $1,500.</p>

          <h3>How does the trade-in apply to my new motor?</h3>
          <p>Comes off the total before financed amount is calculated. Reduces monthly payment and can shift rate tier. If paying cash, comes straight off invoice.</p>

          <h3>How long does a trade-in valuation take?</h3>
          <p>Typically 1 business day. Final value confirmed at physical inspection in Gores Landing (about 20 minutes). 9 of 10 trade-ins come in within $200 of the emailed figure.</p>

          <h3>Related</h3>
          <ul>
            <li><Link to="/repower/cost">Mercury repower cost</Link></li>
            <li><Link to="/repower/financing">Repower financing</Link></li>
            <li><Link to="/repower">Mercury Repower hub</Link></li>
            <li><Link to="/quote/motor-selection">Build a quote</Link></li>
          </ul>
        </>
      }
    />
  );
}
