// Mercury Marine Product Knowledge Base
// Comprehensive product information for AI chatbot context

export const MERCURY_FAMILIES = {
  verado: {
    name: "Verado",
    tagline: "The pinnacle of outboard performance",
    description: "Mercury's flagship line featuring supercharged V8 and V10 engines with premium features like electro-hydraulic steering and Advanced Range Optimization.",
    key_tech: [
      "Supercharged 4-stroke powerhead",
      "Electro-hydraulic power steering",
      "Advanced Range Optimization (ARO)",
      "Integrated electric steering",
      "Advanced Sound Control",
      "Digital throttle & shift standard"
    ],
    best_for: "Offshore fishing, large pontoons (24ft+), performance boats, center consoles",
    hp_range: "175-400 HP",
    price_positioning: "Premium - highest quality and features",
    selling_points: [
      "Smoothest, quietest operation in class",
      "Best fuel economy at cruise speeds",
      "Industry-leading 5-year warranty",
      "Joystick piloting compatible"
    ]
  },
  pro_xs: {
    name: "Pro XS",
    tagline: "Born to run. Built to win.",
    description: "Tournament-proven performance outboards calibrated for maximum acceleration and top speed. The choice of professional anglers.",
    key_tech: [
      "ProXS performance calibration",
      "Torque Master II HD gearcase",
      "Transient Spark technology",
      "CMS (Competition Management System)",
      "Lightweight design",
      "Performance-tuned ECU"
    ],
    best_for: "Bass boats, tournament fishing, performance applications, hole shot priority",
    hp_range: "115-300 HP",
    price_positioning: "Performance premium over FourStroke",
    selling_points: [
      "Fastest acceleration in class",
      "Proven on tournament circuits",
      "Optimized for competition use",
      "Trophy-winning heritage"
    ]
  },
  fourstroke: {
    name: "FourStroke",
    tagline: "Legendary reliability meets everyday value",
    description: "Mercury's versatile workhorse line. Perfect balance of power, efficiency, and reliability for recreational boaters.",
    key_tech: [
      "Advanced 4-stroke design",
      "Single overhead cam (SOHC)",
      "Multi-port fuel injection",
      "SmartCraft compatible",
      "Large displacement",
      "60-amp alternator (on larger models)"
    ],
    best_for: "Family cruising, fishing, pontoons, aluminum boats, utility",
    hp_range: "2.5-150 HP",
    price_positioning: "Best value for recreational use",
    selling_points: [
      "Best-in-class fuel economy",
      "Whisper-quiet operation",
      "Low maintenance costs",
      "Excellent resale value"
    ]
  },
  seapro: {
    name: "SeaPro",
    tagline: "Commercial-grade durability",
    description: "Built for the demands of commercial operation. Heavy-duty components designed for maximum uptime and longevity.",
    key_tech: [
      "Heavy-duty gearcase",
      "Commercial-grade components",
      "Enhanced cooling system",
      "Hardened internal parts",
      "High-output alternator",
      "Extended maintenance intervals"
    ],
    best_for: "Commercial fishing, charter boats, workboats, rental fleets",
    hp_range: "75-300 HP",
    price_positioning: "Commercial value - built to last",
    selling_points: [
      "1000-hour service intervals",
      "Built for all-day, every-day use",
      "Lowest cost of ownership",
      "Commercial warranty available"
    ]
  },
  portable: {
    name: "Portable FourStroke",
    tagline: "Take the power with you",
    description: "Lightweight, easy-to-carry outboards perfect for small boats, tenders, and inflatables.",
    key_tech: [
      "Lightweight design",
      "Built-in fuel tank option",
      "Easy-start system",
      "Shallow water drive",
      "Tiller control",
      "Fold-down handle"
    ],
    best_for: "Dinghies, inflatables, jon boats, small aluminum boats, tenders",
    hp_range: "2.5-20 HP",
    price_positioning: "Affordable entry point",
    selling_points: [
      "Lightest in class",
      "Easy to transport and store",
      "Simple, reliable operation",
      "Low fuel consumption"
    ]
  }
};

