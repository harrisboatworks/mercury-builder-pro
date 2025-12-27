import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  
  // Default business hours
  const businessStart = 9;
  const businessEnd = 17;
  
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
    
    // Insert callback request
    const { data, error } = await supabase
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
    
    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to schedule callback');
    }
    
    console.log('Callback scheduled:', data.id);
    
    // Send confirmation SMS if Twilio is configured
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
        console.log('Confirmation SMS sent');
      } catch (smsError) {
        console.error('SMS failed (non-blocking):', smsError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        callbackId: data.id,
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
