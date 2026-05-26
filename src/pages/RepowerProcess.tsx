import { Link } from 'react-router-dom';
import { ListChecks, Award, Wrench, MapPin } from 'lucide-react';
import { HubPage } from '@/components/hub/HubPage';

const SITE = 'https://www.mercuryrepower.ca';

const steps = [
  {
    name: 'Build a quote in the configurator',
    text:
      "Real CAD quote, not a 'request more info' form. Walks through motor model, shaft length, tiller or remote, and boat type. Three minutes. Tech follows up by phone or email to confirm anything specific.",
  },
  {
    name: 'Deposit to lock the order',
    text:
      '$200 portable, $500 mid-range, $1,000 big-block / Pro XS / Verado. Deposit goes against your final invoice. Refundable per dealer policy before Mercury releases the motor for shipping. Non-refundable after that (Mercury Canada policy).',
  },
  {
    name: 'Motor order placed with Mercury',
    text:
      'Same business day deposit clears. Lead times: FourStroke 2 to 4 weeks, Pro XS 3 to 6 weeks, Verado 6 to 12 weeks (special-order). Promotional pricing and warranty lock in at order placement.',
  },
  {
    name: 'Boat scheduled for the bay',
    text:
      'Most customers drop the boat once we have a firm arrival date for the motor. We handle a high volume of winterization and rigging jobs each year, so if your boat is already in winter storage with us, we handle the internal move.',
  },
  {
    name: 'Old motor removed, new motor rigged',
    text:
      '3 to 5 working days on the bench. Old motor unbolted, transom checked, new motor mounted to spec, controls and cables installed, fuel system inspected and connected, battery cables and gauges per spec, new prop fitted. Anything not in the original quote gets called out and quoted separately.',
  },
  {
    name: 'Water test on Rice Lake',
    text:
      'Full WOT run, cruise check, trim test under load, prop verification. Re-prop on the spot if RPM is off. Real water, real depth, real conditions. Boost feature tested on Pro XS V8 4.6L (175/200/225 HP) where applicable.',
  },
  {
    name: 'Pickup at Gores Landing',
    text:
      "Walk-through covers every button, gauge, kill switch. Pickup-only. No shipping, no delivery. 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0, about 110 km east of Toronto and 30 km south of Peterborough.",
  },
];