export const MERCURY_TECHNOLOGIES = {
  smartcraft: {
    name: "SmartCraft",
    description: "Mercury's digital engine management and networking system. Provides real-time engine data, diagnostics, and vessel integration.",
    benefits: ["Real-time engine monitoring", "Digital gauges", "Fuel management", "Engine diagnostics", "Multi-engine sync"]
  },
  aro: {
    name: "Advanced Range Optimization (ARO)",
    description: "Intelligent fuel management that automatically adjusts fuel delivery for up to 15% better fuel economy at cruise speeds.",
    benefits: ["15% better fuel economy", "Extended range", "Automatic optimization", "No driver input needed"]
  },
  command_thrust: {
    name: "Command Thrust",
    description: "Larger gearcase with higher gear ratio delivers more thrust at lower RPM. Ideal for heavy boats and pontoons.",
    benefits: ["Better hole shot with heavy loads", "Improved low-speed thrust", "Better pontoon performance", "Easier planing"]
  },
  dts: {
    name: "Digital Throttle & Shift (DTS)",
    description: "Electronic throttle and shift control for smooth, precise operation. Eliminates mechanical cables.",
    benefits: ["Smooth, effortless shifting", "No cable maintenance", "Precise control", "Required for joystick piloting"]
  },
  joystick_piloting: {
    name: "Joystick Piloting",
    description: "Intuitive boat control with a single joystick. Move the boat in any direction with fingertip control.",
    benefits: ["Easy docking", "360-degree control", "Reduced learning curve", "Available on Verado"]
  },
  active_trim: {
    name: "Active Trim",
    description: "Automatic trim adjustment based on speed and conditions. Set it and forget it.",
    benefits: ["Optimal performance automatically", "Better fuel economy", "Reduced driver fatigue", "Consistent ride"]
  },
  transient_spark: {
    name: "Transient Spark",
    description: "Aggressive spark timing during acceleration for faster hole shots and better throttle response.",
    benefits: ["Faster acceleration", "Better throttle response", "Competition-ready performance"]
  }
};

export const MERCURY_COMPARISONS = {
  verado_vs_fourstroke: {
    question: "Should I get a Verado or FourStroke?",
    answer: "It depends on your priorities. **Verado** is the premium choice with supercharged power, electric steering, and the smoothest operation - ideal for offshore, large boats, or if you want the best. **FourStroke** offers excellent reliability and value for recreational use - perfect for lakes, pontoons, and family boating. For most recreational boaters on Ontario lakes, the FourStroke is the sweet spot. If you're doing big water or want the ultimate experience, go Verado."
  },
  pro_xs_vs_fourstroke: {
    question: "Pro XS or regular FourStroke?",
    answer: "**Pro XS** is calibrated for maximum performance - faster hole shots, higher top speed, tournament-ready. Worth the premium if you're competitive fishing or want that extra edge. **FourStroke** is calibrated for everyday efficiency and smooth operation. For most recreational anglers, the FourStroke performs beautifully and saves money on fuel."
  },
  size_recommendations: {
    "under_14ft": { hp: "9.9-25", note: "Check your boat's max HP rating on the capacity plate" },
    "14-16ft": { hp: "25-60", note: "Sweet spot is usually 40-50HP for aluminum boats" },
    "16-18ft": { hp: "60-115", note: "90HP is very popular for this size range" },
    "18-20ft": { hp: "90-150", note: "115HP handles most applications well" },
    "20-22ft": { hp: "115-200", note: "Consider 150HP minimum for heavier boats" },
    "22-24ft": { hp: "150-250", note: "Pontoons often do great with 150-200HP" },
    "over_24ft": { hp: "200-400", note: "Offshore and large boats - Verado territory" }
  }
};

export const MOTOR_USE_CASES = {
  pontoon: {
    recommended: ["FourStroke 75-150", "Verado 150-250 for larger pontoons"],
    why: "Pontoons need torque for heavy loads. Command Thrust models excel here. 115HP is the most popular pontoon choice.",
    tips: "Consider 150HP if you have a triple-tube or often run with full passengers."
  },
  bass_boat: {
    recommended: ["Pro XS 115-250", "FourStroke 115-150"],
    why: "Bass boats need hole shot and top speed. Pro XS calibration gives you the edge in tournaments.",
    tips: "Jackplate mounting and proper prop selection are crucial for max performance."
  },
  aluminum_fishing: {
    recommended: ["FourStroke 40-115", "Pro XS 115 for performance"],
    why: "Aluminum boats are versatile - match HP to your typical use and passenger load.",
    tips: "Don't overpower - check capacity plate. 60-90HP is perfect for most 16-18ft aluminum boats."
  },
  offshore: {
    recommended: ["Verado 200-400", "SeaPro for charters"],
    why: "Reliability and power matter offshore. Verado's advanced features shine in demanding conditions.",
    tips: "Consider twin engines for safety. Joystick piloting makes docking much easier."
  },
  inflatable: {
    recommended: ["Portable 2.5-20", "FourStroke 25-40 for RIBs"],
    why: "Weight is critical. Mercury portables are the lightest in class.",
    tips: "Match HP to your RIB's rating. 15-20HP handles most yacht tenders well."
  }
};

