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

import { RepowerGuideDownloadDialog } from '@/components/repower/RepowerGuideDownloadDialog';
import { ExpandableImage } from '@/components/ui/expandable-image';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, Zap, Fuel, Volume2, Wrench, Calendar, Award, 
  MapPin, Phone, Download, Play, ChevronRight, Snowflake, BadgeCheck, Star
} from 'lucide-react';
import mercuryLogo from '@/assets/mercury-logo.png';
import { generateDailyTestimonials, generateReviewCount } from '@/lib/activityGenerator';
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
  const reviewCount = useMemo(() => generateReviewCount(), []);

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
            <p className="font-sans font-semibold text-[11px] md:text-xs uppercase text-repower-mercury-red mb-4 flex items-center gap-3">
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
                className="border border-repower-navy-900/10 bg-white rounded p-8 hover:border-repower-mercury-red/40 transition-all duration-300"
              >
                <sign.icon className="w-6 h-6 text-repower-mercury-red mb-4" />
                <h3 className="font-display font-semibold text-lg text-repower-navy-900 mb-2">{sign.title}</h3>
                <p className="font-sans text-sm text-repower-navy-900/65 leading-relaxed">{sign.description}</p>
              </div>
            ))}
          </div>

          <div className="border-l-2 border-repower-gold pl-6 md:pl-8 py-4">
            <p className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-repower-gold mb-3">
              The "One More Season" Trap
            </p>
            <p className="font-sans text-base md:text-lg text-repower-navy-900/80 leading-relaxed">
              A new motor isn't just about reliability. It's about <span className="text-repower-navy-900 font-medium">using your boat instead of worrying about it.</span> Stop nursing an old motor, paying for repairs, and worrying on every trip.
            </p>
          </div>
        </div>
      </section>

      {/* Repower vs New Boat */}
      <section className="py-24 md:py-32 px-6 md:px-14 bg-[#0A1828] text-[#F5F1EA]">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <p className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-[#C9A24A] mb-6">
              The Big Question
            </p>
            <h2
              className="font-display font-bold text-[clamp(36px,5vw,64px)] tracking-tight leading-[1.05]"
              style={{ letterSpacing: '-0.03em' }}
            >
              Repower or buy <em className="not-italic italic text-[#C8102E]">new?</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-[#C9A24A]/30 bg-[#C9A24A]/[0.04] rounded p-8 md:p-10">
              <p className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-[#C9A24A] mb-4">
                Repower if...
              </p>
              <ul className="space-y-4">
                {[
                  'Your hull is solid, aluminum & fiberglass last decades',
                  'You like your boat, it fits your needs and the right size',
                  'The numbers work: 70% of the benefit for 30% of the cost',
                ].map((item) => (
                  <li key={item} className="flex gap-3 font-sans text-base text-[#F5F1EA]/80 leading-relaxed">
                    <span className="text-[#C9A24A] font-display font-bold mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-[#F5F1EA]/10 rounded p-8 md:p-10">
              <p className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-[#F5F1EA]/50 mb-4">
                Buy new if...
              </p>
              <ul className="space-y-4">
                {[
                  'Your hull has structural damage or significant issues',
                  "You've outgrown your current boat",
                  'You want completely different features or layout',
                ].map((item) => (
                  <li key={item} className="flex gap-3 font-sans text-base text-[#F5F1EA]/60 leading-relaxed">
                    <span className="text-[#F5F1EA]/40 mt-0.5">—</span>
                    <span>{item}</span>
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
      <section className="py-24 md:py-32 px-6 md:px-14 bg-[#050E1C] text-[#F5F1EA]">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <p className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-[#C9A24A] mb-6">
              Mercury Technology
            </p>
            <h2
              className="font-display font-bold text-[clamp(36px,5vw,64px)] tracking-tight leading-[1.05] mb-6"
              style={{ letterSpacing: '-0.03em' }}
            >
              Not a replacement. A <em className="not-italic italic text-[#C8102E]">revolution.</em>
            </h2>
            <p className="font-sans font-light text-lg md:text-xl text-[#F5F1EA]/70 max-w-2xl mx-auto leading-relaxed">
              If your motor is 10–15+ years old, technology has transformed. Modern four-strokes deliver performance that wasn't possible a decade ago.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {modernBenefitsData.map((benefit, index) => (
              <div
                key={index}
                className="border border-[#F5F1EA]/10 bg-repower-cream/[0.02] rounded p-8 hover:border-[#C9A24A]/40 transition-all duration-300"
              >
                <benefit.icon className="w-6 h-6 text-[#C9A24A] mb-4" />
                <h3 className="font-display font-semibold text-lg text-[#F5F1EA] mb-2">{benefit.title}</h3>
                <p className="font-sans text-sm text-[#F5F1EA]/60 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>

          <div className="border border-[#F5F1EA]/10 rounded p-6 md:p-8 flex items-center gap-6 bg-repower-cream/[0.02]">
            <img src={mercuryLogo} alt="Mercury" className="h-10 hidden sm:block opacity-90" />
            <div>
              <h3 className="font-display font-semibold text-lg text-[#F5F1EA] mb-1">Mercury SmartCraft® Technology</h3>
              <p className="font-sans text-sm text-[#F5F1EA]/65 leading-relaxed">
                Real-time engine monitoring, fuel economy tracking, and maintenance alerts, from your phone with the Mercury Marine app.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Infographic Section */}
      <section className="py-24 md:py-32 px-6 md:px-14 bg-[#0A1828] text-[#F5F1EA]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-[#C9A24A] mb-6">
            Reference
          </p>
          <h2
            className="font-display font-bold text-[clamp(32px,4.5vw,56px)] tracking-tight leading-[1.05] mb-10"
            style={{ letterSpacing: '-0.03em' }}
          >
            The complete repower guide.
          </h2>
          <ExpandableImage
            src="/repower-assets/hbw-repower-infographic.png"
            alt="Harris Boat Works Mercury Repower Infographic - 70% of the benefit for 30% of the cost. Warning signs, process, and pricing guide for boat motor replacement"
            className="w-full rounded shadow-2xl shadow-black/40 mb-8 border border-[#F5F1EA]/10"
          />
          <button
            onClick={() => setGuideDialogOpen(true)}
            className="inline-flex items-center justify-center gap-2 border border-[#F5F1EA]/30 text-[#F5F1EA] px-8 py-4 rounded uppercase tracking-wider text-sm font-semibold hover:bg-repower-cream/5 transition-all duration-300"
          >
            <Download className="w-4 h-4" />
            Download Full Guide (PDF)
          </button>
        </div>
      </section>

      <RepowerGuideDownloadDialog open={guideDialogOpen} onOpenChange={setGuideDialogOpen} />

      {/* Pricing Section */}
      <section className="py-24 md:py-32 px-6 md:px-14 bg-[#050E1C] text-[#F5F1EA]">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <p className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-[#C9A24A] mb-6">
              Transparent Pricing
            </p>
            <h2
              className="font-display font-bold text-[clamp(36px,5vw,64px)] tracking-tight leading-[1.05] mb-6"
              style={{ letterSpacing: '-0.03em' }}
            >
              Real CAD pricing. <em className="not-italic italic text-[#C8102E]">No surprises.</em>
            </h2>
            <p className="font-sans font-light text-lg md:text-xl text-[#F5F1EA]/70 max-w-2xl mx-auto leading-relaxed">
              A clear and honest look at your investment.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { n: '1', t: 'The Motor', p: '$1,500, $35,000+', d: 'Priced by HP. Quote builder shows exact pricing for any motor.' },
              { n: '2', t: 'Rigging & Controls', p: '$1,500, $4,000', d: "Depends on your boat's existing setup. Sometimes minimal work needed." },
              { n: '3', t: 'Installation', p: '$800, $1,500', d: 'Includes professional mounting and lake testing on Rice Lake.' },
            ].map((item) => (
              <div key={item.n} className="border border-[#F5F1EA]/10 bg-repower-cream/[0.02] rounded p-8">
                <div className="font-display font-bold text-5xl text-[#C9A24A]/50 mb-4" style={{ letterSpacing: '-0.04em' }}>
                  {item.n}
                </div>
                <h3 className="font-display font-semibold text-lg text-[#F5F1EA] mb-3">{item.t}</h3>
                <p className="font-display font-bold text-2xl text-[#F5F1EA] mb-3" style={{ letterSpacing: '-0.02em' }}>
                  {item.p}
                </p>
                <p className="font-sans text-sm text-[#F5F1EA]/60 leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>

          <div className="border border-[#C8102E]/40 bg-gradient-to-br from-[#C8102E]/15 to-transparent rounded p-10 md:p-14 text-center">
            <p className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-[#C9A24A] mb-4">
              Typical Rice Lake Repower
            </p>
            <p
              className="font-display font-bold text-[clamp(40px,6vw,80px)] tracking-tight text-[#F5F1EA] mb-3"
              style={{ letterSpacing: '-0.035em' }}
            >
              $8,000, $18,000
            </p>
            <p className="font-sans text-base md:text-lg text-[#F5F1EA]/65">
              For a 16–18ft boat with 60–115 HP, all-in.
            </p>
          </div>

          {/* Repower cost-by-HP table */}
          <div className="mt-20 max-w-5xl mx-auto">
            <h3 className="font-display font-semibold text-2xl md:text-3xl text-[#F5F1EA] mb-3 text-center" style={{ letterSpacing: '-0.02em' }}>
              Mercury Repower Cost by Horsepower
            </h3>
            <p className="font-sans text-sm text-[#F5F1EA]/55 text-center mb-8">
              Ontario, 2026 CAD, complete installed packages
            </p>
            <div className="overflow-x-auto rounded border border-[#F5F1EA]/10">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  Typical complete Mercury outboard repower price ranges in CAD by horsepower category for Ontario boaters.
                </caption>
                <thead>
                  <tr className="bg-repower-cream/[0.04]">
                    <th scope="col" className="text-left px-6 py-4 font-sans font-semibold text-xs uppercase tracking-[0.18em] text-[#C9A24A]">HP Category</th>
                    <th scope="col" className="text-left px-6 py-4 font-sans font-semibold text-xs uppercase tracking-[0.18em] text-[#C9A24A]">Typical Boat</th>
                    <th scope="col" className="text-left px-6 py-4 font-sans font-semibold text-xs uppercase tracking-[0.18em] text-[#C9A24A]">Complete Repower (CAD)</th>
                  </tr>
                </thead>
                <tbody className="font-sans">
                  {[
                    ['9.9, 20 HP', 'Tiller, kicker, small aluminum, canoe', '$5,000, $9,000'],
                    ['25, 60 HP', 'Mid-size aluminum, small pontoon', '$9,000, $18,000'],
                    ['75, 115 HP', 'Larger fishing boats, pontoons, smaller runabouts', '$16,000, $28,000'],
                    ['150, 200 HP', 'Performance fishing, runabouts, family boats', '$28,000, $50,000'],
                    ['250, 300 HP', 'High-performance, larger hulls, twin setups', '$48,000, $75,000'],
                    ['350, 425 HP (Verado V10)', 'Special-order, call for pricing', '$65,000+ per engine'],
                  ].map(([hp, boat, price]) => (
                    <tr key={hp} className="border-t border-[#F5F1EA]/10">
                      <td className="px-6 py-4 font-medium text-[#F5F1EA]">{hp}</td>
                      <td className="px-6 py-4 text-[#F5F1EA]/65">{boat}</td>
                      <td className="px-6 py-4 text-[#F5F1EA] font-medium">{price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="font-sans text-xs text-[#F5F1EA]/50 text-center mt-4">
              Detailed line-item math:{' '}
              <Link to="/blog/mercury-repower-cost-ontario-2026-cad" className="text-[#C9A24A] hover:text-[#F5F1EA] underline transition-colors">
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
      <section className="py-24 md:py-32 px-6 md:px-14 bg-[#0A1828] text-[#F5F1EA]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-[#C9A24A] mb-6">
            Service Area
          </p>
          <h2
            className="font-display font-bold text-[clamp(36px,5vw,64px)] tracking-tight leading-[1.05] mb-6"
            style={{ letterSpacing: '-0.03em' }}
          >
            Serving Ontario <em className="not-italic italic text-[#C8102E]">boaters.</em>
          </h2>
          <p className="font-sans font-light text-lg text-[#F5F1EA]/70 mb-10 leading-relaxed max-w-2xl mx-auto">
            Located in Gores Landing with our own private boat launch on Rice Lake.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {['Rice Lake', 'Kawarthas', 'Peterborough', 'Cobourg', 'Port Hope', 'Northumberland', 'Durham', 'GTA', 'Toronto'].map((area) => (
              <span
                key={area}
                className="border border-[#F5F1EA]/20 text-[#F5F1EA]/80 px-4 py-2 rounded font-sans text-xs uppercase tracking-[0.18em]"
              >
                {area}
              </span>
            ))}
          </div>
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=5369+Harris+Boat+Works+Rd+Gores+Landing+ON+K0K+2E0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border border-[#F5F1EA]/30 text-[#F5F1EA] px-8 py-4 rounded uppercase tracking-wider text-sm font-semibold hover:bg-repower-cream/5 transition-all duration-300"
          >
            <MapPin className="w-4 h-4" />
            Get Directions
          </a>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 md:py-32 px-6 md:px-14 bg-[#050E1C] text-[#F5F1EA]">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <p className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-[#C9A24A] mb-6">
              Customer Stories
            </p>
            <h2
              className="font-display font-bold text-[clamp(36px,5vw,64px)] tracking-tight leading-[1.05] mb-4"
              style={{ letterSpacing: '-0.03em' }}
            >
              What customers <em className="not-italic italic text-[#C8102E]">say.</em>
            </h2>
            <p className="font-sans text-base text-[#F5F1EA]/65">
              <span className="font-medium text-[#F5F1EA]">{reviewCount}+</span> five-star reviews from Ontario boaters
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {dailyTestimonials.map((testimonial, index) => (
              <div key={index} className="border border-[#F5F1EA]/10 bg-repower-cream/[0.02] rounded p-8">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#C9A24A] text-[#C9A24A]" />
                  ))}
                </div>
                <p className="font-display text-lg text-[#F5F1EA] mb-6 leading-relaxed italic" style={{ letterSpacing: '-0.01em' }}>
                  "{testimonial.quote}"
                </p>
                <p className="font-sans text-xs uppercase tracking-[0.18em] text-[#F5F1EA]/55">
                  <span className="text-[#C9A24A]">{testimonial.name}</span> · {testimonial.location}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA, restyled */}
      <FinalCTARepower />
    </RepowerLayout>
  );
}
