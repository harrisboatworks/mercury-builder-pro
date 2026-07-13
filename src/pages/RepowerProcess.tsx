import { Link } from 'react-router-dom';
import { ListChecks, Award, Wrench, MapPin } from 'lucide-react';
import { HubPage } from '@/components/hub/HubPage';

const SITE = 'https://www.mercuryrepower.ca';

const steps = [
  {
    name: 'Build a quote in the configurator',
    text:
      "Real CAD quote, not a 'request more info' form. You pick motor model, shaft length, tiller or remote, and your boat type. Three minutes. A tech follows up by phone or email to confirm the specifics.",
  },
  {
    name: 'Deposit locks the motor and your slot',
    text:
      "$200 for portables, $500 mid-range, $1,000 for Pro XS / Verado / big-block. The deposit goes against your final invoice. Refundable up until we place the order with Mercury; after that, Mercury Canada's policy applies.",
  },
  {
    name: 'Boat into the bay',
    text:
      "If your motor is on the floor (most of the year, that's what happens), we schedule the boat right away. If your boat is already in winter storage with us, we handle the internal move. If we're ordering a special-order engine, we schedule the bay for when the motor lands.",
  },
  {
    name: 'Old motor out, new motor rigged',
    text:
      "One to two working days on the bench. We pull the old motor, check the transom, mount the new one to spec, install controls and cables, inspect and connect the fuel system, wire the battery and gauges, and fit a new prop. If we find something the quote didn't cover, we call you before touching it.",
  },
  {
    name: 'Water test on Rice Lake',
    text:
      'Full WOT run, cruise check, trim test under load, prop verification. If the RPM is off, we re-prop on the spot. Real water, real depth, real conditions. Not a bench test.',
  },
  {
    name: 'Pickup at Gores Landing',
    text:
      'Walk-through of every button, gauge, and kill switch. Pickup only, no shipping, no delivery. Buyer must be present in person with valid government photo ID.',
  },
];

