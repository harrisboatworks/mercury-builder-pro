import { beforeEach, describe, expect, it, vi } from 'vitest';

const invoke = vi.hoisted(() => vi.fn());
const toastSuccess = vi.hoisted(() => vi.fn());

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke,
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccess,
    error: vi.fn(),
  },
}));

import {
  buildChatMotorContext,
  buildChatQuoteProgress,
  executeConfirmedChatWrite,
  extractMarkedObject,
  formatAccessoryCount,
  formatSelectedQuoteLabel,
  getChatWriteSuccessCopy,
  parseAssistantCommandMarkers,
  stripStreamingCommandMarkers,
  type ChatPendingWrite,
} from './chatSessionHelpers';
import {
  getChatPageCategory,
  getMobileDrawerBottom,
  getMobileLauncherBottom,
  isPhoneQuoteNavPath,
} from './chatLayout';

const leadWrite = (overrides: Partial<ChatPendingWrite['payload']> = {}): ChatPendingWrite => ({
  kind: 'lead',
  title: 'Have Harris call you back?',
  description: 'We will pass this to the Harris team. Nothing is sent until you confirm.',
  details: [
    { label: 'Name', value: 'Jay' },
    { label: 'Phone', value: '905-555-1234' },
  ],
  payload: {
    name: 'Jay',
    phone: '905-555-1234',
    conversationContext: 'Customer requested callback',
    currentPage: '/quote/summary',
    ...overrides,
  },
});

describe('formatAccessoryCount', () => {
  it('uses singular and plural accessory wording', () => {
    expect(formatAccessoryCount(1)).toBe('1 accessory');
    expect(formatAccessoryCount(2)).toBe('2 accessories');
    expect(formatAccessoryCount(2)).not.toMatch(/accessoryies/);
  });
});

describe('buildChatQuoteProgress', () => {
  it('uses the live quote stepper instead of the retired 6-step map', () => {
    const installed = buildChatQuoteProgress('/quote/summary', {
      purchasePath: 'installed',
      motor: { id: 'm1' },
      hasTradein: true,
      selectedOptions: [{ name: 'SmartCraft Connect' }],
      tradeInInfo: { estimatedValue: 1200 },
    });

    expect(installed.step).toBe(8);
    expect(installed.total).toBe(9);
    expect(installed.selectedPackage).toBe('1 accessory');
    expect(installed.tradeInValue).toBe(1200);

    const looseOptions = buildChatQuoteProgress('/quote/options', {
      purchasePath: 'loose',
      motor: { id: 'm1' },
    });
    expect(looseOptions.step).toBe(2);
    expect(looseOptions.total).toBe(7);

    const boatInfoHiddenWhenLoose = buildChatQuoteProgress('/quote/boat-info', {
      purchasePath: 'loose',
    });
    expect(boatInfoHiddenWhenLoose.step).toBe(1);
  });

  it('prefers the live package label and pluralizes accessory counts', () => {
    expect(formatSelectedQuoteLabel({ label: 'Motor-only pickup' }, [
      { name: 'SmartCraft Connect' },
      { name: '25L fuel tank' },
    ])).toBe('Motor-only pickup');

    const twoAccessories = buildChatQuoteProgress('/quote/options', {
      purchasePath: 'installed',
      motor: { id: 'm1' },
      selectedOptions: [{ name: 'SmartCraft Connect' }, { name: '25L fuel tank' }],
    });
    expect(twoAccessories.selectedPackage).toBe('2 accessories');
    expect(twoAccessories.step).toBe(2);
    expect(twoAccessories.total).toBe(9);
  });

  it('treats bare /quote as the motor-selection step', () => {
    expect(buildChatQuoteProgress('/quote', { motor: { id: 'm1' } })).toEqual(
      buildChatQuoteProgress('/quote/motor-selection', { motor: { id: 'm1' } }),
    );
  });
});

