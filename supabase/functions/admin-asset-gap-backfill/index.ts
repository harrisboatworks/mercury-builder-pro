// One-shot helper: upload a base64-encoded hero image for one motor, create a
// motor_media row, and set motor_models.hero_image_url + hero_media_id.
//
// Scope-limited: only operates on the 3 approved asset-gap model_numbers.
// Admin-gated. Intended to be removed after the 3 backfills are complete.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { decodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

const ALLOWED_MODEL_NUMBERS = new Set([
  '1F51413GZ', // 50 ELPT FourStroke
  '1F60413GZ', // 60 ELPT FourStroke
  '1F60453GZ', // 60 ELPT Command Thrust FourStroke
]);

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Allow either admin JWT OR the EDGE_INTERNAL_SECRET header (matches existing cron-hardened pattern)
  const internalSecret = Deno.env.get('EDGE_INTERNAL_SECRET');
  const providedSecret = req.headers.get('x-internal-secret');
  const usingInternalSecret = internalSecret && providedSecret && providedSecret === internalSecret;

  if (!usingInternalSecret) {
    const authResult = await requireAdmin(req, corsHeaders);
    if (authResult instanceof Response) return authResult;
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { model_number, filename, base64, alt_text } = await req.json();

    if (!model_number || !filename || !base64) {
      return json({ success: false, error: 'model_number, filename, base64 required' }, 400);
    }
    if (!ALLOWED_MODEL_NUMBERS.has(model_number)) {
      return json({ success: false, error: `model_number not in approved asset-gap set` }, 403);
    }

    // Find the motor
    const { data: motor, error: motorErr } = await supabase
      .from('motor_models')
      .select('id, model_number, horsepower, hero_image_url, image_url')
      .eq('model_number', model_number)
      .single();
    if (motorErr || !motor) return json({ success: false, error: `motor not found: ${motorErr?.message}` }, 404);

    if (motor.hero_image_url || motor.image_url) {
      return json({ success: false, error: 'motor already has an image; refusing to overwrite' }, 409);
    }

    // Upload to motor-images bucket (matches existing curated path convention)
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
    const objectPath = `uploads/${ts}-${safeName}`;

    const bytes = decodeBase64(base64);
    const { error: upErr } = await supabase.storage
      .from('motor-images')
      .upload(objectPath, bytes, {
        contentType: 'image/jpeg',
        upsert: false,
      });
    if (upErr) return json({ success: false, error: `storage upload failed: ${upErr.message}` }, 500);

    const { data: pub } = supabase.storage.from('motor-images').getPublicUrl(objectPath);
    const publicUrl = pub.publicUrl;

    // Create motor_media row (curated hero)
    const { data: mediaRow, error: medErr } = await supabase
      .from('motor_media')
      .insert({
        motor_id: motor.id,
        media_url: publicUrl,
        media_type: 'image',
        media_category: 'hero',
        assignment_type: 'individual',
        original_filename: filename,
        mime_type: 'image/jpeg',
        file_size: bytes.length,
        alt_text: alt_text ?? null,
        is_active: true,
        display_order: 0,
      })
      .select('id, media_url')
      .single();
    if (medErr || !mediaRow) return json({ success: false, error: `motor_media insert failed: ${medErr?.message}` }, 500);

    // Promote
    const { error: updErr } = await supabase
      .from('motor_models')
      .update({
        hero_image_url: mediaRow.media_url,
        hero_media_id: mediaRow.id,
        media_last_updated: new Date().toISOString(),
      })
      .eq('id', motor.id);
    if (updErr) return json({ success: false, error: `motor_models update failed: ${updErr.message}` }, 500);

    return json({
      success: true,
      model_number,
      motor_id: motor.id,
      media_id: mediaRow.id,
      hero_image_url: mediaRow.media_url,
      object_path: objectPath,
    });
  } catch (e) {
    return json({ success: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
