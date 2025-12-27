/**
 * Voice Navigation Event System
 * Allows the ElevenLabs voice agent to control page navigation and filtering
 */

export type VoiceNavigationEvent = 
  | { type: 'filter_motors'; payload: { horsepower?: number; model?: string; inStock?: boolean } }
  | { type: 'navigate'; payload: { path: string } }
  | { type: 'show_motor'; payload: { motorId: string } }
  | { type: 'add_motor_to_quote'; payload: { motor: MotorForQuote } }
  | { type: 'set_purchase_path'; payload: { path: 'loose' | 'installed' } }
  | { type: 'read_quote_summary'; payload: Record<string, never> }
  | { type: 'update_boat_info'; payload: { length?: number; type?: string; make?: string; currentHp?: number } }
  | { type: 'navigate_quote_step'; payload: { step: 'motor' | 'path' | 'boat' | 'trade-in' | 'summary' | 'schedule' } }
  | { type: 'apply_trade_in'; payload: { brand: string; year: number; horsepower: number; condition?: string } }
  | { type: 'compare_motors'; payload: { motorIds: string[] } }
  | { type: 'send_motor_photos'; payload: { phone: string; motorModel: string } };

// Motor data structure for adding to quote
export interface MotorForQuote {
  id: string;
  model: string;
  horsepower: number;
  msrp?: number;
  salePrice?: number;
  inStock?: boolean;
}

export const VOICE_NAVIGATION_EVENT = 'voice-navigation';

/**
 * Dispatch a voice navigation event that components can listen to
 */
export function dispatchVoiceNavigation(event: VoiceNavigationEvent): void {
  window.dispatchEvent(new CustomEvent(VOICE_NAVIGATION_EVENT, { detail: event }));
}

/**
 * Helper to create a filter motors event
 */
export function filterMotors(options: { 
  horsepower?: number; 
  model?: string; 
  inStock?: boolean 
}): void {
  dispatchVoiceNavigation({ type: 'filter_motors', payload: options });
}

/**
 * Helper to navigate to a specific path
 */
export function navigateToPath(path: string): void {
  dispatchVoiceNavigation({ type: 'navigate', payload: { path } });
}

/**
 * Helper to show a specific motor by ID
 */
export function showMotor(motorId: string): void {
  dispatchVoiceNavigation({ type: 'show_motor', payload: { motorId } });
}

/**
 * Helper to set the purchase path (loose vs installed)
 */
export function setPurchasePath(path: 'loose' | 'installed'): void {
  dispatchVoiceNavigation({ type: 'set_purchase_path', payload: { path } });
}
