import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// 1x1 transparent GIF
const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b
]);

serve(async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type"); // 'open' or 'click'
    const token = url.searchParams.get("token");
    const step = url.searchParams.get("step");
    const redirectUrl = url.searchParams.get("url");

    if (!token || !type) {
      console.error("[track-email-event] Missing token or type");
      // Still return pixel/redirect to not break user experience
      if (type === "click" && redirectUrl) {
        return Response.redirect(decodeURIComponent(redirectUrl), 302);
      }
      return new Response(TRACKING_PIXEL, {
        headers: { "Content-Type": "image/gif", "Cache-Control": "no-store" },
      });
    }

    console.log(`[track-email-event] ${type} event for token: ${token}, step: ${step}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the sequence by token
    const { data: sequence, error: findError } = await supabase
      .from("email_sequence_queue")
      .select("*")
      .eq("unsubscribe_token", token)
      .single();

    if (findError || !sequence) {
      console.error("[track-email-event] Sequence not found:", findError);
      if (type === "click" && redirectUrl) {
        return Response.redirect(decodeURIComponent(redirectUrl), 302);
      }
      return new Response(TRACKING_PIXEL, {
        headers: { "Content-Type": "image/gif", "Cache-Control": "no-store" },
      });
    }

    // Create tracking event
    const trackingEvent = {
      type,
      step: step ? parseInt(step) : null,
      timestamp: new Date().toISOString(),
      url: type === "click" ? redirectUrl : null,
      userAgent: req.headers.get("user-agent"),
    };

    // Update sequence with tracking data
    const existingEvents = sequence.tracking_events || [];
    const updates: Record<string, any> = {
      tracking_events: [...existingEvents, trackingEvent],
      updated_at: new Date().toISOString(),
    };

    if (type === "open") {
      updates.email_opens = (sequence.email_opens || 0) + 1;
      updates.last_opened_at = new Date().toISOString();
    } else if (type === "click") {
      updates.email_clicks = (sequence.email_clicks || 0) + 1;
      updates.last_clicked_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("email_sequence_queue")
      .update(updates)
      .eq("id", sequence.id);

    if (updateError) {
      console.error("[track-email-event] Update error:", updateError);
    } else {
      console.log(`[track-email-event] Tracked ${type} for ${sequence.email}`);
    }

    // Return appropriate response
    if (type === "click" && redirectUrl) {
      return Response.redirect(decodeURIComponent(redirectUrl), 302);
    }

    // Return tracking pixel for opens
    return new Response(TRACKING_PIXEL, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error: any) {
    console.error("[track-email-event] Error:", error);
    
    // Always try to return something useful to not break user experience
    const url = new URL(req.url);
    const redirectUrl = url.searchParams.get("url");
    if (redirectUrl) {
      return Response.redirect(decodeURIComponent(redirectUrl), 302);
    }
    
    return new Response(TRACKING_PIXEL, {
      headers: { "Content-Type": "image/gif", "Cache-Control": "no-store" },
    });
  }
});
