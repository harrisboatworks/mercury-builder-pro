import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { composeVoiceSystemPrompt, VOICE_SYSTEM_PROMPT } from '../../../supabase/functions/_shared/voice-system-prompt';
import type { CustomerKnowledge } from '../../../supabase/functions/_shared/customer-knowledge-context';

const knowledge: CustomerKnowledge = {
  business: {
    name: 'Harris Boat Works',
    contact: { hours: { monSat: 'STALE-HOURS', sun: 'STALE-SUNDAY', note: 'STALE-SEASON' } },
  },
  businessPublished: false,
  motors: [], promotions: [], financing: [],
};

describe('voice session policy and current knowledge', () => {
  it('does not promote fallback hours to live authority', () => {
    const result = composeVoiceSystemPrompt(knowledge);
    expect(result).toContain('BUSINESS HOURS UNAVAILABLE');
    expect(result).not.toContain('STALE-HOURS');
    expect(result).not.toContain('STALE-SUNDAY');
    expect(result).not.toContain('STALE-SEASON');
    expect(result).not.toContain('PUBLISHED BUSINESS PROFILE');
    expect(result).toContain('This is not evidence that no offer is active');
  });

  it('takes published hours and financing terms from the supplied facts, not fixed prompt defaults', () => {
    const result = composeVoiceSystemPrompt({
      ...knowledge, businessPublished: true,
      business: { contact: { hours: { monSat: '10:00-14:00', sun: 'By confirmation', note: 'Synthetic schedule' } } },
      financing: [{ name: 'Synthetic offer', rate: 6.25, term_months: 48, min_amount: 4321 }],
    });
    expect(result).toContain('10:00-14:00');
    expect(result).toContain('By confirmation');
    expect(result).toContain('6.25% APR');
    expect(result).toContain('48-month term');
    expect(result).toContain('4,321');
    expect(result).not.toContain('7.99%');
    expect(result).not.toContain('$349');
    expect(result).not.toContain('61 years');
  });

  it('keeps session values subordinate to fresh tool receipts and uses actual quote tools', () => {
    const result = composeVoiceSystemPrompt(knowledge, ['Viewed motor: synthetic', 'Quote value: $123']);
    expect(result).toContain('Viewed motor: synthetic');
    expect(result).toContain('not a fresh price, valuation, inventory or action receipt');
    expect(result).toContain('get_quote_status');
    expect(result).toContain('update_boat_info');
    expect(result).toContain('reminder_type');
    expect(result).not.toContain('get_quote_summary');
    expect(result).not.toContain('set_boat_details');
    expect(VOICE_SYSTEM_PROMPT).toContain('Omit hours when unknown; never turn unknown into zero');
    expect(VOICE_SYSTEM_PROMPT).toContain('Do not give an estimate on failure');
  });

  it('requires trade inputs before invocation and does not misdiagnose provider outages', () => {
    const result = composeVoiceSystemPrompt(knowledge);
    expect(result).toContain('Before calling estimate_trade_value, require both confirmed engine architecture and condition');
    expect(result).toContain('ask for it first and do not call the tool yet');
    expect(result).toContain('Unknown is not confirmed');
    expect(result).toContain('service-unavailable, timeout or rate-limit result is not evidence that model, hours or another input is missing');
    expect(result).toContain('only when the tool explicitly identifies that field and it has not already been provided');
    expect(result).toContain('Do not repeat an identical failed call unless the inputs change or the customer explicitly asks');
  });

  it('wires the shared policy into the token response used for website session overrides', () => {
    const tokenSource = readFileSync('supabase/functions/elevenlabs-conversation-token/index.ts', 'utf8');
    const hookSource = readFileSync('src/hooks/useElevenLabsVoice.ts', 'utf8');
    expect(tokenSource).toContain('return composeVoiceSystemPrompt(liveKnowledge');
    expect(tokenSource).not.toContain('DECODE the model name and ANSWER DIRECTLY');
    expect(tokenSource).not.toContain('Premium supercharged performance');
    expect(tokenSource).not.toContain('FINANCING MINIMUM THRESHOLD');
    expect(hookSource).toContain('prompt: { prompt: tokenData.systemPrompt }');
  });
});
