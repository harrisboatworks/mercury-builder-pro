// Comprehensive Mercury Marine specifications database
// Official specs from Mercury Marine for all HP ranges

export interface MercurySpecs {
  hp: number;
  family: string;
  description: string;
  features: string[];
  specifications: {
    displacement?: string;
    cylinders?: number;
    boreStroke?: string;
    fuelSystem?: string;
    startingType?: string;
    weight?: string;
    shaftLengths?: string[];
    gearRatio?: string;
    fuelTankCapacity?: string;
    oilCapacity?: string;
    alternatorOutput?: string;
    recommendedFuel?: string;
    propShaftHorsepower?: string;
    fullThrottleRPM?: string;
    steeringType?: string;
    trimSystem?: string;
  };
  bestFor: string[];
  url: string;
}

export const mercurySpecsDatabase: Record<string, MercurySpecs> = {
  // Portable FourStrokes (2.5-20 HP)
  "2.5": {
    hp: 2.5,
    family: "FourStroke Portable",
    description: "The Mercury 2.5hp FourStroke is the perfect lightweight auxiliary or tender motor. Compact, quiet, and fuel-efficient, it's ideal for dinghies, inflatables, and small utility boats.",
    features: [
      "Lightweight at just 37 lbs (17 kg)",
      "Integral fuel tank - no external tank needed",
      "Forward-Neutral-Reverse gear shift",
      "Automatic decompression for easy starting",
      "360° steering for easy maneuvering",
      "Shallow water drive capability"
    ],
    specifications: {
      displacement: "85cc",
      cylinders: 1,
      boreStroke: "56 x 34.5mm",
      fuelSystem: "Single carburetor",
      startingType: "Manual",
      weight: "37 lbs (17 kg)",
      shaftLengths: ["15\""],
      gearRatio: "2.15:1",
      fuelTankCapacity: "0.26 gal (1L) integral",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "4500-5500"
    },
    bestFor: ["Dinghies", "Inflatables", "Sailboat auxiliaries", "Small tenders"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/2-5hp/"
  },

  "3.5": {
    hp: 3.5,
    family: "FourStroke Portable",
    description: "The Mercury 3.5hp FourStroke delivers reliable power in an ultra-portable package. Perfect for tenders, dinghies, and small jon boats where easy transport is essential.",
    features: [
      "Lightweight design at 38 lbs (17 kg)",
      "Integral fuel tank",
      "Forward-Neutral-Reverse shift",
      "Twist-grip throttle",
      "Shallow water drive",
      "Carry handle for easy transport"
    ],
    specifications: {
      displacement: "85cc",
      cylinders: 1,
      boreStroke: "56 x 34.5mm",
      fuelSystem: "Single carburetor",
      startingType: "Manual",
      weight: "38 lbs (17 kg)",
      shaftLengths: ["15\""],
      gearRatio: "2.15:1",
      fuelTankCapacity: "0.26 gal (1L) integral",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "4500-5500"
    },
    bestFor: ["Tenders", "Dinghies", "Small jon boats", "Inflatables"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/3-5hp/"
  },

  "4": {
    hp: 4,
    family: "FourStroke Portable",
    description: "The Mercury 4hp FourStroke offers more power while maintaining excellent portability. Ideal for small boats, canoes with motor mounts, and lightweight tenders.",
    features: [
      "Reliable four-stroke power",
      "Multi-function tiller handle",
      "Integral fuel tank with external tank option",
      "Shallow water drive",
      "Forward-Neutral-Reverse shift",
      "Fuel efficient operation"
    ],
    specifications: {
      displacement: "123cc",
      cylinders: 1,
      boreStroke: "59 x 45mm",
      fuelSystem: "Single carburetor",
      startingType: "Manual",
      weight: "57 lbs (26 kg)",
      shaftLengths: ["15\"", "20\""],
      gearRatio: "2.08:1",
      fuelTankCapacity: "0.26 gal integral + external option",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "4500-5500"
    },
    bestFor: ["Small boats", "Canoes", "Lightweight tenders", "Inflatables"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/4hp-6hp/"
  },

  "5": {
    hp: 5,
    family: "FourStroke Portable",
    description: "The Mercury 5hp FourStroke provides reliable power for small boats and tenders. Its lightweight design and fuel efficiency make it perfect for daily use.",
    features: [
      "Lightweight portable design",
      "Multi-function tiller",
      "External fuel tank compatible",
      "Shallow water drive",
      "Fuel efficient four-stroke",
      "Easy to transport"
    ],
    specifications: {
      displacement: "123cc",
      cylinders: 1,
      boreStroke: "59 x 45mm",
      fuelSystem: "Single carburetor",
      startingType: "Manual",
      weight: "57 lbs (26 kg)",
      shaftLengths: ["15\"", "20\""],
      gearRatio: "2.08:1",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "4500-6000"
    },
    bestFor: ["Small boats", "Tenders", "Utility boats", "Lightweight craft"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/4hp-6hp/"
  },

  "6": {
    hp: 6,
    family: "FourStroke Portable",
    description: "The Mercury 6hp FourStroke is the top of the portable range, offering excellent power-to-weight ratio. Perfect for larger tenders and small fishing boats.",
    features: [
      "Best-in-class power-to-weight",
      "Multi-function tiller handle",
      "External fuel tank compatible",
      "Shallow water drive",
      "Reliable starting",
      "Quiet operation"
    ],
    specifications: {
      displacement: "123cc",
      cylinders: 1,
      boreStroke: "59 x 45mm",
      fuelSystem: "Single carburetor",
      startingType: "Manual",
      weight: "57 lbs (26 kg)",
      shaftLengths: ["15\"", "20\""],
      gearRatio: "2.08:1",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "5000-6000"
    },
    bestFor: ["Larger tenders", "Small fishing boats", "Utility boats"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/4hp-6hp/"
  },

  "8": {
    hp: 8,
    family: "FourStroke Portable",
    description: "The Mercury 8hp FourStroke delivers reliable mid-range power in a portable package. Great for small fishing boats, utility boats, and larger inflatables.",
    features: [
      "Portable yet powerful",
      "Multi-function tiller",
      "Electric start available",
      "Shallow water drive",
      "Under-cowl fuel tank option",
      "Front-mounted shift lever"
    ],
    specifications: {
      displacement: "209cc",
      cylinders: 2,
      boreStroke: "55 x 44mm",
      fuelSystem: "Two carburetors",
      startingType: "Manual/Electric",
      weight: "84 lbs (38 kg)",
      shaftLengths: ["15\"", "20\""],
      gearRatio: "2.08:1",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "5000-6000"
    },
    bestFor: ["Small fishing boats", "Utility boats", "Large inflatables", "Jon boats"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/8hp-9-9hp/"
  },

  "9.9": {
    hp: 9.9,
    family: "FourStroke",
    description: "The Mercury 9.9hp FourStroke is legendary for reliability and versatility. Perfect as a primary motor for small boats or as a kicker motor for larger vessels.",
    features: [
      "Legendary reliability",
      "Electric start available",
      "Power Tilt available",
      "Multi-function tiller",
      "Shallow water drive",
      "Compatible with EFI models"
    ],
    specifications: {
      displacement: "209cc",
      cylinders: 2,
      boreStroke: "55 x 44mm",
      fuelSystem: "Two carburetors/EFI",
      startingType: "Manual/Electric",
      weight: "88 lbs (40 kg)",
      shaftLengths: ["15\"", "20\"", "25\""],
      gearRatio: "2.08:1",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "5000-6000"
    },
    bestFor: ["Small fishing boats", "Kicker motors", "Pontoons", "Sailboats"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/8hp-9-9hp/"
  },

  "9.9 ProKicker": {
    hp: 9.9,
    family: "ProKicker",
    description: "The Mercury 9.9 ProKicker is purpose-built as a trolling motor. Features specialized gear ratios and propellers optimized for slow-speed trolling and precise boat control.",
    features: [
      "Purpose-built for trolling",
      "High-thrust propeller",
      "Extra-low gear ratio for control",
      "Big Tiller compatible",
      "Electric start standard",
      "Power Tilt available"
    ],
    specifications: {
      displacement: "209cc",
      cylinders: 2,
      boreStroke: "55 x 44mm",
      fuelSystem: "EFI",
      startingType: "Electric",
      weight: "99 lbs (45 kg)",
      shaftLengths: ["20\"", "25\""],
      gearRatio: "2.42:1 (trolling optimized)",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "5000-5500"
    },
    bestFor: ["Trolling", "Kicker motor", "Salmon fishing", "Walleye fishing"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/prokicker/9-9hp/"
  },

  "15": {
    hp: 15,
    family: "FourStroke",
    description: "The Mercury 15hp FourStroke offers excellent power for small to mid-size boats. Available in tiller and remote configurations with EFI for reliable starts.",
    features: [
      "Electronic Fuel Injection",
      "Electric start available",
      "Power Trim available",
      "Tiller or remote control",
      "Shallow water drive",
      "Lightweight design"
    ],
    specifications: {
      displacement: "333cc",
      cylinders: 2,
      boreStroke: "62 x 55mm",
      fuelSystem: "EFI",
      startingType: "Manual/Electric",
      weight: "99 lbs (45 kg)",
      shaftLengths: ["15\"", "20\""],
      gearRatio: "1.92:1",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "5000-6000"
    },
    bestFor: ["Small fishing boats", "Jon boats", "Utility boats", "Tenders"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/15hp-20hp/"
  },

  "20": {
    hp: 20,
    family: "FourStroke",
    description: "The Mercury 20hp FourStroke delivers strong mid-range performance with EFI reliability. Perfect for aluminum fishing boats, pontoons, and utility vessels.",
    features: [
      "Electronic Fuel Injection",
      "Electric start standard",
      "Power Trim & Tilt",
      "Tiller or remote control",
      "Lightweight yet powerful",
      "Quiet operation"
    ],
    specifications: {
      displacement: "333cc",
      cylinders: 2,
      boreStroke: "62 x 55mm",
      fuelSystem: "EFI",
      startingType: "Manual/Electric",
      weight: "103 lbs (47 kg)",
      shaftLengths: ["15\"", "20\""],
      gearRatio: "1.92:1",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "5500-6000"
    },
    bestFor: ["Aluminum fishing boats", "Pontoons", "Utility boats", "Jon boats"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/15hp-20hp/"
  },

  "25": {
    hp: 25,
    family: "FourStroke",
    description: "The Mercury 25hp FourStroke brings big motor features to a compact package. EFI, electric start, and power trim make this an excellent choice for mid-size boats.",
    features: [
      "Electronic Fuel Injection",
      "Electric start",
      "Power Trim & Tilt",
      "Big Tiller option",
      "SmartCraft compatible",
      "Fuel efficient"
    ],
    specifications: {
      displacement: "526cc",
      cylinders: 3,
      boreStroke: "62 x 58mm",
      fuelSystem: "EFI",
      startingType: "Electric",
      weight: "139 lbs (63 kg)",
      shaftLengths: ["15\"", "20\""],
      gearRatio: "1.92:1",
      alternatorOutput: "18 amp",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "5500-6000"
    },
    bestFor: ["Aluminum fishing boats", "Pontoons", "Carolina Skiffs", "Center consoles"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/25hp-30hp/"
  },

  "30": {
    hp: 30,
    family: "FourStroke",
    description: "The Mercury 30hp FourStroke offers excellent power and efficiency for mid-size boats. Three-cylinder smoothness with EFI reliability.",
    features: [
      "Three-cylinder smoothness",
      "Electronic Fuel Injection",
      "Power Trim & Tilt",
      "SmartCraft compatible",
      "Tiller or remote",
      "Command Thrust option"
    ],
    specifications: {
      displacement: "526cc",
      cylinders: 3,
      boreStroke: "62 x 58mm",
      fuelSystem: "EFI",
      startingType: "Electric",
      weight: "150 lbs (68 kg)",
      shaftLengths: ["15\"", "20\""],
      gearRatio: "1.92:1",
      alternatorOutput: "18 amp",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "5500-6000"
    },
    bestFor: ["Aluminum boats", "Pontoons", "Bay boats", "Utility vessels"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/25hp-30hp/"
  },

  "40": {
    hp: 40,
    family: "FourStroke",
    description: "The Mercury 40hp FourStroke delivers powerful, efficient performance. Three-cylinder design with EFI provides smooth, reliable power for a wide range of boats.",
    features: [
      "Three-cylinder EFI",
      "Power Trim & Tilt",
      "SmartCraft compatible",
      "Command Thrust available",
      "Tiller or remote",
      "Big Tiller option"
    ],
    specifications: {
      displacement: "747cc",
      cylinders: 3,
      boreStroke: "68 x 68.6mm",
      fuelSystem: "EFI",
      startingType: "Electric",
      weight: "229 lbs (104 kg)",
      shaftLengths: ["15\"", "20\""],
      gearRatio: "2.00:1",
      alternatorOutput: "18 amp",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "5500-6000"
    },
    bestFor: ["Pontoons", "Bay boats", "Aluminum fishing boats", "Skiffs"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/40hp-60hp/"
  },

  "50": {
    hp: 50,
    family: "FourStroke",
    description: "The Mercury 50hp FourStroke is a versatile mid-range powerhouse. Perfect for pontoons, bay boats, and utility vessels needing reliable performance.",
    features: [
      "Four-cylinder smoothness",
      "Electronic Fuel Injection",
      "Power Trim & Tilt",
      "SmartCraft gauges compatible",
      "Command Thrust option",
      "Quiet operation"
    ],
    specifications: {
      displacement: "995cc",
      cylinders: 4,
      boreStroke: "68 x 68.6mm",
      fuelSystem: "EFI",
      startingType: "Electric",
      weight: "240 lbs (109 kg)",
      shaftLengths: ["15\"", "20\""],
      gearRatio: "2.00:1",
      alternatorOutput: "18 amp",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "5500-6000"
    },
    bestFor: ["Pontoons", "Bay boats", "Utility boats", "Deck boats"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/40hp-60hp/"
  },

  "60": {
    hp: 60,
    family: "FourStroke",
    description: "The Mercury 60hp FourStroke offers excellent power-to-weight performance. Four-cylinder smoothness with Command Thrust option for enhanced handling.",
    features: [
      "Four-cylinder EFI",
      "Power Trim & Tilt",
      "SmartCraft compatible",
      "Command Thrust available",
      "Lightweight design",
      "Low emissions"
    ],
    specifications: {
      displacement: "995cc",
      cylinders: 4,
      boreStroke: "68 x 68.6mm",
      fuelSystem: "EFI",
      startingType: "Electric",
      weight: "247 lbs (112 kg)",
      shaftLengths: ["20\"", "25\""],
      gearRatio: "2.00:1",
      alternatorOutput: "18 amp",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "5500-6000"
    },
    bestFor: ["Pontoons", "Bass boats", "Bay boats", "Flats boats"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/40hp-60hp/"
  },

  "75": {
    hp: 75,
    family: "FourStroke",
    description: "The Mercury 75hp FourStroke provides strong mid-range performance with excellent fuel economy. Four-cylinder reliability in a compact package.",
    features: [
      "Four-cylinder smoothness",
      "Electronic Fuel Injection",
      "Power Trim & Tilt",
      "SmartCraft compatible",
      "Compact design",
      "Excellent fuel economy"
    ],
    specifications: {
      displacement: "1732cc",
      cylinders: 4,
      boreStroke: "82 x 82mm",
      fuelSystem: "EFI",
      startingType: "Electric",
      weight: "326 lbs (148 kg)",
      shaftLengths: ["20\"", "25\""],
      gearRatio: "2.07:1",
      alternatorOutput: "50 amp",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "5500-6000"
    },
    bestFor: ["Bass boats", "Bay boats", "Pontoons", "Center consoles"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/75hp-115hp/"
  },

  "90": {
    hp: 90,
    family: "FourStroke",
    description: "The Mercury 90hp FourStroke delivers strong performance with four-cylinder smoothness. Perfect for bass boats, pontoons, and bay boats.",
    features: [
      "Four-cylinder design",
      "Electronic Fuel Injection",
      "Power Trim & Tilt",
      "SmartCraft gauges",
      "50 amp charging",
      "Quiet operation"
    ],
    specifications: {
      displacement: "1732cc",
      cylinders: 4,
      boreStroke: "82 x 82mm",
      fuelSystem: "EFI",
      startingType: "Electric",
      weight: "326 lbs (148 kg)",
      shaftLengths: ["20\"", "25\""],
      gearRatio: "2.07:1",
      alternatorOutput: "50 amp",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "5500-6000"
    },
    bestFor: ["Bass boats", "Bay boats", "Pontoons", "Deck boats"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/75hp-115hp/"
  },

  "100": {
    hp: 100,
    family: "FourStroke",
    description: "The Mercury 100hp FourStroke Command Thrust offers enhanced low-speed handling. Perfect for heavy pontoons and boats requiring extra maneuverability.",
    features: [
      "Command Thrust gearcase",
      "Enhanced low-speed control",
      "Electronic Fuel Injection",
      "Power Trim & Tilt",
      "SmartCraft compatible",
      "50 amp alternator"
    ],
    specifications: {
      displacement: "1732cc",
      cylinders: 4,
      boreStroke: "82 x 82mm",
      fuelSystem: "EFI",
      startingType: "Electric",
      weight: "343 lbs (156 kg)",
      shaftLengths: ["20\"", "25\""],
      gearRatio: "2.38:1 (Command Thrust)",
      alternatorOutput: "50 amp",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "5500-6000"
    },
    bestFor: ["Heavy pontoons", "Houseboats", "Deck boats", "Multi-purpose boats"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/75hp-115hp/"
  },

  "115": {
    hp: 115,
    family: "FourStroke",
    description: "The Mercury 115hp FourStroke is the flagship of the four-cylinder lineup. Delivers excellent power, fuel economy, and reliability for a wide range of boats.",
    features: [
      "Four-cylinder powerhouse",
      "Electronic Fuel Injection",
      "Power Trim & Tilt",
      "SmartCraft compatible",
      "Command Thrust option",
      "Industry-leading fuel economy"
    ],
    specifications: {
      displacement: "2064cc",
      cylinders: 4,
      boreStroke: "84.3 x 92.4mm",
      fuelSystem: "EFI",
      startingType: "Electric",
      weight: "355 lbs (161 kg)",
      shaftLengths: ["20\"", "25\""],
      gearRatio: "2.07:1",
      alternatorOutput: "50 amp",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "5500-6000"
    },
    bestFor: ["Bass boats", "Bay boats", "Pontoons", "Center consoles", "Deck boats"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/75hp-115hp/"
  },

  "115 Pro XS": {
    hp: 115,
    family: "Pro XS",
    description: "The Mercury 115 Pro XS is built for tournament performance. Lighter weight, quicker acceleration, and higher top speed than standard models.",
    features: [
      "Lighter weight for speed",
      "Performance tuning",
      "Quicker acceleration",
      "Higher top speed",
      "Pro XS styling",
      "Tournament ready"
    ],
    specifications: {
      displacement: "2064cc",
      cylinders: 4,
      boreStroke: "84.3 x 92.4mm",
      fuelSystem: "EFI",
      startingType: "Electric",
      weight: "331 lbs (150 kg)",
      shaftLengths: ["20\"", "25\""],
      gearRatio: "2.07:1",
      alternatorOutput: "50 amp",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "5800-6400"
    },
    bestFor: ["Tournament bass boats", "Performance boats", "Racing"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/pro-xs/115hp/"
  },

  "150": {
    hp: 150,
    family: "FourStroke",
    description: "The Mercury 150hp FourStroke delivers V6-like performance in a four-cylinder package. Excellent power, fuel economy, and smooth operation.",
    features: [
      "Four-cylinder efficiency",
      "V6-like performance",
      "Electronic Fuel Injection",
      "Power Trim & Tilt",
      "SmartCraft compatible",
      "Joystick ready"
    ],
    specifications: {
      displacement: "3000cc",
      cylinders: 4,
      boreStroke: "91 x 115mm",
      fuelSystem: "EFI",
      startingType: "Electric",
      weight: "455 lbs (206 kg)",
      shaftLengths: ["20\"", "25\""],
      gearRatio: "1.85:1",
      alternatorOutput: "85 amp",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "5000-6000"
    },
    bestFor: ["Center consoles", "Bay boats", "Deck boats", "Multi-purpose boats"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/150hp/"
  },

  "150 Pro XS": {
    hp: 150,
    family: "Pro XS",
    description: "The Mercury 150 Pro XS is the tournament angler's choice. Performance tuned for maximum speed and acceleration.",
    features: [
      "Performance calibration",
      "Lighter components",
      "Higher top speed",
      "Quick acceleration",
      "Pro XS graphics",
      "Tournament proven"
    ],
    specifications: {
      displacement: "3000cc",
      cylinders: 4,
      boreStroke: "91 x 115mm",
      fuelSystem: "EFI",
      startingType: "Electric",
      weight: "455 lbs (206 kg)",
      shaftLengths: ["20\"", "25\""],
      gearRatio: "1.85:1",
      alternatorOutput: "85 amp",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "5200-6400"
    },
    bestFor: ["Tournament bass boats", "Performance boats", "Speed-oriented boaters"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/pro-xs/150hp/"
  },

  "175": {
    hp: 175,
    family: "FourStroke V6",
    description: "The Mercury 175hp V6 FourStroke delivers smooth, powerful performance with exceptional fuel economy. Perfect for larger bay boats and center consoles.",
    features: [
      "V6 power and smoothness",
      "Electronic Fuel Injection",
      "Advanced Range Optimization (ARO)",
      "SmartCraft compatible",
      "Power Trim & Tilt",
      "Joystick compatible"
    ],
    specifications: {
      displacement: "3400cc",
      cylinders: 6,
      boreStroke: "91 x 86.7mm",
      fuelSystem: "EFI",
      startingType: "Electric",
      weight: "527 lbs (239 kg)",
      shaftLengths: ["20\"", "25\""],
      gearRatio: "1.85:1",
      alternatorOutput: "85 amp",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "5000-6000"
    },
    bestFor: ["Center consoles", "Bay boats", "Larger pontoons", "Sport boats"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/175hp-225hp/"
  },

  "200": {
    hp: 200,
    family: "FourStroke V6",
    description: "The Mercury 200hp V6 FourStroke offers outstanding power and fuel efficiency. A popular choice for center consoles, bay boats, and performance pontoons.",
    features: [
      "V6 performance",
      "Electronic Fuel Injection",
      "Advanced Range Optimization",
      "SmartCraft digital throttle",
      "Power Trim & Tilt",
      "Joystick Piloting ready"
    ],
    specifications: {
      displacement: "3400cc",
      cylinders: 6,
      boreStroke: "91 x 86.7mm",
      fuelSystem: "EFI",
      startingType: "Electric",
      weight: "527 lbs (239 kg)",
      shaftLengths: ["20\"", "25\"", "30\""],
      gearRatio: "1.85:1",
      alternatorOutput: "85 amp",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "5200-6000"
    },
    bestFor: ["Center consoles", "Bay boats", "Performance pontoons", "Sport boats"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/175hp-225hp/"
  },

  "225": {
    hp: 225,
    family: "FourStroke V6",
    description: "The Mercury 225hp V6 FourStroke is the flagship V6, delivering maximum power with excellent fuel economy. Ideal for offshore and performance applications.",
    features: [
      "V6 flagship power",
      "Electronic Fuel Injection",
      "Advanced Range Optimization",
      "Digital throttle & shift",
      "Joystick Piloting ready",
      "Transient Spark technology"
    ],
    specifications: {
      displacement: "3400cc",
      cylinders: 6,
      boreStroke: "91 x 86.7mm",
      fuelSystem: "EFI",
      startingType: "Electric",
      weight: "532 lbs (241 kg)",
      shaftLengths: ["20\"", "25\"", "30\""],
      gearRatio: "1.85:1",
      alternatorOutput: "85 amp",
      recommendedFuel: "Regular unleaded 87 octane",
      fullThrottleRPM: "5200-6000"
    },
    bestFor: ["Offshore boats", "Large center consoles", "Performance boats", "Sport fishing"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/fourstroke/175hp-225hp/"
  },

  "250": {
    hp: 250,
    family: "Verado",
    description: "The Mercury 250hp Verado is the ultimate in outboard technology. Supercharged V6 power with legendary Verado smoothness and refinement.",
    features: [
      "Supercharged performance",
      "Legendary Verado smoothness",
      "Digital throttle & shift",
      "Joystick Piloting ready",
      "Advanced Sound Control",
      "Adaptive Speed Control"
    ],
    specifications: {
      displacement: "2598cc",
      cylinders: 6,
      boreStroke: "84 x 78mm",
      fuelSystem: "Supercharged EFI",
      startingType: "Electric",
      weight: "607 lbs (275 kg)",
      shaftLengths: ["20\"", "25\"", "30\""],
      gearRatio: "1.85:1",
      alternatorOutput: "85 amp",
      recommendedFuel: "Premium unleaded 91+ octane",
      fullThrottleRPM: "5800-6400"
    },
    bestFor: ["Luxury boats", "Center consoles", "Offshore fishing", "Performance cruising"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/verado/250hp/"
  },

  "300": {
    hp: 300,
    family: "Verado",
    description: "The Mercury 300hp Verado delivers extraordinary power with incredible refinement. The supercharged V8 provides unmatched acceleration and top speed.",
    features: [
      "V8 supercharged power",
      "Unmatched smoothness",
      "Digital throttle & shift",
      "Joystick Piloting",
      "Active Trim",
      "Transient Spark technology"
    ],
    specifications: {
      displacement: "4598cc",
      cylinders: 8,
      boreStroke: "89 x 92.4mm",
      fuelSystem: "Supercharged EFI",
      startingType: "Electric",
      weight: "668 lbs (303 kg)",
      shaftLengths: ["20\"", "25\"", "30\""],
      gearRatio: "1.75:1",
      alternatorOutput: "85 amp",
      recommendedFuel: "Premium unleaded 91+ octane",
      fullThrottleRPM: "5800-6400"
    },
    bestFor: ["Offshore boats", "Large center consoles", "Multi-engine applications", "Performance boats"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/verado/300hp/"
  },

  "350": {
    hp: 350,
    family: "Verado",
    description: "The Mercury 350hp Verado is the pinnacle of outboard technology. V10 supercharged power with the smoothest, quietest operation available.",
    features: [
      "V10 supercharged engine",
      "Ultimate refinement",
      "Contra-rotating props",
      "Digital throttle & shift",
      "Joystick Piloting",
      "Skyhook digital anchor"
    ],
    specifications: {
      displacement: "5744cc",
      cylinders: 10,
      boreStroke: "89 x 92.4mm",
      fuelSystem: "Supercharged EFI",
      startingType: "Electric",
      weight: "771 lbs (350 kg)",
      shaftLengths: ["25\"", "30\""],
      gearRatio: "1.60:1",
      alternatorOutput: "115 amp",
      recommendedFuel: "Premium unleaded 91+ octane",
      fullThrottleRPM: "5800-6400"
    },
    bestFor: ["Large yachts", "Offshore fishing boats", "Performance boats", "Multi-engine applications"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/verado/350hp/"
  },

  "400": {
    hp: 400,
    family: "Verado",
    description: "The Mercury 400hp Verado is the most powerful outboard in the lineup. V10 supercharged performance for the ultimate in offshore and performance boating.",
    features: [
      "400hp from V10 supercharged",
      "Ultimate power",
      "Advanced Midsection",
      "Digital controls",
      "Joystick Piloting",
      "Contra-rotating props"
    ],
    specifications: {
      displacement: "5744cc",
      cylinders: 10,
      boreStroke: "89 x 92.4mm",
      fuelSystem: "Supercharged EFI",
      startingType: "Electric",
      weight: "771 lbs (350 kg)",
      shaftLengths: ["25\"", "30\""],
      gearRatio: "1.60:1",
      alternatorOutput: "115 amp",
      recommendedFuel: "Premium unleaded 91+ octane",
      fullThrottleRPM: "5800-6400"
    },
    bestFor: ["Large yachts", "Offshore performance", "High-speed boats", "Multi-engine applications"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/verado/400hp/"
  },

  "500": {
    hp: 500,
    family: "Verado",
    description: "The Mercury 500hp Verado is the ultimate outboard - the most powerful production outboard engine ever built. Quad-cam V8 power for extreme performance.",
    features: [
      "Most powerful outboard ever",
      "Quad-cam V8 design",
      "7.6L displacement",
      "Contra-rotating props",
      "Premium refinement",
      "Digital everything"
    ],
    specifications: {
      displacement: "7600cc",
      cylinders: 8,
      boreStroke: "110 x 100mm",
      fuelSystem: "Naturally aspirated EFI",
      startingType: "Electric",
      weight: "990 lbs (449 kg)",
      shaftLengths: ["25\"", "30\""],
      gearRatio: "1.50:1",
      alternatorOutput: "150 amp",
      recommendedFuel: "Premium unleaded 91+ octane",
      fullThrottleRPM: "5000-5600"
    },
    bestFor: ["Large center consoles", "Sportfishing yachts", "High-performance boats", "Multi-engine applications"],
    url: "https://www.mercurymarine.com/en/us/engines/outboard/verado/500hp/"
  }
};

// Helper function to find specs by HP and optional family
export function findMercurySpecs(hp: number, family?: string): MercurySpecs | null {
  // First try exact match with family
  if (family) {
    const familyLower = family.toLowerCase();
    for (const [key, specs] of Object.entries(mercurySpecsDatabase)) {
      if (specs.hp === hp && specs.family.toLowerCase().includes(familyLower)) {
        return specs;
      }
    }
  }
  
  // Try exact HP match
  const exactKey = hp.toString();
  if (mercurySpecsDatabase[exactKey]) {
    return mercurySpecsDatabase[exactKey];
  }
  
  // Search for HP match
  for (const specs of Object.values(mercurySpecsDatabase)) {
    if (specs.hp === hp) {
      return specs;
    }
  }
  
  return null;
}

// Get all available HP values
export function getAvailableHpValues(): number[] {
  const hpSet = new Set<number>();
  for (const specs of Object.values(mercurySpecsDatabase)) {
    hpSet.add(specs.hp);
  }
  return Array.from(hpSet).sort((a, b) => a - b);
}
