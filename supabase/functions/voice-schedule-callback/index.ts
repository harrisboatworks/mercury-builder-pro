import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Parse natural language time to a scheduled datetime
 */
function parsePreferredTime(timeStr: string): { scheduledFor: Date | null; description: string } {
  const now = new Date();
  const lowerTime = (timeStr || '').toLowerCase().trim();
  
  // Parse relative times
  if (lowerTime.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (lowerTime.includes('morning')) {
      tomorrow.setHours(10, 0, 0, 0);
      return { scheduledFor: tomorrow, description: 'tomorrow morning around 10 AM' };
    } else if (lowerTime.includes('afternoon')) {
      tomorrow.setHours(14, 0, 0, 0);
      return { scheduledFor: tomorrow, description: 'tomorrow afternoon around 2 PM' };
    } else if (lowerTime.includes('evening')) {
      tomorrow.setHours(16, 0, 0, 0);
      return { scheduledFor: tomorrow, description: 'tomorrow late afternoon around 4 PM' };
    } else {
      tomorrow.setHours(11, 0, 0, 0);
      return { scheduledFor: tomorrow, description: 'tomorrow around 11 AM' };
    }
  }
  
  if (lowerTime.includes('this week') || lowerTime.includes('next few days')) {
    const weekday = new Date(now);
    weekday.setDate(weekday.getDate() + 2);
    weekday.setHours(11, 0, 0, 0);
    return { scheduledFor: weekday, description: 'within the next couple days' };
  }
  
  if (lowerTime.includes('next week')) {
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(10, 0, 0, 0);
    return { scheduledFor: nextWeek, description: 'early next week' };
  }
  
  if (lowerTime.includes('monday')) {
    return getNextDayOfWeek(1, lowerTime);
  } else if (lowerTime.includes('tuesday')) {
    return getNextDayOfWeek(2, lowerTime);
  } else if (lowerTime.includes('wednesday')) {
    return getNextDayOfWeek(3, lowerTime);
  } else if (lowerTime.includes('thursday')) {
    return getNextDayOfWeek(4, lowerTime);
  } else if (lowerTime.includes('friday')) {
    return getNextDayOfWeek(5, lowerTime);
  }
  
  if (lowerTime.includes('morning')) {
    const morning = new Date(now);
    if (now.getHours() >= 12) morning.setDate(morning.getDate() + 1);
    morning.setHours(10, 0, 0, 0);
    return { scheduledFor: morning, description: 'tomorrow morning' };
  }
  
  if (lowerTime.includes('afternoon')) {
    const afternoon = new Date(now);
    if (now.getHours() >= 16) afternoon.setDate(afternoon.getDate() + 1);
    afternoon.setHours(14, 0, 0, 0);
    return { scheduledFor: afternoon, description: 'this afternoon' };
  }
  
  // Default: next business day at 11 AM
  const nextBusiness = new Date(now);
  nextBusiness.setDate(nextBusiness.getDate() + 1);
  nextBusiness.setHours(11, 0, 0, 0);
  return { scheduledFor: nextBusiness, description: 'the next business day' };
}

function getNextDayOfWeek(dayOfWeek: number, timeStr: string): { scheduledFor: Date; description: string } {
  const now = new Date();
  const daysUntil = (dayOfWeek + 7 - now.getDay()) % 7 || 7;
  const target = new Date(now);
  target.setDate(target.getDate() + daysUntil);
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  if (timeStr.includes('morning')) {
    target.setHours(10, 0, 0, 0);
    return { scheduledFor: target, description: `${dayNames[dayOfWeek]} morning` };
  } else if (timeStr.includes('afternoon')) {
    target.setHours(14, 0, 0, 0);
    return { scheduledFor: target, description: `${dayNames[dayOfWeek]} afternoon` };
  } else {
    target.setHours(11, 0, 0, 0);
    return { scheduledFor: target, description: dayNames[dayOfWeek] };
  }
}

/**
 * Generate a unique user ID for anonymous voice leads
 */