export default function RepowerProcess() {
  const howToSchema = {
    '@type': 'HowTo',
    '@id': `${SITE}/repower/process#howto`,
    name: 'Mercury Repower Process at Harris Boat Works',
    description:
      'Six-step Mercury outboard repower process from quote to water-tested pickup at Harris Boat Works in Gores Landing, Ontario. Most jobs run under a week because motors are stocked.',
    totalTime: 'P7D',
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };

  return (
    <HubPage
      path="/repower/process"
      metaTitle="Mercury Repower Process: 7 Steps from Quote to Splash (2026)"
      metaDescription="The 7-step Mercury repower process at Harris Boat Works: quote, deposit, order, rig, install, lake test, pickup. Mercury dealer since 1965 in Gores Landing, Ontario."
      breadcrumbName="Mercury Repower Process"
      lastReviewedISO="2026-07-09"
      lastReviewedLabel="July 2026"
      h1="Mercury Repower Process: Quote to Water-Tested Pickup, Usually Under a Week"
      subhead="Most Mercury repowers at Harris Boat Works go from first contact to a water-tested pickup in under a week. We stock the motors, we control the bay, and the same techs quote and rig the job. Special orders take longer, and we tell you upfront. Pickup only at Gores Landing, ON."
      primaryCTA={{ label: 'Start Your Quote', to: '/quote/motor-selection' }}
      phoneNumber="(905) 342-2153"
      directAnswer={
        <>
          You start with a real CAD quote in the configurator. Deposit locks the motor and your slot. We schedule the boat into the bay, pull the old motor, rig the new one, and water-test on Rice Lake. You pick it up at Gores Landing with a full walk-through. Most repowers run about a week from first contact to pickup because the motor is already on the floor. Special-order engines (uncommon Verado configs, backordered SKUs, custom shaft or gearcase combos) take longer, and we quote a realistic ETA when you deposit.
        </>
      }
      table={{
        caption: 'Deposit tiers by motor class',
        columns: [
          { key: 'class', label: 'Motor class' },
          { key: 'deposit', label: 'Deposit' },
          { key: 'refund', label: 'Refundable' },
        ],
        rows: [
          { class: 'Portable', deposit: '$200', refund: 'Until Mercury order placed' },
          { class: 'Mid-range', deposit: '$500', refund: 'Until Mercury order placed' },
          { class: 'Pro XS / Verado / big-block', deposit: '$1,000', refund: 'Until Mercury order placed' },
        ],
        footnote: <>Deposit goes against your final invoice. After Mercury order placement, Mercury Canada's policy applies.</>,
      }}
      coveredIntro="Related deep dives on cost, financing, and trade-in inside the repower workflow."
      articleGroups={[
        {
          heading: 'Inside the process',
          cards: [
            { title: 'Mercury Repower Cost (CAD)', description: 'Where the dollars actually go.', to: '/repower/cost' },
            { title: 'Mercury Repower Financing', description: 'OAC, deposits, monthly math.', to: '/repower/financing' },
            { title: 'Outboard Trade-In Value', description: 'How trade-in fits into the quote.', to: '/repower/trade-in' },
          ],
        },
      ]}
      whyHbwIntro="Same techs price the quote and rig the motor. About 85 repowers a year through the same bay."
      whyHbw={[
        { icon: <Award className="h-5 w-5" aria-hidden="true" />, title: 'We stock the motors', description: 'No Mercury lead time to wait on for most builds.' },
        { icon: <ListChecks className="h-5 w-5" aria-hidden="true" />, title: '~85 repowers a year', description: 'Same team, same process, same buyers.' },
        { icon: <Wrench className="h-5 w-5" aria-hidden="true" />, title: 'Same tech quotes and rigs', description: 'No handoffs, no re-explaining.' },
        { icon: <MapPin className="h-5 w-5" aria-hidden="true" />, title: 'Water test on Rice Lake', description: 'Real freshwater run before pickup.' },
      ]}
      faqs={[
        {
          question: 'How long does a Mercury repower take?',
          answer:
            "For most customers, under a week from first contact to a water-tested pickup. That's because we stock the motors, so there's no Mercury lead time to wait on. Special-order engines (uncommon Verado configs, backordered SKUs, custom shaft or gearcase combos) take longer, and we quote a realistic ETA when you deposit.",
        },
        {
          question: 'What happens at the water test?',
          answer:
            "We take the boat out on Rice Lake with the new motor rigged. Full throttle run to check WOT RPM, cruise check for prop pitch, trim test under load. If the RPM is off, we re-prop on the spot and run it again. You don't want to find out at your home lake that the prop is wrong.",
        },
        {
          question: 'Can I be there during the install?',
          answer:
            'For the full-day install, no. We need the bay clear to work. For the water test and pickup walk-through, yes, and most customers come out for the walk-through so we can go over every control, every gauge, and every kill switch together.',
        },
        {
          question: 'What if there is a problem after pickup?',
          answer:
            "Call us. Every new Mercury carries a 3-year factory warranty and we're an authorized warranty dealer. Bring the boat back or call and describe what's happening. If it's a warranty issue, we handle it with Mercury on your behalf.",
        },
        {
          question: 'Do you ship the motor to me?',
          answer:
            'No. Pickup only at 5369 Harris Boat Works Rd, Gores Landing, ON. The water test is here. The final tune is here. You come and get it, in person with government photo ID.',
        },
        {
          question: 'When should I book for spring?',
          answer:
            "If you want the earliest spring launch, deposit during our winter closure (December through March). We'll start the moment we reopen April 1. If you're flexible on timing, deposit any time and we'll schedule around your boat's arrival.",
        },
      ]}
      secondaryCTA={{
        heading: 'Ready to start?',
        body: <>Step 1 is a real CAD quote in about three minutes.</>,
        button: { label: 'Build Your Mercury Quote', to: '/quote/motor-selection' },
      }}
      extraSchemas={[howToSchema]}
      enrichedContent={
        <>
          <h2>The Mercury Repower Process at Harris Boat Works</h2>
          <blockquote>
            <strong>Quick answer:</strong> You start with a real CAD quote in the configurator. Deposit locks the motor and your slot. We schedule the boat into the bay, pull the old motor, rig the new one, and water-test on Rice Lake. You pick it up at Gores Landing with a full walk-through. Most repowers run about a week from first contact to pickup because the motor is already on the floor. Special-order engines (uncommon Verado configs, backordered SKUs, custom shaft or gearcase combos) take longer, and we quote a realistic ETA when you deposit.
          </blockquote>

          <h3>Key facts</h3>
          <ul>
            <li><strong>Typical timeline:</strong> Under a week, first contact to water-tested pickup</li>
            <li><strong>Rigging + water test:</strong> 1 to 2 working days on the bench</li>
            <li><strong>Deposit tiers:</strong> $200 portable, $500 mid-range, $1,000 Pro XS / Verado / big-block</li>
            <li><strong>Water test:</strong> Rice Lake, Gores Landing (real freshwater, real load)</li>
            <li><strong>Repowers per year:</strong> ~85</li>
            <li><strong>Winter closure:</strong> December 1 through April 1 (deposits accepted for spring slots)</li>
            <li>Mercury outboard dealer since 1965, current Premier tier</li>
            <li>Family-owned since 1947</li>
            <li>Pickup only at 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0</li>
          </ul>

          {steps.map((s, i) => (
            <div key={s.name}>
              <h3>Step {i + 1}. {s.name}</h3>
              <p>{s.text}</p>
            </div>
          ))}

          <h2>When It Takes Longer</h2>
          <p>Not every job runs in a week. The exception cases:</p>
          <ul>
            <li><strong>Special-order Verado configurations</strong> (uncommon shaft lengths, dual-engine rigging, specific gearcase combos)</li>
            <li><strong>Backordered SKUs</strong> when Mercury Canada is between shipments</li>
            <li><strong>Custom rigging</strong> that needs parts we don't stock (specialty controls, non-standard DTS, unusual gauge integrations)</li>
          </ul>
          <p>For these, we quote a realistic ETA when you deposit. If Mercury's lead time changes after the order is in, we tell you.</p>

          <h2>Winter Booking (December Through March)</h2>
          <p>We're closed December 1 through April 1. Deposits are still accepted through the winter. If you want the earliest spring launch, get your deposit in during winter and we'll start the moment we reopen April 1. Standard-motor customers who deposit in January or February are typically on the water by mid-May.</p>

          <h2>Why It's Fast</h2>
          <ul>
            <li><strong>We stock the motors.</strong> Most Mercurys most customers ask for are already at Gores Landing. No Mercury lead time to wait on.</li>
            <li><strong>We do about 85 repowers a year.</strong> Same team, same process, same buyers. Everyone knows the drill.</li>
            <li><strong>Same tech quotes and rigs.</strong> Whoever priced your quote is the one who rigs the motor. No handoffs, no re-explaining.</li>
            <li><strong>Water test on our home lake.</strong> Every motor gets a real Rice Lake run before it goes home.</li>
          </ul>

          <p><strong>Related guides:</strong></p>
          <ul>
            <li><Link to="/repower">Mercury Repower hub</Link></li>
            <li><Link to="/repower/cost">Repower cost in CAD</Link></li>
            <li><Link to="/repower/financing">Repower financing</Link></li>
            <li><Link to="/repower/trade-in">Trade-in value</Link></li>
            <li><Link to="/blog/best-mercury-outboard-rice-lake-fishing">Best Mercury outboard for Rice Lake</Link></li>
          </ul>
        </>
      }
    />
  );
}
