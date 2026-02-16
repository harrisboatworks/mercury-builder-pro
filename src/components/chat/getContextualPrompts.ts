// Dynamic contextual prompts based on motor type, boat info, and current page
// Written in friendly, conversational language

interface Motor {
  model: string;
  hp?: number;
  horsepower?: number;
  price?: number;
}

interface BoatInfo {
  type?: string;
  length?: string;
  year?: string;
  make?: string;
  model?: string;
}

interface ActivePromo {
  name?: string;
  warranty_extra_years?: number | null;
  end_date?: string | null;
}

// Conversational prompts that feel like asking a friend
export function getContextualPrompts(
  motor: Motor | null,
  boatInfo: BoatInfo | null,
  currentPage: string
): string[] {
  // ============== QUOTE BUILDER PAGES ==============
  
  // Package Selection page - warranty and coverage focus
  if (currentPage.includes('/quote/package-selection')) {
    return [
      "What's the difference between packages?",
      "Is the 7-year warranty worth it?",
      "What's covered under Complete?",
      "What does Premium add?"
    ];
  }

  // Promo Selection page - deal comparison focus
  if (currentPage.includes('/quote/promo-selection')) {
    return [
      "Which promo saves the most money?",
      "How does 6 months no payments work?",
      "What's the 2.99% APR deal?",
      "Can I change my promo later?"
    ];
  }

  // Options page
  if (currentPage.includes('/quote/options')) {
    return [
      "What's in the Complete package?",
      "Is the warranty worth it?",
      "Help me pick a package",
      "What's covered by Mercury?"
    ];
  }

  // Installation page
  if (currentPage.includes('/quote/installation')) {
    return [
      "What's included in pro install?",
      "How long does installation take?",
      "Can I pick it up instead?",
      "Do you install at my dock?"
    ];
  }

  // Fuel tank page
  if (currentPage.includes('/quote/fuel-tank')) {
    return [
      "Do I need a new fuel tank?",
      "What size tank should I get?",
      "Can I use my existing tank?",
      "What about fuel line compatibility?"
    ];
  }

  // Purchase path page - LOOSE vs INSTALLED decision
  if (currentPage.includes('/quote/purchase-path')) {
    return [
      "Should I do DIY or pro install?",
      "What's included in pro install?",
      "Can I pick it up and install later?",
      "How much is installation?"
    ];
  }

  // Boat info page
  if (currentPage.includes('/quote/boat-info')) {
    const hp = motor?.hp || motor?.horsepower || 0;
    return [
      hp > 0 ? `What shaft length for ${hp}HP on my boat?` : "What shaft length do I need?",
      "Will this motor fit my transom?",
      "What controls do I need?",
      "Can you help with my rigging?"
    ];
  }

  // Trade-in page
  if (currentPage.includes('/quote/trade-in')) {
    return [
      "What's my old motor worth?",
      "Do you accept non-running motors?",
      "How is trade-in value calculated?",
      "Can I trade in my boat too?"
    ];
  }

  // Quote summary page - motor-aware closing questions
  if (currentPage.includes('/quote/summary')) {
    const hp = motor?.hp || motor?.horsepower || 0;
    const motorPrice = motor?.price || 0;
    const motorLabel = hp > 0 ? `${hp}HP` : 'my motor';
    const isFinancingEligible = motorPrice >= 5000;
    
    if (isFinancingEligible) {
      return [
        `What's my monthly payment on the ${motorLabel}?`,
        "Can you get me a better price?",
        `How long until my ${motorLabel} is ready?`,
        "What are my financing options?"
      ];
    } else {
      return [
        `Any current rebates on the ${motorLabel}?`,
        `How long until my ${motorLabel} is ready?`,
        "What's included with my motor?",
        "Can you walk me through the quote?"
      ];
    }
  }

  // Schedule page
  if (currentPage.includes('/quote/schedule')) {
    return [
      "What happens at the consultation?",
      "How long is the appointment?",
      "Can we do a video call instead?",
      "What should I bring?"
    ];
  }

  // Motor selection page
  if (currentPage === '/' || currentPage.includes('/quote/motor')) {
    if (!motor) {
      return [
        "Help me pick the right motor",
        "What size do I need for my boat?",
        "Any deals going on right now?",
        "What's a good motor for fishing?"
      ];
    }
  }

  // ============== OTHER PAGES ==============

  // Promotions page
  if (currentPage.includes('/promotions')) {
    return [
      "What's the best deal right now?",
      "When do these promos end?",
      "Can I stack promotions?",
      "Tell me about the Get 7 deal"
    ];
  }

  // Repower page - lead capture and quote building focus
  if (currentPage.includes('/repower')) {
    return [
      "Is repowering worth it for my boat?",
      "How much does a typical repower cost?",
      "What HP motor fits my boat?",
      "What's the repower process?"
    ];
  }

  // Financing page
  if (currentPage.includes('/financing')) {
    return [
      "What's the monthly payment?",
      "What credit score do I need?",
      "Can I pay it off early?",
      "What rates do you offer?"
    ];
  }

  // Contact page
  if (currentPage.includes('/contact')) {
    return [
      "What are your hours?",
      "Can I come see the motors?",
      "Do you do test runs?",
      "Where are you located?"
    ];
  }

  // ============== MOTOR-SPECIFIC PROMPTS ==============
  // Only used when no page match and motor is selected

  if (!motor) {
    return [
      "What motor fits my boat?",
      "Any good deals right now?",
      "Tell me about financing",
      "Help me pick a motor"
    ];
  }

  // Get HP value and model info
  const hp = motor.hp || motor.horsepower || 0;
  const modelLower = motor.model?.toLowerCase() || '';

  // Tiller-specific prompts
  if (modelLower.includes('tiller') || modelLower.includes('tlr') || modelLower.includes('mh')) {
    return [
      `Good tiller motor for fishing?`,
      "Clamp-on or bolt-on?",
      `Best boats for this ${hp}HP?`,
      "What's the fuel economy?"
    ];
  }

  // ProKicker-specific prompts
  if (modelLower.includes('prokicker')) {
    return [
      "What's a ProKicker for?",
      "Best trolling speed?",
      "ProKicker vs regular 9.9?",
      "Will it fit my transom?"
    ];
  }

  // High HP motors (115+)
  if (hp >= 115) {
    return [
      `Compare to the ${hp >= 200 ? hp - 50 : hp + 40}HP`,
      "Fuel economy at cruise?",
      "Is this too much power?",
      "What boats work with this HP?"
    ];
  }

  // Mid-range motors (40-114)
  if (hp >= 40) {
    return [
      `Is ${hp}HP enough for me?`,
      "What warranty comes with it?",
      `${hp} vs ${hp + 25}HP — which one?`,
      "Good for pontoons?"
    ];
  }

  // Small motors (<40HP)
  return [
    `What boats work with ${hp}HP?`,
    "Good for fishing?",
    "How's the fuel economy?",
    "Tiller or remote control?"
  ];
}