// ========== REPOWER KNOWLEDGE ==========

// Comprehensive repower knowledge from Harris Boat Works Repower Guide
export const REPOWER_GUIDE = {
  key_stat: "70% of the benefit of a new boat for 30% of the cost",
  typical_price_range: "$8,000 - $18,000 for a 16-18ft boat with 60-115 HP, all-in",
  pricing_breakdown: {
    motor: "$1,500 - $35,000+ depending on HP",
    rigging_controls: "$1,500 - $4,000 depending on existing setup",
    installation: "$800 - $1,500 including lake test"
  },
  warning_signs: [
    "Hard starting or stalling",
    "Excessive smoke from exhaust",
    "Loss of power",
    "Frequent repairs adding up"
  ],
  one_more_season_trap: "Stop nursing an old motor. A new motor isn't just about reliability—it's about USING your boat instead of worrying about it.",
  winter_tip: "Best time to repower: Winter. First pick before spring rush, no wait for installation, ready for launch day.",
  modern_benefits: [
    "30-40% better fuel economy",
    "Quiet operation - hold a conversation at cruise",
    "No oil mixing",
    "Instant EFI starting every time",
    "Mercury SmartCraft technology"
  ],
  repower_page: "/repower"
};

// The 6 reasons customers repower (from Mercury Repower Report)
export const REPOWER_VALUE_PROPS = {
  reliability: {
    headline: "No more breakdowns",
    message: "Older engines lose reliability. A new Mercury means more time on the water, less time worrying.",
    stat: "Reliability is the #1 reason boaters repower"
  },
  technology: {
    headline: "Modern tech",
    message: "SmartCraft displays, VesselView, Active Trim, Digital Throttle & Shift — features that didn't exist when your boat was new.",
    stat: "Today's engines are smarter, smoother, and more connected"
  },
  maintenance: {
    headline: "Lower maintenance",
    message: "Old engines need frequent repairs. New Mercury engines cut those costs significantly with 100-hour service intervals.",
    stat: "Newer engines require less maintenance and fewer repairs"
  },
  warranty: {
    headline: "Fresh warranty",
    message: "Factory warranty up to 3 years, plus extended options up to 8 years total. Peace of mind included.",
    stat: "New engines come with comprehensive warranty protection"
  },
  love_your_boat: {
    headline: "Keep what you love",
    message: "Your boat is set up exactly how you like it — rigged for your style. Repowering keeps everything perfect, just upgrades the power.",
    stat: "Many boaters have deep emotional connections to their boats"
  },
  fuel_efficiency: {
    headline: "Save on fuel",
    message: "Modern 4-stroke tech saves 30-40% on fuel every trip. Better fuel economy = longer days on the water.",
    stat: "Fuel efficiency has improved dramatically in the last decade"
  }
};

// Real customer repower stories for AI to reference
export const CUSTOMER_STORIES = [
  {
    boat: "1977 Boston Whaler Revenge",
    motor: "200hp Pro XS V8",
    highlight: "Multigenerational family boat — now faster with modern tech and fuel efficiency",
    quote: "We've had this boat for decades. The new V8 brought it back to life."
  },
  {
    boat: "1999 Triton TR-21 Bass Boat",
    motor: "250hp Pro XS V8",
    highlight: "Went from mid-60s to 75 mph, plus VesselView and digital controls",
    quote: "The hole shot is unreal. Competition-ready performance."
  },
  {
    boat: "Regulator 23",
    motor: "250hp FourStroke V8",
    highlight: "90 lbs lighter than old motor, quieter, better top speed without losing fuel economy",
    quote: "Smoother, quieter, and we actually save on fuel. Win-win-win."
  },
  {
    boat: "21ft Pontoon",
    motor: "150hp FourStroke",
    highlight: "Replaced tired 115hp 2-stroke with modern 4-stroke for better performance and reliability",
    quote: "The family finally trusts the boat again. No more breakdowns."
  }
];

