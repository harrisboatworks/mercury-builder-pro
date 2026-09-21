import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.1';
import { Resend } from 'npm:resend@2.0.0';
import { requireAdmin } from '../_shared/admin-auth.ts';
import { reportingEnd, runReport } from './workflow.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const auth = await requireAdmin(req, corsHeaders);
  if (auth instanceof Response) return auth;
  if (req.method !== 'POST') return json({ success: false, error: 'POST required' }, 405);
  try {
    const bodyText = await req.text();
    const options = bodyText.trim() ? JSON.parse(bodyText) : {};
    if (!options || typeof options !== 'object' || Array.isArray(options)) return json({ success: false, error: 'Expected an object' }, 400);
    if (options.dry_run !== undefined && typeof options.dry_run !== 'boolean') return json({ success: false, error: 'dry_run must be boolean' }, 400);
    // A fixed reporting end is permitted only for a no-send preview.
    if (options.end_at && options.dry_run !== true) return json({ success: false, error: 'end_at requires dry_run' }, 400);
    const end = options.end_at ? new Date(options.end_at) : new Date(reportingEnd(new Date()));
    if (!Number.isFinite(end.getTime())) return json({ success: false, error: 'Invalid end_at' }, 400);
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const phone = Deno.env.get('ADMIN_PHONE');
    const result = await runReport(end.toISOString(), options.dry_run === true, {
      smsConfigured: Boolean(phone),
      aggregate: async (end) => {
        const { data, error } = await supabase.rpc('weekly_report_v2', { p_end: end });
        if (error) throw new Error('Weekly aggregate unavailable; no report sent');
        return data;
      },
      email: async (rendered) => {
        // Preserve the existing recipients. Provider acceptance is not delivery.
        const email = await new Resend(Deno.env.get('RESEND_API_KEY')!).emails.send({
          from: 'Mercury Quotes <noreply@mercuryrepower.ca>',
          to: ['info@harrisboatworks.ca'],
          cc: ['hbwbot00@gmail.com', 'harrisboatworks2153@manus.bot'],
          subject: rendered.subject, html: rendered.html,
        });
        return !email.error && Boolean(email.data?.id);
      },
      sms: async (rendered) => {
        const sms = await supabase.functions.invoke('send-sms', {
          body: { to: phone, message: rendered.sms, messageType: 'manual' },
        });
        return !sms.error && sms.data?.success === true && Boolean(sms.data?.messageId);
      },
    });
    return json(result, result.success ? 200 : 502);
  } catch (error) {
    console.error('[WEEKLY-REPORT] Failed:', error instanceof Error ? error.name : 'UnknownError');
    return json({ success: false, error: 'Report generation or provider submission failed; delivery not verified' }, 500);
  }
});