describe('buildChatMotorContext', () => {
  it('prefers model_display and listed price fields', () => {
    expect(buildChatMotorContext(null)).toBeNull();
    expect(buildChatMotorContext({
      id: 'abc',
      model: '115ELPT',
      model_display: '115 ELPT FourStroke',
      hp: 115,
      msrp: 13750,
      family: 'FourStroke',
    })).toEqual({
      id: 'abc',
      model: '115 ELPT FourStroke',
      hp: 115,
      price: 13750,
      family: 'FourStroke',
      description: undefined,
      features: undefined,
    });
  });

  it('prefers the effective customer price over MSRP metadata', () => {
    expect(buildChatMotorContext({
      model: '115ELPT',
      hp: 115,
      price: 11990,
      salePrice: 12500,
      msrp: 13750,
    })?.price).toBe(11990);
  });
});

describe('stripStreamingCommandMarkers', () => {
  it('hides every command marker the model can emit mid-stream', () => {
    const raw = 'Here you go [LEAD_CAPTURE: {"name":"Jay"}]\n[SEND_SMS: {"phone":"555"}]\n[PRICE_ALERT: {"hp":115}]\n[FINANCING_CTA: {"price":9000}]';
    expect(stripStreamingCommandMarkers(raw)).toBe('Here you go');
  });

  it('removes duplicate and incomplete streaming markers', () => {
    const duplicate = 'Thanks [LEAD_CAPTURE: {"name":"Jay"}] extra [LEAD_CAPTURE: {"name":"Jay"}]';
    expect(stripStreamingCommandMarkers(duplicate)).toBe('Thanks extra');
    expect(stripStreamingCommandMarkers('Hello [LEAD_CAPTURE: {"name":')).toBe('Hello');
  });
});

