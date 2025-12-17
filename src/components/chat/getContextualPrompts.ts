// Dynamic contextual prompts based on motor type, boat info, and current page
// Written in friendly, conversational language

interface Motor {
  model: string;
  hp?: number;
  horsepower?: number;
}

interface BoatInfo {
  type?: string;
  length?: string;
  year?: string;
  make?: string;
  model?: string;
}

// Conversational prompts that feel like asking a friend
export function getContextualPrompts(
  motor: Motor | null,
  boatInfo: BoatInfo | null,
  currentPage: string
): string[] {
  // Motor selection page
  if (currentPage === '/' || currentPage.includes('/quote/motor')) {
    if (!motor) {
      return [
        "Help me pick the right motor",
        "What size do I need for my boat?",
        "Any deals going on right now?"
      ];
    }
  }

  // Quote summary page
  if (currentPage.includes('/quote/summary')) {
    return [
      "Can you get me a better price?",
      "What are my financing options?",
      "Walk me through my quote"
    ];
  }

  // Options page
  if (currentPage.includes('/quote/options')) {
    return [
      "What's in the Complete package?",
      "Is the warranty worth it?",
      "Help me pick a package"
    ];
  }

  // Purchase path page - LOOSE vs INSTALLED decision (NOT tiller vs remote)
  if (currentPage.includes('/quote/purchase-path')) {
    return [
      "Should I do DIY or pro install?",
      "What's included in pro install?",
      "Can I pick it up and install later?"
    ];
  }

  // Boat info page
  if (currentPage.includes('/quote/boat-info')) {
    return [
      "Will this motor fit my boat?",
      "What controls do I need?",
      "Help me with my boat setup"
    ];
  }

  // Trade-in page
  if (currentPage.includes('/quote/trade-in')) {
    return [
      "What's my motor worth?",
      "What do you accept for trade?",
      "How do trade-ins work?"
    ];
  }

  // Promotions page
  if (currentPage.includes('/promotions')) {
    return [
      "What's the best deal right now?",
      "When do these promos end?",
      "Can I stack promotions?"
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
      "Can I pay it off early?"
    ];
  }

  // Contact page
  if (currentPage.includes('/contact')) {
    return [
      "What are your hours?",
      "Can I come see the motors?",
      "Do you do test runs?"
    ];
  }

  // No motor context - general prompts
  if (!motor) {
    return [
      "What motor fits my boat?",
      "Any good deals right now?",
      "Tell me about financing"
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
      `Best boats for this ${hp}HP?`
    ];
  }

  // ProKicker-specific prompts
  if (modelLower.includes('prokicker')) {
    return [
      "What's a ProKicker for?",
      "Best trolling speed?",
      "ProKicker vs regular 9.9?"
    ];
  }

  // High HP motors (115+)
  if (hp >= 115) {
    return [
      `Compare to the ${hp >= 200 ? hp - 50 : hp + 40}HP`,
      "Fuel economy at cruise?",
      "Is this too much power?"
    ];
  }

  // Mid-range motors (40-114)
  if (hp >= 40) {
    return [
      `Is ${hp}HP enough for me?`,
      "What warranty comes with it?",
      `${hp} vs ${hp + 25}HP — which one?`
    ];
  }

  // Small motors (<40HP)
  return [
    `What boats work with ${hp}HP?`,
    "Good for fishing?",
    "How's the fuel economy?"
  ];
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