// Discovery questions for AI to ask customers considering repower
export const DISCOVERY_QUESTIONS = [
  "How old is your current engine?",
  "What's been giving you trouble with your current motor?",
  "Looking for more speed, better hole shot, or improved fuel economy?",
  "Interested in modern tech like digital controls and SmartCraft connectivity?",
  "Planning to keep your boat for a while?",
  "What do you use your boat for mostly — fishing, cruising, watersports?"
];

// SmartCraft technology benefits for sales conversations
export const SMARTCRAFT_BENEFITS = {
  vesselview: {
    name: "VesselView Mobile",
    benefit: "Connect your phone to see real-time engine data, fuel usage, and maintenance alerts",
    selling_point: "Know exactly what your engine is doing at all times"
  },
  active_trim: {
    name: "Active Trim",
    benefit: "Automatically adjusts trim for optimal performance — set it and forget it",
    selling_point: "Perfect trim at every speed without touching the button"
  },
  digital_throttle: {
    name: "Digital Throttle & Shift",
    benefit: "Butter-smooth, cable-free shifting with precise control",
    selling_point: "No cables to maintain, smoother than any mechanical system"
  },
  troll_control: {
    name: "Troll Control",
    benefit: "Dial in exact RPM in 10-increment adjustments for precise trolling speed",
    selling_point: "Perfect for anglers who need exact trolling speeds"
  }
};

// ========== SHAFT LENGTH GUIDE (CRITICAL CUSTOMER EDUCATION) ==========

export const SHAFT_LENGTH_GUIDE = {
  overview: {
    what_it_is: "Shaft length is the distance from the mounting bracket to the cavitation plate (anti-ventilation plate). It MUST match your boat's transom height.",
    why_critical: "Wrong shaft length causes serious problems - this isn't cosmetic, it's functional.",
    common_misconception: "Many customers think 'longer is safer' or 'I don't mind it deeper' - this is WRONG. Both too short AND too long cause real problems."
  },
  
  shaft_lengths: {
    short: { 
      code: "S", 
      inches: 15, 
      transom_range: "13-16 inches",
      typical_boats: "Small dinghies, inflatables, some aluminum boats",
      notes: "Least common - most small boats use long shaft now"
    },
    long: { 
      code: "L", 
      inches: 20, 
      transom_range: "17-21 inches",
      typical_boats: "Most aluminum fishing boats, bass boats, runabouts, small pontoons",
      notes: "Most popular size - fits majority of recreational boats"
    },
    extra_long: { 
      code: "XL", 
      inches: 25, 
      transom_range: "22-27 inches",
      typical_boats: "Deep-V hulls, offshore boats, larger pontoons, performance boats",
      notes: "Common for offshore and larger vessels"
    },
    extra_extra_long: { 
      code: "XXL", 
      inches: 30, 
      transom_range: "28+ inches",
      typical_boats: "High-performance offshore, tall transoms, jackplate applications",
      notes: "Specialty applications only"
    }
  },

  problems_too_short: {
    headline: "Motor Sits TOO HIGH - Serious Problems",
    issues: [
      "Propeller breaks water surface causing cavitation",
      "Loss of thrust and control",
      "Water intake ports above waterline = overheating risk",
      "Propeller and gearcase damage from running in air",
      "Dangerous in rough water - prop comes out of water"
    ],
    customer_experience: "The motor screams, you lose power, prop spins in air. Feels like the motor is slipping."
  },

  problems_too_long: {
    headline: "Motor Sits TOO LOW - Also Serious Problems",
    myth_to_bust: "'I don't mind it deeper' or 'longer is safer' - this is NOT OK!",
    issues: [
      "Exhaust underwater too deep = backpressure reduces performance",
      "Increased drag = slower top speed, worse fuel economy",
      "Steering becomes heavy and unresponsive",
      "Water pickup and cooling system issues at speed",
      "Anti-ventilation plate positioned wrong",
      "Motor works harder, runs hotter, wears faster",
      "Can't trim properly - always fighting the wrong height"
    ],
    customer_experience: "The boat feels sluggish, steering is heavy, you burn more fuel, and the motor works harder than it should. It's not 'fine' - it's costing you performance and motor life."
  },

  how_to_measure: {
    step1: "Find the center of your transom (back of boat)",
    step2: "Measure from the TOP of the transom straight down to the BOTTOM",
    step3: "This is your transom height - measure in inches",
    step4: "Match to the appropriate shaft length (see chart)",
    pro_tip: "If you're between sizes or unsure, bring the boat in or send photos. We'll help you get it right.",
    tool_reference: "Use the Transom Height Calculator on our website for guidance"
  },

  quick_reference: {
    "13-16 inches": "Short shaft (15\")",
    "17-21 inches": "Long shaft (20\") - most common",
    "22-27 inches": "Extra-long shaft (25\")",
    "28+ inches": "Extra-extra-long shaft (30\")"
  },

  sales_guidance: {
    when_customer_says_longer: "Never recommend a longer shaft 'to be safe.' If they're unsure, recommend they measure properly or bring the boat in. Wrong is wrong in either direction.",
    when_unsure: "If a customer doesn't know their transom height, don't guess. Have them measure or come in with the boat. Getting this wrong is a big problem.",
    key_message: "The shaft length isn't a preference - it's a specification. Match it correctly and the motor performs as designed. Get it wrong and you're fighting problems every time you go out."
  }
};