// Enhanced function that blends promo questions with page prompts
export function getContextualPromptsWithPromo(
  motor: Motor | null,
  boatInfo: BoatInfo | null,
  currentPage: string,
  activePromo: ActivePromo | null
): string[] {
  const basePrompts = getContextualPrompts(motor, boatInfo, currentPage);
  
  // If there's an active "Get 7" style promo (4+ extra warranty years), inject a promo question
  if (activePromo?.warranty_extra_years && activePromo.warranty_extra_years >= 4) {
    // Skip if already on promo page or promo selection (already has promo questions)
    if (currentPage.includes('/promotions') || currentPage.includes('/quote/promo-selection')) {
      return basePrompts;
    }
    
    const promoQuestion = "Tell me about the Get 7 deal";
    // Insert promo question at position 2 (after first two page-specific questions)
    return [
      ...basePrompts.slice(0, 2),
      promoQuestion,
      ...basePrompts.slice(2, 3)
    ];
  }
  
  return basePrompts;
}

// Enhanced function that blends Perplexity insights with page prompts
export function getContextualPromptsWithPerplexity(
  motor: Motor | null,
  boatInfo: BoatInfo | null,
  currentPage: string,
  activePromo: ActivePromo | null,
  perplexityQuestions: string[] | null
): string[] {
  // Start with promo-aware base prompts
  const basePrompts = getContextualPromptsWithPromo(motor, boatInfo, currentPage, activePromo);
  
  // If we have Perplexity-backed questions, blend one in
  if (perplexityQuestions && perplexityQuestions.length > 0) {
    // Skip pages that already have comprehensive prompts
    if (currentPage.includes('/quote/package-selection') || 
        currentPage.includes('/quote/promo-selection')) {
      // These pages already have good coverage - just add one Perplexity question
      const perplexityQ = perplexityQuestions[0];
      // Only add if not already present
      if (!basePrompts.includes(perplexityQ)) {
        return [...basePrompts.slice(0, 3), perplexityQ];
      }
    }
    
    // For other pages, insert Perplexity question at position 2
    const perplexityQ = perplexityQuestions[0];
    if (!basePrompts.includes(perplexityQ)) {
      return [
        ...basePrompts.slice(0, 2),
        perplexityQ,
        ...basePrompts.slice(2, 3)
      ];
    }
  }
  
  return basePrompts;
}

