// src/lib/quotesApi.ts
import { supabase } from '@/integrations/supabase/client';
import { triggerQuoteDeliveryWebhooks } from './webhooks';
import { generateSMSMessage } from './smsTemplates';

// --- Types ---
export type QuoteOption = { name: string; price: number };

export type CreateQuoteInput = {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  salesperson?: string;
  boat_model?: string;
  motor_model?: string;
  motor_hp?: number;
  base_price?: number;
  discount?: number;
  options?: QuoteOption[];
  tax_rate?: number; // default 13
  notes?: string;
};

// --- Existing helpers ---
export async function seedQuote() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await fetch('/api/quotes-seed', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(`Seed failed: ${res.status}`);
  return res.json();
}

export async function listQuotes(limit = 20) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await fetch(`/api/quotes-list?limit=${limit}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return res.json() as Promise<{ ok: boolean; quotes: any[] }>;
}

// --- New: create a real quote (POST) ---
export async function createQuote(input: CreateQuoteInput) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await fetch('/api/quotes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Create failed: ${res.status}`);
  }
  
  const result = await res.json();
  
  // Trigger quote delivery webhooks after successful quote creation
  if (result.ok && result.created) {
    console.log('Quote created successfully, triggering delivery webhooks...');
    try {
      await triggerQuoteDeliveryWebhooks(result.created);
      
      // Send SMS notification for quote delivery
      await triggerQuoteDeliverySMS(result.created);
    } catch (error) {
      console.error('Error triggering quote delivery notifications:', error);
      // Don't fail the quote creation if notifications fail
    }
  }
  
  return result as Promise<{ ok: true; created: any }>;
}

// Add SMS notification function for quote delivery
export async function triggerQuoteDeliverySMS(quoteData: any) {
  try {
    // Get admin SMS preferences (in a real app, this would be from database)
    const smsPreferences = JSON.parse(localStorage.getItem('sms_preferences') || '{}');
    
    if (!smsPreferences.quoteDelivered || !smsPreferences.phoneNumber) {
      console.log('Quote delivery SMS alerts disabled or no phone number configured');
      return;
    }

    const message = generateSMSMessage('quote_confirmation', {
      customerName: quoteData.customer_name,
      quoteNumber: quoteData.quote_number,
      totalPrice: quoteData.total_price,
      motorModel: quoteData.motor_model || 'Mercury Motor',
    });

    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: {
        to: smsPreferences.phoneNumber,
        message: message,
        messageType: 'quote_confirmation'
      }
    });

    if (error) throw error;
    
    console.log('Quote delivery SMS sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to send quote delivery SMS:', error);
    throw error;
  }
}
