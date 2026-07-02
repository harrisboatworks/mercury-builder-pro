// Long-form case study pages for mercuryrepower.ca (Bucket 2 Batch 2, May 2026).
// Each page renders: hero, H1, last-reviewed line, "Quick answer" gold callout,
// intro, Key facts, H2 sections, FAQs, Visit Harris Boat Works, Related.
// Copy is verbatim from the SEO brief — do not rewrite. No em dashes.

import type { CaseStudy } from './caseStudies';

export interface CaseStudySection {
  heading: string;
  paragraphs: string[];
}

export interface CaseStudyFAQ {
  question: string;
  answer: string;
}

export interface CaseStudyLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface CaseStudyLongForm {
  /** Clean page title (without " | Harris Boat Works" suffix). */
  cleanTitle: string;
  canonical: string;
  metaDescription: string;
  /** Descriptive H1 — the "# " heading from the markdown. */
  h1: string;
  lastReviewed: string;
  quickAnswer: string;
  intro: string;
  keyFacts: string[];
  sections: CaseStudySection[];
  faqs: CaseStudyFAQ[];
  visit: string;
  related: CaseStudyLink[];
  heroAlt?: string;
}

const VISIT_BASE =
  'Harris Boat Works · 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0 · Phone (905) 342-2153 · Family-owned since 1947 · Mercury Premier Dealer, selling Mercury since 1965.';

