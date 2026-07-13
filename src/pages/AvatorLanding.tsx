import { Award, Users, MapPin, Wrench, Phone, MessageSquare, Mail } from 'lucide-react';
import { HubPage } from '@/components/hub/HubPage';
import { SITE_URL } from '@/lib/site';

const PATH = '/electric/mercury-avator';
const LAST_REVIEWED_ISO = '2026-07-13';
const LAST_REVIEWED_LABEL = 'July 2026';

const FAQS = [
  {
    question: 'Does Harris Boat Works sell Mercury Avator electric outboards?',
    answer:
      'Yes, Avator is joining our lineup now. Pricing is being finalized; call 905-342-2153 for current details and timing. Like all our motors, Avator is pickup only at Gores Landing.',
  },
  {
    question: 'How is Avator power rated?',
    answer:
      "In kilowatts of output power and equivalent thrust, not gas horsepower. The 7.5e, for example, delivers 750 watts at the propshaft. It's a different way of thinking about power, and we're happy to translate it to your boat and use case.",
  },
  {
    question: 'What will an Avator cost?',
    answer:
      'Pricing is coming soon. Avator is built to order through Mercury Canada and battery count drives the price, so the honest answer today is call us and we\'ll quote your configuration as soon as pricing is locked.',
  },
  {
    question: 'Can I use Avator on electric-only lakes in Ontario?',
    answer:
      "That's one of its best use cases. Zero-exhaust electric propulsion is exactly what electric-only and restricted waters in cottage country call for. Check your lake's specific rules before you launch.",
  },
  {
    question: 'How do I charge an Avator at the cottage?',
    answer:
      'The portable models use swappable batteries you can carry up to the cottage and charge on a standard outlet overnight. Our charging guide covers dock and cottage setups in detail.',
  },
];

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${SITE_URL}${PATH}#service`,
  name: 'Mercury Avator Electric Outboards',
  serviceType: 'Electric Outboard Motor Sales',
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
    'Mercury Avator electric outboard motors at Harris Boat Works: portable and remote-steer electric outboards rated in kilowatts of output power and thrust. Built to order through Mercury Canada. Pickup only at Gores Landing, Ontario.',
  brand: { '@type': 'Brand', name: 'Mercury Marine' },
  url: `${SITE_URL}${PATH}`,
};

const PricingComingSoonBanner = (
  <div className="not-prose my-6 rounded-2xl border-2 border-repower-gold bg-repower-gold/10 p-6 md:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-repower-gold">
      Pricing coming soon
    </p>
    <h2 className="mb-3 font-display text-2xl font-bold text-repower-cream md:text-3xl">
      Get on the Avator list
    </h2>
    <p className="mb-5 text-repower-cream/85">
      We're finalizing Avator pricing now and it will appear here and in our quote tools the moment
      it's set. In the meantime, reach out and we'll walk you through configurations and get you a
      number as soon as we have one.
    </p>
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <a
        href="tel:+19053422153"
        className="inline-flex items-center gap-2 rounded-md bg-repower-gold px-5 py-3 text-sm font-semibold text-repower-navy-900 hover:bg-repower-gold/90"
      >
        <Phone className="h-4 w-4" aria-hidden="true" />
        Call 905-342-2153
      </a>
      <a
        href="sms:+16479522153"
        className="inline-flex items-center gap-2 rounded-md border border-repower-cream/25 px-5 py-3 text-sm font-semibold text-repower-cream hover:border-repower-gold hover:text-repower-gold"
      >
        <MessageSquare className="h-4 w-4" aria-hidden="true" />
        Text 647-952-2153
      </a>
      <a
        href="mailto:info@harrisboatworks.ca?subject=Avator%20pricing%20updates"
        className="inline-flex items-center gap-2 rounded-md border border-repower-cream/25 px-5 py-3 text-sm font-semibold text-repower-cream hover:border-repower-gold hover:text-repower-gold"
      >
        <Mail className="h-4 w-4" aria-hidden="true" />
        Notify me by email
      </a>
    </div>
  </div>
);

const EnrichedContent = (
  <>
    <h2>Why electric, why now</h2>
    <p>
      Electric-only lakes and quiet bays are multiplying across Ontario cottage country, and the
      technology finally earns its keep for small-boat duty. No fuel to stabilize, no fumes at the
      dock, instant torque at the twist of a tiller, and a swappable battery you can charge at the
      cottage overnight. For tenders, small tinnies, canoes with square sterns, and silent-approach
      fishing, Avator is the first electric line we've been comfortable putting the Mercury badge
      behind.
    </p>

    <h2>The Avator lineup</h2>
    <p>
      Mercury builds five Avator models. The portable tiller trio (7.5e, 20e, 35e) covers tender,
      dinghy, and small fishing boat duty; the 7.5e delivers 750 watts at the prop with a swappable
      battery around 1 kWh. The bigger 75e and 110e bring remote steering and multi-battery banks
      for larger small craft. All are rated in kilowatts of output power and thrust rather than gas
      horsepower, which is how Mercury frames them and how we quote them. Avator is built to order
      through Mercury Canada, and battery count is the biggest driver of the final number.
    </p>

    <h2>What Avator is good for on Rice Lake and the Kawarthas</h2>
    <ul>
      <li>Electric-only and restricted waters in cottage country</li>
      <li>Silent trolling and finesse fishing approaches</li>
      <li>Tenders and dinghies at the cottage: charge overnight, boat all weekend</li>
      <li>Short-hop cruising where quiet beats speed</li>
    </ul>
    <p>
      <strong>And what it's not:</strong> Avator won't replace a 60 or 115 on a family runabout.
      Range and load characteristics make it a small-boat, calm-water tool. We'll tell you straight
      if your use case wants gas.
    </p>

    {PricingComingSoonBanner}
  </>
);