// Get page-specific welcome messages
export function getPageWelcomeMessage(
  currentPage: string,
  motor: Motor | null,
  activePromo: ActivePromo | null
): string {
  const hp = motor?.hp || motor?.horsepower || 0;
  const family = motor?.model?.toLowerCase().includes('verado') ? 'Verado' :
                 motor?.model?.toLowerCase().includes('pro xs') ? 'Pro XS' :
                 'FourStroke';

  // ============== QUOTE BUILDER PAGES ==============
  
  if (currentPage.includes('/quote/package-selection')) {
    return "Comparing coverage packages? I can help you decide which one fits your needs.";
  }
  
  if (currentPage.includes('/quote/promo-selection')) {
    return "Ready to pick your bonus? I can explain each option and help you choose the best one.";
  }
  
  if (currentPage.includes('/quote/options')) {
    return "Hey! Need help picking a package? I can break down what's in each one.";
  }
  
  if (currentPage.includes('/quote/installation')) {
    return "Thinking about installation options? I can walk you through what's included.";
  }
  
  if (currentPage.includes('/quote/fuel-tank')) {
    return "Got questions about fuel tanks? I can help you figure out what you need.";
  }
  
  if (currentPage.includes('/quote/purchase-path')) {
    return "Hey! Deciding between pro install or DIY? I can walk you through the options.";
  }
  
  if (currentPage.includes('/quote/boat-info')) {
    return "Hey! Got questions about compatibility or controls? I'm here to help.";
  }
  
  if (currentPage.includes('/quote/trade-in')) {
    return "Hey! Got something to trade? Tell me what you've got and I'll give you a ballpark.";
  }
  
  if (currentPage.includes('/quote/summary')) {
    return "Looking over your quote? Let me know if you have any questions about pricing or next steps.";
  }
  
  if (currentPage.includes('/quote/schedule')) {
    return "Ready to book? Let me know if you have any questions about the consultation.";
  }

  // Motor selection with motor context
  if ((currentPage === '/' || currentPage.includes('/quote/motor')) && motor && hp > 0) {
    return `Hey! Checking out the ${hp}HP ${family}? Solid choice — what do you want to know about it?`;
  }

  // ============== OTHER PAGES ==============
  
  if (currentPage.includes('/financing')) {
    return "Curious about financing? I can help you figure out monthly payments and options.";
  }
  
  if (currentPage.includes('/promotions')) {
    const promoMsg = activePromo?.warranty_extra_years && activePromo.warranty_extra_years >= 4
      ? " The Get 7 deal is pretty sweet right now!"
      : "";
    return `Hey! Looking at the current deals?${promoMsg} I can help you find the best one.`;
  }
  
  if (currentPage.includes('/repower')) {
    return "Thinking about repowering? Tell me about your boat — I'll help you figure out if it makes sense.";
  }
  
  if (currentPage.includes('/contact')) {
    return "Hey! Got a question for the team? I can help with hours, directions, or anything else.";
  }

  // Default friendly greeting
  return "Hey! I'm here to help you find the perfect Mercury motor. What are you looking for?";
}

// Get boat type label for display
export function getBoatTypeLabel(typeId: string): string {
  const labels: Record<string, string> = {
    'pontoon': 'Pontoon',
    'v-hull-fishing': 'V-Hull Fishing Boat',
    'center-console': 'Center Console',
    'utility': 'Utility Boat',
    'inflatable': 'Inflatable/Dinghy',
    'jon-boat': 'Jon Boat',
    'bowrider': 'Bowrider',
    'deck-boat': 'Deck Boat',
    'bass-boat': 'Bass Boat',
    'aluminum-fishing': 'Aluminum Fishing Boat'
  };
  return labels[typeId] || typeId;
}

// Helper to check if current page is motor-focused (where motor prompts should take priority)
export function isMotorFocusedPage(pathname: string): boolean {
  const motorPages = ['/', '/quote/motor', '/repower', '/motors'];
  return motorPages.some(p => pathname === p || pathname.startsWith(p + '/'));
}
