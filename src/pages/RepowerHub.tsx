import { Link } from 'react-router-dom';
import { Award, Users, MapPin, Wrench } from 'lucide-react';
import { HubPage } from '@/components/hub/HubPage';
import { BlogInlineCTA } from '@/components/blog/BlogInlineCTA';




// Directory of the repower cluster, grouped. Each entry is a published article.
// Some slugs from the editorial brief have not shipped yet and are intentionally
// omitted (see REPOWER_HUB_SLUGS in src/data/blogClusters.ts for the list).
type DirEntry = { title: string; description: string; to: string };
type DirGroup = { heading: string; cards: DirEntry[] };

const DIRECTORY: DirGroup[] = [
  {
    heading: 'Deciding',
    cards: [
      { title: 'Boat Repowering Guide: When to Replace Your Motor', description: 'Warning signs, age thresholds, and the math of repower vs replace.', to: '/blog/boat-repowering-guide-when-to-replace-motor' },
      { title: 'Repower vs New Boat', description: 'The honest CAD math when the hull is solid.', to: '/blog/repower-vs-new-boat' },
      { title: 'Boat Hull Replacement vs Repower Decision', description: 'When the hull is worth keeping and when it is not.', to: '/blog/boat-hull-replacement-vs-repower-decision' },
      { title: 'Repair, Repower, or Sell Your Boat (Ontario)', description: 'A 3-way decision guide for owners staring at a quote.', to: '/blog/repair-repower-or-sell-boat-ontario-decision-guide' },
      { title: 'Mercury Repower Eligibility Guide', description: 'Hull, transom, and rigging checks before you commit.', to: '/blog/mercury-repower-eligibility-guide' },
    ],
  },
  {
    heading: 'Cost & Financing',
    cards: [
      { title: 'Mercury Repower Cost Ontario 2026 (CAD)', description: 'Detailed cost breakdown by HP class with line-item rigging.', to: '/blog/mercury-repower-cost-ontario-2026-cad' },
      { title: 'Mercury Outboard & Boat Repower Financing Ontario (2026)', description: 'Current rate, terms up to 120 months, $0 down, and the honest fine print.', to: '/blog/mercury-outboard-financing-ontario-2026' },
      { title: 'Old Motor Trade-In, HST & Disposal (Ontario)', description: 'How trade-in credit, HST, and disposal interact on a repower.', to: '/blog/repower-old-motor-trade-in-hst-disposal-ontario' },
    ],
  },
  {
    heading: 'Process & What to Expect',
    cards: [
      { title: 'What Happens During a Mercury Repower', description: 'The 7-step shop walk-through from deposit to pickup.', to: '/blog/what-happens-during-mercury-repower' },
      { title: 'HBW On-Water Load Test: The Mercury Repower Advantage', description: 'Why every motor gets a real Rice Lake water test.', to: '/blog/hbw-on-water-load-test-mercury-repower-advantage-2026' },
      { title: 'Mercury Warranty After a Repower (Ontario)', description: 'How the 3+3 warranty and any active promo extension apply post-repower.', to: '/blog/mercury-warranty-after-repower-ontario' },
      { title: 'Pleasure Craft Licence Update During Repower', description: 'When and how to update Transport Canada paperwork.', to: '/blog/pleasure-craft-licence-update-repower-ontario' },
      { title: 'Winter Repower Planning Guide', description: 'Why January to March is the smart time to book.', to: '/blog/winter-repower-planning-guide' },
    ],
  },
  {
    heading: 'Brand & Engine-Type Conversions',
    cards: [
      { title: 'Evinrude to Mercury Repower (Ontario)', description: 'Brand-conversion costs, rigging changes, and timing.', to: '/blog/evinrude-to-mercury-repower-ontario-guide' },
      { title: 'Yamaha to Mercury Repower (Ontario)', description: 'What changes when you switch brands at the transom.', to: '/blog/yamaha-to-mercury-repower-ontario-guide' },
      { title: 'Honda to Mercury Repower (Ontario)', description: 'Honda-specific rigging, controls, and prop swap notes.', to: '/blog/honda-to-mercury-repower-ontario-guide' },
      { title: 'Two-Stroke vs Four-Stroke Repower', description: 'Old smoker to modern FourStroke: what actually changes.', to: '/blog/two-stroke-vs-four-stroke-repower' },
      { title: 'Outboard vs Sterndrive Repower (Ontario, 2026)', description: 'Why most Ontario boats end up outboard after a sterndrive repower.', to: '/blog/outboard-vs-sterndrive-2026-ontario-repower' },
    ],
  },
  {
    heading: 'Rigging, Controls & Fit',
    cards: [
      { title: 'Mercury DTS vs Mechanical Controls', description: 'When digital throttle and shift is worth the rigging cost.', to: '/blog/mercury-dts-vs-mechanical-controls-ontario-repower' },
      { title: 'Horsepower & Capacity Plate Guide', description: 'Reading the legal HP ceiling on your transom before you spec a motor.', to: '/blog/repower-horsepower-capacity-plate-guide' },
      { title: 'Pontoon vs Aluminum vs V-Hull Repower Differences', description: 'How hull type changes HP, gearcase, and rigging choices.', to: '/blog/repower-pontoon-aluminum-v-hull-differences' },
    ],
  },
  {
    heading: 'Local Guides',
    cards: [
      { title: 'Complete Guide to Boat Repower in the Kawarthas', description: 'End-to-end process for Kawartha-region boats.', to: '/blog/complete-guide-boat-repower-kawarthas' },
      { title: 'Ontario Cottage Boat Motor Repower Guide', description: 'Cottage-use specifics: kickers, fishing, family runabouts.', to: '/blog/ontario-cottage-boat-motor-repower-guide' },
      { title: 'Mercury Repower GTA: Toronto-Area Boater Guide', description: 'Logistics, pricing, and timeline for a GTA-to-Gores-Landing repower.', to: '/blog/mercury-repower-gta-toronto-destination' },
      { title: 'Mercury Pro XS Repower for Rice Lake & Kawartha Anglers', description: 'Pro XS hole-shot, top end, and Command Thrust for serious anglers.', to: '/blog/mercury-pro-xs-repower-rice-lake-kawartha-anglers' },
    ],
  },
];


