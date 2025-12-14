// Conversational, friendly messages for the feedback bar
// Written like a knowledgeable friend helping you through a purchase

export interface ConversationalNudge {
  message: string;
  icon?: string;
  aiPrompt?: string; // What to send to AI if tapped
}

// Welcome/orientation messages per page (0-3 seconds)
export const WELCOME_MESSAGES: Record<string, ConversationalNudge[]> = {
  '/quote/motor-selection': [
    { message: "Tap any motor to check it out", icon: 'sparkles' },
    { message: "Browse around — I'm here if you need help", icon: 'heart' },
  ],
  '/quote/options': [
    { message: "Pick a package or skip — totally up to you", icon: 'check' },
    { message: "Most folks grab Complete, but you do you", icon: 'shield' },
  ],
  '/quote/purchase-path': [
    { message: "How do you want to get your motor?", icon: 'check' },
    { message: "Pick what works best for you", icon: 'heart' },
  ],
  '/quote/boat-info': [
    { message: "Tell me about your boat — helps with the fit", icon: 'check' },
    { message: "Quick question about your boat setup", icon: 'sparkles' },
  ],
  '/quote/trade-in': [
    { message: "Got something to trade? Let's see what it's worth", icon: 'dollar' },
    { message: "Old motor collecting dust? Could be worth something", icon: 'refresh' },
  ],
  '/quote/installation': [
    { message: "How do you want it installed?", icon: 'check' },
    { message: "Our techs can handle everything if you want", icon: 'shield' },
  ],
  '/quote/fuel-tank': [
    { message: "Last step — pick your fuel tank", icon: 'check' },
    { message: "Almost there! Just the tank left", icon: 'flag' },
  ],
  '/quote/schedule': [
    { message: "Looking good! Review and submit when ready", icon: 'check' },
    { message: "You're all set — just hit submit", icon: 'flag' },
  ],
};

// Action prompts (3-8 seconds) - what to do on this page
export const ACTION_PROMPTS: Record<string, ConversationalNudge[]> = {
  '/quote/motor-selection': [
    { message: "Tap a motor to see specs and pricing", icon: 'sparkles', aiPrompt: "Help me understand the motor specs" },
    { message: "Use the HP tabs to filter by size", icon: 'check' },
    { message: "Not sure which one? I can help narrow it down →", icon: 'sparkles', aiPrompt: "Help me find the right motor for my boat" },
  ],
  '/quote/options': [
    { message: "Complete covers you for pretty much everything", icon: 'shield' },
    { message: "Packages save you money vs buying separately", icon: 'dollar' },
    { message: "Not sure what you need? Let's figure it out →", icon: 'sparkles', aiPrompt: "Help me understand the package options" },
  ],
  '/quote/purchase-path': [
    { message: "Pro install includes rigging and sea trial", icon: 'shield' },
    { message: "Going DIY? We'll set it up so you're ready", icon: 'check' },
    { message: "Questions about install? Ask away →", icon: 'sparkles', aiPrompt: "What's included in professional installation?" },
  ],
  '/quote/boat-info': [
    { message: "This helps us make sure everything fits right", icon: 'check' },
    { message: "Your boat type helps us dial in the controls", icon: 'shield' },
    { message: "Not sure about controls? I can explain →", icon: 'sparkles', aiPrompt: "Help me understand the control options for my boat" },
  ],
  '/quote/trade-in': [
    { message: "Even old motors can be worth something", icon: 'dollar' },
    { message: "Trade-in value comes right off the top", icon: 'check' },
    { message: "Wondering what yours is worth? →", icon: 'sparkles', aiPrompt: "How much is my old motor worth as a trade-in?" },
  ],
  '/quote/installation': [
    { message: "Our guys average 15+ years doing this", icon: 'award' },
    { message: "Pro install includes a full sea trial", icon: 'shield' },
  ],
  '/quote/fuel-tank': [
    { message: "Bigger tank = longer days on the water", icon: 'check' },
    { message: "Tank size depends on how far you cruise", icon: 'heart' },
    { message: "Not sure what size? I can help →", icon: 'sparkles', aiPrompt: "What fuel tank size do I need for my boat?" },
  ],
  '/quote/schedule': [
    { message: "We'll get back to you within 24 hours", icon: 'check' },
    { message: "Questions before you submit? Ask here →", icon: 'sparkles', aiPrompt: "What happens after I submit my quote?" },
  ],
};

