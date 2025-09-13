// Webhook utilities for Zapier integration
import { supabase } from '@/integrations/supabase/client';

export type WebhookType = 'hot_lead' | 'new_lead_summary' | 'follow_up_reminder' | 'quote_delivery' | 'manual_trigger';

export interface WebhookPayload {
  type: WebhookType;
  timestamp: string;
  data: Record<string, any>;
}

export interface WebhookConfig {
  id: string;
  name: string;
  webhook_url: string;
  webhook_type: WebhookType;
  is_active: boolean;
  test_payload: Record<string, any>;
}

// Get active webhooks for a specific type
export async function getActiveWebhooks(type: WebhookType): Promise<WebhookConfig[]> {
  const { data, error } = await supabase
    .from('webhook_configurations')
    .select('*')
    .eq('webhook_type', type)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching webhooks:', error);
    return [];
  }

  return data || [];
}

// Trigger a webhook with payload
export async function triggerWebhook(
  webhookUrl: string, 
  payload: WebhookPayload, 
  configId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Triggering webhook:', webhookUrl, payload);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'no-cors', // Handle CORS for external webhooks
      body: JSON.stringify(payload),
    });

    // Log the webhook activity
    if (configId) {
      await logWebhookActivity(configId, payload.type, payload, 'success');
    }

    return { success: true };
  } catch (error) {
    console.error('Webhook trigger failed:', error);
    
    // Log the failure
    if (configId) {
      await logWebhookActivity(configId, payload.type, payload, 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
    
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Log webhook activity
export async function logWebhookActivity(
  webhookConfigId: string,
  triggerType: string,
  payload: WebhookPayload,
  status: 'success' | 'failed' | 'pending',
  errorMessage?: string
) {
  const { error } = await supabase
    .from('webhook_activity_logs')
    .insert({
      webhook_config_id: webhookConfigId,
      trigger_type: triggerType,
      payload: payload.data,
      status,
      error_message: errorMessage,
      triggered_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error logging webhook activity:', error);
  }
}

// Trigger webhooks for hot leads
export async function triggerHotLeadWebhooks(leadData: any) {
  const webhooks = await getActiveWebhooks('hot_lead');
  
  const payload: WebhookPayload = {
    type: 'hot_lead',
    timestamp: new Date().toISOString(),
    data: {
      lead_id: leadData.id,
      customer_name: leadData.customer_name,
      customer_email: leadData.customer_email,
      customer_phone: leadData.customer_phone,
      lead_score: leadData.lead_score,
      final_price: leadData.final_price,
      motor_model: leadData.motor_model_id,
      created_at: leadData.created_at,
      lead_source: leadData.lead_source,
      urgency: 'HIGH',
      action_required: 'Immediate follow-up recommended',
    }
  };

  const results = await Promise.all(
    webhooks.map(webhook => 
      triggerWebhook(webhook.webhook_url, payload, webhook.id)
    )
  );

  console.log(`Triggered ${webhooks.length} hot lead webhooks`, results);
  return results;
}

// Trigger webhooks for quote delivery
export async function triggerQuoteDeliveryWebhooks(quoteData: any) {
  const webhooks = await getActiveWebhooks('quote_delivery');
  
  const payload: WebhookPayload = {
    type: 'quote_delivery',
    timestamp: new Date().toISOString(),
    data: {
      quote_id: quoteData.id,
      quote_number: quoteData.quote_number,
      customer_name: quoteData.customer_name,
      customer_email: quoteData.customer_email,
      total_price: quoteData.total_price,
      motor_model: quoteData.motor_model,
      pdf_url: quoteData.pdf_url,
      created_at: quoteData.created_at,
      follow_up_sequence: 'quote_delivered',
    }
  };

  const results = await Promise.all(
    webhooks.map(webhook => 
      triggerWebhook(webhook.webhook_url, payload, webhook.id)
    )
  );

  console.log(`Triggered ${webhooks.length} quote delivery webhooks`, results);
  return results;
}

// Trigger manual webhook for testing
export async function triggerManualWebhook(webhookConfig: WebhookConfig, testData?: any) {
  const payload: WebhookPayload = {
    type: 'manual_trigger',
    timestamp: new Date().toISOString(),
    data: testData || webhookConfig.test_payload || {
      test: true,
      webhook_name: webhookConfig.name,
      triggered_by: 'admin',
      message: 'This is a test webhook trigger from the admin panel',
    }
  };

  return await triggerWebhook(webhookConfig.webhook_url, payload, webhookConfig.id);
}

// Enhanced lead scoring algorithm
export function calculateEnhancedLeadScore(leadData: any): number {
  let score = 0;
  
  // Base price scoring (0-30 points)
  const price = leadData.final_price || 0;
  if (price > 50000) score += 30;
  else if (price > 30000) score += 25;
  else if (price > 15000) score += 20;
  else if (price > 8000) score += 15;
  else score += 10;
  
  // Contact information completeness (0-25 points)
  if (leadData.customer_email) score += 10;
  if (leadData.customer_phone) score += 10;
  if (leadData.customer_name && leadData.customer_name.trim().length > 2) score += 5;
  
  // Lead source quality (0-20 points)
  if (leadData.lead_source === 'website_form') score += 20;
  else if (leadData.lead_source === 'phone_inquiry') score += 18;
  else if (leadData.lead_source === 'pdf_download') score += 15;
  else if (leadData.lead_source === 'chat_widget') score += 12;
  else score += 10;
  
  // Motor specifications (0-15 points)
  if (leadData.motor_model_id) score += 10;
  if (leadData.base_price && leadData.base_price > 0) score += 5;
  
  // Timing factors (0-10 points)
  const now = new Date();
  const created = new Date(leadData.created_at);
  const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff < 1) score += 10; // Very recent
  else if (hoursDiff < 4) score += 8;
  else if (hoursDiff < 12) score += 6;
  else if (hoursDiff < 24) score += 4;
  else score += 2;
  
  return Math.min(100, Math.max(0, Math.round(score)));
}