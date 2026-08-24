import { Link } from 'react-router-dom';
import { CreditCard, Award, Wrench, MapPin } from 'lucide-react';
import { HubPage } from '@/components/hub/HubPage';
import { formatFinancingRate } from '@/lib/finance';

export default function RepowerFinancing() {
  return (
    <HubPage
      path="/repower/financing"
      metaTitle="Mercury Outboard Financing in Ontario (2026) | HBW"
      metaDescription="Finance a Mercury repower OAC at Harris Boat Works. Current rates and your monthly payment on the live quote builder. Apply by phone at Gores Landing."
      breadcrumbName="Mercury Repower Financing"
      lastReviewedISO="2026-05-26"
      lastReviewedLabel="May 2026"
      h1="Mercury Outboard Financing in Ontario (2026)"
      subhead={`Current Mercury TD program: ${formatFinancingRate()} through Dec 31, 2026 (OAC). Monthly payments posted live on the quote builder.`}

      primaryCTA={{ label: 'See Live Rates on Your Quote', to: '/quote/motor-selection' }}
      phoneNumber="(905) 342-2153"
      directAnswer={
        <>
          Harris Boat Works arranges Mercury repower financing on approved credit (OAC) through Mercury and partner lenders. Current rates, terms (typically 36 to 84 months), and your estimated monthly payment are posted live on the quote builder. Standard deposits are $200 up to 25 HP, $500 over 25 through 115 HP, and $1,000 over 115 HP. The model-specific Mercury 9.9 MH offer for model 1A10201LK uses a $100 reservation deposit under the terms shown below. Trade-in value can reduce what you finance. Applications start with a phone call to (905) 342-2153. Mercury dealer since 1965, current Premier tier.
        </>
      }
      table={{
        caption: 'Deposit Tiers by HP Class (CAD, 2026)',
        columns: [
          { key: 'tier', label: 'Tier' },
          { key: 'hp', label: 'HP class' },
          { key: 'deposit', label: 'Deposit (CAD, 2026)' },
        ],
        rows: [
          { tier: 'Standard', hp: 'up to 25 HP', deposit: '$200' },
          { tier: 'Standard', hp: 'over 25 through 115 HP', deposit: '$500' },
          { tier: 'Standard', hp: 'over 115 HP', deposit: '$1,000' },
          { tier: '9.9 MH express offer', hp: '9.9 HP, model 1A10201LK', deposit: '$100' },
        ],
        footnote: (
          <>
            Refundability follows stock status, not the deposit amount. If the motor is in stock, the deposit is refundable. If the motor is out of stock or a special order, the deposit stays refundable until HBW confirms the exact motor, price, availability and ETA, and the customer approves the order in writing. Once HBW places the order after that written approval, the deposit becomes non-refundable and is credited to the final invoice. The $100 9.9 MH offer changes the deposit amount only.
          </>
        ),
      }}
      coveredIntro="Connected pages: pricing, trade-in credits, and the full repower hub."
      articleGroups={[
        {
          heading: 'Plan the full job',
          cards: [
            { title: 'Mercury Repower Cost (CAD)', description: 'Where the dollars go before financing.', to: '/repower/cost' },
            { title: 'Outboard Trade-In Value', description: 'Reduce what you finance with trade-in credit.', to: '/repower/trade-in' },
            { title: 'Mercury Repower Process', description: 'How financing fits the 7-step timeline.', to: '/repower/process' },
          ],
        },
      ]}
      whyHbwIntro="Financing handled in-house by phone so you can ask real questions about rate, term, and how trade-in shifts the math."
      whyHbw={[
        { icon: <Award className="h-5 w-5" aria-hidden="true" />, title: 'Mercury dealer since 1965', description: 'Current Premier tier.' },
        { icon: <CreditCard className="h-5 w-5" aria-hidden="true" />, title: 'OAC through Mercury and partners', description: 'Tier-based rates, typical terms 36 to 84 months.' },
        { icon: <Wrench className="h-5 w-5" aria-hidden="true" />, title: 'Same shop rigs your motor', description: 'No handoff between sales and service.' },
        { icon: <MapPin className="h-5 w-5" aria-hidden="true" />, title: 'Pickup at Gores Landing', description: '5369 Harris Boat Works Rd.' },
      ]}
      faqs={[
        {
          question: 'Can I finance a Mercury repower?',
          answer:
            'Yes. Harris Boat Works arranges financing OAC through Mercury and partner lenders. Current rates and your estimated monthly payment are posted live on the quote builder at /quote/motor-selection. Typical terms run 36 to 84 months.',
        },
        {
          question: 'What deposit do I need?',
          answer:
            'Standard deposits are $200 up to 25 HP, $500 over 25 through 115 HP, and $1,000 over 115 HP. The model-specific Mercury 9.9 MH offer for model 1A10201LK uses a $100 deposit. That amount does not change the refund rule. Refundability follows stock status, not the deposit amount. If the motor is in stock, the deposit is refundable. If the motor is out of stock or a special order, the deposit stays refundable until HBW confirms the exact motor, price, availability and ETA, and you approve the order in writing. Once HBW places the order after that written approval, the deposit becomes non-refundable and is credited to the final invoice.',
        },
        {
          question: 'Will financing affect my Mercury warranty?',
          answer:
            'No. Mercury Canadian warranty (3 years limited plus 3 years corrosion coverage running concurrently), with promotional extensions stacked on top when active, applies to every motor we rig regardless of how you pay. Financed motors are registered to you the same way as cash purchases.',
        },
        {
          question: 'How do I apply for repower financing?',
          answer:
            "Call Harris Boat Works at (905) 342-2153 to start an application. We do not run an online application. Financing is handled by phone with one of our team so we can answer questions about rates, terms, and how trade-in value affects the financed amount. Approval is typically same-day or next business day.",
        },
      ]}
      secondaryCTA={{
        heading: 'See your live monthly payment',
        body: <>Build a quote and current rate tiers populate your monthly estimate automatically.</>,
        button: { label: 'Build Your Mercury Quote', to: '/quote/motor-selection' },
      }}
      enrichedContent={
        <>
          <h2>Mercury Repower Financing in Ontario</h2>
          <blockquote>
            <strong>Quick answer:</strong> Financing OAC through Mercury and partner lenders. Current rates and your monthly payment posted live on the quote builder. Apply by phone at (905) 342-2153.
          </blockquote>

          <h3>Key facts</h3>
          <ul>
            <li>Financing: OAC through Mercury and partner lenders. Current rates posted live on the quote builder</li>
            <li>Typical terms: 36, 48, 60, 72, or 84 months</li>
            <li>Deposit tiers: $200 up to 25 HP, $500 over 25 through 115 HP, $1,000 over 115 HP; $100 for model 1A10201LK</li>
            <li>Sample math (illustrative, 2026): $15,000 over 60 months runs mid-$200s to low-$300s per month at current rate tiers</li>
            <li>Applications by phone: (905) 342-2153</li>
            <li>Mercury dealer since 1965 (current Premier tier); financing through Mercury and partner lenders</li>
          </ul>

          <h3>Can I finance a Mercury repower?</h3>
          <p>Yes. Most repower customers finance some or all of the job. We arrange financing OAC through Mercury and partner lenders. Current rates and your monthly payment are posted live on the quote builder. Approval is usually same-day or next business day for straightforward applications.</p>

          <h3>What are the interest rates?</h3>
          <p>Rates are tier-based by financed amount and posted live on the quote builder. There is a lower rate on amounts over $10,000 CAD financed and a higher rate on amounts under. The break point is what you actually finance, not the total cost. Trade-in plus deposit can shift you between tiers. We will run the math both ways on your quote.</p>

          <h3>Sample monthly payment math</h3>
          <p><em>Illustrative only.</em> A $15,000 repower financed over 60 months at current tier-1 rates lands in the mid-$200s to low-$300s per month, depending on exact rate and any optional add-ons. For your real number, build the quote. OAC disclaimer: rates and terms are illustrative; actual rate, term, and approval depend on lender review.</p>

          <h3>What deposit do I need?</h3>
          <p>Standard deposits are $200 up to 25 HP, $500 over 25 through 115 HP, and $1,000 over 115 HP. The model-specific Mercury 9.9 MH offer for model 1A10201LK uses a $100 deposit. That amount does not change the refund rule. Refundability follows stock status, not the deposit amount. If the motor is in stock, the deposit is refundable. If the motor is out of stock or a special order, the deposit stays refundable until HBW confirms the exact motor, price, availability and ETA, and you approve the order in writing. Once HBW places the order after that written approval, the deposit becomes non-refundable and is credited to the final invoice.</p>

          <h3>How long are typical loan terms?</h3>
          <p>36 to 48 months for smaller jobs and quick payoff. 60 months is the sweet spot for most mid-HP and Pro XS jobs. 72 to 84 months for big-block and Pro XS where the customer wants to keep cash free.</p>

          <h3>Will financing affect my warranty?</h3>
          <p>No. Mercury Canadian warranty (3 years limited plus 3 years corrosion, concurrent), with promotional extensions stacked on top when active, applies to every motor we rig regardless of how you pay.</p>

          <h3>Can a trade-in reduce what I finance?</h3>
          <p>Yes. Trade-in value comes off the total before we calculate the financed amount, often shifting rate tiers. See the <Link to="/repower/trade-in">trade-in page</Link>.</p>

          <h3>How do I apply?</h3>
          <p>Call (905) 342-2153. Phone-only application. Approval typically same-day or next business day. You'll need government photo ID, proof of income, and the quote number from the configurator (if you have built one).</p>

          <h3>Related</h3>
          <ul>
            <li><Link to="/repower/cost">Mercury repower cost</Link></li>
            <li><Link to="/repower/trade-in">Outboard trade-in</Link></li>
            <li><Link to="/repower">Mercury Repower hub</Link></li>
            <li><Link to="/quote/motor-selection">Build a quote</Link></li>
          </ul>
        </>
      }
    />
  );
}
