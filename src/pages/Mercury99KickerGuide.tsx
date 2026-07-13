import { Award, Users, MapPin, Wrench } from 'lucide-react';
import { HubPage } from '@/components/hub/HubPage';
import { SITE_URL } from '@/lib/site';

const PATH = '/motors/mercury-9-9-tiller-kicker-guide';
const LAST_REVIEWED_ISO = '2026-07-13';
const LAST_REVIEWED_LABEL = 'July 2026';

const FAQS = [
  {
    question: "What's the difference between the Mercury 9.9 and the ProKicker?",
    answer:
      'Same 9.9 powerhead, different mission. The ProKicker adds EFI, the Command Thrust gearcase, a high-thrust four-blade prop, and power tilt, all tuned for precise low-speed trolling as a kicker motor. The standard 9.9 is the all-purpose version for tinnies and tenders.',
  },
  {
    question: 'How much does a Mercury 9.9 cost in Canada?',
    answer:
      "As of July 2026, HBW's price starts at $2,999 CAD for the manual-start 9.9MH/MLH, $3,399 for electric start, and $5,000 to $5,198 for ProKicker models. Live pricing for every variant is on our pricing reference page.",
  },
  {
    question: 'Is the Mercury 9.9 good for a sailboat?',
    answer:
      "Yes, it's a classic sailboat auxiliary. Choose the Command Thrust version with the 25\" (EXLH) shaft for most sailboats: the bigger gearcase and prop give the push a displacement hull needs.",
  },
  {
    question: 'What shaft length do I need?',
    answer:
      'Measure transom height: about 15" needs short (MH/EH), about 20" needs long (L models, the most common), about 25" needs XL, typical for sailboats. Our shaft length guide covers how to measure.',
  },
  {
    question: 'Can the 9.9 push my fishing boat as a kicker?',
    answer:
      "That's the ProKicker's whole job. On 16-20 ft aluminum fishing rigs it trolls all day at precise speeds. It mounts beside your main motor on the transom or a kicker bracket.",
  },
  {
    question: 'Do I need a licence to run a 9.9 in Ontario?',
    answer:
      "You need a Pleasure Craft Operator Card (PCOC) to operate any powered boat in Canada, including a 9.9. The boat itself needs a Pleasure Craft Licence if the motor is 10 HP or more, which the 9.9 neatly ducks under, one reason it's such a popular cottage motor.",
  },
];

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${SITE_URL}${PATH}#service`,
  name: 'Mercury 9.9 HP Outboard Sales',
  serviceType: 'Outboard Motor Sales',
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
  areaServed: ['Rice Lake', 'Kawarthas', 'Peterborough', 'Northumberland County', 'Ontario'],
  description:
    'Mercury 9.9 HP outboards at Harris Boat Works: tiller, electric start, Command Thrust, and ProKicker variants in stock and available for pickup at Gores Landing, Ontario. Real CAD pricing from a Mercury Premier Dealer since 1965.',
  brand: { '@type': 'Brand', name: 'Mercury Marine' },
  url: `${SITE_URL}${PATH}`,
};

const EnrichedContent = (
  <>
    <h2>One motor, four jobs</h2>
    <p>
      The 9.9 shows up on more transoms than any other small Mercury because it does four different
      jobs well: pushing a 12-14 ft aluminum boat at the cottage, backing up a sailboat, kicking a
      fishing rig along at trolling speed, and serving as reliable tender power. Same powerhead
      across the line; the variants below change how it's configured for each job.
    </p>

    <h2>The ProKicker is the one anglers ask about</h2>
    <p>
      The 9.9 ProKicker EFI is the trolling standard on Rice Lake and across the Kawarthas: Command
      Thrust gearcase, high-thrust four-blade prop, power tilt, and EFI cold starts on chilly
      walleye mornings. On a 16-20 ft fishing rig it holds precise trolling speed all day while
      your main motor rests. (The ProKicker's CT gearcase is a purpose-built trolling
      configuration; on the main motor of a V-hull, Command Thrust is a pontoon and workboat
      gearcase.)
    </p>

    <h2>What a Mercury 9.9 costs (as of July 2026)</h2>
    <p>
      The 9.9MH and 9.9MLH start at $2,999 CAD. Electric-start ELH runs $3,399. Command Thrust
      versions for sailboat duty run $3,971-$4,554 depending on shaft. ProKicker models run
      $5,000-$5,198 depending on tiller/remote and shaft length. Live prices for every variant are
      on the pricing reference, and you can build an itemized quote in about three minutes.
    </p>
    <p>
      <em>
        Prices here are planning figures as of July 2026. For live Mercury motor pricing, see the{' '}
        <a href="/pricing-reference">Mercury pricing reference</a>.
      </em>
    </p>

    <h2>9.9 or 15? The eternal question</h2>
    <p>
      Same block, same weight, same footprint; the 15 is a tuning step up for about $1,000 more. If
      the boat is rated for 15 HP and you ever carry two people, the 15 is usually the better buy.
      If it's a dedicated kicker or a sailboat auxiliary, the 9.9 (especially ProKicker/CT) is the
      right tool. See our full comparison at{' '}
      <a href="/blog/mercury-9-9-vs-15-hp-tiller-ontario">9.9 vs 15 HP tiller</a>.
    </p>
  </>
);

