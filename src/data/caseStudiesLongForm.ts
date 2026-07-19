// Long-form case study pages for mercuryrepower.ca (Bucket 2 Batch 2, May 2026).
// Each page renders: hero, H1, last-reviewed line, "Quick answer" gold callout,
// intro, Key facts, H2 sections, FAQs, Visit Harris Boat Works, Related.
// These planning scenarios are illustrative, not customer testimonials.

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
    title: '90 HP to 115 Pro XS Repower Planning Scenario',
    excerpt:
      'An illustrative 17-foot fiberglass bass-boat scenario comparing a 90 HP setup with a 115 HP Pro XS Command Thrust repower.',
    scenario: 'Fiberglass bass boat repower',
    boatType: '17-foot fiberglass bass boat',
    region: 'Rice Lake / Kawarthas',
    beforeMotor: 'Mercury 90 HP FourStroke',
    afterMotor: 'Mercury 115 HP Pro XS Command Thrust',
    hpJump: '90 → 115',
    heroImage: '/lovable-uploads/case-study-90-to-115-pro-xs-fish-boat-hero.png',
    customerQuote:
      'A 115 Pro XS Command Thrust may suit a properly rated 17-foot performance hull when the complete setup supports it.',
    recommendation:
      'Best for 17-foot fiberglass bass or multi-species hulls rated 115 HP or higher, where the owner wants stronger hole shot and a Pro XS-class top end without changing the hull.',
    whyItWorked: [
      'Pro XS is Mercury\'s performance-oriented 115 HP option',
      'Command Thrust can turn a larger propeller for a heavier load',
      'Final acceleration, RPM, and top speed depend on the actual hull, load, engine height, and propeller',
    ],
    isIllustrative: true,
    quoteUrl: '/quote/motor-selection?caseStudy=CS06',
    longForm: {
      cleanTitle: '90 HP to 115 Pro XS Repower Planning Scenario',
      canonical: 'https://www.mercuryrepower.ca/case-studies/90-to-115-pro-xs-fish-boat',
      metaDescription:
        'Illustrative 17-foot bass-boat scenario comparing a 90 HP setup with a Mercury 115 HP Pro XS Command Thrust repower.',
      h1: '90 HP to 115 HP Pro XS Command Thrust Repower on a 17-foot Bass Boat',
      lastReviewed: '2026-07-18',
      quickAnswer:
        'This illustrative scenario compares a 90 HP setup with a 115 HP Pro XS Command Thrust repower on a 17-foot fiberglass bass boat. The current bare-motor price is published in the pricing reference; removal, controls, propeller, rigging, and water testing depend on the actual boat and belong in a written quote.',
      intro:
        'A 90 HP to 115 HP Pro XS Command Thrust repower can suit a properly rated 17-foot fiberglass bass or multi-species boat when the owner wants stronger acceleration and performance tuning. This is a planning example, not a completed customer job. HBW confirms the hull rating, exact motor, controls, propeller, rigging, and current quote before making a recommendation.',
      keyFacts: [
        'Old motor: Mercury 90 HP FourStroke (still running)',
        'New motor: Mercury 115 HP Pro XS Command Thrust',
        'Boat: 17-foot fiberglass bass / multi-species hull',
        'Pricing: current bare motor in the pricing reference; installed quote depends on the boat and rigging',
        'Boat with us: 2 to 5 days (motor lead time separate)',
        'Power jump: 25 HP, roughly 28% more rated horsepower',
        'Warranty: Mercury Limited Warranty, confirmed at quote',
        'Deposit: $500 to hold the order',
      ],
      sections: [
        {
          heading: 'What was on the boat before?',
          paragraphs: [
            'The planning example starts with a properly rated 17-foot fiberglass bass or multi-species boat carrying normal fishing load: trolling motor, batteries, livewell, fuel, tackle, and two anglers. Before comparing motors, HBW would document the capacity plate, current engine, measured performance, mounting height, propeller, and full operating load.',
            'The decision should be based on the owner\'s measured acceleration, RPM, handling, and speed goals rather than a generic result assigned to every 17-foot hull.',
          ],
        },
        {
          heading: 'Why upgrade to a 115 Pro XS Command Thrust?',
          paragraphs: [
            'The 115 Pro XS is Mercury\'s performance-oriented 115 HP option. Command Thrust uses a larger gearcase that can turn a larger-diameter propeller, which may suit a heavier or more heavily loaded hull.',
            'No responsible planning scenario can promise a planing time, top speed, fuel result, or handling change without the actual boat and baseline measurements. HBW would select engine height and propeller on the water and verify WOT RPM against Mercury\'s specification.',
          ],
        },
        {
          heading: 'What did the job involve?',
          paragraphs: [
            "This is more rigging than a FourStroke-to-FourStroke swap. We confirm the transom plate rating and Coast Guard capacity plate, pull the old 90, inspect the transom skin and bracket, and mount the 115 Pro XS Command Thrust with a bigger bolt pattern in some cases. The Pro XS often runs digital throttle and shift (DTS), if the boat had mechanical controls, we either keep mechanical or upgrade to DTS depending on what the helm can carry.",
            "Propeller selection takes care here. The Command Thrust gearcase uses a different propeller family than a standard 115, so the correct model and pitch must be selected from the actual hull, load, engine height, and measured WOT RPM.",
            "Water test on Rice Lake confirms WOT RPM, listens for any rigging issue, and checks gauges. Pickup-only at Gores Landing, we don't ship or deliver.",
          ],
        },
        {
          heading: 'What did it cost?',
          paragraphs: [
            'Use the pricing reference for the current bare-motor price. The complete installed quote depends on shaft length, controls, steering, propeller, removal, fuel-system condition, transom condition, and the amount of rigging the boat can reuse. Any trade value is assessed separately after the motor is identified and inspected.',
            'HBW can arrange financing through DealerPlan and Canadian lenders on eligible purchases of $5,000 or more at the current {{LIVE_RATE}} promotional APR through Dec 31, 2026 (OAC). The financed quote includes the $349 DealerPlan documentation fee where applicable and discloses the contract term, amortization, and any balance due at maturity.',
          ],
        },
      ],
      faqs: [
        {
          question: 'How long does a 115 Pro XS Command Thrust repower take?',
          answer:
            "Two clocks. Your boat is with us for 2 to 5 days, drop-off to pickup, install and water test. Motor lead time is separate: in-stock 115 Pro XS ships immediately, special orders wait at Mercury (the wait depends on the model and current Mercury availability), and your boat stays with you until the motor arrives.",
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
            'Yes. HBW can arrange financing through DealerPlan and Canadian lenders on eligible purchases of $5,000 or more at the current {{LIVE_RATE}} promotional APR through Dec 31, 2026 (OAC). The financed quote includes the $349 DealerPlan documentation fee where applicable and shows the full lender disclosure. A $500 deposit holds the order.',
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
    title: 'Pontoon Boost Upgrade Planning Scenario',
    excerpt:
      'An illustrative 24-foot tritoon scenario showing when a 200 HP Pro XS with the Mercury Boost software upgrade may improve acceleration.',
    scenario: 'Pontoon Boost planning scenario',
    boatType: '24-foot tritoon',
    region: 'Rice Lake / Kawarthas',
    beforeMotor: '175 HP V6 FourStroke',
    afterMotor: 'Mercury 200 HP Pro XS V8 4.6L with Boost',
    hpJump: '175 → 200; Boost improves acceleration, not horsepower',
    heroImage: '/lovable-uploads/case-study-pontoon-boost-retrofit-hero-v3.png',
    customerQuote:
      'Boost can improve mid-range acceleration and throttle response on an eligible motor; the result depends on the boat, load, setup, and conditions.',
    recommendation:
      'Consider Boost only after confirming the hull is correctly powered and the motor is eligible. It cannot substitute for additional rated horsepower on an underpowered boat.',
    whyItWorked: [
      'V8 4.6L torque suits heavy pontoon hulls',
      'Mercury reports 5% to 21% quicker zero-to-top-speed acceleration across five tested boat-and-engine combinations',
      'Boost does not increase horsepower, top speed, or the maximum RPM range',
    ],
    isIllustrative: true,
    quoteUrl: '/quote/motor-selection?caseStudy=CS07',
    longForm: {
      cleanTitle: 'Pontoon Boost Upgrade Planning Scenario',
      canonical: 'https://www.mercuryrepower.ca/case-studies/pontoon-boost-retrofit',
      metaDescription:
        'Illustrative 24-foot tritoon scenario explaining what Mercury Boost does, what it does not do, and how to verify motor eligibility.',
      h1: 'Pontoon Repower with Mercury Boost on a 24-foot Tritoon',
      lastReviewed: '2026-07-18',
      quickAnswer:
        'Mercury Boost is a software calibration for eligible motors. It activates automatically during qualifying full-throttle mid-range acceleration. Mercury describes improved mid-range response and reports 5% to 21% quicker zero-to-top-speed acceleration across five tested boat-and-engine combinations. It does not add horsepower, top speed, maximum RPM, or change time to plane. This page is an illustrative planning scenario, not a completed customer job or a fixed-price quote.',
      intro:
        'This illustrative scenario starts with a heavily loaded 24-foot tritoon whose owner is considering a 175 HP to 200 HP repower. Boost may make an eligible motor feel more responsive during full-throttle acceleration, but it is not extra horsepower and it cannot correct a motor-to-hull mismatch. Harris Boat Works confirms the capacity plate, motor eligibility, propeller, controls, and complete installed quote before recommending it.',
      keyFacts: [
        'Old motor: 175 HP V6 FourStroke',
        'New motor: Mercury 200 HP Pro XS V8 4.6L with Boost',
        'Boost: automatic software calibration during full-throttle mid-range acceleration',
        'Boat: 24-foot tritoon',
        'Pricing: confirm the current motor price and Boost eligibility in a written quote',
        'Boat with us: 2 to 5 days (motor lead time separate)',
        'Performance: Mercury reports 5% to 21% quicker zero-to-top-speed acceleration across five tested combinations; actual results vary',
      ],
      sections: [
        {
          heading: 'What was on the boat before?',
          paragraphs: [
            'The planning example is a 24-foot tritoon with a 175 HP V6 FourStroke. Before recommending any upgrade, HBW would confirm the capacity plate, current setup, typical passenger and gear load, propeller, engine height, and whether the complaint is acceleration or genuinely insufficient power.',
            'That distinction matters. Boost may improve acceleration on an eligible motor, but Mercury states that it does not increase engine horsepower, top speed, or the maximum RPM range.',
          ],
        },
        {
          heading: 'Why upgrade to a 200 Pro XS V8 with Boost?',
          paragraphs: [
            'A 200 Pro XS V8 4.6L may be worth comparing only if the capacity plate and complete setup support 200 HP. Moving from a 175 V6 to a 200 V8 also changes engine architecture, weight, rigging, and propeller requirements, so it is not a software-only decision.',
            'Boost is a Mercury software calibration that activates automatically during qualifying full-throttle mid-range acceleration. Mercury reports 5% to 21% quicker zero-to-top-speed acceleration across five tested boat-and-engine combinations, with results varying by boat, load, setup, and conditions.',
            'It does not turn a 200 HP motor into a 225 HP motor. If the boat is underpowered for its real load, the correct answer may be a higher rated motor, a different propeller or setup, or no change until the hull limits are confirmed.',
          ],
        },
        {
          heading: 'What did the job involve?',
          paragraphs: [
            'A V6-to-V8 repower is more than a motor change. HBW confirms the transom rating and condition, control and steering compatibility, electrical needs, engine height, propeller, and exact Boost eligibility before quoting.',
            'Boost is not operated with a separate button. On an eligible, unlocked motor it activates automatically when the throttle is advanced rapidly to wide-open throttle and the engine reaches the applicable mid-range conditions.',
            'Water test on Rice Lake, both loaded and unloaded, before pickup. Pickup-only at Gores Landing, we don\'t ship or deliver.',
          ],
        },
        {
          heading: 'What did it cost?',
          paragraphs: [
            'Use the pricing reference for the current bare-motor price. The installed quote depends on the exact motor, controls, steering, propeller, rigging, removal, transom condition, and any eligible software upgrade. HBW confirms Boost price and eligibility in writing rather than publishing an unverified fixed add-on.',
            'Financing and promotions can change. The quote builder applies the current eligible terms and keeps them separate from the motor and installation price.',
          ],
        },
      ],
      faqs: [
        {
          question: 'What is Mercury Boost?',
          answer:
            'Boost is a Mercury software calibration that improves mid-range acceleration and throttle response on eligible motors. It activates automatically during full-throttle acceleration. It does not increase engine horsepower, top speed, or maximum RPM.',
        },
        {
          question: 'How much does Boost add to the motor price?',
          answer:
            'Boost pricing and eligibility must be confirmed for the specific engine serial number. HBW will show it as a separate line item in the written quote when available.',
        },
        {
          question: 'When does Boost operate?',
          answer:
            'Boost is inactive at low RPM, steady-state cruising, and after top speed is reached. It activates automatically during full-throttle mid-range acceleration and remains active only while its operating conditions are met.',
        },
        {
          question: 'Will Boost work on my existing pontoon?',
          answer:
            'Eligibility depends on the exact engine model, serial number, and Mercury\'s current rollout. Check the Mercury Marine app or ask HBW to verify the serial number. Hull horsepower rating and setup are separate checks.',
        },
      ],
      visit:
        `${VISIT_BASE}\n\nWe're the repower side of Harris Boat Works in Gores Landing, Mercury Premier Dealer, selling Mercury since 1965. Any eligible Boost work is confirmed by exact serial number and quoted in writing before authorization.`,
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
      'An illustrative 17-foot aluminum-boat scenario replacing an older 70–90 HP two-stroke with a Mercury 90 FourStroke EFI.',
    scenario: '2-stroke to 4-stroke modernization',
    boatType: '17-foot aluminum runabout',
    region: 'Rice Lake / Kawarthas',
    beforeMotor: '70–90 HP 2-stroke (Mercury Sport or legacy Evinrude)',
    afterMotor: 'Mercury 90 HP FourStroke EFI',
    hpJump: 'Modernization (similar HP, modern EFI)',
    heroImage: '/lovable-uploads/case-study-two-stroke-to-fourstroke-modernization-hero-v3.png',
    customerQuote:
      'A current FourStroke can simplify fuel handling, starting, service support, and warranty compared with an aging carbureted two-stroke.',
    recommendation:
      'Best for owners of 15–25-year-old aluminum runabouts with tired carbureted 2-strokes who want a quiet, clean, factory-warrantied modern FourStroke without changing the hull.',
    whyItWorked: [
      'Clean cold starts and smooth idle with modern EFI',
      'Quieter, smoother operation is a common reason to compare a current FourStroke',
      'No two-stroke oil mixing; actual fuel use depends on the old engine, hull, propeller, load, and operating point',
    ],
    isIllustrative: true,
    quoteUrl: '/quote/motor-selection?caseStudy=CS08',
    longForm: {
      cleanTitle: 'Two-Stroke to FourStroke Modernization',
      canonical:
        'https://www.mercuryrepower.ca/case-studies/two-stroke-to-fourstroke-modernization',
      metaDescription:
        'Illustrative 17-foot aluminum-boat scenario replacing an older 70–90 HP two-stroke with a Mercury 90 FourStroke EFI.',
      h1: 'Two-Stroke to FourStroke Modernization on a 17-foot Aluminum',
      lastReviewed: '2026-07-18',
      quickAnswer:
        'This illustrative scenario replaces an older 70–90 HP two-stroke with a Mercury 90 FourStroke EFI on a properly rated 17-foot aluminum runabout. The pricing reference shows the current bare-motor price; removal, controls, propeller, fuel-system work, rigging, and testing require a boat-specific quote.',
      intro:
        'Replacing an older 70–90 HP two-stroke with a current Mercury 90 FourStroke EFI can improve starting, noise, fuel handling, and serviceability on a compatible 17-foot aluminum runabout. This is an illustrative planning example. HBW confirms motor weight, hull rating, controls, fuel system, propeller, and the current written quote for the actual boat.',
      keyFacts: [
        'Old motor: 70–90 HP 2-stroke (Mercury Sport or discontinued Evinrude legacy)',
        'New motor: Mercury 90 HP FourStroke EFI',
        'Boat: 17-foot aluminum runabout',
        'Pricing: current bare motor in the pricing reference; installed quote depends on the boat and rigging',
        'Boat with us: 2 to 5 days (motor lead time separate)',
        'Warranty: Mercury Limited Warranty, confirmed at quote',
        'Noise and fuel use: compare with measurements from the actual old engine and boat',
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
            'Noise is the second. A current FourStroke can be quieter and smoother than an older carbureted two-stroke, but the difference depends on the specific engines, installation, and operating point.',
            'Fuel is the third. Modern EFI eliminates two-stroke oil mixing and may reduce fuel use, but HBW would not promise a percentage without baseline fuel data from the actual boat and a comparable water test.',
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
            'Use the pricing reference for the current bare-motor price. The installed quote adds only the work the boat actually needs, which may include removal, controls, cables, steering, propeller, fuel-system remediation, and water testing. Trade value depends on the exact old motor and its condition.',
            'Discontinued legacy 2-strokes have less trade value but we still take them case by case.',
            'HBW can arrange financing through DealerPlan and Canadian lenders on eligible purchases of $5,000 or more at the current {{LIVE_RATE}} promotional APR through Dec 31, 2026 (OAC). The financed quote includes the $349 DealerPlan documentation fee where applicable and discloses the contract term, amortization, and any balance due at maturity. A $500 deposit holds the order.',
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
            'Four reasons to compare them are modern EFI starting and idle control, quieter operation, no two-stroke oil mixing, and the current Mercury Limited Warranty. The actual noise and fuel difference depends on the old engine and boat, so HBW does not promise a generic percentage.',
        },
        {
          question: 'Will the controls from my old 2-stroke work with a new Mercury?',
          answer:
            'Usually no. The throttle and shift cables and harness are different. We include new Mercury controls and cables in the repower quote so everything is matched and warrantied.',
        },
        {
          question: 'How long does this kind of repower take?',
          answer:
            "Two clocks. Your boat is with us for 2 to 5 days, drop-off to pickup (a little longer if we find transom rework on an older boat). Motor lead time is separate: in-stock motors ship immediately, special orders wait at Mercury (the wait depends on the model and current Mercury availability), and your boat stays with you until the motor arrives. Pickup-only at Gores Landing.",
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
      'An illustrative 23-foot bowrider scenario planning a special-order Mercury 300 V8 Verado repower.',
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
    isIllustrative: true,
    quoteUrl: '/quote/motor-selection?caseStudy=CS09',
    longForm: {
      cleanTitle: 'Verado V8 300 Special-Order Repower',
      canonical:
        'https://www.mercuryrepower.ca/case-studies/verado-v8-special-order-repower',
      metaDescription:
        'Illustrative 23-foot bowrider scenario planning a special-order Mercury 300 V8 Verado repower with complete helm integration.',
      h1: 'Verado V8 300 Special-Order Repower on a 23-foot Bowrider',
      lastReviewed: '2026-07-18',
      quickAnswer:
        'This illustrative scenario covers a special-order Mercury 300 V8 Verado repower on a properly rated 23-foot fiberglass bowrider. Verado pricing and availability are confirmed by quote; removal, Digital Throttle and Shift, steering, propeller, helm integration, and water testing depend on the boat.',
      intro:
        'A Mercury 300 HP V8 Verado repower can suit a compatible 23-foot fiberglass bowrider where quiet operation, steering integration, and refined controls matter. This is an illustrative planning example, not a completed customer job. Verado is special-order from HBW, and both lead time and price are confirmed for the exact configuration before a deposit or schedule is discussed.',
      keyFacts: [
        'Old motor: older 250 HP Verado (tired, several seasons in)',
        'New motor: Mercury 300 HP V8 Verado (special-order)',
        'Boat: 23-foot fiberglass bowrider',
        'Pricing and lead time: special-order quote for the exact motor and helm configuration',
        'Motor lead time: 8–14 weeks (Verado is special-order only); boat with us: 2 to 5 days',
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
            "When the motor arrives, the shop work takes about 2 to 5 days. We pull the old Verado, inspect the transom skin and bracket, and inspect the rigging tunnel. Verado uses DTS throughout, the throttle, helm, gauges, and ECU all talk on a Mercury smart helm network. We replace the helm package as part of the job. Propeller selection runs through 2–3 stainless props in the 15–16-inch diameter range, pitched 19–23 inches depending on hull, load, and customer style, until WOT lands in Mercury's spec band cleanly.",
            "Water test on Rice Lake confirms WOT RPM, helm response, steering torque, and gauge integrity. Pickup-only at Gores Landing, we don't ship or deliver.",
          ],
        },
        {
          heading: 'What did it cost?',
          paragraphs: [
            'Verado is special-order from HBW, so the motor price and availability are confirmed in the written quote. The complete package depends on the helm and DTS configuration, steering, propeller, removal, rigging, and water testing. Any trade value is assessed separately after the old motor is identified and inspected.',
            'HBW can arrange financing through DealerPlan and Canadian lenders on eligible purchases of $5,000 or more at the current {{LIVE_RATE}} promotional APR through Dec 31, 2026 (OAC). The financed quote includes the $349 DealerPlan documentation fee where applicable and discloses the contract term, amortization, and any balance due at maturity. A $1,000 deposit holds the build slot.',
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
            'Often yes, depending on hours, condition, and year. Verados are sought after as cores and for resale. Fill the trade-in form and we usually email a CAD figure within one business day. Trade value comes off the all-in price.',
        },
        {
          question: 'Is financing available for a Verado repower?',
          answer:
            'Yes. HBW can arrange financing through DealerPlan and Canadian lenders on eligible purchases of $5,000 or more at the current {{LIVE_RATE}} promotional APR through Dec 31, 2026 (OAC). The financed quote includes the $349 DealerPlan documentation fee where applicable. A $1,000 deposit holds the order; the build slot is not finalized until the deposit is in and credit is approved.',
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
      'An illustrative 18-foot walleye-boat scenario adding a Mercury Avator 7.5e electric outboard for quiet, low-speed use.',
    scenario: 'Electric kicker / trolling install',
    boatType: '18-foot aluminum walleye / muskie boat',
    region: 'Rice Lake / Kawarthas',
    beforeMotor: 'No kicker or old 4–9.9 HP gas kicker',
    afterMotor: 'Mercury Avator 7.5e electric outboard',
    hpJump: '750-watt electric outboard added for defined low-speed use',
    heroImage: '/lovable-uploads/case-study-avator-electric-kicker-trolling-hero-v3.png',
    customerQuote:
      'A quiet, low-speed option can make sense when the boat, route, range, mounting, and charging plan all fit.',
    recommendation:
      'Consider for a compatible fishing boat only after confirming the complete load, required range and reserve, transom or bracket fit, controls, and charging access.',
    whyItWorked: [
      'Quiet electric operation with no exhaust at the motor',
      'One integrated quick-swap battery, with an optional charged spare carried separately',
      'Integrated display shows battery, power, and estimated runtime',
    ],
    isIllustrative: true,
    quoteUrl: '/quote/motor-selection?caseStudy=CS10',
    longForm: {
      cleanTitle: 'Avator 7.5e Electric Kicker on a Walleye Boat',
      canonical:
        'https://www.mercuryrepower.ca/case-studies/avator-electric-kicker-trolling',
      metaDescription:
        'Illustrative 18-foot walleye-boat scenario adding a Mercury Avator 7.5e electric outboard for quiet, low-speed use.',
      h1: 'Mercury Avator 7.5e Electric Kicker on an 18-foot Walleye Boat',
      lastReviewed: '2026-07-18',
      quickAnswer:
        'This illustrative scenario adds a Mercury Avator 7.5e electric outboard to an 18-foot aluminum fishing boat for quiet, low-speed operation. HBW is not publishing firm Avator pricing yet; the motor, battery, bracket, controls, fit, and availability must be confirmed in a written quote.',
      intro:
        'An Avator 7.5e can be considered for quiet, low-speed operation on a compatible 18-foot aluminum fishing boat. This is an illustrative planning example, not a completed customer installation. HBW confirms the boat fit, battery configuration, controls, bracket, expected runtime for the intended use, and current availability before recommending a package.',
      keyFacts: [
        'Motor: Mercury Avator 7.5e (electric outboard)',
        'Output: 750 watts at the propeller',
        'Boat: 18-foot aluminum walleye / muskie boat',
        'Pricing: coming soon; call (905) 342-2153 for the current motor and battery package',
        'Install timing: confirmed after tiller or remote controls, mounting, clearance, and accessories are selected',
        'Published test: about 60 minutes / 5 miles at full throttle and up to 19 hours / 34 miles at 25% on Mercury\'s specified 13-foot test boat; actual results vary',
        'Deposit: $200 for portable / small HP',
        'Warranty: Mercury Limited Warranty, confirmed at quote',
      ],
      sections: [
        {
          heading: 'What was on the boat before?',
          paragraphs: [
            'The planning example is an 18-foot aluminum fishing boat with a gas main motor already on the transom. The owner is comparing a small gas kicker, a bow-mounted electric, and an Avator for defined low-speed use.',
            'Before recommending Avator, HBW would document the complete boat load, transom space, mounting and shaft requirements, intended route, normal wind and water conditions, required reserve, and charging access.',
          ],
        },
        {
          heading: 'Why upgrade to a Mercury Avator 7.5e?',
          paragraphs: [
            "The Avator 7.5e is Mercury's 750-watt electric outboard. It offers quiet operation, no exhaust at the motor, an integrated display with battery and estimated-runtime information, and a removable battery under the top cowl.",
            'Mercury tested it on a 13-foot boat with a 382-lb dry weight and one 1 kWh battery: about 60 minutes or 5 miles at full throttle and up to 19 hours or 34 miles at 25% throttle. Those figures are test context, not a result promised for this 18-foot scenario.',
            'The 7.5e uses one integrated quick-swap battery. A charged spare can be carried and swapped, but it is not a dual-wired battery bank. The included 110W charger connects to a household outlet; faster optional chargers are available.',
          ],
        },
        {
          heading: 'What did the job involve?',
          paragraphs: [
            'The planned job begins with transom and bracket clearance, shaft length, tiller or remote-control choice, steering clearance, display and charger selection, and the intended route. The standard 1 kWh battery installs under the top cowl; it is not wired into a rear battery compartment.',
            'Installation scope and timing depend on the selected configuration and any accessories that need to move. A written quote separates the motor, integrated battery, charger, mounting, controls or display, labour, and testing.',
          ],
        },
        {
          heading: 'What did it cost?',
          paragraphs: [
            'HBW is not publishing firm Avator package pricing yet. The written quote will separate the motor, battery configuration, bracket or mounting work, controls or display, installation, and water testing so the customer can see what the package includes.',
            'HBW can arrange financing through DealerPlan and Canadian lenders on eligible purchases of $5,000 or more at the current {{LIVE_RATE}} promotional APR through Dec 31, 2026 (OAC). The financed quote includes the $349 DealerPlan documentation fee where applicable and discloses the contract term, amortization, and any balance due at maturity.',
          ],
        },
      ],
      faqs: [
        {
          question: 'How long does an Avator install take?',
          answer:
            'Timing depends on the selected tiller or remote configuration, bracket and transom fit, steering clearance, controls or display, and motor availability. HBW confirms the scope and timing in the written quote.',
        },
        {
          question: 'How does an Avator 7.5e compare to a 3.5 HP gas kicker?',
          answer:
            'Mercury rates the 7.5e at 750 watts at the propeller rather than gasoline horsepower. Compare the complete boat fit, required speed and range, charging, maintenance, and mounting instead of relying on a simple horsepower equivalence.',
        },
        {
          question: 'How long does the Avator battery last?',
          answer:
            'Mercury\'s specified 13-foot test boat ran about 60 minutes or 5 miles at full throttle and up to 19 hours or 34 miles at 25% throttle with one 1 kWh battery. Actual runtime depends on the hull, load, throttle, wind, water, and reserve requirement.',
        },
        {
          question: 'Will the Avator work with my existing main motor?',
          answer:
            'Possibly. HBW must confirm transom and steering clearance, shaft length, bracket or direct-mount fit, tiller or remote controls, and the expected range before quoting. Pickup is at Gores Landing.',
        },
      ],
      visit:
        `${VISIT_BASE}\n\nWe're the repower side of Harris Boat Works. Avator is build-to-order, and the team confirms the boat, route, mounting, battery, charger, controls, availability, and testing scope before making a recommendation.`,
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
      'An illustrative 18-foot deep-V aluminum-boat scenario comparing a Mercury 60 HP Command Thrust repower with a standard gearcase.',
    scenario: 'Heavy-hull Command Thrust repower',
    boatType: '18-foot deep-V aluminum',
    region: 'Rice Lake / Kawarthas',
    beforeMotor: 'Standard Mercury 60 HP FourStroke',
    afterMotor: 'Mercury 60 HP FourStroke Command Thrust',
    hpJump: 'Same HP, bigger gearcase + high-thrust prop',
    heroImage: '/lovable-uploads/case-study-command-thrust-heavy-aluminum-hero-v3.png',
    customerQuote:
      'The larger Command Thrust gearcase may help a properly rated heavy hull carry load without changing the horsepower rating.',
    recommendation:
      'Consider for a properly rated heavier deep-V aluminum hull after comparing the standard and Command Thrust gearcases, actual load, propeller options, and measured WOT RPM.',
    whyItWorked: [
      'Larger gearcase and high-thrust prop move more water',
      'Larger propeller options may improve loaded acceleration and low-speed control',
      'Stays inside the boat\'s 60 HP transom rating',
    ],
    isIllustrative: true,
    quoteUrl: '/quote/motor-selection?caseStudy=CS11',
    longForm: {
      cleanTitle: 'Command Thrust 60 HP on Heavy Aluminum',
      canonical:
        'https://www.mercuryrepower.ca/case-studies/command-thrust-heavy-aluminum',
      metaDescription:
        'Illustrative 18-foot deep-V aluminum-boat scenario comparing a Mercury 60 HP Command Thrust repower with a standard gearcase.',
      h1: '60 HP Command Thrust Repower on an 18-foot Deep-V Aluminum',
      lastReviewed: '2026-07-18',
      quickAnswer:
        'This illustrative scenario considers a Mercury 60 HP FourStroke Command Thrust repower on a properly rated 18-foot deep-V aluminum boat. The current bare-motor price is in the pricing reference; controls, propeller, removal, fuel-system work, rigging, and water testing require a boat-specific quote.',
      intro:
        'A Mercury 60 HP FourStroke Command Thrust can suit a heavier 18-foot deep-V aluminum boat that benefits from a larger gearcase and propeller. This is an illustrative planning example, not a completed customer job. HBW confirms the hull rating, gearcase choice, controls, propeller, engine height, and current written quote for the actual boat.',
      keyFacts: [
        'Old motor: standard Mercury 60 HP FourStroke',
        'New motor: Mercury 60 HP FourStroke Command Thrust',
        'Boat: 18-foot deep-V aluminum (heavy hull)',
        'Pricing: current bare motor in the pricing reference; installed quote depends on the boat and rigging',
        'Boat with us: 2 to 5 days (motor lead time separate)',
        'Same HP, bigger gearcase + higher-thrust prop',
        'Warranty: Mercury Limited Warranty, confirmed at quote',
        'Deposit: $500 for mid-range orders',
      ],
      sections: [
        {
          heading: 'What was on the boat before?',
          paragraphs: [
            'The candidate is a heavy 18-foot deep-V aluminum with a wide beam, full canvas, and a transom plate rated 60 HP. Owners often have a standard 60 HP FourStroke that came with the boat. Nothing is broken. The motor runs clean.',
            'The planning complaint is slow loaded acceleration with two people, fishing gear, a full livewell, kicker, and fuel. HBW would first measure the existing setup, propeller, engine height, WOT RPM, load, and hull condition. With a 60 HP capacity-plate limit, any recommendation must stay within that rating.',
          ],
        },
        {
          heading: 'Why upgrade to Command Thrust at the same HP?',
          paragraphs: [
            "Command Thrust is Mercury's heavy-hull gearcase. The horsepower rating stays at 60. What changes is the gearcase under the powerhead, a larger-diameter torpedo, larger gears, and a high-thrust prop with more blade area. The motor turns a lower gear ratio, which means each prop revolution moves more water.",
            'The larger gearcase and propeller options may improve loaded acceleration and low-speed control. The exact planing time, top speed, trim behaviour, and cruise result depend on the actual hull, load, engine height, and selected propeller, so this scenario does not assign a guaranteed improvement.',
            'Staying within the capacity-plate rating is mandatory. Command Thrust is a gearcase choice within the same horsepower rating, not a substitute for confirming that the complete motor and boat combination is approved.',
          ],
        },
        {
          heading: 'What did the job involve?',
          paragraphs: [
            "A standard-to-Command-Thrust swap is mostly a propeller and gearcase change in terms of customer-visible difference, but it's a full motor swap under the cowl. We confirm the transom plate rating (the 60 HP cap stays valid), pull the old 60, inspect the transom and bracket, and mount the new Command Thrust 60 with new bolts. New controls and cables go in to match Mercury's current specs.",
            'Propeller selection is boat-specific. HBW would choose the correct Command Thrust propeller family and verify loaded WOT RPM, acceleration, steering, and trim on the actual boat rather than prescribing a generic pitch range.',
            "Water test on Rice Lake confirms WOT, hole shot, gauge function, and trim behaviour. Pickup-only at Gores Landing, we don't ship or deliver. See our repower process for the full sequence.",
          ],
        },
        {
          heading: 'What did it cost?',
          paragraphs: [
            'Use the pricing reference for the current bare-motor price. The installed quote depends on controls, propeller, removal, fuel-system condition, steering, engine height, and any rigging that can be reused. Any trade value is assessed separately after the existing motor is identified and inspected.',
            'HBW can arrange financing through DealerPlan and Canadian lenders on eligible purchases of $5,000 or more at the current {{LIVE_RATE}} promotional APR through Dec 31, 2026 (OAC). The financed quote includes the $349 DealerPlan documentation fee where applicable and discloses the contract term, amortization, and any balance due at maturity. A $500 deposit holds the order.',
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
            'Sometimes a different horsepower is worth comparing, but the capacity plate is the hard ceiling. Command Thrust is one gearcase option at the rated 60 HP; HBW confirms the actual boat and load before recommending it.',
        },
        {
          question: 'How long does the repower take?',
          answer:
            "Two clocks. Your boat is with us for 2 to 5 days, drop-off to pickup, for a Mercury-to-Mercury swap on a clean transom. Motor lead time is separate: in-stock motors ship immediately, special orders wait at Mercury (the wait depends on the model and current Mercury availability), and your boat stays with you until the motor arrives. Pickup-only at Gores Landing.",
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
      'An illustrative 23-foot cabin-boat scenario evaluating whether twin 115 HP outboards can be replaced with one 300 HP V8.',
    scenario: 'Twin-to-single big-block consolidation',
    boatType: '23-foot cabin / walkaround',
    region: 'Rice Lake / Trent system',
    beforeMotor: 'Twin 115 HP FourStrokes (~25 years old)',
    afterMotor: 'Single Mercury 300 HP V8 Verado or Pro XS 4.6L',
    hpJump: 'Twin 115 → single 300',
    heroImage: '/lovable-uploads/case-study-twin-to-single-big-block-hero-v3.png',
    customerQuote:
      'A twin-to-single conversion can reduce component count, but only if the hull, transom, balance, handling, and redundancy requirements support it.',
    recommendation:
      'Consider only after the boat manufacturer or qualified technical review confirms single-engine rating, transom loading, balance, steering, controls, handling, and redundancy requirements.',
    whyItWorked: [
      'One motor reduces the number of engine-specific service items',
      'Fuel use must be measured on the actual hull and operating point',
      'Single-engine controls are simpler, while twin-engine manoeuvring and get-home redundancy are lost',
    ],
    isIllustrative: true,
    quoteUrl: '/quote/motor-selection?caseStudy=CS12',
    longForm: {
      cleanTitle: 'Twin 115 to Single 300 V8 Consolidation',
      canonical: 'https://www.mercuryrepower.ca/case-studies/twin-to-single-big-block',
      metaDescription:
        'Illustrative 23-foot cabin-boat scenario evaluating a change from twin 115 HP outboards to one Mercury 300 HP V8.',
      h1: 'Twin 115 to Single 300 V8 Consolidation on a 23-foot Cabin Boat',
      lastReviewed: '2026-07-18',
      quickAnswer:
        'Replacing twin 115 HP outboards with one 300 HP V8 is a major naval-architecture and rigging decision, not a simple horsepower swap. This illustrative scenario shows the questions to ask. HBW must confirm the hull rating, transom, weight and balance, redundancy needs, steering, controls, propeller, and current written quote.',
      intro:
        "This illustrative scenario evaluates consolidating twin 115 HP FourStrokes into one Mercury 300 HP V8 on a 23-foot cabin or walkaround boat. The change can reduce maintenance and helm complexity, but it also changes weight distribution, low-speed handling, redundancy, steering, controls, and transom loading. HBW confirms manufacturer limits and the full configuration before treating it as a viable repower path.",
      keyFacts: [
        'Old setup: twin 115 HP FourStrokes, about 25 years old',
        'New setup: single Mercury 300 HP V8 Verado or Pro XS 4.6L',
        'Boat: 23-foot cabin / walkaround',
        'Pricing: written quote after hull, transom, controls, steering, and motor selection are confirmed',
        'Motor lead time and install schedule: confirmed for the selected Pro XS or special-order Verado configuration',
        'Fuel economy: no generic percentage; compare the measured twin baseline with the proposed single-engine setup',
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
            'The comparison has four parts: service component count, measured fuel use, low-speed handling, and redundancy.',
            'One motor reduces the number of engine-specific filters, plugs, fluids, water pumps, and control components, but a complete maintenance-cost comparison needs the exact old and proposed engines.',
            'Fuel use cannot be assigned a generic improvement. Hull attitude, propeller efficiency, engine loading, cruise speed, wind, water, and total weight all affect the result, so the existing boat needs a measured baseline.',
            'A single throttle and one engine network simplify the helm, but twin engines can provide different low-speed manoeuvring options. The new handling characteristics need to be assessed, not assumed.',
            'The major trade-off is loss of get-home engine redundancy. The owner must evaluate operating area, towing access, and risk tolerance before treating a single-engine conversion as acceptable.',
          ],
        },
        {
          heading: 'What did the job involve?',
          paragraphs: [
            'A twin-to-single is one of the bigger jobs we do. We start with a transom inspection, twin bolt patterns leave eight holes that need to be addressed, sometimes filled and sometimes left for hardware reuse depending on where the single mounts. The center bridge between the twin pockets often needs reinforcement to handle the torque of a single V8 in the middle. This is shop work, not a one-day install.',
            "The proposed motor requires matched Mercury controls, steering, fuel routing, electrical work, gauges, and a boat-specific propeller. HBW would verify loaded WOT RPM, steering, trim, acceleration, and low-speed handling on the completed boat.",
            "Motor availability, transom engineering or repair, and installation timing are confirmed in the written quote. Verado is special-order. Pickup is at Gores Landing; HBW does not ship or deliver outboards.",
          ],
        },
        {
          heading: 'What did it cost?',
          paragraphs: [
            'The current bare-motor price is only one part of this project. The written quote depends on the selected 300 HP model, steering, controls, transom work, electrical changes, propeller, removal of two motors, and water testing. Verado availability is special-order; Pro XS availability is confirmed at quote time.',
            'Trade-in on two 25-year-old 115 FourStrokes depends heavily on condition, clean, running motors with reasonable hours can take meaningful dollars off. Fill the trade-in form and we usually email a CAD figure within one business day.',
            'HBW can arrange financing through DealerPlan and Canadian lenders on eligible purchases of $5,000 or more at the current {{LIVE_RATE}} promotional APR through Dec 31, 2026 (OAC). The financed quote includes the $349 DealerPlan documentation fee where applicable and discloses the contract term, amortization, and any balance due at maturity. A $1,000 deposit holds the order.',
          ],
        },
      ],
      faqs: [
        {
          question: 'Why go from twin to single?',
          answer:
            'Potential advantages are fewer engine-specific service components and a simpler single-engine control network. Potential disadvantages are changed low-speed handling and loss of get-home engine redundancy. Fuel use and suitability must be evaluated on the actual hull; inland use alone does not make the conversion automatically appropriate.',
        },
        {
          question: 'Do I need to modify the transom for single-engine conversion?',
          answer:
            'Often yes. Twin transoms have two bolt patterns and a center bridge between them. We may need to fill the unused bolt holes, reinforce the center skin, and re-rig steering and controls for a single. This is included in the quote. We inspect the transom carefully before final quote.',
        },
        {
          question: 'Can I trade in both old 115s?',
          answer:
            'Yes. We take Mercury outboard trade-ins, and 25-year-old 115 FourStrokes still carry some core value depending on condition. Fill the trade-in form with details on both motors and we usually email a combined CAD figure within one business day.',
        },
        {
          question: 'How long does a twin-to-single conversion take?',
          answer:
            'Timing depends on current motor availability, the selected Pro XS or special-order Verado configuration, engineering or transom work, controls, steering, rigging, and water testing. HBW confirms both the motor lead time and the boat schedule in the written quote. Pickup is at Gores Landing.',
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
