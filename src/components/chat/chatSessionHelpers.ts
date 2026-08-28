import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getQuoteStepNumber, getVisibleQuoteSteps } from '@/components/quote-builder/quote-progress-steps';
import { parseFinancingCTA, type FinancingCTAData } from './FinancingCTACard';
import { parseTradeInCTA, type TradeInCTAData } from './TradeInCTACard';
import { parseServiceCTA, type ServiceCTAData } from './ServiceCTACard';
import { parseRepowerCTA, type RepowerCTAData } from './RepowerCTACard';
import { FINANCING_MINIMUM } from '@/lib/finance';

export interface ChatQuoteProgressInput {
  purchasePath?: 'loose' | 'installed' | null;
  motor?: unknown;
  hasTradein?: boolean;
  selectedOptions?: Array<{ name?: string }> | null;
  selectedPackage?: { label?: string } | null;
  tradeInInfo?: { estimatedValue?: number | null } | null;
}

export interface ChatQuoteProgress {
  step: number;
  total: number;
  selectedPackage: string | null;
  tradeInValue: number | null;
}

export interface ChatMotorLike {
  id?: string;
  model?: string;
  model_display?: string;
  hp?: number;
  horsepower?: number;
  price?: number;
  msrp?: number;
  sale_price?: number;
  salePrice?: number;
  family?: string;
  description?: string;
  features?: unknown;
}

export interface ChatStreamMotorContext {
  id?: string;
  model: string;
  hp: number;
  price?: number;
  family?: string;
  description?: string;
  features?: unknown;
}

const WRITE_MARKERS = ['LEAD_CAPTURE', 'SEND_SMS', 'PRICE_ALERT'] as const;
const DISPLAY_MARKERS = [
  ...WRITE_MARKERS,
  'FINANCING_CTA',
  'TRADEIN_CTA',
  'SERVICE_CTA',
  'REPOWER_CTA',
] as const;

export type ChatWriteKind = 'lead' | 'sms' | 'price_alert';
export type ChatWriteStatus = 'needs_consent' | 'sending' | 'sent' | 'declined' | 'error';

export function getChatWriteSuccessCopy(kind: ChatWriteKind): string {
  if (kind === 'sms') return 'Confirmed. The text was sent.';
  if (kind === 'price_alert') return 'Confirmed. The team has your price-alert request.';
  return 'Confirmed. The team has your callback request.';
}

export interface ChatPendingWrite {
  kind: ChatWriteKind;
  title: string;
  description: string;
  details: Array<{ label: string; value: string }>;
  payload: Record<string, unknown>;
}

export function formatAccessoryCount(count: number): string {
  return `${count} ${count === 1 ? 'accessory' : 'accessories'}`;
}

export function formatSelectedQuoteLabel(
  selectedPackage?: { label?: string } | null,
  selectedOptions?: Array<{ name?: string }> | null,
): string | null {
  const packageLabel = selectedPackage?.label?.trim();
  if (packageLabel) return packageLabel;
  const count = selectedOptions?.length ?? 0;
  if (count < 1) return null;
  return formatAccessoryCount(count);
}

function quoteProgressPath(pathname: string): string {
  return pathname === '/quote' || pathname === '/quote/' ? '/quote/motor-selection' : pathname;
}

function customerFacingPrice(motor: ChatMotorLike): number | undefined {
  if (typeof motor.price === 'number') return motor.price;
  if (typeof motor.salePrice === 'number') return motor.salePrice;
  if (typeof motor.sale_price === 'number') return motor.sale_price;
  if (typeof motor.msrp === 'number') return motor.msrp;
  return undefined;
}

export function buildChatQuoteProgress(
  pathname: string,
  state: ChatQuoteProgressInput,
): ChatQuoteProgress {
  const progressState = {
    purchasePath: state.purchasePath,
    motor: state.motor,
    hasTradein: state.hasTradein,
  };
  const visible = getVisibleQuoteSteps(progressState);
  const step = getQuoteStepNumber(progressState, quoteProgressPath(pathname));

  return {
    step: step ?? 1,
    total: Math.max(visible.length, 1),
    selectedPackage: formatSelectedQuoteLabel(state.selectedPackage, state.selectedOptions),
    tradeInValue: state.tradeInInfo?.estimatedValue ?? null,
  };
}

export function buildChatMotorContext(motor: ChatMotorLike | null | undefined): ChatStreamMotorContext | null {
  if (!motor) return null;
  return {
    id: motor.id,
    model: motor.model_display || motor.model || '',
    hp: motor.hp || motor.horsepower || 0,
    price: customerFacingPrice(motor),
    family: motor.family,
    description: motor.description,
    features: motor.features,
  };
}