export const LONG_FORM_CASE_STUDIES: CaseStudy[] = [
  {
    id: 'CS06',
    slug: '90-to-115-pro-xs-fish-boat',
    title: '90 HP to 115 Pro XS Repower Case Study',
    excerpt:
      'A 17-foot fiberglass bass boat gets a 115 HP Pro XS Command Thrust repower for $17,000–$20,000 all-in at Harris Boat Works.',
    scenario: 'Fiberglass bass boat repower',
    boatType: '17-foot fiberglass bass boat',
    region: 'Rice Lake / Kawarthas',
    beforeMotor: 'Mercury 90 HP FourStroke',
    afterMotor: 'Mercury 115 HP Pro XS Command Thrust',
    hpJump: '90 → 115',
    heroImage: '/lovable-uploads/case-study-90-to-115-pro-xs-fish-boat-hero.png',
    customerQuote:
      'Tournament-grade hole shot and more top end out of a boat they already love.',
    recommendation:
      'Best for 17-foot fiberglass bass or multi-species hulls rated 115 HP or higher, where the owner wants stronger hole shot and a Pro XS-class top end without changing the hull.',
    whyItWorked: [
      'Pro XS tune gives sharper hole shot vs base FourStroke 115',
      'Command Thrust gearcase moves more water on heavier loads',
      'Mid-50s mph top end with the right prop',
    ],
    isIllustrative: false,
    quoteUrl: '/quote/motor-selection?caseStudy=CS06',
    longForm: {
      cleanTitle: '90 HP to 115 Pro XS Repower Case Study',
      canonical: 'https://www.mercuryrepower.ca/case-studies/90-to-115-pro-xs-fish-boat',
      metaDescription:
        'See how a 17-foot bass boat gets a 115 HP Pro XS Command Thrust repower for $17,000–$20,000 all-in at Harris Boat Works.',
      h1: '90 HP to 115 HP Pro XS Command Thrust Repower on a 17-foot Bass Boat',
      lastReviewed: '2026-05-24',
      quickAnswer:
        'A 90 HP to 115 HP Pro XS Command Thrust repower on a 17-foot fiberglass bass boat typically runs $17,000–$20,000 all-in at Harris Boat Works in Gores Landing. That covers the new Mercury 115 Pro XS Command Thrust, removal of the old 90 HP FourStroke, new digital or mechanical controls, propeller selection, and a full water test on Rice Lake. Timeline is 3–4 weeks. Build a quote at mercuryrepower.ca.',
      intro:
        'A 90 HP to 115 HP Pro XS Command Thrust repower on a 17-foot fiberglass bass boat typically runs $17,000–$20,000 all-in at Harris Boat Works in Gores Landing. That covers the new Mercury 115 Pro XS Command Thrust, removal of the old 90 HP FourStroke, new digital or mechanical controls, propeller selection, and a full water test on Rice Lake. Timeline is 3–4 weeks. This is the upgrade owners pick when they want tournament-grade hole shot and more top end out of a boat they already love.',
      keyFacts: [
        'Old motor: Mercury 90 HP FourStroke (still running)',
        'New motor: Mercury 115 HP Pro XS Command Thrust',
        'Boat: 17-foot fiberglass bass / multi-species hull',
        'Cost range: $17,000–$20,000 CAD all-in',
        'Timeline: 3–4 weeks',
        'Power jump: 25 HP, roughly 28% more rated horsepower',
        'Warranty: Mercury Limited Warranty, confirmed at quote',
        'Deposit: $500 to hold the order',
      ],
      sections: [
        {
          heading: 'What was on the boat before?',
          paragraphs: [
            'The starting point is a 17-foot fiberglass bass or multi-species boat with a 90 HP Mercury FourStroke that still works fine. The motor is not the problem. The hull is. Modern fiberglass bass boats weigh more than the brochure pretends, once you load a kicker, a trolling motor, two batteries, a livewell, a cooler, and two anglers with tackle, the 90 is doing a lot of work just to plane.',
            'Customers usually come in for service, not a repower, and start asking about a bigger motor halfway through coffee. The 90 hits the high 30s mph if the prop is right, but hole shot is the issue. By the time the boat is on plane, two boat lengths have gone by, not great on tournament starts or in tight rivers.',
          ],
        },
        {
          heading: 'Why upgrade to a 115 Pro XS Command Thrust?',
          paragraphs: [
            "The 115 Pro XS Command Thrust is two motors in one decision. Pro XS is the attitude, sport-tuned intake, exhaust, and ECU calibration for stronger hole shot and quicker top-end response than a base FourStroke 115. Command Thrust is the gearcase, a larger-diameter torpedo with a bigger gearset and a higher-thrust prop, designed to push heavier hulls and shrug off load.",
            "Together you get a motor that pulls a fully loaded 17-foot bass boat onto plane in about half the time the old 90 needed. Top end in this combo lands in the mid-50s mph on a clean hull with the right pitch. Fuel economy at cruise is comparable to the old 90 because the new motor isn't labouring.",
            'The Command Thrust gearcase also handles trim and steering torque better when the boat is pushed hard in corners. For tournament anglers, that means more confidence in chop and tighter holes through wakes.',
          ],
        },
        {
          heading: 'What did the job involve?',
          paragraphs: [
            "This is more rigging than a FourStroke-to-FourStroke swap. We confirm the transom plate rating and Coast Guard capacity plate, pull the old 90, inspect the transom skin and bracket, and mount the 115 Pro XS Command Thrust with a bigger bolt pattern in some cases. The Pro XS often runs digital throttle and shift (DTS), if the boat had mechanical controls, we either keep mechanical or upgrade to DTS depending on what the helm can carry.",
            "Propeller selection takes care here. The Command Thrust gearcase uses a different prop spline than a standard 115, so we move through 2–3 pitch options on the water until the motor hits Mercury's WOT RPM band cleanly. We pick props in the 14-inch diameter range, with pitch in the 17–21-inch window depending on hull, load, and customer style.",
            "Water test on Rice Lake confirms WOT RPM, listens for any rigging issue, and checks gauges. Pickup-only at Gores Landing, we don't ship or deliver.",
          ],
        },
        {
          heading: 'What did it cost?',
          paragraphs: [
            'All-in lands between $17,000 and $20,000 CAD. The 115 Pro XS Command Thrust sits in the $15,000–$18,000 motor band, and the rigging, controls, prop set, removal, fuel system, and water test build the rest. A clean Mercury 90 FourStroke trade-in can take several thousand off depending on hours and year, fill the trade form and we email a CAD figure within one business day.',
            'Financing is 7.99% APR over $10,000 on approved credit, 8.99% APR under $10,000. For full pricing context see our Mercury repower cost guide, or read more about Rice Lake repower work. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD 'Always On' program (OAC).',
          ],
        },
      ],
      faqs: [
        {
          question: 'How long does a 115 Pro XS Command Thrust repower take?',
          answer:
            'Typically 3–4 weeks from quote signing to water test pickup at HBW. The Pro XS family sometimes has a slightly longer parts window than a base FourStroke, so we set the timeline once we confirm motor availability.',
        },
        {
          question: 'What is the difference between a 115 FourStroke and a 115 Pro XS?',
          answer:
            'Same horsepower rating but different attitude. The Pro XS has tuned intake and exhaust, sport-tuned ECU, and stronger hole shot. The Command Thrust gearcase is a bigger torpedo with more bite, better for heavier hulls or higher loads.',
        },
        {
          question: 'Will a 115 Pro XS fit on a 17-foot bass boat?',
          answer:
            'On most 17-foot fiberglass bass and multi-species hulls rated 115 HP or higher, yes. We confirm the transom plate rating, dry weight allowance, and Coast Guard capacity plate before quoting. We never overpower a hull.',
        },
        {
          question: 'Is there financing for this kind of repower?',
          answer:
            'Yes. Over $10,000 the rate is 7.99% APR on approved credit. A $500 deposit holds the order. Full terms come through the quote and you confirm them before motor allocation. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD 'Always On' program (OAC).',
        },
      ],
      visit:
        `${VISIT_BASE}\n\nWe're the repower side of Harris Boat Works. When you book a Pro XS job, the Harris Boat Works service team on Rice Lake is the same crew that rigs and water-tests the motor before pickup.`,
      related: [
        { label: 'Pricing Reference', href: '/pricing-reference' },
        { label: 'Rice Lake Mercury Repower', href: '/locations/rice-lake-mercury-repower' },
        {
          label: 'the Harris Boat Works service team on Rice Lake',
          href: 'https://www.harrisboatworks.ca/services',
          external: true,
        },
      ],
      heroAlt: '17-foot fiberglass bass boat with Mercury 115 Pro XS Command Thrust on Rice Lake.',
    },
  },
  {
    id: 'CS07',
    slug: 'pontoon-boost-retrofit',
    title: 'Pontoon Boost Retrofit Case Study',
    excerpt:
      'A 24-foot tritoon gets a 200 HP Pro XS V8 with Mercury Boost for $22,000–$26,000 all-in at Harris Boat Works.',
    scenario: 'Pontoon Boost retrofit',
    boatType: '24-foot tritoon',
    region: 'Rice Lake / Kawarthas',
    beforeMotor: '175 HP V6 FourStroke',
    afterMotor: 'Mercury 200 HP Pro XS V8 4.6L with Boost',
    hpJump: '175 → 200 (+25 HP Boost on demand)',
    heroImage: '/lovable-uploads/case-study-pontoon-boost-retrofit-hero-v3.png',
    customerQuote:
      'Press the Boost button and a heavy tritoon planes in 4–5 seconds instead of 10.',
    recommendation:
      'Best for 22–26-foot tritoons rated for 200+ HP that struggle to plane fully loaded. Mercury Boost trades the cost of a 225 HP motor for an on-demand burst that lifts the boat onto plane in seconds.',
    whyItWorked: [
      'V8 4.6L torque suits heavy pontoon hulls',
      'Mercury Boost adds 25 HP on demand for 4–6 seconds',
      'Hole-shot time roughly cut in half',
    ],
    isIllustrative: false,
    quoteUrl: '/quote/motor-selection?caseStudy=CS07',
    longForm: {
      cleanTitle: 'Pontoon Boost Retrofit Case Study',
      canonical: 'https://www.mercuryrepower.ca/case-studies/pontoon-boost-retrofit',
      metaDescription:
        'See how a 24-foot tritoon gets a 200 HP Pro XS V8 with Mercury Boost for $22,000–$26,000 all-in at Harris Boat Works.',
      h1: 'Pontoon Repower with Mercury Boost on a 24-foot Tritoon',
      lastReviewed: '2026-05-24',
      quickAnswer:
        'A 175 HP to 200 HP Pro XS V8 4.6L repower with Mercury Boost on a 24-foot tritoon typically runs $22,000–$26,000 all-in at Harris Boat Works in Gores Landing. That covers the new 200 Pro XS, the Boost option (25 HP on-demand for 4–6 seconds), removal of the old 175 V6, digital controls, prop selection, and a water test on Rice Lake. Timeline is 4–5 weeks. Build a quote at mercuryrepower.ca.',
      intro:
        'A 175 HP to 200 HP Pro XS V8 4.6L repower with Mercury Boost on a 24-foot tritoon typically runs $22,000–$26,000 all-in at Harris Boat Works in Gores Landing. That covers the new 200 Pro XS, the Boost option (25 HP on-demand for 4–6 seconds), removal of the old 175 V6, digital controls, prop selection, and a water test on Rice Lake. Timeline is 4–5 weeks. This is the most common Boost retrofit we do, heavy tritoons that need an easier time getting on plane with a full load.',
      keyFacts: [
        'Old motor: 175 HP V6 FourStroke',
        'New motor: Mercury 200 HP Pro XS V8 4.6L with Boost',
        'Boost gives 25 extra HP on demand for 4–6 seconds',
        'Boat: 24-foot tritoon',
        'Cost range: $22,000–$26,000 CAD all-in',
        'Timeline: 4–5 weeks',
        'Boost cost add: ~$1,200–$1,800 over base motor',
        'Deposit: $1,000 for big-block / Pro XS',
      ],
      sections: [
        {
          heading: 'What was on the boat before?',
          paragraphs: [
            'The classic Boost retrofit candidate is a 24-foot tritoon (three logs, full furniture package, bimini, big fuel tank) with a 175 HP V6 FourStroke that came on the boat 5 to 8 years ago. The motor runs. It\'s well maintained. The owner has had it serviced at HBW since launch.',
            'The issue is the way the boat behaves on a Saturday in July with eight adults, a cooler, water toys, and a full tank. The 175 plows. Hole shot takes 8–12 seconds depending on load, and the boat sits at a nose-high attitude longer than anyone enjoys. Once on plane the cruise is fine. It\'s the getting-there that turns into a conversation.',
          ],
        },
        {
          heading: 'Why upgrade to a 200 Pro XS V8 with Boost?',
          paragraphs: [
            'The 200 Pro XS V8 4.6L is the natural upgrade. The 4.6-litre block is the same physical motor as the 250 and 300 in that family, just tuned differently, which means you get a lot of motor for the HP rating. The V8 has more low-end torque than the older V6, which is exactly what a heavy pontoon needs.',
            'Boost is the part that makes the math work. Press the button on the throttle and the motor delivers 25 extra HP for 4–6 seconds. The whole feature is built around the hole shot. A 24-foot tritoon that took 10 seconds to plane with the old 175 will plane in 4–5 seconds on a 200 Pro XS with Boost engaged. Once the boat is on plane, the owner releases the button and cruises on the 200 HP base.',
            'Because the boost is short-burst and warranty-safe, you get the practical benefit of a 225 HP motor on demand without the cost or fuel burn of running 225 all day. For a pontoon that does a lot of loaded family days, this is one of the best dollar-for-dollar upgrades Mercury sells.',
          ],
        },
        {
          heading: 'What did the job involve?',
          paragraphs: [
            'A V6-to-V8 swap on a pontoon is more than a motor change. We confirm the transom rating, pull the old 175, inspect the transom and the motor pod, and mount the 200 Pro XS V8 with new hardware. Boost requires a Mercury smart helm setup, digital throttle, the right gauge, the harness, and the boost button mapped on the throttle handle. If the pontoon already had a Mercury smart helm, the upgrade is mostly harness and software. If not, we install a new helm package.',
            'Propeller selection matters more on a pontoon than people expect. We try 2–3 stainless props in the 15.25-inch diameter range, with pitch in the 17–19-inch window, until WOT RPM lands in Mercury\'s spec band cleanly with and without Boost active. The right prop is the difference between Boost feeling like a press-and-go feature and Boost feeling subtle.',
            'Water test on Rice Lake, both loaded and unloaded, before pickup. Pickup-only at Gores Landing, we don\'t ship or deliver.',
          ],
        },
        {
          heading: 'What did it cost?',
          paragraphs: [
            'All-in lands between $22,000 and $26,000 CAD. The 200 Pro XS V8 motor sits in the $18,000–$22,000 band, Boost adds $1,200–$1,800, and rigging, controls, prop set, removal, and water test build the rest. A clean 175 V6 trade-in can take several thousand off, fill the trade form and we email a CAD number within one business day.',
            'Financing is 7.99% APR over $10,000 on approved credit. A $1,000 deposit holds the order. See the Mercury repower cost guide for the broader pricing context, or read more about Rice Lake repower work. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD 'Always On' program (OAC).',
          ],
        },
      ],
      faqs: [
        {
          question: 'What is Mercury Boost?',
          answer:
            'Boost is a Mercury feature that delivers 25 extra horsepower on demand for 4–6 seconds at the press of a button. It is available on select Pro XS V8 4.6L models, 175, 200, and 225 HP. The most common use case is helping a heavy pontoon get on plane with a full load.',
        },
        {
          question: 'How much does Boost add to the motor price?',
          answer:
            'Boost typically adds $1,200–$1,800 to the base Pro XS V8 price, depending on rigging requirements. The full pontoon retrofit with motor, Boost, removal, controls, and water test lands in the $22,000–$26,000 all-in range.',
        },
        {
          question: 'Does Boost work for the whole day or just hole shot?',
          answer:
            'Boost is intentionally short-burst, 4–6 seconds at a time. It is designed for the hole-shot moment when a heavy boat is fighting to get on plane, or for a quick passing burst. It is not a continuous overboost, which is why the motor stays inside Mercury\'s warranty envelope.',
        },
        {
          question: 'Will Boost work on my existing pontoon?',
          answer:
            'Boost is only on select Pro XS V8 4.6L motors, 175, 200, and 225 HP. If your pontoon is rated for that HP range on the transom plate, the retrofit works. We confirm the rating before quoting. Pickup-only at Gores Landing.',
        },
      ],
      visit:
        `${VISIT_BASE}\n\nWe're the repower side of Harris Boat Works in Gores Landing, Mercury Premier Dealer, selling Mercury since 1965. Every Boost retrofit gets rigged and water-tested by the same techs who wrote the quote.`,
      related: [
        { label: 'Pricing Reference', href: '/pricing-reference' },
        { label: 'Rice Lake Mercury Repower', href: '/locations/rice-lake-mercury-repower' },
        {
          label: 'Harris Boat Works in Gores Landing, Mercury Premier Dealer, selling Mercury since 1965',
          href: 'https://www.harrisboatworks.ca/aboutus',
          external: true,
        },
      ],
      heroAlt: '24-foot tritoon with Mercury 200 Pro XS V8 Boost on Rice Lake.',
    },
  },
  {
    id: 'CS08',
    slug: 'two-stroke-to-fourstroke-modernization',
    title: 'Two-Stroke to FourStroke Modernization',
    excerpt:
      'Replace an old 2-stroke 70–90 HP with a Mercury 90 FourStroke EFI for $13,000–$16,000 all-in at Harris Boat Works.',
    scenario: '2-stroke to 4-stroke modernization',
    boatType: '17-foot aluminum runabout',
    region: 'Rice Lake / Kawarthas',
    beforeMotor: '70–90 HP 2-stroke (Mercury Sport or legacy Evinrude)',
    afterMotor: 'Mercury 90 HP FourStroke EFI',
    hpJump: 'Modernization (similar HP, modern EFI)',
    heroImage: '/lovable-uploads/case-study-two-stroke-to-fourstroke-modernization-hero-v3.png',
    customerQuote:
      'No oil mixing, half the idle noise, and roughly 30% better fuel burn at cruise.',
    recommendation:
      'Best for owners of 15–25-year-old aluminum runabouts with tired carbureted 2-strokes who want a quiet, clean, factory-warrantied modern FourStroke without changing the hull.',
    whyItWorked: [
      'Clean cold starts and smooth idle with modern EFI',
      'Roughly half the idle noise vs older 2-stroke',
      'No 2-stroke oil mixing, ~30% better fuel at cruise',
    ],
    isIllustrative: false,
    quoteUrl: '/quote/motor-selection?caseStudy=CS08',
    longForm: {
      cleanTitle: 'Two-Stroke to FourStroke Modernization',
      canonical:
        'https://www.mercuryrepower.ca/case-studies/two-stroke-to-fourstroke-modernization',
      metaDescription:
        'Replace an old 2-stroke 70–90 HP with a Mercury 90 FourStroke EFI for $13,000–$16,000 all-in at Harris Boat Works.',
      h1: 'Two-Stroke to FourStroke Modernization on a 17-foot Aluminum',
      lastReviewed: '2026-05-24',
      quickAnswer:
        'Replacing an older 2-stroke 70–90 HP outboard with a new Mercury 90 HP FourStroke EFI on a 17-foot aluminum runabout typically runs $13,000–$16,000 all-in at Harris Boat Works in Gores Landing. That covers the new motor, removal of the old 2-stroke, new controls and cables, propeller selection, fuel system inspection, and a full water test on Rice Lake. Timeline is 2–4 weeks. Build a quote at mercuryrepower.ca.',
      intro:
        'Replacing an older 2-stroke 70–90 HP outboard with a new Mercury 90 HP FourStroke EFI on a 17-foot aluminum runabout typically runs $13,000–$16,000 all-in at Harris Boat Works in Gores Landing. That covers the new motor, removal of the old 2-stroke, new controls and cables, propeller selection, fuel system inspection, and a full water test on Rice Lake. Timeline is 2–4 weeks. This is the reliability-and-warranty repower, owners trading a tired carbureted 2-stroke for a quiet, clean, factory-warrantied modern FourStroke.',
      keyFacts: [
        'Old motor: 70–90 HP 2-stroke (Mercury Sport or discontinued Evinrude legacy)',
        'New motor: Mercury 90 HP FourStroke EFI',
        'Boat: 17-foot aluminum runabout',
        'Cost range: $13,000–$16,000 CAD all-in',
        'Timeline: 2–4 weeks',
        'Warranty: Mercury Limited Warranty, confirmed at quote',
        'Noise reduction: roughly half at idle vs old 2-stroke',
        'Fuel improvement: roughly 30% better at cruise',
      ],
      sections: [
        {
          heading: 'What was on the boat before?',
          paragraphs: [
            "The starting motor is a 1990s-or-early-2000s carbureted 2-stroke in the 70–90 HP range. Sometimes it's an older Mercury Sport. Often it's a discontinued legacy 2-stroke from Evinrude, a brand that stopped making outboards in 2020 and is no longer supported by its original parts pipeline. Either way, the motor is the same story: it ran for a long time, it's finally tired, and parts for a proper rebuild are harder to find than they used to be.",
            "The boat is usually a 17-foot aluminum runabout owned by someone who has had it for 15 to 25 years. They love the boat. They aren't interested in trading it. They just want a motor that doesn't need a 2-stroke oil top-up at every fill, doesn't blow smoke on cold starts, and doesn't rattle the dock when warming up.",
          ],
        },
        {
          heading: 'Why upgrade from a 2-stroke to a Mercury 90 FourStroke EFI?',
          paragraphs: [
            "Reliability is the headline. Modern EFI 4-strokes start clean on a cold morning without choke fiddling, idle smooth, and don't foul plugs sitting overnight. They're computer-managed, no carbs to clean, no float bowls to drain, no jets to rebuild.",
            'Noise is the second. A modern Mercury 90 FourStroke runs at roughly half the noise of a comparable old 2-stroke at idle and trolling speed. For early-morning launches and conversation in the boat, this is the change owners notice first.',
            'Fuel is the third. Modern EFI burns roughly 30% less fuel at cruise than a carbureted 2-stroke of the same HP. No oil mixing, no jug of 2-stroke oil every other tank. Over a 5-month Ontario season that adds up.',
            'Warranty closes the deal. A brand-new Mercury carries the current Mercury Limited Warranty plus any active promotional coverage, which we confirm at quote. That factory backing is the kind of peace of mind no 25-year-old 2-stroke can offer.',
          ],
        },
        {
          heading: 'What did the job involve?',
          paragraphs: [
            'The work is a little more involved than a Mercury-to-Mercury swap. We confirm the transom rating, pull the old 2-stroke, and inspect the transom skin carefully, older 2-strokes sometimes leave water intrusion or stress cracks that need to be addressed before a new motor goes on. If the transom checks out, we install the Mercury 90 FourStroke EFI with new bolts, new controls, new throttle and shift cables, a new tach harness, and a new fuel primer bulb.',
            "Because the old motor used a different control layout, we always replace the helm controls rather than try to make old ones work. That's included in the quote. Propeller selection, usually a 13.25-inch diameter aluminum or stainless in the 17–19-inch pitch range, happens on the water during the test.",
            "Water test on Rice Lake confirms WOT RPM lands in Mercury's spec band, gauges read clean, and steering is right. Pickup-only at Gores Landing, we don't ship or deliver. See our repower process page for the full sequence.",
          ],
        },
        {
          heading: 'What did it cost?',
          paragraphs: [
            'All-in lands between $13,000 and $16,000 CAD. The Mercury 90 FourStroke EFI sits in the $8,000–$14,000 mid-range FourStroke band, and the new controls, cables, prop, removal of the old 2-stroke, fuel system work, and water test build the rest. Trade-in on an old 2-stroke depends heavily on brand and condition, older Mercury Sport trade-ins still carry some resale value.',
            'Discontinued legacy 2-strokes have less trade value but we still take them case by case.',
            'Financing is 7.99% APR over $10,000 on approved credit. A $500 deposit holds the order. For the full pricing picture, see our Mercury repower cost guide.',
          ],
        },
      ],
      faqs: [
        {
          question: 'Can you repower an old Evinrude with a Mercury?',
          answer:
            'Yes. Evinrude is a discontinued legacy 2-stroke brand and we replace them often. The mounting pattern is similar enough on most transoms that the swap is straightforward, though we always confirm the transom condition and may need new bolts and a new throttle harness.',
        },
        {
          question: 'Why move from a 2-stroke to a 4-stroke?',
          answer:
            'Three reasons. Reliability, modern EFI 4-strokes start clean and idle smooth. Noise, about half the noise at idle. Warranty, a new Mercury carries the current Mercury Limited Warranty plus any active promotional coverage, confirmed at quote. Fuel, no oil mixing and roughly 30 percent better burn at cruise.',
        },
        {
          question: 'Will the controls from my old 2-stroke work with a new Mercury?',
          answer:
            'Usually no. The throttle and shift cables and harness are different. We include new Mercury controls and cables in the repower quote so everything is matched and warrantied.',
        },
        {
          question: 'How long does this kind of repower take?',
          answer:
            '2–4 weeks from quote signing to water test pickup at HBW. The window is wider than a Mercury-to-Mercury swap because we sometimes have transom rework on an older boat. Pickup-only at Gores Landing.',
        },
      ],
      visit:
        `${VISIT_BASE}\n\nWe're the repower side of Harris Boat Works, a family marina in Gores Landing serving boaters since 1947. Two-stroke-to-FourStroke jobs are some of the most satisfying work we do, the boat sounds different the moment you leave the dock.`,
      related: [
        { label: 'Pricing Reference', href: '/pricing-reference' },
        { label: 'How To Repower A Boat', href: '/how-to-repower-a-boat' },
        {
          label: 'Harris Boat Works, a family marina in Gores Landing serving boaters since 1947',
          href: 'https://www.harrisboatworks.ca/aboutus',
          external: true,
        },
      ],
      heroAlt: '17-foot aluminum runabout with new Mercury 90 FourStroke EFI replacing an older 2-stroke.',
    },
  },
  {
    id: 'CS09',
    slug: 'verado-v8-special-order-repower',
    title: 'Verado V8 300 Special-Order Repower',
    excerpt:
      'A 23-foot bowrider gets a Mercury 300 V8 Verado special-order repower for $32,000–$38,000 all-in at Harris Boat Works.',
    scenario: 'Premium Verado V8 repower',
    boatType: '23-foot fiberglass bowrider',
    region: 'Rice Lake / Kawarthas',
    beforeMotor: 'Older 250 HP Verado',
    afterMotor: 'Mercury 300 HP V8 Verado (special-order)',
    hpJump: '250 → 300 Verado V8',
    heroImage: '/lovable-uploads/case-study-verado-v8-special-order-repower-hero-v3.png',
    customerQuote:
      'Quiet at idle, smoother at cruise, and the next ten years of ownership under current Mercury warranty.',
    recommendation:
      'Best for 22–24-foot fiberglass bowriders / cuddies running a tired Verado, where the owner wants premium refinement and is willing to wait for an 8–14-week Mercury build slot.',
    whyItWorked: [
      'V8 Verado is quieter and smoother than the inline-six it replaces',
      'Integrated DTS, helm electronics, and power steering',
      'New motor under current Mercury Limited Warranty',
    ],
    isIllustrative: false,
    quoteUrl: '/quote/motor-selection?caseStudy=CS09',
    longForm: {
      cleanTitle: 'Verado V8 300 Special-Order Repower',
      canonical:
        'https://www.mercuryrepower.ca/case-studies/verado-v8-special-order-repower',
      metaDescription:
        'See how a 23-foot bowrider gets a Mercury 300 V8 Verado special-order repower for $32,000–$38,000 all-in at Harris Boat Works.',
      h1: 'Verado V8 300 Special-Order Repower on a 23-foot Bowrider',
      lastReviewed: '2026-05-24',
      quickAnswer:
        'A Mercury 300 HP V8 Verado special-order repower on a 23-foot fiberglass bowrider typically runs $32,000–$38,000 all-in at Harris Boat Works in Gores Landing. That covers the new V8 Verado, removal of the tired older 250 Verado, digital throttle and shift, prop selection, full helm integration, and a water test on Rice Lake. Build a quote at mercuryrepower.ca.',
      intro:
        'A Mercury 300 HP V8 Verado special-order repower on a 23-foot fiberglass bowrider typically runs $32,000–$38,000 all-in at Harris Boat Works in Gores Landing. That covers the new V8 Verado, removal of the tired older 250 Verado, digital throttle and shift, prop selection, full helm integration, and a water test on Rice Lake. Timeline is 8–14 weeks because Verado is special-order only, we set the date the day the motor leaves the Mercury build line. This is the premium repower job, and we set lead-time expectations honestly from quote one.',
      keyFacts: [
        'Old motor: older 250 HP Verado (tired, several seasons in)',
        'New motor: Mercury 300 HP V8 Verado (special-order)',
        'Boat: 23-foot fiberglass bowrider',
        'Cost range: $32,000–$38,000 CAD all-in',
        'Timeline: 8–14 weeks (special-order lead time)',
        'Deposit: $1,000 to hold the Mercury build slot',
        'Warranty: Mercury Limited Warranty, confirmed at quote',
        'Note: Verado is not stocked, every job is built-to-order',
      ],
      sections: [
        {
          heading: 'What was on the boat before?',
          paragraphs: [
            "The typical Verado candidate is a 23-foot fiberglass bowrider or cuddy, a family weekender that has been on the water for 8 to 12 years with the original 250 HP Verado. The motor still runs but it's tired. Idle is rougher than it should be, the power steering pump has a whine, hours are climbing past the 1,200–1,500 mark, and the cost of catching it up on supercharger service, water pump, and helm electronics is in the same neighbourhood as a deposit on a new motor.",
            'Owners come in for one more big service quote, see the math, and ask the obvious question, what would it cost to just put a new one on it. We walk through the options. Most of the time the answer is the new V8 Verado.',
          ],
        },
        {
          heading: 'Why upgrade to a Mercury 300 V8 Verado?',
          paragraphs: [
            "The V8 Verado is the premium 4.6-litre Mercury motor at the time of writing. Quiet at idle, quieter than the older Verado supercharged inline six it replaces. Smoother at cruise. Integrated power steering with a cleaner helm feel. The digital throttle and shift (DTS) controls give precise low-speed handling for docking, which matters on a 23-foot fiberglass hull that gets close to a lift every weekend.",
            "Pure performance is part of the answer, but it isn't the whole answer. The bigger benefit is the next ten years of ownership, a brand-new motor with current Mercury electronics, supported by parts and software updates, under the current Mercury Limited Warranty.",
            'For owners who want sport-tune attitude (sharper hole shot, more aggressive throttle response) we recommend the Pro XS 300 instead. Same V8 block, different tune, lower price. The Verado is the cruise-and-comfort choice. Most 23-foot bowrider customers pick Verado for that reason.',
          ],
        },
        {
          heading: 'What did the job involve?',
          paragraphs: [
            'A Verado repower starts at the build slot. Once the order is confirmed and the deposit is in, Mercury allocates a build slot. Lead time runs 8–14 weeks depending on the time of year and queue. We tell customers up front: if you want the boat ready for the May long weekend, the order has to be in by late January or early February.',
            "When the motor arrives, the shop work takes about 1–2 weeks. We pull the old Verado, inspect the transom skin and bracket, and inspect the rigging tunnel. Verado uses DTS throughout, the throttle, helm, gauges, and ECU all talk on a Mercury smart helm network. We replace the helm package as part of the job. Propeller selection runs through 2–3 stainless props in the 15–16-inch diameter range, pitched 19–23 inches depending on hull, load, and customer style, until WOT lands in Mercury's spec band cleanly.",
            "Water test on Rice Lake confirms WOT RPM, helm response, steering torque, and gauge integrity. Pickup-only at Gores Landing, we don't ship or deliver.",
          ],
        },
        {
          heading: 'What did it cost?',
          paragraphs: [
            'All-in lands between $32,000 and $38,000 CAD. The 300 V8 Verado itself sits in the $25,000+ premium band, the helm and DTS package adds several thousand, and the rigging, controls, prop set, removal, and water test build the rest. A clean older Verado can take a meaningful amount off via trade, fill the form and we email a CAD figure within one business day.',
            'Financing is 7.99% APR over $10,000 on approved credit. A $1,000 deposit holds the build slot. See our repower cost guide for full context, or read the repower process for what the 8–14 week window actually looks like. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD 'Always On' program (OAC).',
          ],
        },
      ],
      faqs: [
        {
          question: 'Why is Verado special-order?',
          answer:
            'We do not stock Verado motors. They are built to order through Mercury Marine and shipped to us once the build slot is allocated. Lead time runs 8–14 weeks from order confirmation depending on the build queue. We set the launch date around the build window, not the calendar.',
        },
        {
          question: 'What is the difference between Pro XS 300 and Verado 300?',
          answer:
            'Both are V8 4.6L blocks at 300 HP. The Verado is the premium tune, quieter, smoother at idle, integrated power steering, supercharged-feel torque delivery, and more refined helm electronics. The Pro XS 300 is the sport tune. Verado is the cruise-and-comfort choice. Pro XS is the performance choice.',
        },
        {
          question: 'Does the old Verado have trade-in value?',
          answer:
            'Often yes, depending on hours, condition, and year. Verados are sought after as cores and for resale. Fill the trade-in form and we email a CAD figure within one business day. Trade value comes off the all-in price.',
        },
        {
          question: 'Is there financing for a $35,000 repower?',
          answer:
            'Yes. The rate is 7.99% APR over $10,000 on approved credit. A $1,000 deposit holds the order. We do not finalize the build slot until the deposit is in and the credit is approved. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD 'Always On' program (OAC).',
        },
      ],
      visit:
        `${VISIT_BASE}\n\nWe're the repower side of Harris Boat Works in Gores Landing, Mercury Premier Dealer, selling Mercury since 1965. Verado is the one repower we always price honestly on lead time, the build window is part of the quote.`,
      related: [
        { label: 'Pricing Reference', href: '/pricing-reference' },
        { label: 'How To Repower A Boat', href: '/how-to-repower-a-boat' },
        {
          label: 'Harris Boat Works in Gores Landing, Mercury Premier Dealer, selling Mercury since 1965',
          href: 'https://www.harrisboatworks.ca/aboutus',
          external: true,
        },
      ],
      heroAlt: '23-foot fiberglass bowrider with a special-order Mercury 300 V8 Verado.',
    },
  },
  {
    id: 'CS10',
    slug: 'avator-electric-kicker-trolling',
    title: 'Avator 7.5e Electric Kicker on a Walleye Boat',
    excerpt:
      'Add a silent Mercury Avator 7.5e electric kicker to an 18-foot walleye boat for $4,500–$6,500 all-in at Harris Boat Works.',
    scenario: 'Electric kicker / trolling install',
    boatType: '18-foot aluminum walleye / muskie boat',
    region: 'Rice Lake / Kawarthas',
    beforeMotor: 'No kicker or old 4–9.9 HP gas kicker',
    afterMotor: 'Mercury Avator 7.5e electric outboard',
    hpJump: 'Silent kicker add (3.5 HP gas equivalent)',
    heroImage: '/lovable-uploads/case-study-avator-electric-kicker-trolling-hero-v3.png',
    customerQuote:
      'Silent troll, no fuel ritual, and a battery you charge like a phone.',
    recommendation:
      'Best for 16–19-foot aluminum walleye and muskie boats with a main motor already on the transom, where the owner wants a silent trolling/kicker option without spooking fish.',
    whyItWorked: [
      'Silent at trolling speeds for walleye and muskie',
      'No carb, no fuel stabilizer, no spark plug ritual',
      'Integrates with Mercury smart helm for state-of-charge readout',
    ],
    isIllustrative: false,
    quoteUrl: '/quote/motor-selection?caseStudy=CS10',
    longForm: {
      cleanTitle: 'Avator 7.5e Electric Kicker on a Walleye Boat',
      canonical:
        'https://www.mercuryrepower.ca/case-studies/avator-electric-kicker-trolling',
      metaDescription:
        'Add a silent Mercury Avator 7.5e electric kicker to an 18-foot walleye boat for $4,500–$6,500 all-in at Harris Boat Works.',
      h1: 'Mercury Avator 7.5e Electric Kicker on an 18-foot Walleye Boat',
      lastReviewed: '2026-05-24',
      quickAnswer:
        'Adding a Mercury Avator 7.5e electric outboard as a quiet kicker on an 18-foot aluminum walleye or muskie boat typically runs $4,500–$6,500 all-in at Harris Boat Works in Gores Landing. That covers the Avator, the lithium battery pack, the mounting bracket, helm wiring, and a water test on Rice Lake. Timeline is 1–2 weeks. Build a quote at mercuryrepower.ca.',
      intro:
        'Adding a Mercury Avator 7.5e electric outboard as a quiet kicker on an 18-foot aluminum walleye or muskie boat typically runs $4,500–$6,500 all-in at Harris Boat Works in Gores Landing. That covers the Avator, the lithium battery pack, the mounting bracket, helm wiring, and a water test on Rice Lake. Timeline is 1–2 weeks. The 7.5e gives the equivalent of a 3.5 HP gas kicker in thrust, runs silent, and lets you sneak up on walleye and muskie without spooking the fish.',
      keyFacts: [
        'Motor: Mercury Avator 7.5e (electric outboard)',
        'Thrust equivalent: comparable to a 3.5 HP gas kicker',
        'Boat: 18-foot aluminum walleye / muskie boat',
        'Cost range: $4,500–$6,500 CAD all-in with battery and bracket',
        'Timeline: 1–2 weeks',
        'Run time: 60–90 minutes per battery at low troll',
        'Deposit: $200 for portable / small HP',
        'Warranty: Mercury Limited Warranty, confirmed at quote',
      ],
      sections: [
        {
          heading: 'What was on the boat before?',
          paragraphs: [
            "The starting point is an 18-foot aluminum walleye or muskie boat with a 90–150 HP Mercury main motor already on the transom. There is either no kicker at all, or there's an old 4–9.9 HP gas kicker that smells, sputters at slow troll, and adds noise the fish hear.",
            "Owners come in once they realize the kicker is the limiting factor on Rice Lake walleye. The fish stack up in the same shallow flats over and over, and any time a gas kicker fires off, the bite stops for ten minutes. A bow-mount trolling motor helps but eats battery and doesn't handle 1–2 foot chop confidently for hours.",
            'The conversation turns to Avator about 80 percent of the time these days.',
          ],
        },
        {
          heading: 'Why upgrade to a Mercury Avator 7.5e?',
          paragraphs: [
            "The Avator 7.5e is Mercury's small electric outboard, built specifically for the kicker / trolling role. Three things matter.",
            'First, silence. At trolling speeds in the 1.5–2.5 mph range, the Avator is functionally silent. No exhaust, no idle vibration, no prop cavitation noise. Walleye and muskie key on sound. Removing the kicker noise often turns a slow afternoon into a productive one.',
            "Second, clean run. No carb to gum up sitting all winter. No oil change, no spark plug, no fuel stabilizer ritual. Plug the battery in to charge, leave the motor on the bracket, and it's ready next time you launch.",
            "Third, integration. The Avator uses Mercury's smart electronics, so the gauge integrates with helm displays on newer boats. You see remaining range and battery state-of-charge the same way you read fuel level on the main motor. That matters when you're pushing the limits of a battery on a long evening troll.",
            'The trade-off is run time. Battery range is 60–90 minutes at low troll per pack. For all-day walleye work most owners add a second battery and rotate them. The math still works out, Mercury lithium packs charge in a few hours, last for thousands of cycles, and weigh less than a full jerrycan of gas.',
          ],
        },
        {
          heading: 'What did the job involve?',
          paragraphs: [
            'The work is straightforward compared with a main-engine repower. We confirm transom space beside the main motor, fit the Avator mounting bracket, mount the motor, wire the battery and the helm gauge, and run the steering and throttle controls. On older boats with a clean transom this is a half-day install. On boats with crowded transoms (main motor, bow-mount controls, transducer, hydraulic jack plate) we sometimes have to relocate accessories to get the Avator clearance.',
            'Battery placement matters. Lithium packs need a dry, ventilated location with cable run kept short. We usually mount them in a rear compartment with a vented battery box.',
            "Water test on Rice Lake confirms thrust, helm response, and gauge integration. Pickup-only at Gores Landing, we don't ship or deliver.",
          ],
        },
        {
          heading: 'What did it cost?',
          paragraphs: [
            'All-in lands between $4,500 and $6,500 CAD. The Avator 7.5e and a single Mercury lithium pack are the bulk of it. The bracket, helm gauge, install labour, and water test make up the rest. A second battery, common for serious walleye anglers, adds about $1,000–$1,500 on top.',
            'Financing is available, 8.99% APR under $10,000 on approved credit. A $200 deposit holds the order. For broader context, see the Mercury repower cost guide or read about Rice Lake repower work.',
          ],
        },
      ],
      faqs: [
        {
          question: 'How long does an Avator install take?',
          answer:
            'Typically 1–2 weeks from quote signing to water test pickup at HBW. The job is mostly bracket installation, battery wiring, and water test. Faster than a main-engine repower because there is no controls or fuel system work on the existing motor.',
        },
        {
          question: 'How does an Avator 7.5e compare to a 3.5 HP gas kicker?',
          answer:
            'Thrust is comparable to a 3.5 HP gas kicker. Noise is the difference. The Avator runs silent at trolling speeds, which is the point, walleye and muskie spook off prop wash and engine noise. The 7.5e gives you a stealth approach a gas kicker cannot.',
        },
        {
          question: 'How long does the Avator battery last?',
          answer:
            'Run time depends on speed setting and load. At low trolling speeds (1.5–2.5 mph), a single Mercury lithium pack typically gives 60–90 minutes of run time. For all-day fishing, owners often add a second battery or rotate two packs.',
        },
        {
          question: 'Will the Avator work with my existing main motor?',
          answer:
            'Yes. The Avator mounts on a bracket beside the main outboard, no integration required. We confirm transom space and bracket fit before quoting. Pickup-only at Gores Landing.',
        },
      ],
      visit:
        `${VISIT_BASE}\n\nWe're the repower side of Harris Boat Works. Avator installs are quick, and the Harris Boat Works service team on Rice Lake water-tests every electric kicker on Rice Lake itself before pickup.`,
      related: [
        { label: 'Pricing Reference', href: '/pricing-reference' },
        { label: 'Rice Lake Mercury Repower', href: '/locations/rice-lake-mercury-repower' },
        {
          label: 'the Harris Boat Works service team on Rice Lake',
          href: 'https://www.harrisboatworks.ca/services',
          external: true,
        },
      ],
      heroAlt: '18-foot aluminum walleye boat with a Mercury Avator 7.5e electric kicker on Rice Lake.',
    },
  },
  {
    id: 'CS11',
    slug: 'command-thrust-heavy-aluminum',
    title: 'Command Thrust 60 HP on Heavy Aluminum',
    excerpt:
      'Repower an 18-foot deep-V aluminum with a Mercury 60 HP Command Thrust for $10,000–$13,000 all-in at Harris Boat Works.',
    scenario: 'Heavy-hull Command Thrust repower',
    boatType: '18-foot deep-V aluminum',
    region: 'Rice Lake / Kawarthas',
    beforeMotor: 'Standard Mercury 60 HP FourStroke',
    afterMotor: 'Mercury 60 HP FourStroke Command Thrust',
    hpJump: 'Same HP, bigger gearcase + high-thrust prop',
    heroImage: '/lovable-uploads/case-study-command-thrust-heavy-aluminum-hero-v3.png',
    customerQuote:
      'Same horsepower on the plate, twice the hole shot under load.',
    recommendation:
      'Best for heavy 17–19-foot deep-V aluminum hulls rated 60 HP that need more low-end pull without exceeding the transom rating or insurance class.',
    whyItWorked: [
      'Larger gearcase and high-thrust prop move more water',
      'Hole shot time roughly cut in half on loaded hulls',
      'Stays inside the boat\'s 60 HP transom rating',
    ],
    isIllustrative: false,
    quoteUrl: '/quote/motor-selection?caseStudy=CS11',
    longForm: {
      cleanTitle: 'Command Thrust 60 HP on Heavy Aluminum',
      canonical:
        'https://www.mercuryrepower.ca/case-studies/command-thrust-heavy-aluminum',
      metaDescription:
        'Repower an 18-foot deep-V aluminum with a Mercury 60 HP Command Thrust for $10,000–$13,000 all-in at Harris Boat Works.',
      h1: '60 HP Command Thrust Repower on an 18-foot Deep-V Aluminum',
      lastReviewed: '2026-05-24',
      quickAnswer:
        'A Mercury 60 HP FourStroke Command Thrust repower on an 18-foot deep-V aluminum boat typically runs $10,000–$13,000 all-in at Harris Boat Works in Gores Landing. That covers the new motor, removal of the old standard-gearcase 60, new controls and cables, propeller selection, fuel system inspection, and a water test on Rice Lake. Timeline is 2–3 weeks. Build a quote at mercuryrepower.ca.',
      intro:
        'A Mercury 60 HP FourStroke Command Thrust repower on an 18-foot deep-V aluminum boat typically runs $10,000–$13,000 all-in at Harris Boat Works in Gores Landing. That covers the new motor, removal of the old standard-gearcase 60, new controls and cables, propeller selection, fuel system inspection, and a water test on Rice Lake. Timeline is 2–3 weeks. Same horsepower rating as a standard 60 but with a bigger gearcase and higher-pitch prop, the Command Thrust gives heavy hulls the push they actually need.',
      keyFacts: [
        'Old motor: standard Mercury 60 HP FourStroke',
        'New motor: Mercury 60 HP FourStroke Command Thrust',
        'Boat: 18-foot deep-V aluminum (heavy hull)',
        'Cost range: $10,000–$13,000 CAD all-in',
        'Timeline: 2–3 weeks',
        'Same HP, bigger gearcase + higher-thrust prop',
        'Warranty: Mercury Limited Warranty, confirmed at quote',
        'Deposit: $500 for mid-range orders',
      ],
      sections: [
        {
          heading: 'What was on the boat before?',
          paragraphs: [
            'The candidate is a heavy 18-foot deep-V aluminum with a wide beam, full canvas, and a transom plate rated 60 HP. Owners often have a standard 60 HP FourStroke that came with the boat. Nothing is broken. The motor runs clean.',
            'The complaint is consistent. Two people on board, a livewell full of water, a kicker, and a full fuel tank, the standard 60 takes too long to get the bow down and onto plane. Hole shot is in the 8–12 second range. At cruise the boat is fine, but the moment a wake hits the bow, the boat drops off plane and the slow climb back up starts again. With a 60 HP cap on the transom plate, the option to just go bigger is off the table.',
          ],
        },
        {
          heading: 'Why upgrade to Command Thrust at the same HP?',
          paragraphs: [ Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD 'Always On' program (OAC)."Command Thrust is Mercury's heavy-hull gearcase. The horsepower rating stays at 60. What changes is the gearcase under the powerhead, a larger-diameter torpedo, larger gears, and a high-thrust prop with more blade area. The motor turns a lower gear ratio, which means each prop revolution moves more water.",
            'The practical result is more hole shot and more low-end pull at the cost of a small top-end drop. On the same 18-foot deep-V, a Command Thrust 60 cuts hole shot time roughly in half, from 10 seconds to 5 seconds in our typical test loads. The boat sits at a better trim attitude on plane. Heavy boat behaviour (fighting wakes, climbing back on plane, holding plane at lower RPM) all gets noticeably better.',
            'Top end gives up roughly 2–3 mph compared with the standard 60, depending on prop pitch. For a heavy fishing or family aluminum that does 95% of its work between idle and cruise, that trade is a clear win.',
            'The other reason owners pick Command Thrust over jumping to bigger HP: insurance, transom rating, and resale. Staying at the rated 60 HP keeps the boat inside its design envelope and inside the insurance class it was rated for.',
          ],
        },
        {
          heading: 'What did the job involve?',
          paragraphs: [
            "A standard-to-Command-Thrust swap is mostly a propeller and gearcase change in terms of customer-visible difference, but it's a full motor swap under the cowl. We confirm the transom plate rating (the 60 HP cap stays valid), pull the old 60, inspect the transom and bracket, and mount the new Command Thrust 60 with new bolts. New controls and cables go in to match Mercury's current specs.",
            'The prop selection is where the magic happens. Command Thrust uses different prop spline and pitch range than the standard 60 gearcase. We try 2–3 high-thrust aluminum or stainless props until WOT RPM lands in Mercury\'s spec band cleanly under load. Pitch is typically in the 11–13-inch range for an 18-foot deep-V, much lower than a comparable standard 60 would run.',
            "Water test on Rice Lake confirms WOT, hole shot, gauge function, and trim behaviour. Pickup-only at Gores Landing, we don't ship or deliver. See our repower process for the full sequence.",
          ],
        },
        {
          heading: 'What did it cost?',
          paragraphs: [
            'All-in lands between $10,000 and $13,000 CAD. The Mercury 60 Command Thrust sits a little higher than a standard 60 because of the bigger gearcase. The new controls, prop, removal, fuel system check, and water test build the rest. Trade-in on a clean standard 60 takes a few thousand off, fill the form and we email a CAD figure within one business day.',
            'Financing is 8.99% APR under $10,000, 7.99% APR over $10,000 on approved credit. A $500 deposit holds the order. See our cost guide for full pricing. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD 'Always On' program (OAC).',
          ],
        },
      ],
      faqs: [
        {
          question: 'What is Command Thrust on a Mercury outboard?',
          answer:
            "Command Thrust is Mercury's heavy-hull gearcase option. Same horsepower as a standard motor, but a larger-diameter torpedo, bigger gears, and a high-thrust propeller. It pushes more water per revolution, which means better hole shot, better trim attitude, and more pull on heavy or oversized hulls.",
        },
        {
          question: 'Will a Command Thrust 60 give me more top speed?',
          answer:
            'Not really. Top speed is usually similar or slightly lower than a standard 60 because the gearing trades top-end for thrust. What you gain is hole shot, mid-range pull, and control of a heavy boat, exactly what a deep-V aluminum or heavy pontoon needs.',
        },
        {
          question: 'Why not just go to a bigger HP standard motor?',
          answer:
            "Sometimes that's the right answer. But if your transom is rated for 60 HP and a bigger motor would overpower the hull or push you into a higher insurance class, Command Thrust is the smart way to get more from the same HP.",
        },
        {
          question: 'How long does the repower take?',
          answer:
            'Typically 2–3 weeks from quote signing to water test pickup at HBW. Mercury-to-Mercury swaps on a clean transom are fast. Pickup-only at Gores Landing.',
        },
      ],
      visit:
        `${VISIT_BASE}\n\nWe're the repower side of Harris Boat Works, a family marina in Gores Landing serving boaters since 1947. Command Thrust prop selection takes a few water-test laps to land right, and we always land it before pickup.`,
      related: [
        { label: 'Pricing Reference', href: '/pricing-reference' },
        { label: 'How To Repower A Boat', href: '/how-to-repower-a-boat' },
        {
          label: 'Harris Boat Works, a family marina in Gores Landing serving boaters since 1947',
          href: 'https://www.harrisboatworks.ca/aboutus',
          external: true,
        },
      ],
      heroAlt: '18-foot deep-V aluminum boat with a Mercury 60 HP FourStroke Command Thrust on Rice Lake.',
    },
  },
  {
    id: 'CS12',
    slug: 'twin-to-single-big-block',
    title: 'Twin 115 to Single 300 V8 Consolidation',
    excerpt:
      'Consolidate twin 115 HPs into a single 300 V8 on a 23-foot cabin boat for $35,000–$42,000 all-in at Harris Boat Works.',
    scenario: 'Twin-to-single big-block consolidation',
    boatType: '23-foot cabin / walkaround',
    region: 'Rice Lake / Trent system',
    beforeMotor: 'Twin 115 HP FourStrokes (~25 years old)',
    afterMotor: 'Single Mercury 300 HP V8 Verado or Pro XS 4.6L',
    hpJump: 'Twin 115 → single 300',
    heroImage: '/lovable-uploads/case-study-twin-to-single-big-block-hero-v3.png',
    customerQuote:
      'Half the service hours, better fuel at cruise, and one throttle to dock with.',
    recommendation:
      'Best for 22–25-foot inland cabin / walkaround boats running tired twin 115s where the owner doesn\'t need offshore redundancy and wants lower service and helm complexity.',
    whyItWorked: [
      'One motor cuts annual service hours roughly in half',
      'Modern V8 burns ~20–30% less fuel than two old 115s at cruise',
      'Single throttle + DTS makes low-speed docking dramatically easier',
    ],
    isIllustrative: false,
    quoteUrl: '/quote/motor-selection?caseStudy=CS12',
    longForm: {
      cleanTitle: 'Twin 115 to Single 300 V8 Consolidation',
      canonical: 'https://www.mercuryrepower.ca/case-studies/twin-to-single-big-block',
      metaDescription:
        'Consolidate twin 115 HPs into a single 300 V8 on a 23-foot cabin boat for $35,000–$42,000 all-in at Harris Boat Works.',
      h1: 'Twin 115 to Single 300 V8 Consolidation on a 23-foot Cabin Boat',
      lastReviewed: '2026-05-24',
      quickAnswer:
        'Consolidating an older twin 115 HP FourStroke setup into a single Mercury 300 HP V8, either Verado (special-order) or Pro XS 4.6L, on a 23-foot cabin or walkaround boat typically runs $35,000–$42,000 all-in at Harris Boat Works in Gores Landing, less trade value on the two old motors. Build a quote at mercuryrepower.ca.',
      intro:
        "Consolidating an older twin 115 HP FourStroke setup into a single Mercury 300 HP V8, either Verado (special-order) or Pro XS 4.6L, on a 23-foot cabin or walkaround boat typically runs $35,000–$42,000 all-in at Harris Boat Works in Gores Landing, less trade value on the two old motors. Timeline is 6–12 weeks depending on whether the customer picks Verado (special-order) or Pro XS (often quicker to source). Going single saves on service hours, fuel, and helm complexity for owners who don't need the redundancy of twins.",
      keyFacts: [
        'Old setup: twin 115 HP FourStrokes, about 25 years old',
        'New setup: single Mercury 300 HP V8 Verado or Pro XS 4.6L',
        'Boat: 23-foot cabin / walkaround',
        'Cost range: $35,000–$42,000 CAD all-in (less trade)',
        'Timeline: 6–12 weeks',
        'Fuel economy: roughly 20–30% better at cruise vs two old 115s',
        'Deposit: $1,000 for big-block / Verado',
        'Warranty: Mercury Limited Warranty, confirmed at quote',
      ],
      sections: [
        {
          heading: 'What was on the boat before?',
          paragraphs: [
            'The candidate is a 23-foot cabin or walkaround (small cuddy, head, narrow side deck) that was rigged twin from new in the late 1990s or early 2000s. Twin 115 HP FourStrokes made sense at the time. Two motors, two of everything. Plenty of power for the hull, redundancy on big water, and a helm setup that felt premium for the era.',
            "Twenty-plus years later the math has changed. The two 115s are running but showing their age, corrosion under the cowl, fading electronics, fuel pumps and water pumps being chased every season. The owner is paying two service bills, running two fuel lines, and replacing two of every consumable. The boat doesn't leave Rice Lake or the Trent system, so true offshore redundancy isn't actually being used.",
          ],
        },
        {
          heading: 'Why consolidate twin 115s into a single 300?',
          paragraphs: [
            'The math comes out three ways.',
            "Service cost, one motor instead of two cuts annual service hours roughly in half. One winterization, one spring service, one set of plugs and oil filters. Over a 10-year ownership window that's real money.",
            'Fuel, a modern Mercury 300 V8 4.6L at cruise burns less fuel than two older 115s working at the same speed. Modern EFI tuning, better prop efficiency, and one motor instead of two reduces parasitic drag on the gearcase side. We typically see 20–30% better fuel economy at cruise on the conversion.',
            "Helm simplicity, one throttle, one shift, one set of gauges. Docking a 23-foot cabin with twin throttles is a learned skill. Docking it with one V8 and Mercury's DTS at low speed is dramatically easier.",
            "The trade-off is honest: no get-home redundancy. With one motor, if the motor fails offshore you wait for a tow. For Rice Lake, the Kawarthas, and the Trent system this is rarely a practical concern. For the open Great Lakes it's a real call to make.",
          ],
        },
        {
          heading: 'What did the job involve?',
          paragraphs: [
            'A twin-to-single is one of the bigger jobs we do. We start with a transom inspection, twin bolt patterns leave eight holes that need to be addressed, sometimes filled and sometimes left for hardware reuse depending on where the single mounts. The center bridge between the twin pockets often needs reinforcement to handle the torque of a single V8 in the middle. This is shop work, not a one-day install.',
            "The new motor goes through full Mercury rigging, DTS throttle, smart helm, hydraulic steering, new fuel routing from the tank to a single inlet, new gauge package. Propeller selection runs through 2–3 stainless props in the 15–16-inch diameter range, pitched 19–23 inches depending on hull and load, until WOT RPM lands in Mercury's band cleanly.",
            "Water test on Rice Lake, loaded and unloaded, before pickup. Pickup-only at Gores Landing, we don't ship or deliver. The full timeline runs 6–12 weeks, the long end driven by Verado's special-order window.",
          ],
        },
        {
          heading: 'What did it cost?',
          paragraphs: [
            'All-in lands between $35,000 and $42,000 CAD before trade. The motor itself sits in the $25,000–$28,000 band for Verado 300 or slightly lower for Pro XS 300 V8 4.6L. The DTS helm package, new steering, transom rework, controls, prop set, removal of two old motors, and water test build the rest.',
            'Trade-in on two 25-year-old 115 FourStrokes depends heavily on condition, clean, running motors with reasonable hours can take meaningful dollars off. Fill the trade-in form and we email a CAD figure within one business day.',
            'Financing is 7.99% APR over $10,000 on approved credit. A $1,000 deposit holds the order. See our cost guide for full repower pricing. Current promo: {{LIVE_RATE}} through Dec 31, 2026 via the Mercury TD 'Always On' program (OAC).',
          ],
        },
      ],
      faqs: [
        {
          question: 'Why go from twin to single?',
          answer:
            'Three reasons. Service cost, one motor to maintain instead of two. Fuel, a modern V8 300 burns less than two 25-year-old 115s pushed hard. Helm simplicity, one throttle, one shift, one set of gauges. The trade-off is no get-home redundancy, so it is the right choice for inland water and the wrong choice for far-offshore work.',
        },
        {
          question: 'Do I need to modify the transom for single-engine conversion?',
          answer:
            'Often yes. Twin transoms have two bolt patterns and a center bridge between them. We may need to fill the unused bolt holes, reinforce the center skin, and re-rig steering and controls for a single. This is included in the quote. We inspect the transom carefully before final quote.',
        },
        {
          question: 'Can I trade in both old 115s?',
          answer:
            'Yes. We take Mercury outboard trade-ins, and 25-year-old 115 FourStrokes still carry some core value depending on condition. Fill the trade-in form with details on both motors and we email a combined CAD figure within one business day.',
        },
        {
          question: 'How long does a twin-to-single conversion take?',
          answer:
            "6–12 weeks depending on motor choice. If you pick Verado 300 the timeline is driven by Mercury's 8–14 week special-order window. Pro XS 300 V8 is often quicker. Transom rework adds about a week to either path. Pickup-only at Gores Landing.",
        },
      ],
      visit:
        `${VISIT_BASE}\n\nWe're the repower side of Harris Boat Works in Gores Landing, Mercury Premier Dealer, selling Mercury since 1965. Twin-to-single is one of the most consequential repower decisions we walk customers through, and we walk through it honestly.`,
      related: [
        { label: 'Pricing Reference', href: '/pricing-reference' },
        { label: 'Trade In Value', href: '/trade-in-value' },
        {
          label: 'Harris Boat Works in Gores Landing, Mercury Premier Dealer, selling Mercury since 1965',
          href: 'https://www.harrisboatworks.ca/aboutus',
          external: true,
        },
      ],
      heroAlt: '23-foot cabin walkaround boat with a single Mercury 300 V8 replacing twin 115s.',
    },
  },
];
