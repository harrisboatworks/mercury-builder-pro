import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Parse natural language time to a reminder datetime
 */
function parseReminderTime(timeStr: string): { remindAt: Date; description: string } {
  const now = new Date();
  const lowerTime = (timeStr || '').toLowerCase().trim();
  
  // Parse relative times
  if (lowerTime.includes('hour')) {
    const match = lowerTime.match(/(\d+)\s*hour/);
    const hours = match ? parseInt(match[1]) : 1;
    const reminder = new Date(now.getTime() + hours * 60 * 60 * 1000);
    return { remindAt: reminder, description: `in ${hours} hour${hours > 1 ? 's' : ''}` };
  }
  
  if (lowerTime.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return { remindAt: tomorrow, description: 'tomorrow morning' };
  }
  
  if (lowerTime.includes('day')) {
    const match = lowerTime.match(/(\d+)\s*day/);
    const days = match ? parseInt(match[1]) : 1;
    const reminder = new Date(now);
    reminder.setDate(reminder.getDate() + days);
    reminder.setHours(10, 0, 0, 0);
    return { remindAt: reminder, description: `in ${days} day${days > 1 ? 's' : ''}` };
  }
  
  if (lowerTime.includes('week')) {
    const match = lowerTime.match(/(\d+)\s*week/);
    const weeks = match ? parseInt(match[1]) : 1;
    const reminder = new Date(now);
    reminder.setDate(reminder.getDate() + (weeks * 7));
    reminder.setHours(10, 0, 0, 0);
    return { remindAt: reminder, description: `in ${weeks} week${weeks > 1 ? 's' : ''}` };
  }
  
  if (lowerTime.includes('month')) {
    const match = lowerTime.match(/(\d+)\s*month/);
    const months = match ? parseInt(match[1]) : 1;
    const reminder = new Date(now);
    reminder.setMonth(reminder.getMonth() + months);
    reminder.setHours(10, 0, 0, 0);
    return { remindAt: reminder, description: `in ${months} month${months > 1 ? 's' : ''}` };
  }
  
  // Day of week
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < dayNames.length; i++) {
    if (lowerTime.includes(dayNames[i])) {
      const daysUntil = (i + 7 - now.getDay()) % 7 || 7;
      const reminder = new Date(now);
      reminder.setDate(reminder.getDate() + daysUntil);
      reminder.setHours(10, 0, 0, 0);
      return { remindAt: reminder, description: `next ${dayNames[i].charAt(0).toUpperCase() + dayNames[i].slice(1)}` };
    }
  }
  
  // Default: 3 days from now
  const reminder = new Date(now);
  reminder.setDate(reminder.getDate() + 3);
  reminder.setHours(10, 0, 0, 0);
  return { remindAt: reminder, description: 'in a few days' };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      customer_phone, 
      customer_name,
      reminder_type,
      when,
      reminder_content,
      custom_note 
    } = await req.json();
    
    console.log('Creating reminder:', { customer_phone, reminder_type, when });
    
    // Validate phone number
    const cleanPhone = (customer_phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please provide a valid phone number.' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Parse the reminder time
    const { remindAt, description } = parseReminderTime(when || '');
    
    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Build reminder content
    const content = {
      ...reminder_content,
      custom_note,
      created_via: 'voice_chat'
    };
    
    // Insert reminder
    const { data, error } = await supabase
      .from('voice_reminders')
      .insert({
        customer_phone: cleanPhone,
        customer_name,
        reminder_type: reminder_type || 'custom',
        reminder_content: content,
        remind_at: remindAt.toISOString(),
        sent: false
      })
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create reminder');
    }
    
    console.log('Reminder created:', data.id, 'for', remindAt.toISOString());
    
    // Format confirmation message based on reminder type
    let confirmationMsg = `I'll remind you ${description}`;
    if (reminder_type === 'motor' && reminder_content?.motor_model) {
      confirmationMsg += ` about the ${reminder_content.motor_model}`;
    } else if (reminder_type === 'promotion') {
      confirmationMsg += ' about our current promotions';
    } else if (reminder_type === 'service') {
      confirmationMsg += ' to schedule your service';
    }
    confirmationMsg += '. You\'ll get a text at that time.';
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        reminderId: data.id,
        remindAt: remindAt.toISOString(),
        description,
        message: confirmationMsg
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error('Create reminder error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