export default function RepowerProcess() {
  const howToSchema = {
    '@type': 'HowTo',
    '@id': `${SITE}/repower/process#howto`,
    name: 'Mercury Repower Process at Harris Boat Works',
    description:
      'Seven-step Mercury outboard repower process from quote to pickup at Harris Boat Works in Gores Landing, Ontario.',
    totalTime: 'P3W/P8W',
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
      metaTitle="Mercury Repower Process: 7 Steps (2026) | Mercuryrepower.ca"
      metaDescription="See the 7-step Mercury repower process at Harris Boat Works. Quote to pickup in 3 to 8 weeks, water-tested on Rice Lake. Pickup-only, Gores Landing ON."
      breadcrumbName="Mercury Repower Process"
      lastReviewedISO="2026-05-26"
      lastReviewedLabel="May 2026"
      h1="Mercury Repower Process: 7 Steps (2026)"
      subhead="Quote to pickup in 3 to 8 weeks. Water-tested on Rice Lake."
      primaryCTA={{ label: 'Start Your Quote', to: '/quote/motor-selection' }}
      phoneNumber="(905) 342-2153"
      directAnswer={
        <>
          A Mercury repower at Harris Boat Works follows seven steps: build a quote in the configurator, place a deposit, motor is ordered from Mercury, boat is scheduled for the bay, old motor is removed and new motor rigged, water test on Rice Lake, and pickup at Gores Landing. Total timeline is 3 to 8 weeks from deposit to pickup, driven mostly by Mercury's lead time (FourStroke 2 to 4 weeks, Pro XS 3 to 6 weeks, Verado 6 to 12 weeks). Pickup-only.
        </>
      }
      table={{
        caption: 'Mercury Repower Timeline by Family',
        columns: [
          { key: 'fam', label: 'Family' },
          { key: 'lead', label: 'Mercury lead time' },
          { key: 'rig', label: 'Rigging + water test' },
        ],
        rows: [
          { fam: 'FourStroke', lead: '2 to 4 weeks', rig: '3 to 5 working days' },
          { fam: 'Pro XS', lead: '3 to 6 weeks', rig: '3 to 5 working days' },
          { fam: 'Verado (special-order)', lead: '6 to 12 weeks', rig: '3 to 5 working days' },
        ],
        footnote: <>Book January through April for a May long weekend launch.</>,
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
      whyHbwIntro="Mercury-only since 1965, family-owned since 1947. Same techs price the quote and rig the motor."
      whyHbw={[
        { icon: <Award className="h-5 w-5" aria-hidden="true" />, title: 'Mercury dealer since 1965', description: 'Current Platinum tier.' },
        { icon: <ListChecks className="h-5 w-5" aria-hidden="true" />, title: '7-step repeatable process', description: 'Predictable timeline, no handoffs.' },
        { icon: <Wrench className="h-5 w-5" aria-hidden="true" />, title: 'In-house rigging and water test', description: 'Real Rice Lake run on every motor.' },
        { icon: <MapPin className="h-5 w-5" aria-hidden="true" />, title: 'Pickup at Gores Landing', description: '5369 Harris Boat Works Rd.' },
      ]}
      faqs={[
        {
          question: 'How long does a Mercury repower take?',
          answer:
            'Most Mercury repowers take 3 to 8 weeks from deposit to pickup. FourStroke motors ship in 2 to 4 weeks, Pro XS in 3 to 6 weeks, and Verado in 6 to 12 weeks because it is special-order. Once the motor arrives at Gores Landing, rigging and water test take 3 to 5 working days. Booking January through April gets you on the water for the May long weekend launch.',
        },
        {
          question: 'What happens at the water test?',
          answer:
            'Every motor we rig is run on Rice Lake before pickup. The test includes a full WOT (wide-open throttle) run, a cruise check at typical running speed, trim adjustment under load, and prop verification. If anything is off, we re-prop or adjust before you ever see the boat.',
        },
        {
          question: 'Can I be there during the install?',
          answer:
            "You are welcome to visit during pickup walk-through, but most of the install happens over 3 to 5 working days on the shop bench and is not a spectator activity. We will send photos or call with updates if anything unexpected comes up. The full walk-through happens when you arrive to pick up.",
        },
        {
          question: 'What if there is a problem after pickup?',
          answer:
            'Every motor we rig carries the Mercury Canadian warranty: 3 years limited plus 3 years corrosion coverage running concurrently, with promotional extensions stacked on top when active. If a warranty issue comes up after pickup, you call (905) 342-2153 and we book the boat back in. We are a Mercury dealer since 1965 (current Platinum tier), so warranty work is done in-house.',
        },
      ]}
      secondaryCTA={{
        heading: 'Ready to start the 7 steps?',
        body: <>Step 1 is a real CAD quote in about three minutes.</>,
        button: { label: 'Build Your Mercury Quote', to: '/quote/motor-selection' },
      }}
      extraSchemas={[howToSchema]}
      enrichedContent={
        <>
          <h2>The 7-Step Mercury Repower Process</h2>
          <blockquote>
            <strong>Quick answer:</strong> Quote, deposit, order, schedule, rig, water-test, pickup. 3 to 8 weeks end to end depending on Mercury lead time. Pickup-only at Gores Landing, ON.
          </blockquote>

          <h3>Key facts</h3>
          <ul>
            <li>Total process steps: 7</li>
            <li>Total timeline: 3 to 8 weeks from deposit to pickup</li>
            <li>Mercury lead time: FourStroke 2 to 4 wk, Pro XS 3 to 6 wk, Verado 6 to 12 wk</li>
            <li>Rigging plus water test on the bench: 3 to 5 working days</li>
            <li>Deposit tiers: $200 / $500 / $1,000 by HP class</li>
            <li>Water test conducted on Rice Lake (south shore, Gores Landing)</li>
            <li>Mercury dealer since 1965, current Platinum tier, family-owned since 1947</li>
            <li>Pickup-only at 5369 Harris Boat Works Rd, Gores Landing ON</li>
          </ul>

          {steps.map((s, i) => (
            <div key={s.name}>
              <h3>Step {i + 1}. {s.name}</h3>
              <p>{s.text}</p>
            </div>
          ))}

          <h3>Related</h3>
          <ul>
            <li><Link to="/repower">Mercury Repower hub</Link></li>
            <li><Link to="/repower/cost">Repower cost in CAD</Link></li>
            <li><Link to="/repower/financing">Repower financing</Link></li>
            <li><Link to="/blog/best-mercury-outboard-rice-lake-fishing">Best Mercury Outboard for Rice Lake</Link></li>
            <li><Link to="/blog/what-happens-during-mercury-repower">What happens during a Mercury repower</Link></li>
          </ul>
        </>
      }
    />
  );
}
