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

// ============= PROMO AWARENESS NUDGES =============
// Universal promo messages that can be shown on any page

export const PROMO_AWARENESS_NUDGES = {
  // Generic promo nudges (work for any "Get X" style promotion)
  getWarrantyNudges: (totalYears: number): Array<{ message: string; icon: string }> => [
    { message: `Mercury Get ${totalYears}: ${totalYears} years factory warranty`, icon: 'shield' },
    { message: `Every motor includes ${totalYears} years parts + labour`, icon: 'check' },
    { message: `${totalYears} years of worry-free boating — that's real coverage`, icon: 'heart' },
    { message: `All 3 bonus options include the same ${totalYears}-year protection`, icon: 'award' },
  ],
  
  // Urgency nudge when promo is ending soon
  getUrgencyNudge: (daysLeft: number, totalYears: number): { message: string; icon: string } | null => {
    if (daysLeft <= 0) return null;
    if (daysLeft <= 7) return { message: `⏰ Only ${daysLeft} days left on the Get ${totalYears} offer!`, icon: 'clock' };
    if (daysLeft <= 14) return { message: `Get ${totalYears} promotion ends in ${daysLeft} days`, icon: 'clock' };
    return null;
  },
  
  // Calculate days until promo ends
  getDaysUntilEnd: (endDateStr: string | null | undefined): number => {
    if (!endDateStr) return 999;
    try {
      const endDate = new Date(endDateStr);
      const now = new Date();
      return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return 999;
    }
  },
};

// ============= CHAT ENGAGEMENT NUDGES =============
// Subtle prompts to encourage AI chat interaction

export interface ChatEngagementNudge {
  message: string;
  icon: string;
  aiPrompt: string;
}

export const CHAT_ENGAGEMENT_NUDGES: Record<string, ChatEngagementNudge[]> = {
  '/quote/motor-selection': [
    { message: "Not sure which HP? Ask AI →", icon: 'sparkles', aiPrompt: "Help me choose the right HP for my boat" },
    { message: "Curious about fuel economy? I can compare →", icon: 'sparkles', aiPrompt: "Compare fuel economy between motors" },
    { message: "Ask AI: What's the difference between these motors?", icon: 'sparkles', aiPrompt: "What's the difference between FourStroke and Pro XS?" },
  ],
  '/quote/options': [
    { message: "What's covered? Tap to ask AI →", icon: 'sparkles', aiPrompt: "What does the Complete package cover?" },
    { message: "Need help choosing? AI can compare →", icon: 'sparkles', aiPrompt: "Compare the package options for me" },
  ],
  '/quote/promo-selection': [
    { message: "Which bonus is best for you? Ask AI →", icon: 'sparkles', aiPrompt: "Which promo option is best for me?" },
    { message: "Not sure? AI can explain each option →", icon: 'sparkles', aiPrompt: "Explain the Mercury Get 7 bonus options" },
  ],
  '/quote/package-selection': [
    { message: "Complete vs Premium? AI can compare →", icon: 'sparkles', aiPrompt: "Compare Complete and Premium packages" },
    { message: "What's the difference? Ask AI →", icon: 'sparkles', aiPrompt: "What's the difference between coverage packages?" },
  ],
  '/quote/boat-info': [
    { message: "Questions about controls? Ask AI →", icon: 'sparkles', aiPrompt: "Help me understand the control options for my boat" },
    { message: "Not sure what fits? AI can help →", icon: 'sparkles', aiPrompt: "What controls do I need for my boat type?" },
  ],
  '/quote/trade-in': [
    { message: "Wondering what yours is worth? Ask AI →", icon: 'sparkles', aiPrompt: "How much is my old motor worth as a trade-in?" },
    { message: "Trade-in questions? AI has answers →", icon: 'sparkles', aiPrompt: "What factors affect my trade-in value?" },
  ],
  '/quote/summary': [
    { message: "Questions before you submit? Ask here →", icon: 'sparkles', aiPrompt: "What happens after I submit my quote?" },
    { message: "Need financing info? AI can explain →", icon: 'sparkles', aiPrompt: "Tell me about the financing options" },
  ],
  '/repower': [
    { message: "Is repowering right for me? Ask AI →", icon: 'sparkles', aiPrompt: "Should I repower my boat or buy new?" },
    { message: "Questions about the process? AI can help →", icon: 'sparkles', aiPrompt: "How does the repower process work?" },
  ],
  'default': [
    { message: "Questions? AI's got answers →", icon: 'sparkles', aiPrompt: "Help me with my quote" },
    { message: "Not sure about something? Just ask →", icon: 'sparkles', aiPrompt: "I have a question about Mercury motors" },
  ],
};

// Get chat nudges for a specific path, with fallback to default
export function getChatNudgesForPath(pathname: string): ChatEngagementNudge[] {
  // Try exact match first
  if (CHAT_ENGAGEMENT_NUDGES[pathname]) {
    return CHAT_ENGAGEMENT_NUDGES[pathname];
  }
  // Try partial matches for quote paths
  for (const [path, nudges] of Object.entries(CHAT_ENGAGEMENT_NUDGES)) {
    if (path !== 'default' && pathname.includes(path)) {
      return nudges;
    }
  }
  return CHAT_ENGAGEMENT_NUDGES.default;
}
