import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { RepowerLayout } from '@/components/repower/RepowerLayout';
import { RepowerHero } from '@/components/repower/RepowerHero';
import { RepowerMath } from '@/components/repower/RepowerMath';
import { RepowerFAQRestyled } from '@/components/repower/RepowerFAQRestyled';
import { WhyHarrisRepower } from '@/components/repower/WhyHarrisRepower';
import { RepowerProcess } from '@/components/repower/RepowerProcess';
import { WinterPro } from '@/components/repower/WinterPro';
import { FinalCTARepower } from '@/components/repower/FinalCTARepower';
import { RepowerPageSEO } from '@/components/seo/RepowerPageSEO';
import { SiteFooter } from '@/components/ui/site-footer';

import { RepowerGuideDownloadDialog } from '@/components/repower/RepowerGuideDownloadDialog';

import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, Zap, Fuel, Volume2, Wrench, Calendar, Award, 
  MapPin, Phone, Download, Play, ChevronRight, Snowflake, BadgeCheck, Star,
  Check, X
} from 'lucide-react';
import mercuryLogo from '@/assets/mercury-logo.png';
import { generateDailyTestimonials } from '@/lib/activityGenerator';
import { useGoogleReviewStats } from '@/hooks/useGoogleReviewStats';
import { allTestimonials } from '@/lib/testimonialData';

const warningSignsData = [
  { icon: AlertTriangle, title: "Hard Starting or Stalling", description: "Unreliable starts, especially when warm" },
  { icon: AlertTriangle, title: "Excessive Smoke", description: "Blue or white smoke from the exhaust" },
  { icon: AlertTriangle, title: "Loss of Power", description: "Can't reach speeds you used to" },
  { icon: AlertTriangle, title: "Frequent Repairs", description: "Costs keep adding up season after season" },
];

const modernBenefitsData = [
  { icon: Fuel, title: "30-40% Better Fuel Economy", description: "Modern four-strokes sip fuel compared to older motors" },
  { icon: Volume2, title: "Whisper Quiet", description: "Hold a conversation at cruise speed" },
  { icon: Zap, title: "Instant EFI Starting", description: "Turn the key, it starts. Every time." },
];

const repowerStepsData = [
  { step: 1, title: "Consultation & Quote", description: "We assess your boat and recommend the right Mercury motor" },
  { step: 2, title: "Scheduling", description: "Book your installation with the shortest wait times" },
  { step: 3, title: "Professional Installation", description: "Mercury-certified techs install in 1-2 days" },
  { step: 4, title: "Lake Test", description: "We test on Rice Lake and walk you through every feature" },
];

const whyHarrisData = [
  { icon: Award, title: "CSI Award Winner", description: "Mercury's highest honor for customer satisfaction" },
  { icon: Calendar, title: "Since 1947", description: "78 years of family-owned marine expertise" },
  { icon: BadgeCheck, title: "Mercury Dealer Since 1965", description: "60 years as an authorized Mercury dealer" },
  { icon: Wrench, title: "Certified Repower Center", description: "Mercury's top-tier repower certification" },
];

