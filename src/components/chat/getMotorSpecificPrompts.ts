// HP-aware smart prompt generator for customer-led chat
// Returns engaging, relevant questions based on motor characteristics

interface MotorContext {
  hp: number;
  family?: string;
  model?: string;
}

/**
 * Get highly engaging, HP-specific questions that anticipate customer concerns.
 * These prompts let customers lead the conversation while providing intelligent suggestions.
 */
export function getMotorSpecificPrompts(context: MotorContext): string[] {
  const { hp, family, model } = context;
  const familyLower = family?.toLowerCase() || '';
  const modelLower = model?.toLowerCase() || '';

  // ProKicker-specific prompts (trolling motor questions)
  if (modelLower.includes('prokicker') || familyLower.includes('prokicker')) {
    return [
      "What's the ideal trolling speed?",
      "ProKicker vs regular 9.9?",
      "Will it fit my boat's kicker bracket?",
      "How quiet is it for fishing?"
    ];
  }

  // Verado-specific prompts (premium technology)
  if (familyLower.includes('verado')) {
    return [
      "What makes Verado special?",
      "Is the Verado worth the premium?",
      "Joystick piloting compatible?",
      "Warranty coverage?"
    ];
  }

  // Pro XS-specific prompts (performance/racing)
  if (familyLower.includes('pro xs') || modelLower.includes('pro xs')) {
    return [
      "Pro XS vs standard FourStroke?",
      "Best prop for top speed?",
      "Tournament legal?",
      "WOT fuel burn?"
    ];
  }

  // SeaPro-specific prompts (commercial use)
  if (familyLower.includes('seapro') || modelLower.includes('seapro')) {
    return [
      "Commercial warranty options?",
      "Best for heavy use?",
      "SeaPro vs FourStroke?",
      "Maintenance schedule?"
    ];
  }

  // Tiller-specific prompts
  if (modelLower.includes('tiller') || modelLower.includes('tlr') || modelLower.includes('mh')) {
    return [
      "Tiller extension available?",
      "Good for solo fishing?",
      "Clamp-on or bolt-on?",
      "How's the ergonomics?"
    ];
  }

  // Portable motors (2.5-6HP) - emphasis on portability, weight, small boats
  if (hp <= 6) {
    return [
      "How heavy is this to carry?",
      "Good for a canoe or kayak?",
      "Fuel tank built-in?",
      "Electric start available?"
    ];
  }

  // Small motors (8-15HP) - emphasis on boat fit, planing, efficiency
  if (hp <= 15) {
    const prompts = [
      "Will this plane my boat?",
      "How quiet at trolling?",
      "Miles per gallon?"
    ];
    // Add power trim question for 9.9+
    if (hp >= 9.9) {
      prompts.push("Power tilt worth it?");
    } else {
      prompts.push("Good for inflatables?");
    }
    return prompts;
  }

  // Mid-small motors (20-30HP) - power trim emphasis
  if (hp <= 30) {
    return [
      "Power trim included?",
      `Is ${hp}HP enough for my boat?`,
      "Manual vs electric tilt?",
      "Fuel consumption at cruise?"
    ];
  }

  // Mid-range motors (40-60HP) - performance and versatility
  if (hp <= 60) {
    return [
      `Compare to the ${hp + 10}HP`,
      "Best for pontoons?",
      "Fuel economy at cruise?",
      "What boats does this fit?"
    ];
  }

  // High-power (75-150HP) - serious performance considerations
  if (hp <= 150) {
    return [
      "Command Thrust worth it?",
      "Break-in procedure?",
      "Is this overkill for fishing?",
      "Fuel burn at WOT?"
    ];
  }

  // Premium/Performance (175HP+) - investment and high-performance
  return [
    "Verado vs Pro XS?",
    "Warranty coverage details?",
    "Best prop for my use?",
    "Financing options?"
  ];
}

/**
 * Extract motor family from model string for context
 */
export function extractMotorFamily(model: string): string {
  const modelLower = model.toLowerCase();
  
  if (modelLower.includes('verado')) return 'Verado';
  if (modelLower.includes('pro xs')) return 'Pro XS';
  if (modelLower.includes('seapro')) return 'SeaPro';
  if (modelLower.includes('prokicker')) return 'ProKicker';
  if (modelLower.includes('fourstroke') || modelLower.includes('4-stroke')) return 'FourStroke';
  if (modelLower.includes('jet')) return 'Jet';
  
  return 'FourStroke'; // Default
}

/**
 * Get a short display label for motor context banner
 */
export function getMotorContextLabel(hp: number, model?: string): string {
  if (!model) return `${hp}HP Motor`;
  
  const family = extractMotorFamily(model);
  return `${hp}HP ${family}`;
}