// Engaging questions (8-15 seconds) - prompt thought and engagement
export const ENGAGING_QUESTIONS: Record<string, ConversationalNudge[]> = {
  '/quote/motor-selection': [
    { message: "More important to you: fuel economy or power?", icon: 'sparkles', aiPrompt: "Help me decide between fuel economy and power" },
    { message: "Mostly fishing or general cruising?", icon: 'heart', aiPrompt: "Recommend a motor for fishing" },
    { message: "How big's your boat? That narrows things down", icon: 'check', aiPrompt: "What motor size do I need for my boat length?" },
  ],
  '/quote/options': [
    { message: "Want worry-free boating? Check out Complete", icon: 'shield', aiPrompt: "What's included in the Complete package?" },
    { message: "Planning to keep this motor a while?", icon: 'heart', aiPrompt: "Is the extended warranty worth it?" },
  ],
  '/quote/purchase-path': [
    { message: "Comfortable doing the install yourself?", icon: 'check', aiPrompt: "What's involved in self-installation?" },
    { message: "Want us to handle the rigging and setup?", icon: 'shield', aiPrompt: "Tell me about professional installation" },
  ],
  '/quote/trade-in': [
    { message: "What brand is your current motor?", icon: 'refresh', aiPrompt: "What affects my trade-in value?" },
    { message: "How old is the motor you're trading?", icon: 'dollar', aiPrompt: "How is trade-in value calculated?" },
  ],
  '/quote/fuel-tank': [
    { message: "Short day trips or longer adventures?", icon: 'heart', aiPrompt: "Help me choose the right fuel tank size" },
    { message: "How far from shore do you usually go?", icon: 'check', aiPrompt: "What fuel tank size do I need for offshore?" },
  ],
};

// Gentle correction nudges - when user might be missing something
export const CORRECTION_NUDGES: Record<string, ConversationalNudge> = {
  'skipping-options-fast': { 
    message: "Heads up — packages actually save you money", 
    icon: 'dollar',
    aiPrompt: "Tell me more about the package savings"
  },
  'essential-on-big-motor': { 
    message: "Just so you know — bigger motors usually benefit from more coverage", 
    icon: 'shield',
    aiPrompt: "Should I get more warranty on a larger motor?"
  },
  'no-trade-in-check': { 
    message: "Sure you don't have something to trade?", 
    icon: 'refresh',
    aiPrompt: "What motors do you accept for trade-in?"
  },
  'rushing-boat-info': { 
    message: "Take a sec here — this helps us get the fit right", 
    icon: 'check',
    aiPrompt: "Why does my boat info matter?"
  },
};

// Celebration/reaction messages for user actions
export const REACTION_MESSAGES: Record<string, ConversationalNudge[]> = {
  'motor-selected': [
    { message: "Nice pick! Solid motor 👍", icon: 'check' },
    { message: "Good choice! That's a popular one", icon: 'heart' },
    { message: "Great motor — let's set it up for you", icon: 'sparkles' },
  ],
  'high-hp-selected': [
    { message: "Going for the power — I like it 💪", icon: 'sparkles' },
    { message: "Nice! That'll move some water", icon: 'check' },
  ],
  'prokicker-selected': [
    { message: "Smart choice for trolling!", icon: 'check' },
    { message: "ProKicker's perfect for fishing boats", icon: 'heart' },
  ],
  'package-selected': [
    { message: "Smart — that covers you for everything", icon: 'shield' },
    { message: "Good call! Peace of mind included", icon: 'check' },
  ],
  'trade-in-applied': [
    { message: "Boom! That's coming off the top 🎉", icon: 'dollar' },
    { message: "Nice! Good savings right there", icon: 'check' },
  ],
  'boat-info-complete': [
    { message: "Perfect — now I can make sure it fits", icon: 'check' },
    { message: "Got it! Everything's looking compatible", icon: 'shield' },
  ],
};

// Progress encouragement based on steps completed
export const PROGRESS_MESSAGES: Record<number, ConversationalNudge> = {
  1: { message: "Great start! 5 quick steps to go", icon: 'flag' },
  2: { message: "You're on a roll! 4 steps left", icon: 'flag' },
  3: { message: "Halfway there! Just 3 more", icon: 'flag' },
  4: { message: "Almost done! 2 steps to finish", icon: 'flag' },
  5: { message: "Last step! Let's wrap this up", icon: 'flag' },
  6: { message: "You're all set! 🎉", icon: 'check' },
};

// Social proof (occasional, builds trust)
export const SOCIAL_PROOF: ConversationalNudge[] = [
  { message: "127+ quotes generated this month", icon: 'award' },
  { message: "Trusted since 1947 — that's 78 years", icon: 'award' },
  { message: "Mercury Dealer of the Year", icon: 'award' },
  { message: "Our techs average 15+ years experience", icon: 'shield' },
];