export default function Repower() {
  const [guideDialogOpen, setGuideDialogOpen] = useState(false);
  const dailyTestimonials = useMemo(() => generateDailyTestimonials(allTestimonials, 3), []);
  const { totalReviews: reviewCount } = useGoogleReviewStats();

  return (
    <RepowerLayout>
      <RepowerPageSEO />

      {/* === Compact content-page hero (replaces duplicate landing-page blocks) === */}
      <RepowerHero />

      {/* === Existing sections (Phase 2 will restyle these wrappers) === */}

      {/* Warning Signs Section */}
      <section className="py-24 md:py-32 px-6 md:px-14 bg-repower-paper text-repower-navy-900">
        <div className="max-w-[1400px] mx-auto">
          <div className="max-w-3xl mb-14 md:mb-20">
            <p className="font-sans font-semibold text-[13px] md:text-sm uppercase tracking-[0.24em] text-repower-mercury-red mb-4 flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-repower-mercury-red/60" />
              Warning Signs
            </p>
            <h2
              className="font-display font-bold text-[clamp(36px,4.5vw,64px)] tracking-[-0.03em] leading-[1.05] mb-6"
            >
              Is your old motor stealing your <em className="not-italic italic text-repower-mercury-red">weekends?</em>
            </h2>
            <p className="font-sans text-[17px] md:text-[18px] text-repower-navy-900/65 max-w-[60ch] leading-relaxed">
              Being out there, not worrying about getting back, that's what boating should be.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {warningSignsData.map((sign, index) => (
              <div
                key={index}
                className="border border-repower-navy-900/10 bg-white rounded-none p-8 hover:border-repower-mercury-red/40 transition-colors duration-300"
              >
                <sign.icon className="w-6 h-6 text-repower-mercury-red mb-4" strokeWidth={1.75} />
                <h3 className="font-display font-semibold text-lg text-repower-navy-900 mb-2 tracking-tight">{sign.title}</h3>
                <p className="font-sans text-sm text-repower-navy-900/65 leading-relaxed">{sign.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-repower-cream border-l-2 border-repower-gold p-8 md:p-10">
            <p className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-repower-gold mb-3 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-repower-gold" strokeWidth={2} />
              The "One More Season" Trap
            </p>
            <p className="font-sans text-base md:text-lg text-repower-navy-900/80 leading-relaxed">
              A new motor isn't just about reliability. It's about <span className="text-repower-navy-900 font-medium">using your boat instead of worrying about it.</span> Stop nursing an old motor, paying for repairs, and worrying on every trip.
            </p>
          </div>
        </div>
      </section>

      {/* Repower vs New Boat */}
      <section className="py-24 md:py-32 px-6 md:px-14 bg-repower-paper text-repower-navy-900">
        <div className="max-w-[1400px] mx-auto">
          <div className="max-w-3xl mb-14 md:mb-20">
            <p className="font-sans font-semibold text-[13px] md:text-sm uppercase tracking-[0.24em] text-repower-mercury-red mb-4 flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-repower-mercury-red/60" />
              The Big Question
            </p>
            <h2
              className="font-display font-bold text-[clamp(36px,4.5vw,64px)] tracking-[-0.03em] leading-[1.05]"
            >
              Repower or buy <em className="not-italic italic text-repower-mercury-red">new?</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-repower-cream border border-repower-navy-900/10 rounded-none p-8 md:p-10">
              <p className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-repower-gold mb-6">
                Repower if...
              </p>
              <ul className="space-y-4 list-none">
                {[
                  'Your hull is solid, aluminum & fiberglass last decades',
                  'You like your boat, it fits your needs and the right size',
                  'The numbers work: 70% of the benefit for 30% of the cost',
                ].map((item) => (
                  <li key={item} className="!flex flex-row flex-nowrap items-start gap-3 font-sans text-base text-repower-navy-900/80 leading-relaxed">
                    <Check className="w-5 h-5 text-repower-gold flex-shrink-0 mt-0.5" strokeWidth={2.5} aria-hidden="true" />
                    <span className="flex-1 min-w-0">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-repower-cream border border-repower-navy-900/10 rounded-none p-8 md:p-10">
              <p className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-repower-navy-900/55 mb-6">
                Buy new if...
              </p>
              <ul className="space-y-4 list-none">
                {[
                  'Your hull has structural damage or significant issues',
                  "You've outgrown your current boat",
                  'You want completely different features or layout',
                ].map((item) => (
                  <li key={item} className="!flex flex-row flex-nowrap items-start gap-3 font-sans text-base text-repower-navy-900/65 leading-relaxed">
                    <X className="w-5 h-5 text-repower-navy-900/50 flex-shrink-0 mt-0.5" strokeWidth={2} aria-hidden="true" />
                    <span className="flex-1 min-w-0">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Repower math (70% benefit / 30% cost), relocated from top */}
      <RepowerMath />

      {/* Modern Technology Benefits */}
      <section className="py-24 md:py-32 px-6 md:px-14 bg-repower-paper text-repower-navy-900">
        <div className="max-w-[1400px] mx-auto">
          <div className="max-w-3xl mb-14 md:mb-20">
            <p className="font-sans font-semibold text-[13px] md:text-sm uppercase tracking-[0.24em] text-repower-mercury-red mb-4 flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-repower-mercury-red/60" />
              Mercury Technology
            </p>
            <h2
              className="font-display font-bold text-[clamp(36px,4.5vw,64px)] tracking-[-0.03em] leading-[1.05] mb-6"
            >
              Not a replacement. A <em className="not-italic italic text-repower-mercury-red">revolution.</em>
            </h2>
            <p className="font-sans text-[17px] md:text-[18px] text-repower-navy-900/65 max-w-[60ch] leading-relaxed">
              If your motor is 10 to 15+ years old, technology has transformed. Modern four-strokes deliver performance that wasn't possible a decade ago.
            </p>
          </div>

          <div className="grid md:grid-cols-3 border-t border-l border-repower-navy-900/10 mb-10">
            {modernBenefitsData.map((benefit, index) => (
              <div
                key={index}
                className="border-r border-b border-repower-navy-900/10 p-8 md:p-10"
              >
                <benefit.icon className="w-6 h-6 text-repower-mercury-red mb-6" strokeWidth={1.75} />
                <h3 className="font-display font-bold text-[clamp(22px,2.2vw,32px)] text-repower-navy-900 mb-3 tracking-[-0.02em] leading-[1.1]">
                  {benefit.title}
                </h3>
                <p className="font-sans text-sm md:text-base text-repower-navy-900/65 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-repower-cream border-l-2 border-repower-gold p-6 md:p-8 flex items-center gap-6">
            <img src={mercuryLogo} alt="Mercury" className="h-10 hidden sm:block" />
            <div>
              <h3 className="font-display font-semibold text-lg text-repower-navy-900 mb-1 tracking-tight">Mercury SmartCraft® Technology</h3>
              <p className="font-sans text-sm text-repower-navy-900/65 leading-relaxed">
                Real-time engine monitoring, fuel economy tracking, and maintenance alerts, from your phone with the Mercury Marine app.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Native repower guide sections (replaces infographic image) */}
      <section className="py-24 md:py-32 px-6 md:px-14 bg-repower-navy-900 text-repower-cream">
        <div className="max-w-[1400px] mx-auto">
          <div className="max-w-3xl mb-14 md:mb-20">
            <p className="font-sans font-semibold text-[13px] md:text-sm uppercase tracking-[0.24em] text-repower-mercury-red mb-4 inline-flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-repower-mercury-red/60" />
              Reference
            </p>
            <h2 className="font-display font-bold text-[clamp(36px,4.5vw,64px)] tracking-[-0.03em] leading-[1.05]">
              The complete repower <em className="not-italic italic text-repower-mercury-red">guide.</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-repower-cream/10 border border-repower-cream/10">
            {[
              {
                Icon: AlertTriangle, color: 'text-repower-mercury-red', eyebrow: 'The Problem',
                title: 'Your motor is costing you more than money.',
                body: 'Aging two-strokes drink fuel, fail to start, and turn weekends into shop visits. Every season you wait, the resale value of your boat drops with the motor.',
              },
              {
                Icon: Wrench, color: 'text-repower-gold', eyebrow: 'The Solution',
                title: 'Repower with a modern Mercury.',
                body: 'New FourStroke EFI technology delivers 30 to 40% better fuel economy, near-silent cruising, and key-turn reliability with SmartCraft monitoring built in.',
              },
              {
                Icon: BadgeCheck, color: 'text-repower-gold', eyebrow: 'The Math',
                title: '70% of the benefit. 30% of the cost.',
                body: 'A typical Rice Lake repower runs $8,000 to $18,000 all-in. A comparable new boat is $35,000 to $70,000. You keep the hull you love and skip the depreciation hit.',
              },
              {
                Icon: ChevronRight, color: 'text-repower-gold', eyebrow: 'The Steps',
                title: 'Four steps from quote to lake test.',
                body: '01 Consultation and quote. 02 Scheduling, shortest waits in the region. 03 Mercury-certified install in 1 to 2 days. 04 Lake test on Rice Lake before you take her home.',
              },
            ].map((s) => (
              <div key={s.eyebrow} className="bg-repower-navy-900 p-8 md:p-12 motion-safe:animate-fade-in">
                <s.Icon className={`w-7 h-7 ${s.color} mb-6`} strokeWidth={1.75} />
                <p className={`font-sans font-semibold text-[13px] md:text-sm uppercase tracking-[0.24em] ${s.color} mb-3`}>
                  {s.eyebrow}
                </p>
                <h3 className="font-display font-bold text-[clamp(22px,2.4vw,32px)] text-repower-cream mb-4 tracking-[-0.02em] leading-[1.1]">
                  {s.title}
                </h3>
                <p className="font-sans text-base md:text-lg text-repower-cream/65 leading-relaxed">
                  {s.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <button
              onClick={() => setGuideDialogOpen(true)}
              className="inline-flex items-center justify-center gap-2 border border-repower-cream/30 text-repower-cream px-8 py-4 rounded-none uppercase tracking-wider text-sm font-semibold hover:bg-repower-cream/5 transition-colors duration-300"
            >
              <Download className="w-4 h-4" />
              Download Full Guide (PDF)
            </button>
          </div>
        </div>
      </section>

      <RepowerGuideDownloadDialog open={guideDialogOpen} onOpenChange={setGuideDialogOpen} />

      {/* Pricing Section */}
      <section className="py-24 md:py-32 px-6 md:px-14 bg-repower-paper text-repower-navy-900">
        <div className="max-w-[1400px] mx-auto">
          <div className="max-w-3xl mb-14 md:mb-20">
            <p className="font-sans font-semibold text-[13px] md:text-sm uppercase tracking-[0.24em] text-repower-mercury-red mb-4 flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-repower-mercury-red/60" />
              Transparent Pricing
            </p>
            <h2
              className="font-display font-bold text-[clamp(36px,4.5vw,64px)] tracking-[-0.03em] leading-[1.05] mb-6"
            >
              Real CAD pricing. <em className="not-italic italic text-repower-mercury-red">No surprises.</em>
            </h2>
            <p className="font-sans text-[17px] md:text-[18px] text-repower-navy-900/65 max-w-[60ch] leading-relaxed">
              A clear and honest look at your investment.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { n: '1', t: 'The Motor', p: '$1,500 to $35,000+', d: 'Priced by HP. Quote builder shows exact pricing for any motor.' },
              { n: '2', t: 'Rigging & Controls', p: '$1,500 to $4,000', d: "Depends on your boat's existing setup. Sometimes minimal work needed." },
              { n: '3', t: 'Installation', p: '$800 to $1,500', d: 'Includes professional mounting and lake testing on Rice Lake.' },
            ].map((item) => (
              <div key={item.n} className="border border-repower-navy-900/10 bg-white rounded p-8">
                <div className="font-display font-bold text-5xl text-repower-gold/60 mb-4 tracking-[-0.04em]">
                  {item.n}
                </div>
                <h3 className="font-display font-semibold text-lg text-repower-navy-900 mb-3">{item.t}</h3>
                <p className="font-display font-bold text-2xl text-repower-navy-900 mb-3 tracking-[-0.02em]">
                  {item.p}
                </p>
                <p className="font-sans text-sm text-repower-navy-900/65 leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>

          <div className="bg-repower-cream border-l-2 border-repower-gold rounded-none p-10 md:p-14">
            <p className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-repower-mercury-red mb-4">
              Typical Rice Lake Repower
            </p>
            <p
              className="font-display font-bold text-[clamp(40px,6vw,80px)] tracking-[-0.035em] leading-[1.05] text-repower-navy-900 mb-3"
            >
              $8,000 to $18,000
            </p>
            <p className="font-sans text-base md:text-lg text-repower-navy-900/65">
              For a 16 to 18ft boat with 60 to 115 HP, all-in.
            </p>
          </div>

          {/* Repower cost-by-HP table */}
          <div className="mt-20 max-w-5xl mx-auto">
            <h3 className="font-display font-semibold text-2xl md:text-3xl text-repower-navy-900 mb-3 text-center tracking-[-0.02em]">
              Mercury Repower Cost by Horsepower
            </h3>
            <p className="font-sans text-sm text-repower-navy-900/55 text-center mb-8">
              Ontario, 2026 CAD, complete installed packages
            </p>
            <div className="overflow-x-auto rounded border border-repower-navy-900/10 bg-white">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  Typical complete Mercury outboard repower price ranges in CAD by horsepower category for Ontario boaters.
                </caption>
                <thead>
                  <tr className="bg-repower-paper">
                    <th scope="col" className="text-left px-6 py-4 font-sans font-semibold text-xs uppercase tracking-[0.18em] text-repower-mercury-red">HP Category</th>
                    <th scope="col" className="text-left px-6 py-4 font-sans font-semibold text-xs uppercase tracking-[0.18em] text-repower-mercury-red">Typical Boat</th>
                    <th scope="col" className="text-left px-6 py-4 font-sans font-semibold text-xs uppercase tracking-[0.18em] text-repower-mercury-red">Complete Repower (CAD)</th>
                  </tr>
                </thead>
                <tbody className="font-sans">
                  {[
                    ['9.9 to 20 HP', 'Tiller, kicker, small aluminum, canoe', '$5,000 to $9,000'],
                    ['25 to 60 HP', 'Mid-size aluminum, small pontoon', '$9,000 to $18,000'],
                    ['75 to 115 HP', 'Larger fishing boats, pontoons, smaller runabouts', '$16,000 to $28,000'],
                    ['150 to 200 HP', 'Performance fishing, runabouts, family boats', '$28,000 to $50,000'],
                    ['250 to 300 HP', 'High-performance, larger hulls, twin setups', '$48,000 to $75,000'],
                    ['350 to 425 HP (Verado V10)', 'Special-order, call for pricing', '$65,000+ per engine'],
                  ].map(([hp, boat, price]) => (
                    <tr key={hp} className="border-t border-repower-navy-900/10">
                      <td className="px-6 py-4 font-medium text-repower-navy-900">{hp}</td>
                      <td className="px-6 py-4 text-repower-navy-900/65">{boat}</td>
                      <td className="px-6 py-4 text-repower-navy-900 font-medium">{price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="font-sans text-xs text-repower-navy-900/55 text-center mt-4">
              Detailed line-item math:{' '}
              <Link to="/blog/mercury-repower-cost-ontario-2026-cad" className="text-repower-mercury-red hover:text-repower-navy-900 underline transition-colors">
                2026 Ontario repower cost guide
              </Link>.
            </p>
          </div>
        </div>
      </section>
      {/* Winter Pro Tip, restyled */}
      <WinterPro />

      {/* Repower Process, restyled */}
      <RepowerProcess />

      {/* FAQ, restyled */}
      <RepowerFAQRestyled />

      {/* Why Harris, restyled */}
      <WhyHarrisRepower />

      {/* Service Area */}
      <section className="py-24 md:py-32 px-6 md:px-14 bg-repower-paper text-repower-navy-900">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-sans font-semibold text-[13px] md:text-sm uppercase tracking-[0.24em] text-repower-mercury-red mb-4 inline-flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-repower-mercury-red/60" />
            Service Area
          </p>
          <h2
            className="font-display font-bold text-[clamp(36px,4.5vw,64px)] tracking-[-0.03em] leading-[1.05] mb-6"
          >
            Serving Ontario <em className="not-italic italic text-repower-mercury-red">boaters.</em>
          </h2>
          <p className="font-sans text-[17px] md:text-[18px] text-repower-navy-900/65 mb-10 leading-relaxed max-w-2xl mx-auto">
            Located in Gores Landing with our own private boat launch on Rice Lake.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {['Rice Lake', 'Kawarthas', 'Peterborough', 'Cobourg', 'Port Hope', 'Northumberland', 'Durham', 'GTA', 'Toronto'].map((area) => (
              <span
                key={area}
                className="border border-repower-navy-900/15 text-repower-navy-900/75 px-4 py-2 rounded font-sans text-xs uppercase tracking-[0.18em]"
              >
                {area}
              </span>
            ))}
          </div>
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=5369+Harris+Boat+Works+Rd+Gores+Landing+ON+K0K+2E0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border border-repower-navy-900/30 text-repower-navy-900 px-8 py-4 rounded uppercase tracking-wider text-sm font-semibold hover:bg-repower-navy-900/[0.03] transition-all duration-300"
          >
            <MapPin className="w-4 h-4" />
            Get Directions
          </a>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 md:py-32 px-6 md:px-14 bg-repower-navy-900 text-repower-cream">
        <div className="max-w-[1400px] mx-auto">
          <div className="max-w-3xl mb-14 md:mb-20">
            <p className="font-sans font-semibold text-[13px] md:text-sm uppercase tracking-[0.24em] text-repower-mercury-red mb-4 flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-repower-mercury-red/60" />
              Customer Stories
            </p>
            <h2
              className="font-display font-bold text-[clamp(36px,4.5vw,64px)] tracking-[-0.03em] leading-[1.05] mb-4"
            >
              What customers <em className="not-italic italic text-repower-mercury-red">say.</em>
            </h2>
            <p className="font-sans text-base text-repower-cream/65">
              <span className="font-medium text-repower-cream">{reviewCount}+</span> five-star reviews from Ontario boaters
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {dailyTestimonials.map((testimonial, index) => (
              <div key={index} className="border border-repower-cream/10 bg-repower-cream/[0.03] rounded p-8">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-repower-gold text-repower-gold" />
                  ))}
                </div>
                <p className="font-display text-lg text-repower-cream mb-6 leading-relaxed italic tracking-[-0.01em]">
                  "{testimonial.quote}"
                </p>
                <p className="font-sans text-xs uppercase tracking-[0.18em] text-repower-cream/55">
                  <span className="text-repower-gold">{testimonial.name}</span> · {testimonial.location}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Final CTA, restyled */}
      <FinalCTARepower />
      <SiteFooter />
    </RepowerLayout>
  );
}