describe('parseAssistantCommandMarkers', () => {
  beforeEach(() => {
    invoke.mockReset();
  });

  it('extracts nested marker JSON and never treats parsing as consent', () => {
    const nested = extractMarkedObject(
      'LEAD_CAPTURE',
      'Thanks [LEAD_CAPTURE: {"name":"Jay","phone":"905-555-1234","email":"jay@example.com","nested":{"ok":true}}]',
    );
    expect(nested).toMatchObject({ name: 'Jay', phone: '905-555-1234' });

    const parsed = parseAssistantCommandMarkers(
      'Got it. [LEAD_CAPTURE: {"name":"Jay","phone":"905-555-1234"}]',
      { currentPage: '/quote/summary' },
    );
    expect(parsed.displayText).toBe('Got it.');
    expect(parsed.pendingWrite?.kind).toBe('lead');
    expect(parsed.pendingWrite?.payload.phone).toBe('905-555-1234');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('drops write markers with invalid phones and does not create a pending write', () => {
    const parsed = parseAssistantCommandMarkers(
      'Sure [SEND_SMS: {"name":"Jay","phone":"nope"}]',
      { currentPage: '/quote/summary' },
    );
    expect(parsed.displayText).toBe('Sure');
    expect(parsed.pendingWrite).toBeUndefined();
    expect(invoke).not.toHaveBeenCalled();
  });

  it('requires 10 to 15 phone digits and strips every duplicate write marker', () => {
    const rejected = parseAssistantCommandMarkers(
      'Sure [SEND_SMS: {"name":"Jay","phone":"5551234"}]',
      { currentPage: '/quote/summary' },
    );
    expect(rejected.pendingWrite).toBeUndefined();

    const duplicate = parseAssistantCommandMarkers(
      'Thanks [LEAD_CAPTURE: {"name":"Jay","phone":"905-555-1234"}] extra [LEAD_CAPTURE: {"name":"Jay","phone":"905-555-1234"}]',
      { currentPage: '/quote/summary' },
    );
    expect(duplicate.displayText).toBe('Thanks extra');
    expect(duplicate.pendingWrite?.kind).toBe('lead');
  });

  it('preserves numeric motor horsepower in a pending price-alert request', () => {
    const parsed = parseAssistantCommandMarkers(
      'I can set that up. [PRICE_ALERT: {"phone":"905-555-1234","motor_hp":20}]',
      { currentPage: '/quote/summary' },
    );

    expect(parsed.pendingWrite?.kind).toBe('price_alert');
    expect(parsed.pendingWrite?.payload.conversationContext).toBe('Price drop alert for 20HP motor');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('parses and preserves every non-writing CTA card', () => {
    const parsed = parseAssistantCommandMarkers(
      'Here are the next steps. ' +
        '[TRADEIN_CTA: {"action":"quote","currentMotor":"90HP"}] ' +
        '[SERVICE_CTA: {"issue":"rough idle","urgency":"normal"}] ' +
        '[REPOWER_CTA: {"targetHP":115,"hasGuide":true}]',
      { currentPage: '/quote/motor-selection' },
    );

    expect(parsed.displayText).toBe('Here are the next steps.');
    expect(parsed.tradeInCTA).toEqual({ action: 'quote', currentMotor: '90HP' });
    expect(parsed.serviceCTA).toEqual({ issue: 'rough idle', urgency: 'normal' });
    expect(parsed.repowerCTA).toEqual({ targetHP: 115, hasGuide: true });
    expect(invoke).not.toHaveBeenCalled();
  });
});

describe('executeConfirmedChatWrite', () => {
  beforeEach(() => {
    invoke.mockReset();
    toastSuccess.mockReset();
    invoke.mockResolvedValue({ data: {}, error: null });
  });

  it('is the only write path and fail-closes on invalid phone data', async () => {
    await expect(executeConfirmedChatWrite(leadWrite({ phone: 'nope' }))).rejects.toThrow(/phone/i);
    expect(invoke).not.toHaveBeenCalled();

    await executeConfirmedChatWrite(leadWrite());
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith('capture-chat-lead', expect.objectContaining({
      body: expect.objectContaining({
        name: 'Jay',
        phone: '905-555-1234',
      }),
    }));
    expect(toastSuccess).toHaveBeenCalledWith('Callback request sent to the team.');
  });

  it('routes a confirmed SMS only after its marker has been parsed without a write', async () => {
    const parsed = parseAssistantCommandMarkers(
      'Review this first. [SEND_SMS: {"name":"Jay","phone":"905-555-1234","content":"comparison","motors":["20HP","25HP"]}]',
      { currentPage: '/quote/motor-selection' },
    );

    expect(parsed.pendingWrite?.kind).toBe('sms');
    expect(invoke).not.toHaveBeenCalled();

    await executeConfirmedChatWrite(parsed.pendingWrite!);
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith('voice-send-follow-up', expect.objectContaining({
      body: expect.objectContaining({
        customer_phone: '905-555-1234',
        message_type: 'comparison',
        motor_model: '20HP vs 25HP',
      }),
    }));
    expect(toastSuccess).toHaveBeenCalledWith('Text sent! Check your phone.');
  });
});

describe('chat consent completion copy', () => {
  it('matches the confirmed action without adding a callback promise', () => {
    expect(getChatWriteSuccessCopy('sms')).toBe('Confirmed. The text was sent.');
    expect(getChatWriteSuccessCopy('price_alert')).toBe('Confirmed. The team has your price-alert request.');
    expect(getChatWriteSuccessCopy('lead')).toBe('Confirmed. The team has your callback request.');
  });
});

describe('chat launcher layout', () => {
  it('lifts the phone launcher above quote sticky nav and docks the drawer to the bottom', () => {
    expect(isPhoneQuoteNavPath('/quote')).toBe(true);
    expect(isPhoneQuoteNavPath('/quote/summary')).toBe(true);
    expect(isPhoneQuoteNavPath('/promotions')).toBe(true);
    expect(isPhoneQuoteNavPath('/financing')).toBe(false);
    expect(getMobileLauncherBottom('/quote/options')).toContain('10.5rem');
    expect(getMobileLauncherBottom('/contact')).toContain('1rem');
    expect(getMobileDrawerBottom()).toBe('0px');
  });

  it('keeps bare and nested quote routes in one persistence category', () => {
    expect(getChatPageCategory('/quote')).toBe('quote');
    expect(getChatPageCategory('/quote/motor-selection')).toBe('quote');
    expect(getChatPageCategory('/repower/cost')).toBe('repower');
  });
});
