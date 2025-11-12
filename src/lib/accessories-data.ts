export interface Accessory {
  id: string;
  name: string;
  category: 'propellers' | 'controls' | 'batteries' | 'maintenance';
  description: string;
  shortDescription: string;
  price: number | null; // null = "Call for Price"
  msrp?: number | null;
  imageUrl: string;
  imageGallery?: string[];
  specifications: {
    label: string;
    value: string;
  }[];
  features?: string[];
  compatibility?: string;
  inStock?: boolean;
  partNumber?: string;
}

export const ACCESSORY_CATEGORIES = {
  propellers: {
    name: 'Propellers',
    description: 'Premium Mercury propellers for optimal performance',
    icon: 'Waves' as const
  },
  controls: {
    name: 'Controls & Rigging',
    description: 'Precision controls and rigging systems',
    icon: 'Settings' as const
  },
  batteries: {
    name: 'Batteries & Electrical',
    description: 'Reliable power systems for your marine needs',
    icon: 'Battery' as const
  },
  maintenance: {
    name: 'Maintenance & Care',
    description: 'Keep your motor running at peak performance',
    icon: 'Wrench' as const
  }
} as const;

export const ACCESSORIES_DATA: Accessory[] = [
  // Propellers
  {
    id: 'prop-blackmax-13x17',
    name: 'BlackMax 13.25 x 17',
    category: 'propellers',
    shortDescription: 'High-performance aluminum propeller for recreational boating',
    description: 'Mercury BlackMax propeller delivers excellent acceleration and top speed for recreational boating. Features pressed-in rubber hub for vibration dampening and corrosion-resistant coating for long-lasting performance in freshwater and saltwater environments.',
    price: 285,
    imageUrl: '/placeholder.svg',
    specifications: [
      { label: 'Diameter', value: '13.25"' },
      { label: 'Pitch', value: '17"' },
      { label: 'Material', value: 'Aluminum' },
      { label: 'Blades', value: '3' },
      { label: 'Hub', value: 'Pressed-in rubber' }
    ],
    features: [
      'Excellent all-around performance',
      'Pressed-in rubber hub for vibration dampening',
      'Corrosion-resistant coating',
      'Perfect for recreational use'
    ],
    compatibility: '40-140 HP Mercury outboards',
    inStock: true,
    partNumber: '48-8M8026910'
  },
  {
    id: 'prop-vengeance-14x19',
    name: 'Vengeance 14 x 19',
    category: 'propellers',
    shortDescription: 'Premium stainless steel propeller for maximum performance',
    description: 'The Mercury Vengeance stainless steel propeller delivers maximum performance with its advanced blade design. Engineered for high-speed applications and demanding conditions, providing exceptional acceleration and top-end speed.',
    price: 685,
    msrp: 749,
    imageUrl: '/placeholder.svg',
    specifications: [
      { label: 'Diameter', value: '14"' },
      { label: 'Pitch', value: '19"' },
      { label: 'Material', value: 'Stainless Steel' },
      { label: 'Blades', value: '3' },
      { label: 'Cup', value: 'Aggressive' }
    ],
    features: [
      'Premium stainless steel construction',
      'Advanced blade geometry',
      'Superior corrosion resistance',
      'Enhanced fuel efficiency',
      'Reduced cavitation'
    ],
    compatibility: '75-150 HP Mercury outboards',
    inStock: true,
    partNumber: '48-8M8026021'
  },
  {
    id: 'prop-trophy-sport-13x15',
    name: 'Trophy Sport 13.6 x 15',
    category: 'propellers',
    shortDescription: 'Versatile propeller for pontoon boats and family cruising',
    description: 'Designed specifically for pontoon boats and family cruising applications. The Trophy Sport propeller provides smooth, quiet operation with excellent low-speed handling and comfortable cruising performance.',
    price: 245,
    imageUrl: '/placeholder.svg',
    specifications: [
      { label: 'Diameter', value: '13.6"' },
      { label: 'Pitch', value: '15"' },
      { label: 'Material', value: 'Aluminum' },
      { label: 'Blades', value: '3' },
      { label: 'Design', value: 'Wide blade' }
    ],
    features: [
      'Optimized for pontoon boats',
      'Smooth, quiet operation',
      'Excellent low-speed handling',
      'Affordable performance'
    ],
    compatibility: '25-75 HP Mercury outboards, pontoon applications',
    inStock: true,
    partNumber: '48-8M8027710'
  },

  // Controls
  {
    id: 'ctrl-digital-throttle-shift',
    name: 'Digital Throttle & Shift (DTS)',
    category: 'controls',
    shortDescription: 'Premium electronic control system for effortless operation',
    description: 'Mercury Digital Throttle & Shift provides fingertip control with electronic precision. Features comfortable ergonomic design, multiple function buttons, and seamless integration with Mercury SmartCraft systems for the ultimate control experience.',
    price: 1899,
    msrp: 2099,
    imageUrl: '/placeholder.svg',
    specifications: [
      { label: 'Type', value: 'Electronic' },
      { label: 'Functions', value: 'Throttle, Shift, Trim' },
      { label: 'Interface', value: 'SmartCraft' },
      { label: 'Mount', value: 'Side or Top' },
      { label: 'Color', value: 'Black with Chrome accents' }
    ],
    features: [
      'Fingertip electronic control',
      'Integrated trim switch',
      'SmartCraft compatible',
      'Programmable trolling function',
      'Premium ergonomic design',
      'Multiple mounting options'
    ],
    compatibility: 'Mercury Verado, OptiMax, and select FourStroke models with DTS',
    inStock: true,
    partNumber: '8M0075245'
  },
  {
    id: 'ctrl-gen-ii-single',
    name: 'Gen II Single Binnacle Control',
    category: 'controls',
    shortDescription: 'Classic mechanical control with smooth operation',
    description: 'Time-tested Gen II control provides reliable mechanical operation with smooth, precise shifting and throttle response. Features neutral safety lock and compatible with most Mercury outboards.',
    price: 489,
    imageUrl: '/placeholder.svg',
    specifications: [
      { label: 'Type', value: 'Mechanical' },
      { label: 'Configuration', value: 'Single Engine' },
      { label: 'Mount', value: 'Top Mount' },
      { label: 'Cable', value: 'Gen II Compatible' },
      { label: 'Safety', value: 'Neutral Lock' }
    ],
    features: [
      'Smooth mechanical operation',
      'Neutral safety lock',
      'Durable construction',
      'Easy installation',
      'Wide compatibility'
    ],
    compatibility: 'Most Mercury outboards 8 HP and above',
    inStock: true,
    partNumber: '881170A15'
  },
  {
    id: 'ctrl-steering-cable-15ft',
    name: 'NFB Rack Steering Cable 15ft',
    category: 'controls',
    shortDescription: 'Premium no-feedback steering cable for precise handling',
    description: 'Mercury No-Feedback (NFB) rack steering cable provides precise, responsive steering with reduced steering effort. Stainless steel construction with corrosion-resistant coating ensures long-lasting performance.',
    price: 325,
    imageUrl: '/placeholder.svg',
    specifications: [
      { label: 'Length', value: '15 feet' },
      { label: 'Type', value: 'NFB Rack' },
      { label: 'Material', value: 'Stainless Steel' },
      { label: 'Ends', value: 'Threaded' },
      { label: 'Coating', value: 'Corrosion-resistant' }
    ],
    features: [
      'No-feedback design',
      'Reduced steering effort',
      'Stainless steel construction',
      'Smooth operation',
      'Long-lasting durability'
    ],
    compatibility: 'Mercury outboards with rack steering systems',
    inStock: true,
    partNumber: '865436A15'
  },
  {
    id: 'ctrl-trim-gauge-smartcraft',
    name: 'SmartCraft Trim Gauge',
    category: 'controls',
    shortDescription: 'Digital trim angle indicator for optimal performance',
    description: 'SmartCraft digital trim gauge provides real-time trim angle information for optimal boat performance and fuel efficiency. Easy-to-read display with backlight for nighttime operation.',
    price: 189,
    imageUrl: '/placeholder.svg',
    specifications: [
      { label: 'Display', value: '2" Digital' },
      { label: 'Type', value: 'SmartCraft' },
      { label: 'Range', value: '0-100%' },
      { label: 'Backlight', value: 'Yes' },
      { label: 'Mount', value: 'Dash' }
    ],
    features: [
      'Real-time trim display',
      'Easy-to-read digital readout',
      'Backlit for night operation',
      'SmartCraft network compatible',
      'Precision accuracy'
    ],
    compatibility: 'Mercury outboards with SmartCraft',
    inStock: true,
    partNumber: '79-8M0135641'
  },

  // Batteries
  {
    id: 'batt-marine-cranking-group24',
    name: 'Mercury Marine Cranking Battery - Group 24',
    category: 'batteries',
    shortDescription: 'High-performance starting battery with 850 CCA',
    description: 'Mercury marine cranking battery delivers reliable starting power in all conditions. Features maintenance-free design, vibration resistance, and superior cold-cranking performance for dependable starts.',
    price: 199,
    imageUrl: '/placeholder.svg',
    specifications: [
      { label: 'Group Size', value: '24' },
      { label: 'CCA', value: '850A' },
      { label: 'Capacity', value: '75 Ah' },
      { label: 'Type', value: 'AGM' },
      { label: 'Warranty', value: '3 Years' }
    ],
    features: [
      'Maintenance-free AGM technology',
      'High cold-cranking amps',
      'Vibration resistant',
      'Spill-proof design',
      'Long service life'
    ],
    compatibility: 'Universal marine applications',
    inStock: true,
    partNumber: '8M0094923'
  },
  {
    id: 'batt-dual-purpose-group27',
    name: 'Mercury Dual Purpose Battery - Group 27',
    category: 'batteries',
    shortDescription: 'Versatile battery for starting and accessory power',
    description: 'Dual-purpose marine battery provides both starting power and deep-cycle capability for running accessories. Perfect for boats with moderate electrical loads requiring both cranking and house power.',
    price: 249,
    imageUrl: '/placeholder.svg',
    specifications: [
      { label: 'Group Size', value: '27' },
      { label: 'CCA', value: '750A' },
      { label: 'Capacity', value: '105 Ah' },
      { label: 'Type', value: 'AGM Dual Purpose' },
      { label: 'Warranty', value: '3 Years' }
    ],
    features: [
      'Starting and deep-cycle capable',
      'Maintenance-free design',
      'Excellent reserve capacity',
      'Vibration resistant',
      'Versatile application'
    ],
    compatibility: 'Universal marine applications',
    inStock: true,
    partNumber: '8M0094924'
  },
  {
    id: 'batt-charger-10amp',
    name: 'Mercury Marine Battery Charger 10A',
    category: 'batteries',
    shortDescription: 'Smart charger for optimal battery maintenance',
    description: 'Intelligent 10-amp battery charger automatically maintains and conditions your marine batteries. Features multi-stage charging, spark-proof connections, and weatherproof construction for dock or garage use.',
    price: 149,
    imageUrl: '/placeholder.svg',
    specifications: [
      { label: 'Output', value: '10 Amps' },
      { label: 'Voltage', value: '12V' },
      { label: 'Stages', value: 'Multi-stage' },
      { label: 'Protection', value: 'Weatherproof' },
      { label: 'Features', value: 'Auto maintain' }
    ],
    features: [
      'Multi-stage charging algorithm',
      'Automatic maintenance mode',
      'Spark-proof connections',
      'Weatherproof housing',
      'LED status indicators'
    ],
    compatibility: '12V lead-acid and AGM batteries',
    inStock: true,
    partNumber: '8M0146025'
  },

  // Maintenance
  {
    id: 'maint-25w40-oil-case',
    name: 'Mercury 25W-40 4-Stroke Oil (Case of 12)',
    category: 'maintenance',
    shortDescription: 'Premium synthetic blend oil for Mercury FourStroke outboards',
    description: 'Mercury 25W-40 synthetic blend oil is specifically formulated for Mercury FourStroke outboards. Provides superior protection in all operating conditions with advanced additive technology.',
    price: 189,
    imageUrl: '/placeholder.svg',
    specifications: [
      { label: 'Viscosity', value: '25W-40' },
      { label: 'Type', value: 'Synthetic Blend' },
      { label: 'Quantity', value: 'Case of 12 quarts' },
      { label: 'Certification', value: 'FC-W' },
      { label: 'Color', value: 'Amber' }
    ],
    features: [
      'Formulated specifically for Mercury',
      'Superior engine protection',
      'All-season performance',
      'Extended oil life',
      'Bulk case pricing'
    ],
    compatibility: 'All Mercury FourStroke outboards',
    inStock: true,
    partNumber: '92-858064K12'
  },
  {
    id: 'maint-premium-plus-gear-lube',
    name: 'Mercury Premium Plus Gear Lube',
    category: 'maintenance',
    shortDescription: 'High-performance gear oil for lower unit protection',
    description: 'Premium gear lubricant designed specifically for Mercury outboard lower units. Provides exceptional wear protection, prevents corrosion, and maintains proper viscosity in all operating temperatures.',
    price: 24,
    imageUrl: '/placeholder.svg',
    specifications: [
      { label: 'Viscosity', value: 'SAE 80W-90' },
      { label: 'Type', value: 'Premium Gear Oil' },
      { label: 'Quantity', value: '1 Quart' },
      { label: 'Application', value: 'Lower Unit' },
      { label: 'Color', value: 'Blue (for leak detection)' }
    ],
    features: [
      'Superior wear protection',
      'Corrosion prevention',
      'All-temperature performance',
      'Blue dye for leak detection',
      'Mercury-specific formulation'
    ],
    compatibility: 'All Mercury outboard lower units',
    inStock: true,
    partNumber: '92-858064QB1'
  },
  {
    id: 'maint-fuel-treatment',
    name: 'Mercury Quickleen Fuel Treatment',
    category: 'maintenance',
    shortDescription: 'Complete fuel system cleaner and stabilizer',
    description: 'Mercury Quickleen cleans fuel system components, removes deposits, stabilizes fuel for storage, and prevents corrosion. Perfect for regular maintenance and winterization.',
    price: 18,
    imageUrl: '/placeholder.svg',
    specifications: [
      { label: 'Size', value: '12 oz' },
      { label: 'Treatment', value: '60 gallons' },
      { label: 'Type', value: 'Fuel additive' },
      { label: 'Functions', value: 'Clean, stabilize, protect' },
      { label: 'Ethanol', value: 'Compatible' }
    ],
    features: [
      'Cleans fuel system',
      'Stabilizes fuel for storage',
      'Prevents corrosion',
      'Removes deposits',
      'Ethanol-compatible'
    ],
    compatibility: 'All gasoline marine engines',
    inStock: true,
    partNumber: '92-8M0058682'
  },
  {
    id: 'maint-storage-seal',
    name: 'Mercury Storage Seal Engine Fogger',
    category: 'maintenance',
    shortDescription: 'Essential protection for engine winterization',
    description: 'Mercury Storage Seal protects internal engine components during storage. Coats cylinder walls, pistons, and valves to prevent corrosion and ensure easy spring startup.',
    price: 16,
    imageUrl: '/placeholder.svg',
    specifications: [
      { label: 'Size', value: '12 oz aerosol' },
      { label: 'Type', value: 'Fogging oil' },
      { label: 'Application', value: 'Internal engine' },
      { label: 'Purpose', value: 'Storage protection' },
      { label: 'Formula', value: 'Corrosion inhibitor' }
    ],
    features: [
      'Prevents corrosion during storage',
      'Protects internal components',
      'Easy aerosol application',
      'Ensures spring startup',
      'Mercury-approved formula'
    ],
    compatibility: 'All 2-stroke and 4-stroke engines',
    inStock: true,
    partNumber: '92-802878Q51'
  },
  {
    id: 'maint-anodes-aluminum',
    name: 'Mercury Aluminum Anode Kit',
    category: 'maintenance',
    shortDescription: 'Sacrificial anodes for corrosion protection',
    description: 'Complete aluminum anode kit provides essential corrosion protection for your outboard in freshwater and brackish environments. Includes all necessary anodes for complete lower unit protection.',
    price: 45,
    imageUrl: '/placeholder.svg',
    specifications: [
      { label: 'Material', value: 'Aluminum' },
      { label: 'Water Type', value: 'Fresh/Brackish' },
      { label: 'Contents', value: 'Complete kit' },
      { label: 'Replacement', value: 'Annual' },
      { label: 'Protection', value: 'Full lower unit' }
    ],
    features: [
      'Complete corrosion protection',
      'Aluminum for freshwater',
      'Easy installation',
      'All mounting hardware included',
      'OEM quality'
    ],
    compatibility: 'Mercury outboards 75-150 HP',
    inStock: true,
    partNumber: '8M0145880'
  }
];