// Offer help messages (after 30s+ idle)
export const OFFER_HELP: ConversationalNudge[] = [
  { message: "Stuck? No shame in asking — that's what I'm here for →", icon: 'sparkles', aiPrompt: "I need help with my quote" },
  { message: "Need a hand? Just tap here →", icon: 'sparkles', aiPrompt: "Help me with my motor selection" },
  { message: "Questions? I've got answers →", icon: 'sparkles', aiPrompt: "I have questions about my options" },
];

// Motor-family-specific messages
export const MOTOR_FAMILY_TIPS: Record<string, ConversationalNudge[]> = {
  'verado': [
    { message: "Verado's the quietest and smoothest of the bunch", icon: 'sparkles' },
    { message: "Verado gives you that premium ride feel", icon: 'shield' },
  ],
  'pro xs': [
    { message: "Pro XS is built for speed — tournament-ready", icon: 'sparkles' },
    { message: "Pro XS owners love the extra punch", icon: 'check' },
  ],
  'fourstroke': [
    { message: "FourStroke's the reliable all-rounder", icon: 'check' },
    { message: "Great fuel economy on the FourStroke", icon: 'dollar' },
  ],
  'seapro': [
    { message: "SeaPro's built tough for commercial work", icon: 'shield' },
    { message: "SeaPro handles heavy use like a champ", icon: 'check' },
  ],
  'prokicker': [
    { message: "ProKicker's perfect for slow trolling", icon: 'heart' },
    { message: "ProKicker gives you precise speed control", icon: 'check' },
  ],
};

// HP range categories
export type HPRange = 'portable' | 'mid-range' | 'high-power' | 'none';

export const getHPRange = (hp: number | undefined): HPRange => {
  if (!hp) return 'none';
  if (hp <= 15) return 'portable';
  if (hp <= 60) return 'mid-range';
  return 'high-power';
};

// HP-specific messages for each range
export const HP_SPECIFIC_MESSAGES: Record<HPRange, ConversationalNudge[]> = {
  'portable': [
    { message: "Light and easy to carry — perfect for small boats", icon: 'check' },
    { message: "Great for dinghies, inflatables, and jon boats", icon: 'heart' },
    { message: "This size is super fuel-efficient", icon: 'dollar' },
    { message: "Simple and reliable — that's what portables are all about", icon: 'shield' },
  ],
  'mid-range': [
    { message: "Solid mid-range choice — handles most boats well", icon: 'check' },
    { message: "Think about tiller vs remote for your setup", icon: 'sparkles' },
    { message: "Good balance of power and fuel economy", icon: 'dollar' },
  ],
  'high-power': [
    { message: "Serious power for serious boats 💪", icon: 'sparkles' },
    { message: "Command Thrust available for heavy loads", icon: 'shield' },
    { message: "These motors really move some water", icon: 'check' },
    { message: "Pro install recommended for this size", icon: 'award' },
  ],
  'none': [],
};

// Keywords that indicate big-motor-only topics
const BIG_MOTOR_KEYWORDS = ['command thrust', 'tournament', 'power trim', 'racing', 'top speed'];

// Keywords that indicate small-motor-only topics
const SMALL_MOTOR_KEYWORDS = ['portable', 'carry', 'lightweight', 'dinghy', 'inflatable'];

// Filter message based on HP relevance
export const isMessageRelevant = (message: string, hp: number | undefined): boolean => {
  if (!hp) return true; // No motor = show generic messages
  
  const lower = message.toLowerCase();
  
  // Filter out big-motor topics for small motors
  if (hp < 40) {
    for (const keyword of BIG_MOTOR_KEYWORDS) {
      if (lower.includes(keyword)) return false;
    }
  }
  
  // Filter out small-motor topics for big motors
  if (hp >= 75) {
    for (const keyword of SMALL_MOTOR_KEYWORDS) {
      if (lower.includes(keyword)) return false;
    }
  }
  
  return true;
};

// Filter an array of nudges by HP relevance
export const filterByHP = <T extends ConversationalNudge>(nudges: T[], hp: number | undefined): T[] => {
  if (!hp) return nudges;
  return nudges.filter(n => isMessageRelevant(n.message, hp));
};

// Get a random item from an array
export const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Pick random from HP-filtered array
export const pickRandomFiltered = <T extends ConversationalNudge>(arr: T[], hp: number | undefined): T | null => {
  const filtered = filterByHP(arr, hp);
  if (filtered.length === 0) return null;
  return pickRandom(filtered);
};

// Get motor family from model string
export const getMotorFamilyKey = (model: string | undefined): string | null => {
  if (!model) return null;
  const lower = model.toLowerCase();
  if (lower.includes('verado')) return 'verado';
  if (lower.includes('pro xs')) return 'pro xs';
  if (lower.includes('prokicker')) return 'prokicker';
  if (lower.includes('seapro')) return 'seapro';
  if (lower.includes('fourstroke')) return 'fourstroke';
  return null;
};