const SITE = 'https://www.mercuryrepower.ca';
const allDirItems = DIRECTORY.flatMap((g) => g.cards);

// ItemList JSON-LD for the directory
const itemListSchema = {
  '@type': 'ItemList',
  '@id': `${SITE}/repower#directory`,
  name: 'HBW Boat Repower Guide: Article Directory',
  numberOfItems: allDirItems.length,
  itemListOrder: 'https://schema.org/ItemListOrderAscending',
  itemListElement: allDirItems.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${SITE}${c.to}`,
    name: c.title,
  })),
};

export default function RepowerHub() {
  return (
    <HubPage
      path="/repower"
      metaTitle="Boat Repower in Ontario | Mercury Outboard Repowering | Harris Boat Works"
      metaDescription="Mercury repower in Ontario: real Canadian pricing, a clear process, and a live quote in about two minutes. Mercury Premier dealer, Rice Lake since 1947."
      breadcrumbName="Boat Repower Guide"
      lastReviewedISO="2026-06-12"
      lastReviewedLabel="June 2026"
      h1="Boat Repower in Ontario. Mercury Outboard Repowering by Harris Boat Works."
      subhead="Real Canadian pricing, a clear process, and a live quote in about two minutes. Mercury Premier dealer, Rice Lake since 1947."
      primaryCTA={{ label: 'Build Your Quote', to: '/quote/motor-selection' }}
      phoneNumber="(905) 342-2153"

      directAnswer={
        <>
          <p className="mb-4">
            If you are looking for a boat repower in Ontario, you have come to
            the right place. Harris Boat Works has been a Mercury Premier
            Dealer since 1965, family-owned since 1947. We handle every boat
            engine repower from start to finish, right here at our marina on
            Rice Lake. Bring your boat to Gores Landing and we will get you
            back on the water with a new Mercury outboard.
          </p>
          A boat repower means replacing your existing outboard with a new
          Mercury on your current boat. For most Ontario freshwater customers
          in 2027, a full boat engine repower lands between $11,000 and
          $40,000 CAD depending on HP class, hull, and rigging. The hull is
          the asset; the motor is the wear part. A repower on a solid hull
          gives you 80% of the new-boat experience for half the money. Live
          pricing on every Mercury we sell is at{' '}
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
          { hp: '9.9 to 25 HP', use: 'Small tin boats, kickers', cost: 'Motor only, $3,000 to $5,500' },
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
      coveredIntro="The HBW Boat Repower Guide covers the full cluster: deciding to repower, cost and financing, the shop process, brand conversions, rigging and controls, and local Ontario context."
      articleGroups={DIRECTORY}
      whyHbwIntro="Sixty years of Mercury-only focus and three generations of family ownership in Gores Landing, Ontario."
      whyHbw={[
        { icon: <Award className="h-5 w-5" aria-hidden="true" />, title: 'Mercury dealer since 1965', description: '60 years of Mercury exclusive expertise.' },
        { icon: <Users className="h-5 w-5" aria-hidden="true" />, title: 'Three generations of family ownership', description: 'Founded 1947 in Gores Landing.' },
        { icon: <Wrench className="h-5 w-5" aria-hidden="true" />, title: 'Mercury-direct factory support', description: 'Premier status gives priority parts and warranty.' },
        { icon: <MapPin className="h-5 w-5" aria-hidden="true" />, title: 'Local Ontario freshwater specialization', description: 'We rig for Rice Lake, Kawarthas, Simcoe, Lake Ontario.' },
      ]}
      faqs={[
        { question: 'How much does a Mercury repower cost in Ontario?', answer: "It depends on the horsepower, the controls and rigging your boat needs, and trade-in. Rather than guess, build a quote and you'll get a real Canadian-dollar number in about two minutes, then a person here reviews it. No 'call for quote' games." },
        { question: 'How long does a repower take?', answer: "It comes down to motor availability and how much rigging your boat needs. When you build a quote, we give you a realistic timeline for your specific job instead of a vague estimate." },
        { question: 'Can I trade in my old motor?', answer: "Yes. We factor trade-in value into your repower. You can get a quick estimate first at our trade-in page, then carry it into your quote." },
        { question: 'Do I need new controls, cables, and gauges?', answer: "Sometimes. Older boats often need updated controls or rigging to run a new motor safely. Your quote spells out exactly what's included so there are no surprises." },
        { question: 'What happens after I build a quote?', answer: "A real person at Harris Boat Works reviews your quote and follows up. There's no obligation. You'll have a real price and a clear next step." },
      ]}
      secondaryCTA={{
        heading: 'Ready to see your real number?',
        body: <>Build a Mercury repower quote in about two minutes. Real Canadian pricing, reviewed by a person, no pressure.</>,
        button: { label: 'Build Your Quote', to: '/quote/motor-selection' },
      }}

      extraSchemas={[
        {
          '@type': 'Service',
          '@id': `${SITE}/repower#service`,
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
        itemListSchema,
      ]}
      enrichedContent={
        <>
          <h2>Boat Repower in Ontario</h2>
          <blockquote>
            <strong>Quick answer:</strong> A boat repower (sometimes searched as "boat engine repower") is the job of pulling your old outboard off the transom and rigging a new Mercury in its place: motor, controls, cables, prop, fuel connection, water test, the whole package. At Harris Boat Works in Gores Landing, ON, a full repower typically runs $11,000 to $40,000 CAD (2026) depending on horsepower and rigging. We have been a Mercury dealer since 1965, family-owned since 1947, and we water-test every motor on Rice Lake before pickup. Pickup-only, no shipping, no delivery.
          </blockquote>

          <h3>Key facts</h3>
          <ul>
            <li>Full repower job: typically $11,000 to $40,000 CAD (2026) depending on horsepower</li>
            <li>Family-owned since 1947, Mercury dealer since 1965, current Premier tier</li>
            <li>Address: 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0</li>
            <li>Timeline: 3 to 8 weeks from deposit to pickup, depending on Mercury lead time</li>
            <li>Deposit: $200 (portable), $500 (mid-range), $1,000 (big-block / Pro XS / Verado)</li>
            <li>Distance from Toronto: about 110 km, roughly 90 minutes door-to-door</li>
            <li>Warranty: Mercury Canadian warranty (3 years limited plus 3 years corrosion, running concurrently), with promotional extensions stacked on top of the base coverage when active</li>
            <li>Pickup-only at Gores Landing. Every motor water-tested on Rice Lake before you take it home</li>
          </ul>

          <h3>Ontario Repower Benchmarks</h3>
          <p>Typical scenarios we see at HBW. HP ranges and CAD figures come from the table above and our 2026 repower cost guide; the brand-conversion row adds the rigging delta documented in our Evinrude/Yamaha/Honda guides. Your actual number depends on hull, rigging, and current Mercury lead time.</p>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>HP Range</th>
                  <th>Typical All-in (CAD)</th>
                  <th>Typical Shop Timeline</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>16 to 18 ft aluminum console</td>
                  <td>75 to 115 HP</td>
                  <td>$17,000 to $22,000</td>
                  <td>3 to 8 weeks</td>
                </tr>
                <tr>
                  <td>Pontoon / tritoon</td>
                  <td>150 HP</td>
                  <td>$23,000 to $30,000</td>
                  <td>3 to 8 weeks</td>
                </tr>
                <tr>
                  <td>Bass boat (performance)</td>
                  <td>200 to 300 HP Pro XS</td>
                  <td>$35,000 to $40,000</td>
                  <td>3 to 8 weeks</td>
                </tr>
                <tr>
                  <td>Cottage tender / tiller</td>
                  <td>9.9 to 25 HP</td>
                  <td>$3,000 to $5,500 (motor only)</td>
                  <td>3 to 5 weeks</td>
                </tr>
                <tr>
                  <td>Classic Evinrude / Johnson conversion (16 to 18 ft aluminum)</td>
                  <td>75 to 115 HP</td>
                  <td>$18,500 to $25,000</td>
                  <td>3 to 8 weeks</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>The conversion row reflects the published $1,500 to $3,000 CAD brand-conversion rigging delta added to the 75 to 115 HP band. For your specific boat, <Link to="/quote/motor-selection">build a quote</Link> or read our <Link to="/blog/mercury-repower-cost-ontario-2026-cad">repower cost guide</Link> for the line-item breakdown.</p>

          <h3>How much does a Mercury repower cost in Ontario?</h3>
          <p>The honest range for a full Mercury repower at Harris Boat Works is $11,000 to $40,000 CAD (2026). That covers the whole job: motor, rigging, controls and cables, propeller, fuel connection, old motor removal, and the water test on Rice Lake.</p>
          <p>Where you land in that range depends on three things: horsepower, the Mercury family you pick, and what your boat needs to accept the new motor. A mid-range FourStroke 40 to 90 HP repower usually lands $11,000 to $18,000. A Pro XS 200 with the Boost upgrade and digital controls runs closer to $19,000 to $25,000. A 300 HP Pro XS on a fishing rig with new gauges and a new prop can push $30,000 to $40,000. Verado V8/V10 is special-order and starts north of $25,000 for the motor alone before rigging.</p>

          <BlogInlineCTA
            variant="inline"
            heading="Worried about the cost?"
            body="Financing can spread a repower over manageable monthly payments."
            primaryLabel="See current financing offers"
            primaryHref="/promotions"
          />


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

          <BlogInlineCTA
            variant="inline"
            heading="Ready to see real numbers for your boat?"
            body="Build your repower quote in about two minutes with live Canadian pricing. A person here reviews it before you hear back."
            primaryLabel="Build My Repower Quote"
            primaryHref="/quote/motor-selection"
          />

          <h3>How long does a Mercury repower take?</h3>
          <p>Most repowers take 3 to 8 weeks from deposit to pickup. The variable is Mercury's lead time, not our bench. FourStrokes ship out of the factory in 2 to 4 weeks. Pro XS runs 3 to 6 weeks. Verado is the slow lane at 6 to 12 weeks because it's special-order.</p>
          <p>Once the motor lands at Gores Landing, the rigging and water test sit on the bench for roughly 3 to 5 working days. We'll call you the morning the water test passes and set a pickup time.</p>
          <p>Most Ontario boaters book their repower between January and April for a May long weekend launch. The <Link to="/blog/what-happens-during-mercury-repower">repower process walkthrough</Link> covers the full 7-step timeline.</p>

          <h3>Where do I pick up my repowered boat?</h3>
          <p>You pick up at the shop: 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0. We're on the south shore of Rice Lake, about 110 km east of Toronto on the 401, 30 km south of Peterborough, and an easy run from Northumberland County, the Kawarthas, and the GTA.</p>
          <p>Pickup-only, every time. We don't ship motors and we don't deliver finished repowers. Every motor we rig gets a real water test on Rice Lake before it leaves, and the walk-through at pickup is part of the job.</p>

          <h3>Why pick Harris Boat Works for a Mercury repower?</h3>
          <p>We've been on this land since 1947 and we've been a Mercury dealer since 1965. Three generations. One brand. The reason that matters: when you hand us your boat, the same techs who priced the quote are the ones rigging the motor and running the water test on Rice Lake the next week. No subcontracted install, no parts farmed out, no handoff between sales and service.</p>
          <p>We sell Mercury only. We don't rig new outboards from other brands. The benefit to you is depth. Our service team has rigged thousands of Mercury motors across every family from FourStroke to Pro XS to Verado. Mercury Canadian warranty (3 years limited plus 3 years corrosion, concurrent), with promotional extensions stacked on top when active, applies to every motor we rig.</p>

          <h3>Next steps</h3>
          <ul>
            <li><Link to="/quote/motor-selection">Build Your Quote</Link>: real Canadian pricing on your repower in about two minutes.</li>
            <li><Link to="/pricing-reference">Full Mercury price list (CAD)</Link>: validate the motor price before you build a quote.</li>
            <li><Link to="/trade-in-value">Get a trade-in estimate</Link>: figure out what your old motor is worth, then carry it into your quote.</li>
            <li><Link to="/promotions">See current financing offers</Link>: spread your repower over manageable monthly payments.</li>
          </ul>

          <h3>Related guides</h3>
          <ul>
            <li><Link to="/blog/mercury-repower-cost-ontario-2026-cad">Mercury Repower Cost Ontario 2026</Link></li>
            <li><Link to="/blog/what-happens-during-mercury-repower">What Happens During a Mercury Repower</Link></li>
            <li><Link to="/blog/mercury-outboard-financing-ontario-2026">Mercury Outboard Financing Ontario 2026</Link></li>
            <li><Link to="/blog/repower-vs-new-boat">Repower vs New Boat</Link></li>
          </ul>

        </>
      }
    />
  );
}
