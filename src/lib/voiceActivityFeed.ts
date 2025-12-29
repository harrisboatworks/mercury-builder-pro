/**
 * Voice Activity Feed System
 * Dispatches activity cards to the text chat when the voice agent takes meaningful actions
 * that warrant persistent, clickable UI (not just toasts)
 */

export type VoiceActivityType = 
  | 'search'      // Searched inventory, found motors
  | 'navigate'    // Navigated to a page
  | 'action'      // Took an action (added to quote, scheduled callback)
  | 'info'        // Provided information (trade-in estimate, comparison)
  | 'promo';      // Showed promotions/deals

export interface VoiceActivityAction {
  label: string;
  path?: string;          // For navigation links
  action?: string;        // For custom actions like 'apply_trade_in'
  actionData?: Record<string, unknown>;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export interface VoiceActivityEvent {
  id: string;
  type: VoiceActivityType;
  icon?: string;          // Emoji or icon name
  title: string;
  description: string;
  data?: Record<string, unknown>;
  actions?: VoiceActivityAction[];
  timestamp: Date;
}

export const VOICE_ACTIVITY_EVENT = 'voice-activity';

/**
 * Dispatch a voice activity event that chat widgets can listen for
 * Only call this when there's something worth showing in chat (links, buttons, data)
 */
export function dispatchVoiceActivity(activity: Omit<VoiceActivityEvent, 'id' | 'timestamp'>): void {
  const event: VoiceActivityEvent = {
    ...activity,
    id: `activity_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date(),
  };
  
  console.log('[VoiceActivity] Dispatching:', event.type, event.title);
  window.dispatchEvent(new CustomEvent(VOICE_ACTIVITY_EVENT, { detail: event }));
}

/**
 * Helper: Show trade-in estimate with apply button
 */
export function showTradeInEstimate(data: {
  brand: string;
  year: number;
  horsepower: number;
  condition: string;
  estimatedValue: number;
  valueRange?: { low: number; high: number };
}): void {
  dispatchVoiceActivity({
    type: 'info',
    icon: '💰',
    title: 'Trade-In Estimate',
    description: `${data.year} ${data.brand} ${data.horsepower}HP (${data.condition}): $${data.estimatedValue.toLocaleString()}`,
    data,
    actions: [
      { label: 'Apply to Quote', action: 'apply_trade_in', actionData: data, variant: 'primary' },
      { label: 'Get Exact Value', path: '/contact', variant: 'secondary' },
    ],
  });
}

/**
 * Helper: Show motor recommendation cards
 */
export function showMotorRecommendations(motors: Array<{
  id: string;
  model: string;
  horsepower: number;
  price?: number;
  inStock?: boolean;
}>): void {
  if (motors.length === 0) return;
  
  dispatchVoiceActivity({
    type: 'search',
    icon: '⭐',
    title: 'Recommended Motors',
    description: `Found ${motors.length} motor${motors.length > 1 ? 's' : ''} that match your needs`,
    data: { motors },
    actions: motors.slice(0, 2).map(m => ({
      label: `${m.horsepower}HP ${m.model.split(' ').slice(-1)[0]}`,
      path: `/motors/${m.id}`,
      variant: 'primary' as const,
    })),
  });
}

/**
 * Helper: Show comparison result
 */
export function showMotorComparison(comparison: {
  motor1: { model: string; hp: number; price: number };
  motor2: { model: string; hp: number; price: number };
  recommendation?: string;
}): void {
  dispatchVoiceActivity({
    type: 'info',
    icon: '⚖️',
    title: 'Motor Comparison',
    description: `${comparison.motor1.hp}HP vs ${comparison.motor2.hp}HP`,
    data: comparison,
    actions: [
      { label: 'View Full Comparison', path: '/compare', variant: 'primary' },
    ],
  });
}

/**
 * Helper: Show callback confirmation
 */
export function showCallbackConfirmation(data: {
  customerName: string;
  preferredTime: string;
  phone: string;
}): void {
  dispatchVoiceActivity({
    type: 'action',
    icon: '📞',
    title: 'Callback Scheduled',
    description: `We'll call ${data.customerName} ${data.preferredTime}`,
    data,
    actions: [
      { label: 'View Contact Info', path: '/contact', variant: 'secondary' },
    ],
  });
}

/**
 * Helper: Show current deals/promotions
 */
export function showCurrentDeals(promos: Array<{
  name: string;
  description: string;
  discount?: number;
}>): void {
  if (promos.length === 0) return;
  
  dispatchVoiceActivity({
    type: 'promo',
    icon: '🎉',
    title: 'Current Deals',
    description: promos[0].name,
    data: { promos },
    actions: [
      { label: 'View All Deals', path: '/promotions', variant: 'primary' },
    ],
  });
}