function extractBalancedJson(text: string, openBraceIndex: number): { raw: string; value: unknown } | null {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = openBraceIndex; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        const raw = text.slice(openBraceIndex, index + 1);
        try {
          return { raw, value: JSON.parse(raw) };
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

export function extractMarkedObject(label: string, text: string): Record<string, unknown> | null {
  const prefix = `[${label}:`;
  const start = text.indexOf(prefix);
  if (start < 0) return null;
  const brace = text.indexOf('{', start);
  if (brace < 0) return null;
  const extracted = extractBalancedJson(text, brace);
  if (!extracted || !extracted.value || typeof extracted.value !== 'object' || Array.isArray(extracted.value)) {
    return null;
  }
  return extracted.value as Record<string, unknown>;
}

function stripMarkedObject(text: string, label: string): string {
  const prefix = `[${label}:`;
  const start = text.indexOf(prefix);
  if (start < 0) return text;
  const brace = text.indexOf('{', start);
  if (brace < 0) return text.replace(prefix, '');
  const extracted = extractBalancedJson(text, brace);
  if (!extracted) {
    return `${text.slice(0, start)}${text.slice(start).replace(/\[[A-Z_]+:[^\]]*$/s, '')}`.trim();
  }
  const closeBracket = text.indexOf(']', start + prefix.length + extracted.raw.length - 1);
  const end = closeBracket >= 0 ? closeBracket + 1 : start + prefix.length + extracted.raw.length;
  return `${text.slice(0, start)}${text.slice(end)}`.replace(/\s+\n/g, '\n').trim();
}

function stripAllMarkedObjects(text: string, label: string): string {
  let current = text;
  while (current.includes(`[${label}:`)) {
    const next = stripMarkedObject(current, label);
    if (next === current) break;
    current = next;
  }
  return current;
}

export function stripStreamingCommandMarkers(text: string): string {
  return DISPLAY_MARKERS
    .reduce((current, label) => stripAllMarkedObjects(current, label), text)
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function asTrimmedString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function asFiniteNumberString(value: unknown): string | null {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : null;
}

function asValidPhone(value: unknown): string | null {
  const phone = asTrimmedString(value);
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return null;
  return phone;
}

function asValidName(value: unknown): string | null {
  const name = asTrimmedString(value);
  if (!name || name.length > 100) return null;
  return name;
}

function asValidEmail(value: unknown): string | null {
  const email = asTrimmedString(value);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) return null;
  return email;
}

export interface ParsedAssistantResponse {
  displayText: string;
  financingCTA?: FinancingCTAData;
  tradeInCTA?: TradeInCTAData;
  serviceCTA?: ServiceCTAData;
  repowerCTA?: RepowerCTAData;
  pendingWrite?: ChatPendingWrite;
}

export interface ParseAssistantCommandsOptions {
  currentPage: string;
  motor?: ChatMotorLike | null;
  conversationHistory?: Array<{ role: string; content: string }>;
}

function motorPayload(motor?: ChatMotorLike | null) {
  if (!motor) return undefined;
  return {
    model: motor.model_display || motor.model,
    hp: motor.hp || motor.horsepower,
    price: customerFacingPrice(motor),
  };
}

function buildLeadWrite(
  data: Record<string, unknown>,
  options: ParseAssistantCommandsOptions,
  kind: 'lead' | 'price_alert',
): ChatPendingWrite | null {
  const name = asValidName(data.name) || (kind === 'price_alert' ? 'Price Alert Subscriber' : null);
  const phone = asValidPhone(data.phone);
  if (!name || !phone) return null;
  const email = asValidEmail(data.email);
  const requestedHp = asTrimmedString(data.motor_hp) || asFiniteNumberString(data.motor_hp);
  const recentContext = (options.conversationHistory || []).slice(-4).map((entry) =>
    `${entry.role}: ${entry.content.substring(0, 100)}`,
  ).join(' | ');

  const details = [
    { label: 'Name', value: name },
    { label: 'Phone', value: phone },
  ];
  if (email) details.push({ label: 'Email', value: email });

  return {
    kind,
    title: kind === 'price_alert' ? 'Text you if the price changes?' : 'Have Harris call you back?',
    description: kind === 'price_alert'
      ? 'We will save this as a price-alert request. Nothing is sent until you confirm.'
      : 'We will pass this to the Harris team. Nothing is sent until you confirm.',
    details,
    payload: {
      name,
      phone,
      email: email || undefined,
      conversationContext: kind === 'price_alert'
        ? `Price drop alert for ${requestedHp || options.motor?.hp || 'unknown'}HP motor`
        : recentContext || 'Customer requested callback',
      currentPage: options.currentPage,
      motorContext: motorPayload(options.motor),
    },
  };
}

function buildSmsWrite(
  data: Record<string, unknown>,
  options: ParseAssistantCommandsOptions,
): ChatPendingWrite | null {
  const phone = asValidPhone(data.phone);
  if (!phone) return null;
  const name = asValidName(data.name) || 'Friend';
  const content = asTrimmedString(data.content);
  const motors = Array.isArray(data.motors)
    ? data.motors.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    kind: 'sms',
    title: 'Send this text to your phone?',
    description: 'This sends a follow-up SMS. Nothing is sent until you confirm.',
    details: [
      { label: 'Name', value: name },
      { label: 'Phone', value: phone },
    ],
    payload: {
      customer_name: name,
      customer_phone: phone,
      message_type: content === 'comparison'
        ? 'comparison'
        : content === 'promo_reminder'
          ? 'promo_reminder'
          : 'quote_interest',
      motor_model: options.motor?.model || (motors.length ? motors.join(' vs ') : undefined),
      motor_id: options.motor?.id,
      custom_note: content === 'comparison' && motors.length
        ? `Comparing: ${motors.join(' vs ')}`
        : undefined,
    },
  };
}

export function parseAssistantCommandMarkers(
  rawResponse: string,
  options: ParseAssistantCommandsOptions,
): ParsedAssistantResponse {
  let displayText = rawResponse;
  let pendingWrite: ChatPendingWrite | undefined;

  const leadData = extractMarkedObject('LEAD_CAPTURE', rawResponse);
  if (leadData) {
    displayText = stripAllMarkedObjects(displayText, 'LEAD_CAPTURE');
    pendingWrite = pendingWrite || buildLeadWrite(leadData, options, 'lead') || undefined;
  }

  const smsData = extractMarkedObject('SEND_SMS', rawResponse);
  if (smsData) {
    displayText = stripAllMarkedObjects(displayText, 'SEND_SMS');
    pendingWrite = pendingWrite || buildSmsWrite(smsData, options) || undefined;
  }

  const alertData = extractMarkedObject('PRICE_ALERT', rawResponse);
  if (alertData) {
    displayText = stripAllMarkedObjects(displayText, 'PRICE_ALERT');
    pendingWrite = pendingWrite || buildLeadWrite(alertData, options, 'price_alert') || undefined;
  }

  let financingCTA: FinancingCTAData | undefined;
  const { displayText: afterFinancing, ctaData } = parseFinancingCTA(displayText);
  if (ctaData) {
    displayText = afterFinancing;
    if (ctaData.price >= FINANCING_MINIMUM) financingCTA = ctaData;
  }

  const tradeIn = parseTradeInCTA(displayText);
  if (tradeIn.ctaData) displayText = tradeIn.displayText;
  const service = parseServiceCTA(displayText);
  if (service.ctaData) displayText = service.displayText;
  const repower = parseRepowerCTA(displayText);
  if (repower.ctaData) displayText = repower.displayText;

  return {
    displayText: stripStreamingCommandMarkers(displayText).trim(),
    financingCTA,
    tradeInCTA: tradeIn.ctaData || undefined,
    serviceCTA: service.ctaData || undefined,
    repowerCTA: repower.ctaData || undefined,
    pendingWrite,
  };
}

export async function executeConfirmedChatWrite(write: ChatPendingWrite): Promise<void> {
  if (write.kind === 'sms') {
    const phone = asValidPhone(write.payload.customer_phone);
    if (!phone) throw new Error('A valid phone number is required.');
    const { error } = await supabase.functions.invoke('voice-send-follow-up', {
      body: {
        customer_name: write.payload.customer_name,
        customer_phone: phone,
        message_type: write.payload.message_type,
        motor_model: write.payload.motor_model,
        motor_id: write.payload.motor_id,
        custom_note: write.payload.custom_note,
      },
    });
    if (error) throw error;
    toast.success('Text sent! Check your phone.');
    return;
  }

  const phone = asValidPhone(write.payload.phone);
  const name = asValidName(write.payload.name);
  if (!phone || !name) throw new Error('A name and valid phone number are required.');
  const { error } = await supabase.functions.invoke('capture-chat-lead', {
    body: {
      name,
      phone,
      email: write.payload.email,
      conversationContext: write.payload.conversationContext,
      currentPage: write.payload.currentPage,
      motorContext: write.payload.motorContext,
    },
  });
  if (error) throw error;
  toast.success(write.kind === 'price_alert'
    ? 'Price-alert request saved.'
    : 'Callback request sent to the team.');
}

export const CHAT_ERROR_TEXT =
  "I'm sorry, I'm having trouble connecting. Tap **Retry** to try again, or text us at 647-952-2153.";
