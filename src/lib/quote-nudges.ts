/**
 * Expert Nudges Library
 * Contextual, educational messages that build trust and reduce friction
 */

// HP range recommendations based on boat length (industry standard)
export function getRecommendedHPRange(boatLengthFt: number): { min: number; max: number; label: string } {
  if (boatLengthFt <= 12) return { min: 5, max: 25, label: '5-25' };
  if (boatLengthFt <= 14) return { min: 15, max: 40, label: '15-40' };
  if (boatLengthFt <= 16) return { min: 25, max: 75, label: '25-75' };
  if (boatLengthFt <= 18) return { min: 50, max: 115, label: '50-115' };
  if (boatLengthFt <= 20) return { min: 75, max: 150, label: '75-150' };
  if (boatLengthFt <= 22) return { min: 115, max: 200, label: '115-200' };
  if (boatLengthFt <= 24) return { min: 150, max: 250, label: '150-250' };
  if (boatLengthFt <= 26) return { min: 175, max: 300, label: '175-300' };
  return { min: 200, max: 400, label: '200-400' };
}

export function isUnderpowered(boatLengthFt: number, hp: number): boolean {
  const range = getRecommendedHPRange(boatLengthFt);
  return hp < range.min * 0.9; // 10% tolerance
}

export function isOverpowered(boatLengthFt: number, hp: number): boolean {
  const range = getRecommendedHPRange(boatLengthFt);
  return hp > range.max * 1.1; // 10% tolerance
}

// Expert nudge content organized by step
export const EXPERT_NUDGES = {
  boatInfo: {
    initial: [
      "Good start. This tells us how to match the engine to your hull.",
      "Rough hp is fine — HBW will double-check details later.",
      "This helps us ensure a perfect fit for your boat.",
    ],
    // Dynamic message based on boat length
    afterLength: (lengthFt: number): string => {
      const range = getRecommendedHPRange(lengthFt);
      return `Boats ${lengthFt}ft usually land in the ${range.label}HP range.`;
    },
    progress: [
      "Compatibility matters for performance & safety.",
      "We'll match the perfect motor to your boat.",
    ],
  },

  activities: {
    fishing: [
      "For fishing, most owners love strong mid-range torque and quiet trolling.",
      "Trolling motor compatibility? We can add that in options.",
      "Fuel efficiency matters for long fishing days.",
    ],
    family: [
      "For family days, easy starts and low maintenance matter most.",
      "Family cruising = reliability and smooth shifting.",
      "Push-button start is a crowd favorite with families.",
    ],
    watersports: [
      "Tubing and skiing need quick hole-shot — we'll prioritize that.",
      "For watersports, prop selection makes a big difference.",
      "Power trim makes getting skiers up easier.",
    ],
    cruising: [
      "Cruising boats love fuel economy at steady speeds.",
      "Modern 4-strokes are 30-40% more fuel efficient.",
    ],
  },

  motorSelection: {
    general: [
      "More hp = quicker hole shot; less hp = better fuel use at cruise.",
      "This hp range suits your boat and crew.",
      "20\" shaft fits most boats — 15\" for small tenders.",
      "Electric start = push-button convenience.",
    ],
    underpowered: (boatLength: number, selectedHP: number): string => {
      const range = getRecommendedHPRange(boatLength);
      return `This looks a bit light for ${boatLength}ft. Want to see ${range.label}HP options?`;
    },
    overpowered: "Plenty of power here — you'll have extra headroom for heavy loads.",
    encouragement: "Excellent choice! Let's customize it.",
    contextHint: "Great specs for your boat type.",
  },

  installation: {
    general: [
      "Digital controls = smoother shifts and lighter throttle.",
      "Upgrading steering now is cleaner and often cheaper than later.",
      "Unsure on options? HBW can suggest Good/Better/Best.",
      "Professional installation includes sea trial.",
      "Full rigging & setup by certified techs.",
    ],
  },

  promoSelection: [
    "These offers are the same ones Mercury runs for their dealer fleet.",
    "The 7-year warranty covers parts AND labour — real coverage.",
    "Choose rebate, financing, or deferred payments — all include warranty.",
    "All options include the same 7-year factory warranty.",
  ],

  packageSelection: [
    "Most repower customers go Complete for peace of mind.",
    "Premium includes fuel system — worth it on older boats.",
    "Complete is our most popular package.",
    "Premium extends warranty to 8 years total.",
    "All packages include professional rigging.",
  ],

  summary: {
    initial: [
      "This is a planning estimate — HBW will finalize labour and rigging with you.",
      "Sending this just starts a no-pressure HBW conversation.",
      "Your price is locked — take your time.",
      "Quote valid for 30 days — no rush.",
    ],
    reassurance: [
      "You can still change hp, options, and budget after you submit.",
      "If this feels high, mention your budget and we can adjust.",
      "Modern engines often save fuel and maintenance vs older 2-strokes.",
      "Most customers take a few days to decide.",
    ],
    notes: "Add any must-haves or worries in the notes so follow-up is actually useful.",
  },

  tradeIn: {
    initial: [
      "Trade-ins reduce your upfront cost.",
      "We accept most outboard motors.",
      "Have a motor to trade? Get instant value.",
    ],
    withValue: (value: number): string => {
      const formatted = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(value);
      return `Nice! That's ${formatted} toward your new motor.`;
    },
  },

  purchasePath: {
    installed: [
      "Most customers choose professional install.",
      "We handle rigging, controls & lake test.",
      "Average install time: 4-6 hours.",
    ],
    loose: [
      "Loose motor? Great for DIYers or remote locations.",
      "Includes all factory accessories and warranty.",
    ],
  },
};

// Pick a random item from an array with optional seeding
export function pickRandomNudge<T>(arr: T[], seed?: number): T {
  const idx = seed !== undefined ? Math.abs(seed) % arr.length : Math.floor(Math.random() * arr.length);
  return arr[idx];
}

// Get a rotating nudge based on idle time
export function getRotatingNudge(nudges: string[], idleSeconds: number, intervalSeconds = 8): string {
  const index = Math.floor(idleSeconds / intervalSeconds) % nudges.length;
  return nudges[index];
}