export default function AvatorLanding() {
  return (
    <HubPage
      path={PATH}
      metaTitle="Mercury Avator Electric Outboards Ontario | Harris Boat Works"
      metaDescription="Mercury Avator electric outboards are coming to Harris Boat Works on Rice Lake. Lineup, use cases for Kawartha waters, and honest answers. Pricing coming soon."
      breadcrumbName="Mercury Avator Electric"
      lastReviewedISO={LAST_REVIEWED_ISO}
      lastReviewedLabel={LAST_REVIEWED_LABEL}
      h1="Mercury Avator Electric Outboards Are Coming to Harris Boat Works"
      subhead="Quiet, zero-exhaust electric power for small boats, joining our lineup on Rice Lake. Pricing coming soon."
      primaryCTA={{ label: 'Get on the Avator list', to: '/contact' }}
      phoneNumber="(905) 342-2153"
      directAnswer={
        <>
          Mercury's Avator line brings quiet, zero-exhaust electric power to small boats, and it's
          joining our lineup at Harris Boat Works on Rice Lake. Pricing is being finalized now. Call
          or text us to get on the list, and we'll have real CAD numbers for you soon.
        </>
      }
      enrichedContent={EnrichedContent}
      table={{
        caption: 'The Mercury Avator Lineup',
        columns: [
          { key: 'model', label: 'Model' },
          { key: 'style', label: 'Style' },
          { key: 'use', label: 'Best for' },
        ],
        rows: [
          { model: 'Avator 7.5e', style: 'Portable tiller · integrated ~1 kWh battery', use: 'Canoes, tenders, dinghies, trolling' },
          { model: 'Avator 20e', style: 'Portable tiller · external battery', use: 'Small tinnies, inflatables' },
          { model: 'Avator 35e', style: 'Portable tiller · external battery', use: 'Small fishing boats, light tenders' },
          { model: 'Avator 75e', style: 'Remote steer · multi-battery bank', use: 'Small pontoons, larger tenders' },
          { model: 'Avator 110e', style: 'Remote steer · multi-battery bank', use: 'Pontoons and small day boats' },
        ],
        footnote: (
          <>Avator is rated in kilowatts of output power and thrust, not gas horsepower. Built to order through Mercury Canada.</>
        ),
      }}
      coveredIntro="Related Avator reading from the HBW blog. Range, charging, real-world use, and a straight comparison with the main electric-outboard alternative."
      articleGroups={[
        {
          heading: 'Avator guides',
          cards: [
            { title: 'Mercury Avator Electric Outboards: Cost & Range (Canada)', description: 'Lineup overview, honest range talk, use-case fit.', to: '/blog/mercury-avator-electric-boating-ontario' },
            { title: 'Mercury Avator 7.5e: Review, Price CAD, and Range (2026)', description: 'The entry portable, up close.', to: '/blog/mercury-avator-7-5e-review' },
            { title: 'Mercury Avator Range on Rice Lake (2026)', description: 'What range really looks like on our home water.', to: '/blog/mercury-avator-range-rice-lake-cottage' },
            { title: 'Charging a Mercury Avator at Your Cottage Dock', description: 'Dock, cottage, and cabin charging setups.', to: '/blog/mercury-avator-charging-cottage-dock' },
            { title: 'Mercury Avator vs Torqeedo: Honest Comparison', description: 'The two serious electric outboard options, side by side.', to: '/blog/mercury-avator-vs-torqeedo' },
          ],
        },
      ]}
      whyHbwIntro="Family-owned on Rice Lake since 1947, Mercury dealer since 1965, Mercury Premier Dealer today."
      whyHbw={[
        { icon: <Award className="h-5 w-5" aria-hidden="true" />, title: 'Mercury Premier Dealer', description: 'Full Mercury lineup, including Avator as it comes online.' },
        { icon: <Users className="h-5 w-5" aria-hidden="true" />, title: 'Three generations on Rice Lake', description: 'Straight advice on what fits your boat and how you actually use it.' },
        { icon: <Wrench className="h-5 w-5" aria-hidden="true" />, title: 'Factory-trained service', description: 'The same shop that supports the motor is the one selling it.' },
        { icon: <MapPin className="h-5 w-5" aria-hidden="true" />, title: 'Pickup at Gores Landing', description: 'All motors are pickup only. No shipping, no third-party release.' },
      ]}
      faqs={FAQS}
      secondaryCTA={{
        heading: 'Pricing coming soon',
        body: (
          <>
            Call <a href="tel:+19053422153" className="text-repower-gold hover:underline">905-342-2153</a>, text{' '}
            <a href="sms:+16479522153" className="text-repower-gold hover:underline">647-952-2153</a>, or email{' '}
            <a
              href="mailto:info@harrisboatworks.ca?subject=Avator%20pricing%20updates"
              className="text-repower-gold hover:underline"
            >
              info@harrisboatworks.ca
            </a>{' '}
            and we'll get you a real number as soon as pricing is locked.
          </>
        ),
        button: { label: 'Contact HBW', to: '/contact' },
      }}
      extraSchemas={[serviceSchema]}
    />
  );
}
