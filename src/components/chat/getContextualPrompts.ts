// Dynamic contextual prompts based on motor type, boat info, and current page

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

export function getContextualPrompts(
  motor: Motor | null,
  boatInfo: BoatInfo | null,
  currentPage: string
): string[] {
  // Page-specific prompts
  if (currentPage.includes('/quote/summary')) {
    return [
      "Can I get a better price?",
      "What financing options are available?",
      "Is my trade-in value accurate?"
    ];
  }

  if (currentPage.includes('/promotions')) {
    return [
      "When do these promotions end?",
      "Can I combine multiple promotions?",
      "What's the best current deal?"
    ];
  }

  if (currentPage.includes('/financing')) {
    return [
      "What credit score do I need?",
      "Can I pay off early?",
      "What documents do I need?"
    ];
  }

  if (currentPage.includes('/contact')) {
    return [
      "What are your hours?",
      "Do you offer test runs?",
      "Can I visit the dealership?"
    ];
  }

  // No motor context - general prompts
  if (!motor) {
    return [
      "What motor fits my boat?",
      "What are current promotions?",
      "Tell me about financing options"
    ];
  }

  // Get HP value
  const hp = motor.hp || motor.horsepower || 0;
  const modelLower = motor.model?.toLowerCase() || '';

  // Tiller-specific prompts
  const isTiller = modelLower.includes('tiller');
  if (isTiller) {
    return [
      `What boats work with a ${hp}HP tiller?`,
      "Clamp-on vs bolt-on mounting?",
      "Best tiller motor for fishing?"
    ];
  }

  // ProKicker-specific prompts
  const isProKicker = modelLower.includes('prokicker');
  if (isProKicker) {
    return [
      "What is a ProKicker used for?",
      "Best trolling speeds with ProKicker?",
      "ProKicker vs standard 9.9HP?"
    ];
  }

  // High HP motors (115+)
  if (hp >= 115) {
    const compareHP = hp >= 200 ? hp - 50 : hp + 40;
    return [
      `Compare ${hp}HP vs ${compareHP}HP`,
      "Fuel consumption at cruising speed?",
      "What's Command Thrust technology?"
    ];
  }

  // Mid-range motors (40-114)
  if (hp >= 40) {
    return [
      `Is ${hp}HP enough for my boat?`,
      "What warranty is included?",
      `Compare ${hp}HP vs ${hp + 25}HP`
    ];
  }

  // Small motors (<40HP)
  return [
    `What boats suit a ${hp}HP motor?`,
    "Is this good for fishing?",
    "Fuel efficiency of this motor?"
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