export default function Mercury99KickerGuide() {
  return (
    <HubPage
      path={PATH}
      metaTitle="Mercury 9.9 HP Outboard: Tiller, Kicker & ProKicker Guide | Harris Boat Works"
      metaDescription="Every Mercury 9.9 variant explained: tiller, electric start, Command Thrust, and the ProKicker trolling motor. Real CAD prices from a Rice Lake Mercury dealer."
      breadcrumbName="Mercury 9.9 Guide"
      lastReviewedISO={LAST_REVIEWED_ISO}
      lastReviewedLabel={LAST_REVIEWED_LABEL}
      h1="The Mercury 9.9: Ontario's Do-Everything Small Outboard"
      subhead="Tiller, electric start, Command Thrust, and the ProKicker trolling kicker, every 9.9 variant sorted, with real CAD prices."
      primaryCTA={{ label: 'Build a 9.9 quote', to: '/quote/motor-selection' }}
      phoneNumber="(905) 342-2153"
      directAnswer={
        <>
          The Mercury 9.9 is the most versatile small outboard we sell: cottage tinny power,
          sailboat auxiliary, and, in ProKicker form, the standard trolling kicker on Rice Lake and
          the Kawarthas. Prices start at $2,999 CAD as of July 2026. The trick is picking the right
          variant, and that's what this page sorts out.
        </>
      }
      enrichedContent={EnrichedContent}
      table={{
        caption: 'Mercury 9.9 lineup at HBW',
        columns: [
          { key: 'variant', label: 'Variant' },
          { key: 'letters', label: 'What the letters mean' },
          { key: 'best', label: 'Best for' },
        ],
        rows: [
          { variant: '9.9MH', letters: 'Manual start, 15" short shaft, tiller', best: 'Small tinnies, tenders, shallow transoms' },
          { variant: '9.9MLH', letters: 'Manual start, 20" long shaft, tiller', best: 'Most cottage aluminum boats' },
          { variant: '9.9EH / 9.9ELH', letters: 'Electric start, 15" / 20", tiller', best: 'Anyone tired of pulling a cord' },
          { variant: '9.9ELH Command Thrust', letters: 'Electric start, 20", bigger CT gearcase', best: 'Sailboat auxiliary, heavy displacement duty' },
          { variant: '9.9EXLH Command Thrust', letters: 'Electric start, 25" shaft, CT gearcase', best: 'Sailboats and tall transoms' },
          { variant: '9.9 ProKicker (ELHPT/ELPT/EXLHPT/EXLPT)', letters: 'EFI, CT gearcase, high-thrust 4-blade prop, power tilt, tiller or remote', best: 'The dedicated trolling kicker' },
        ],
        footnote: (
          <>Letters: M manual / E electric start, L long 20" shaft, XL 25", H tiller, PT power tilt, CT Command Thrust gearcase.</>
        ),
      }}
      coveredIntro="Related 9.9 reading from the HBW blog. Reviews, kicker setup, portable options, and how to size shaft length to your transom."
      articleGroups={[
        {
          heading: 'Mercury 9.9 guides',
          cards: [
            { title: 'Mercury 9.9 EFI Review (Ontario)', description: 'The everyday 9.9 up close.', to: '/blog/mercury-9-9-efi-review-ontario' },
            { title: 'Mercury ProKicker on Rice Lake: Fishing Guide', description: 'How anglers rig the ProKicker for walleye and musky.', to: '/blog/mercury-prokicker-rice-lake-fishing-guide' },
            { title: 'Mercury 9.9 vs 15 HP Tiller (Ontario)', description: 'Same block, different tune. Which one fits your boat.', to: '/blog/mercury-9-9-vs-15-hp-tiller-ontario' },
            { title: 'Portable Mercury Outboards 2-20 HP', description: 'Where the 9.9 sits in the portable lineup.', to: '/blog/portable-outboard-mercury-guide-2-20hp' },
            { title: 'Outboard Shaft Length Guide', description: 'How to measure your transom and pick the right shaft.', to: '/blog/outboard-shaft-length-guide' },
            { title: 'Musky Boat & Motor Guide: Kawarthas', description: 'Why 9.9 ProKicker matters for figure-8s and slow trolls.', to: '/blog/musky-boat-motor-guide-kawarthas' },
          ],
        },
      ]}
      whyHbwIntro="Family-owned on Rice Lake since 1947, Mercury dealer since 1965, Mercury Premier Dealer today."
      whyHbw={[
        { icon: <Award className="h-5 w-5" aria-hidden="true" />, title: 'Mercury Premier Dealer', description: 'Full 9.9 lineup in stock, from MH tiller to ProKicker EFI.' },
        { icon: <Users className="h-5 w-5" aria-hidden="true" />, title: 'Three generations on Rice Lake', description: 'We rig ProKickers for local anglers all season, we know what works.' },
        { icon: <Wrench className="h-5 w-5" aria-hidden="true" />, title: 'Factory-trained service', description: 'The same shop that sells the 9.9 services it, forever.' },
        { icon: <MapPin className="h-5 w-5" aria-hidden="true" />, title: 'Pickup at Gores Landing', description: 'All motors are pickup only. No shipping, no third-party release.' },
      ]}
      faqs={FAQS}
      secondaryCTA={{
        heading: 'Ready to price a Mercury 9.9?',
        body: (
          <>
            Build an itemized quote in about three minutes, pick the variant, add rigging and prop,
            see live CAD pricing, no email wall. Existing 9.9 needing service? Submit a{' '}
            <a href="https://hbw.wiki/service" className="text-repower-gold hover:underline">
              service request at hbw.wiki/service
            </a>
            .
          </>
        ),
        button: { label: 'Build a 9.9 quote', to: '/quote/motor-selection' },
      }}
      extraSchemas={[serviceSchema]}
    />
  );
}
