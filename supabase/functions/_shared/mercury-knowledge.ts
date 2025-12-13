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
