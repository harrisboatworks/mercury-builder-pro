import { supabase } from '@/integrations/supabase/client';
import { calculateEnhancedLeadScore, triggerHotLeadWebhooks } from './webhooks';
import { generateSMSMessage } from './smsTemplates';

export interface LeadData {
  motor_model?: string;
  motor_hp?: number;
  base_price?: number;
  final_price?: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  lead_status: 'downloaded' | 'scheduled' | 'contacted' | 'closed';
  lead_source: 'pdf_download' | 'consultation';
  anonymous_session_id?: string;
  quote_data?: any;
}

export async function saveLead(leadData: LeadData) {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Generate anonymous session ID if user not authenticated
  const sessionId = user ? undefined : `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Calculate enhanced lead score
  const leadScore = calculateEnhancedLeadScore(leadData);
  
  const leadRecord = {
    user_id: user?.id || null,
    customer_name: leadData.customer_name || null,
    customer_email: leadData.customer_email || user?.email || null,
    customer_phone: leadData.customer_phone || null,
    motor_model_id: null, // We could enhance this later
    base_price: leadData.base_price || 0,
    final_price: leadData.final_price || 0,
    deposit_amount: 0,
    loan_amount: 0,
    monthly_payment: 0,
    term_months: 60,
    total_cost: leadData.final_price || 0,
    lead_status: leadData.lead_status,
    lead_source: leadData.lead_source,
    anonymous_session_id: sessionId,
    lead_score: leadScore,
    // Temporarily set these required fields with default values
    discount_amount: 0,
    penalty_applied: false
  };

  console.log('Saving lead with enhanced score:', leadScore, leadRecord);

  const { data, error } = await supabase
    .from('customer_quotes')
    .insert(leadRecord)
    .select()
    .single();

  if (error) {
    console.error('Error saving lead:', error);
    throw error;
  }

  console.log('Lead saved successfully:', data);
  
  // Trigger hot lead webhooks if score is high
  if (leadScore >= 70) {
    console.log('High-score lead detected, triggering webhooks...');
    try {
      await triggerHotLeadWebhooks({ ...data, lead_score: leadScore });
      
      // Send SMS alert for hot leads
      await triggerHotLeadSMS({
        customerName: data.customer_name || 'Unknown',
        leadScore: leadScore,
        finalPrice: data.final_price || 0,
        motorModel: leadData.motor_model || 'Mercury Motor',
        phoneNumber: data.customer_phone,
      });
    } catch (error) {
      console.error('Error triggering hot lead notifications:', error);
      // Don't fail the lead save if notifications fail
    }
  }

  return data;
}

// Add SMS notification function
export async function triggerHotLeadSMS(leadData: {
  customerName: string;
  leadScore: number;
  finalPrice: number;
  motorModel: string;
  phoneNumber?: string;
}) {
  try {
    // Get admin SMS preferences (in a real app, this would be from database)
    const smsPreferences = JSON.parse(localStorage.getItem('sms_preferences') || '{}');
    
    if (!smsPreferences.hotLeads || !smsPreferences.phoneNumber) {
      console.log('Hot lead SMS alerts disabled or no phone number configured');
      return;
    }

    const message = generateSMSMessage('hot_lead', {
      customerName: leadData.customerName,
      leadScore: leadData.leadScore,
      finalPrice: leadData.finalPrice,
      motorModel: leadData.motorModel,
    });

    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: {
        to: smsPreferences.phoneNumber,
        message: message,
        messageType: 'hot_lead',
        customerName: leadData.customerName,
        leadScore: leadData.leadScore,
        quoteAmount: leadData.finalPrice
      }
    });

    if (error) throw error;
    
    console.log('Hot lead SMS sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to send hot lead SMS:', error);
    throw error;
  }
}

function calculateLeadScore(leadData: LeadData): number {
  let score = 0;
  
  // Base score for showing interest
  score += 10;
  
  // Higher score for higher value motors
  if (leadData.final_price) {
    if (leadData.final_price > 50000) score += 30;
    else if (leadData.final_price > 30000) score += 20;
    else if (leadData.final_price > 15000) score += 10;
  }
  
  // Higher score if contact info provided
  if (leadData.customer_name) score += 15;
  if (leadData.customer_email) score += 15;
  if (leadData.customer_phone) score += 20;
  
  return Math.min(score, 100); // Cap at 100
}

export async function updateLeadStatus(leadId: string, status: LeadData['lead_status'], notes?: string) {
  const updates: any = { 
    lead_status: status,
    notes: notes ? notes : undefined
  };
  
  if (status === 'contacted') {
    updates.last_contact_attempt = new Date().toISOString();
    
    // Get current contact_attempts count and increment it
    const { data: currentLead } = await supabase
      .from('customer_quotes')
      .select('contact_attempts')
      .eq('id', leadId)
      .single();
    
    updates.contact_attempts = (currentLead?.contact_attempts || 0) + 1;
  }

  const { data, error } = await supabase
    .from('customer_quotes')
    .update(updates)
    .eq('id', leadId)
    .select()
    .single();

  if (error) throw error;
  return data;
}