export function getMotorFamilyInfo(familyName: string): string {
  const normalizedName = familyName?.toLowerCase().replace(/[^a-z]/g, '') || '';
  
  if (normalizedName.includes('verado')) {
    const family = MERCURY_FAMILIES.verado;
    return `**${family.name}**: ${family.tagline}. ${family.description} Best for: ${family.best_for}`;
  }
  if (normalizedName.includes('proxs') || normalizedName.includes('pro xs')) {
    const family = MERCURY_FAMILIES.pro_xs;
    return `**${family.name}**: ${family.tagline}. ${family.description} Best for: ${family.best_for}`;
  }
  if (normalizedName.includes('seapro') || normalizedName.includes('sea pro')) {
    const family = MERCURY_FAMILIES.seapro;
    return `**${family.name}**: ${family.tagline}. ${family.description} Best for: ${family.best_for}`;
  }
  if (normalizedName.includes('fourstroke') || normalizedName.includes('four stroke')) {
    const family = MERCURY_FAMILIES.fourstroke;
    return `**${family.name}**: ${family.tagline}. ${family.description} Best for: ${family.best_for}`;
  }
  
  return '';
}

export function getHPRecommendation(boatLength: number): string {
  if (boatLength < 14) return MERCURY_COMPARISONS.size_recommendations["under_14ft"].hp + " HP - " + MERCURY_COMPARISONS.size_recommendations["under_14ft"].note;
  if (boatLength < 16) return MERCURY_COMPARISONS.size_recommendations["14-16ft"].hp + " HP - " + MERCURY_COMPARISONS.size_recommendations["14-16ft"].note;
  if (boatLength < 18) return MERCURY_COMPARISONS.size_recommendations["16-18ft"].hp + " HP - " + MERCURY_COMPARISONS.size_recommendations["16-18ft"].note;
  if (boatLength < 20) return MERCURY_COMPARISONS.size_recommendations["18-20ft"].hp + " HP - " + MERCURY_COMPARISONS.size_recommendations["18-20ft"].note;
  if (boatLength < 22) return MERCURY_COMPARISONS.size_recommendations["20-22ft"].hp + " HP - " + MERCURY_COMPARISONS.size_recommendations["20-22ft"].note;
  if (boatLength < 24) return MERCURY_COMPARISONS.size_recommendations["22-24ft"].hp + " HP - " + MERCURY_COMPARISONS.size_recommendations["22-24ft"].note;
  return MERCURY_COMPARISONS.size_recommendations["over_24ft"].hp + " HP - " + MERCURY_COMPARISONS.size_recommendations["over_24ft"].note;
}

// Get a random repower value prop for conversations
export function getRepowerValueProp(): { headline: string; message: string } {
  const props = Object.values(REPOWER_VALUE_PROPS);
  return props[Math.floor(Math.random() * props.length)];
}

// Get a customer story for social proof
export function getCustomerStory(): typeof CUSTOMER_STORIES[0] {
  return CUSTOMER_STORIES[Math.floor(Math.random() * CUSTOMER_STORIES.length)];
}

// Get shaft length recommendation from transom height
export function getShaftRecommendation(transomInches: number): { shaft: string; code: string; notes: string } {
  if (transomInches <= 16) {
    return { shaft: "Short (15\")", code: "S", notes: "For transoms 13-16 inches" };
  }
  if (transomInches <= 21) {
    return { shaft: "Long (20\")", code: "L", notes: "Most common - for transoms 17-21 inches" };
  }
  if (transomInches <= 27) {
    return { shaft: "Extra-Long (25\")", code: "XL", notes: "For transoms 22-27 inches" };
  }
  return { shaft: "Extra-Extra-Long (30\")", code: "XXL", notes: "For transoms 28+ inches" };
}