function generateAnonymousUserId(): string {
  return 'voice_' + crypto.randomUUID();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customer_name, customer_phone, preferred_time, notes, motor_interest, motor_context } = await req.json();
    
    console.log('Scheduling callback:', { customer_name, customer_phone, preferred_time, motor_interest });
    
    // Validate phone number (basic check)
    const cleanPhone = (customer_phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please provide a valid phone number with area code.' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Parse the preferred time
    const { scheduledFor, description } = parsePreferredTime(preferred_time || '');
    
    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Insert callback request to voice_callbacks table
    const { data: callbackData, error: callbackError } = await supabase
      .from('voice_callbacks')
      .insert({
        customer_name: customer_name || 'Voice Customer',
        customer_phone: cleanPhone,
        preferred_time: preferred_time,
        scheduled_for: scheduledFor?.toISOString(),
        notes,
        motor_interest,
        motor_context,
        callback_status: 'pending'
      })
      .select()
      .single();
    
    if (callbackError) {
      console.error('Voice callback insert error:', callbackError);
      throw new Error('Failed to schedule callback');
    }
    
    console.log('Voice callback scheduled:', callbackData.id);
    
    // ALSO insert into customer_quotes for unified lead tracking
    const anonymousUserId = generateAnonymousUserId();
    const leadNotes = [
      `Voice callback request - ${description}`,
      motor_interest ? `Interested in: ${motor_interest}` : '',
      notes ? `Notes: ${notes}` : ''
    ].filter(Boolean).join('\n');
    
    const { data: quoteData, error: quoteError } = await supabase
      .from('customer_quotes')
      .insert({
        customer_name: customer_name || 'Voice Customer',
        customer_phone: cleanPhone,
        customer_email: '', // Voice leads may not have email
        user_id: anonymousUserId,
        lead_source: 'voice_chat',
        lead_status: 'new',
        lead_score: 75, // High intent - they requested a callback
        notes: leadNotes,
        base_price: motor_context?.price || 0,
        final_price: motor_context?.price || 0,
        deposit_amount: 0,
        loan_amount: 0,
        monthly_payment: 0,
        term_months: 0,
        total_cost: 0,
      })
      .select()
      .single();
    
    if (quoteError) {
      console.error('Customer quote insert error (non-blocking):', quoteError);
      // Don't fail the whole request - voice_callbacks is the primary
    } else {
      console.log('Customer quote created:', quoteData?.id);
    }
    
    // Send confirmation SMS to customer if Twilio is configured
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFrom = Deno.env.get('TWILIO_FROM_NUMBER');
    
    if (twilioSid && twilioToken && twilioFrom) {
      try {
        const message = `Thanks ${customer_name || 'there'}! Harris Boat Works will call you ${description}. ` +
          `${motor_interest ? `Re: ${motor_interest}. ` : ''}` +
          `Questions? Reply to this text or call 905-342-9980.`;
        
        const formData = new URLSearchParams();
        formData.append('To', '+1' + cleanPhone);
        formData.append('From', twilioFrom);
        formData.append('Body', message);
        
        await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
          }
        );
        console.log('Customer confirmation SMS sent');
      } catch (smsError) {
        console.error('Customer SMS failed (non-blocking):', smsError);
      }
      
      // Send admin notification SMS
      const adminPhone = Deno.env.get('ADMIN_PHONE');
      if (adminPhone) {
        try {
          const adminMessage = `🔔 NEW VOICE LEAD\n` +
            `${customer_name || 'Unknown'}\n` +
            `📞 ${cleanPhone}\n` +
            `⏰ Wants call: ${description}\n` +
            `${motor_interest ? `🚤 Interest: ${motor_interest}` : ''}`;
          
          const adminFormData = new URLSearchParams();
          adminFormData.append('To', adminPhone.startsWith('+') ? adminPhone : '+1' + adminPhone);
          adminFormData.append('From', twilioFrom);
          adminFormData.append('Body', adminMessage);
          
          await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: adminFormData.toString()
            }
          );
          console.log('Admin notification SMS sent');
        } catch (adminSmsError) {
          console.error('Admin SMS failed (non-blocking):', adminSmsError);
        }
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        callbackId: callbackData.id,
        quoteId: quoteData?.id,
        scheduledDescription: description,
        message: `Got it! Someone from our team will call you ${description}. I've sent a confirmation to your phone.`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error('Schedule callback error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
