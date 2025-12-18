// HP-aware smart prompt generator with dynamic rotation
// Returns engaging, rotating questions based on motor characteristics

interface MotorContext {
  hp: number;
  family?: string;
  model?: string;
}

// Utility to shuffle and pick N items from array
function shuffleAndPick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Session storage key for tracking shown prompts
const SHOWN_PROMPTS_KEY = 'chat_shown_prompts';
const PROMPT_MOTOR_KEY = 'chat_prompt_motor_id';

// Get previously shown prompts from session
function getShownPrompts(): Set<string> {
  try {
    const stored = sessionStorage.getItem(SHOWN_PROMPTS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

// Save shown prompts to session
function saveShownPrompts(prompts: Set<string>, motorKey: string) {
  try {
    sessionStorage.setItem(SHOWN_PROMPTS_KEY, JSON.stringify([...prompts]));
    sessionStorage.setItem(PROMPT_MOTOR_KEY, motorKey);
  } catch {
    // Ignore storage errors
  }
}

// Clear shown prompts when motor changes
function clearShownPromptsIfMotorChanged(motorKey: string) {
  const storedMotor = sessionStorage.getItem(PROMPT_MOTOR_KEY);
  if (storedMotor !== motorKey) {
    sessionStorage.removeItem(SHOWN_PROMPTS_KEY);
    sessionStorage.setItem(PROMPT_MOTOR_KEY, motorKey);
  }
}

// ============================================
// EXPANDED QUESTION POOLS BY CATEGORY
// ============================================

const performanceQuestions = {
  portable: [ // 2.5-6HP
    "How heavy is this to carry?",
    "Easy to lift on/off a kayak?",
    "How loud at idle?",
    "Top speed on a 12ft boat?",
    "Fuel consumption per hour?",
    "Runs on regular gas?",
    "Good for trolling?",
    "How's the vibration at idle?",
  ],
  small: [ // 8-15HP
    "Will this plane my boat?",
    "How quiet at trolling speed?",
    "Fuel economy at cruise?",
    "Top speed on a 14ft aluminum?",
    "How loud is it at full throttle?",
    "Good for rough water?",
    "Weight without fuel?",
    "Smooth at idle?",
  ],
  midSmall: [ // 20-30HP
    "Fuel consumption at cruise?",
    "Will it plane a pontoon?",
    "RPM range at WOT?",
    "Good hole shot?",
    "How quiet at trolling?",
    "Weight comparison to competitors?",
    "Handles choppy conditions?",
    "Top speed on 16ft boat?",
  ],
  midRange: [ // 40-60HP
    "What RPM at wide open?",
    "Fuel consumption at cruise?",
    "Top speed on a 17ft aluminum?",
    "How quiet at idle?",
    "Good for watersports?",
    "Handles rough water well?",
    "Power-to-weight ratio?",
    "Good low-end torque?",
  ],
  highPower: [ // 75-150HP
    "What RPM should I see at WOT?",
    "Fuel burn at cruise speed?",
    "Top speed on 18ft fiberglass?",
    "Hole shot performance?",
    "Good for pulling tubes?",
    "How's the torque curve?",
    "Noise level at cruise?",
    "Handles big waves?",
  ],
  premium: [ // 175HP+
    "What RPM at wide open throttle?",
    "Fuel economy at 30mph?",
    "How smooth at high speeds?",
    "Top speed on 20ft boat?",
    "Handles offshore conditions?",
    "Best for long runs?",
    "Noise level comparison?",
    "Power for watersports?",
  ],
};

const practicalQuestions = {
  portable: [
    "Good for a canoe?",
    "Works on an inflatable?",
    "Good for kayak fishing?",
    "Easy to store in car trunk?",
    "Solo operation easy?",
    "Good for a small lake?",
    "Works with transom mount?",
    "Good for a tender?",
  ],
  small: [
    "Good for fishing?",
    "Works with my Jon boat?",
    "Good for duck hunting?",
    "Solo operation manageable?",
    "Will fit a 14ft boat?",
    "Good for small lakes?",
    "Cartop boat friendly?",
    "Good for aluminum boats?",
  ],
  midSmall: [
    "Good for bass fishing?",
    "Will fit my pontoon?",
    "Good for towing tubes?",
    "Solo operation easy?",
    "Works with ski pylon?",
    "Good for river use?",
    "Will fit 16ft boat?",
    "Good for shallow water?",
  ],
  midRange: [
    "Good for watersports?",
    "Will work on my pontoon?",
    "Good for fishing tournaments?",
    "Solo launch manageable?",
    "Good for Lake Ontario?",
    "Will pull a skier?",
    "Good for family boating?",
    "Works with my 18ft boat?",
  ],
  highPower: [
    "Good for offshore?",
    "Will handle big water?",
    "Good for fishing charters?",
    "Works with center console?",
    "Good for long runs?",
    "Solo operation doable?",
    "Will pull a wakeboarder?",
    "Good for Rice Lake?",
  ],
  premium: [
    "Good for offshore fishing?",
    "Will handle rough seas?",
    "Good for tournament use?",
    "Twin setup recommended?",
    "Good for cruising?",
    "Will fit my transom?",
    "Good for Great Lakes?",
    "Best for long distances?",
  ],
};

const maintenanceQuestions = [
  "Break-in procedure?",
  "First service at how many hours?",
  "Oil type and capacity?",
  "Winterizing included with install?",
  "How often to change gear oil?",
  "Spark plug interval?",
  "Impeller replacement schedule?",
  "Zinc anode frequency?",
  "What's the maintenance schedule?",
  "Easy to service myself?",
  "Fuel filter location?",
  "Recommended fuel treatment?",
];

const valueQuestions = [
  "Any promotions right now?",
  "Warranty coverage?",
  "Financing available?",
  "What's included in the price?",
  "Is there a rebate?",
  "Extended warranty worth it?",
  "Price match policy?",
  "What does installation include?",
  "Any package deals?",
  "Trade-in value for my old motor?",
  "Payment plans available?",
  "Current Mercury promotions?",
];

const comparisonQuestions = {
  portable: [
    "Compare to the 4HP",
    "Suzuki vs Mercury portable?",
    "Why Mercury over Honda?",
    "2.5 vs 3.5HP difference?",
  ],
  small: [
    "Compare to the next size up",
    "Pro XS 9.9 vs standard?",
    "Worth stepping up to 15HP?",
    "Manual vs electric start?",
  ],
  midSmall: [
    "Compare to the 30HP",
    "Worth the upgrade to 25HP?",
    "EFI vs carbureted?",
    "Power trim worth it?",
  ],
  midRange: [
    "Compare to the 60HP",
    "Pro XS vs FourStroke?",
    "Worth stepping up in HP?",
    "Command Thrust worth it?",
  ],
  highPower: [
    "Compare to the 115HP",
    "Pro XS vs standard?",
    "Verado vs FourStroke?",
    "Worth the extra HP?",
  ],
  premium: [
    "Verado vs Pro XS?",
    "Single vs twin setup?",
    "Compare to Yamaha?",
    "Worth the Verado premium?",
  ],
};

// Family-specific questions
const familyQuestions = {
  prokicker: [
    "Ideal trolling speed?",
    "Will it fit my kicker bracket?",
    "ProKicker vs regular 9.9?",
    "How quiet for fishing?",
    "Best trolling RPM?",
    "Trolling plate needed?",
    "Electric start available?",
    "Integrated linkage option?",
  ],
  verado: [
    "What makes Verado special?",
    "Is the premium worth it?",
    "Joystick piloting compatible?",
    "How quiet is it really?",
    "Supercharged benefits?",
    "Maintenance costs higher?",
    "Best Verado for my boat?",
    "Digital throttle benefits?",
  ],
  proxs: [
    "Pro XS vs standard FourStroke?",
    "What RPM at WOT?",
    "Tournament legal?",
    "Best prop for top speed?",
    "Hole shot comparison?",
    "Racing applications?",
    "Torque master differences?",
    "Worth it for fishing?",
  ],
  seapro: [
    "Commercial warranty options?",
    "Heavy-duty maintenance?",
    "SeaPro vs FourStroke?",
    "Hour meter included?",
    "Good for rental fleet?",
    "Built tougher how?",
    "Corrosion protection?",
    "High-hour expectations?",
  ],
  tiller: [
    "Tiller extension available?",
    "Good for solo fishing?",
    "Clamp-on or bolt-on?",
    "How's the ergonomics?",
    "Steering effort okay?",
    "Throttle smooth?",
    "Extension handle length?",
    "Good for small boats?",
  ],
};

// Technical questions (Perplexity-backed)
const technicalQuestions = [
  "Exact oil capacity?",
  "Spark plug part number?",
  "Recommended prop pitch?",
  "Gear ratio specs?",
  "Alternator output?",
  "Compression ratio?",
  "Displacement size?",
  "Dry weight specs?",
  "Fuel system type?",
  "Cooling system details?",
];

/**
 * Get rotating, HP-specific questions that feel fresh each time.
 * Tracks shown questions to avoid immediate repeats.
 */
export function getMotorSpecificPrompts(context: MotorContext, count: number = 4): string[] {
  const { hp, family, model } = context;
  const familyLower = family?.toLowerCase() || '';
  const modelLower = model?.toLowerCase() || '';
  
  // Create motor identifier for tracking
  const motorKey = `${hp}_${familyLower}_${modelLower}`;
  
  // Clear tracking if motor changed
  clearShownPromptsIfMotorChanged(motorKey);
  
  // Get previously shown prompts
  const shownPrompts = getShownPrompts();
  
  // Build question pool based on motor characteristics
  let pool: string[] = [];
  
  // Add family-specific questions first (highest priority)
  if (modelLower.includes('prokicker') || familyLower.includes('prokicker')) {
    pool.push(...familyQuestions.prokicker);
  } else if (familyLower.includes('verado')) {
    pool.push(...familyQuestions.verado);
  } else if (familyLower.includes('pro xs') || modelLower.includes('pro xs')) {
    pool.push(...familyQuestions.proxs);
  } else if (familyLower.includes('seapro') || modelLower.includes('seapro')) {
    pool.push(...familyQuestions.seapro);
  } else if (modelLower.includes('tiller') || modelLower.includes('tlr') || modelLower.includes('mh')) {
    pool.push(...familyQuestions.tiller);
  }
  
  // Add HP-appropriate performance & practical questions
  const hpCategory = hp <= 6 ? 'portable' :
                     hp <= 15 ? 'small' :
                     hp <= 30 ? 'midSmall' :
                     hp <= 60 ? 'midRange' :
                     hp <= 150 ? 'highPower' : 'premium';
  
  pool.push(...performanceQuestions[hpCategory]);
  pool.push(...practicalQuestions[hpCategory]);
  pool.push(...comparisonQuestions[hpCategory]);
  
  // Add some maintenance questions
  pool.push(...shuffleAndPick(maintenanceQuestions, 4));
  
  // Add some value questions
  pool.push(...shuffleAndPick(valueQuestions, 4));
  
  // Add a few technical questions
  pool.push(...shuffleAndPick(technicalQuestions, 2));
  
  // Filter out recently shown prompts
  let unseenPool = pool.filter(q => !shownPrompts.has(q));
  
  // If we've shown most questions, reset the tracking
  if (unseenPool.length < count) {
    shownPrompts.clear();
    unseenPool = pool;
  }
  
  // Pick random questions from unseen pool
  const selected = shuffleAndPick(unseenPool, count);
  
  // Track the newly shown prompts
  selected.forEach(q => shownPrompts.add(q));
  saveShownPrompts(shownPrompts, motorKey);
  
  return selected;
}

/**
 * Force refresh prompts (called by rotation timer)
 */
export function refreshMotorPrompts(context: MotorContext, count: number = 4): string[] {
  // Simply call the main function - it handles rotation automatically
  return getMotorSpecificPrompts(context, count);
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
