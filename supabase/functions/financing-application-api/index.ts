import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.53.1';
import { Resend } from 'npm:resend@2.0.0';
import { z } from 'npm:zod@3.25.76';
import { corsHeaders } from '../_shared/cors.ts';
import { buildEmail, detailsCard, esc } from '../_shared/email-layout.ts';
import { isAllowedOrigin, forbiddenOriginResponse } from '../_shared/origin-check.ts';
import { checkRateLimit, rateLimitedResponse } from '../_shared/rate-limit.ts';

const MAX_BODY_BYTES = 128 * 1024;
const TOTAL_STEPS = 7;
const jsonObject = z.record(z.string(), z.unknown());

const draftSchema = z.object({
  purchaseDetails: jsonObject.nullable(),
  applicant: jsonObject.nullable(),
  employment: jsonObject.nullable(),
  financial: jsonObject.nullable(),
  coApplicant: jsonObject.nullable(),
  hasCoApplicant: z.boolean(),
  references: jsonObject.nullable(),
  quoteId: z.string().uuid().nullable(),
  currentStep: z.number().int().min(1).max(TOTAL_STEPS),
  completedSteps: z.array(z.number().int().min(1).max(TOTAL_STEPS)).max(TOTAL_STEPS),
});

const saveSchema = z.object({
  action: z.literal('save'),
  email: z.string().trim().email().max(255),
  applicantName: z.string().trim().max(100).optional(),
  applicationId: z.string().uuid().optional(),
  resumeToken: z.string().uuid().optional(),
  draft: draftSchema,
});

const loadSchema = z.object({
  action: z.literal('load'),
  resumeToken: z.string().uuid(),
});

const submitSchema = z.object({
  action: z.literal('submit'),
  applicationId: z.string().uuid().optional(),
  resumeToken: z.string().uuid().optional(),
  applicantSinEncrypted: z.string().min(16).max(4096),
  coApplicantSinEncrypted: z.string().min(16).max(4096).optional(),
  application: draftSchema.omit({ currentStep: true, completedSteps: true }).extend({
    consent: jsonObject,
  }),
});

const requestSchema = z.discriminatedUnion('action', [saveSchema, loadSchema, submitSchema]);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function stripSin(value: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!value) return value;
  const { sin: _sin, ...safe } = value;
  return safe;
}

async function getOptionalUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!authHeader || !supabaseUrl || !anonKey) return null;

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user?.id ?? null;
}

async function sendResumeEmail(params: {
  email: string;
  applicantName?: string;
  completedSteps: number;
  resumeUrl: string;
}): Promise<boolean> {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) {
    console.error('[financing-application-api] RESEND_API_KEY is not configured');
    return false;
  }

  const progress = Math.round((params.completedSteps / TOTAL_STEPS) * 100);
  const body = `
    <p style="margin:0 0 14px 0;">Hi${params.applicantName ? ` ${esc(params.applicantName)}` : ''},</p>
    <p style="margin:0 0 14px 0;">Your financing application is saved. You can pick it up where you left off whenever you have a few minutes.</p>
    ${detailsCard([
      { label: 'Progress', value: `${params.completedSteps} of ${TOTAL_STEPS} steps (${progress}%)` },
      { label: 'Saved for', value: '30 days' },
    ])}
    <p style="margin:18px 0 0 0;">For your security, your SIN is not stored in the saved draft and must be entered again when you return.</p>
    <p style="margin:18px 0 0 0;">Need a hand? Reply to this email or call <a href="tel:9053422153" style="color:#0f2a43;font-weight:600;">(905) 342-2153</a>.</p>
  `;

  const html = buildEmail({
    preheader: 'Pick up your financing application where you left off.',
    heading: 'Resume your financing application',
    bodyHtml: body,
    ctaText: 'Continue application',
    ctaUrl: params.resumeUrl,
    footerNote: 'This private resume link is good for 30 days.',
  });

  const response = await new Resend(resendKey).emails.send({
    from: 'Harris Boat Works <noreply@mercuryrepower.ca>',
    replyTo: 'info@harrisboatworks.ca',
    to: [params.email],
    subject: 'Resume your financing application | Harris Boat Works',
    html,
  });

  if (response.error || !response.data?.id) {
    console.error('[financing-application-api] Resume email failed:', response.error?.message || 'missing email id');
    return false;
  }
  return true;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!isAllowedOrigin(req)) return forbiddenOriginResponse(corsHeaders);

  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) return json({ error: 'Request is too large' }, 413);

  const ipAllowed = await checkRateLimit(req, {
    action: 'financing_application_api_ip',
    maxAttempts: 40,
    windowMinutes: 60,
  });
  if (!ipAllowed) return rateLimitedResponse(corsHeaders, 300);

  try {
    const rawText = await req.text();
    if (new TextEncoder().encode(rawText).byteLength > MAX_BODY_BYTES) {
      return json({ error: 'Request is too large' }, 413);
    }

    const parsed = requestSchema.safeParse(JSON.parse(rawText));
    if (!parsed.success) {
      return json({ error: 'Invalid financing request', details: parsed.error.flatten() }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      console.error('[financing-application-api] Supabase service configuration missing');
      return json({ error: 'Financing service is temporarily unavailable' }, 503);
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const userId = await getOptionalUserId(req);
    const input = parsed.data;

    if (input.action === 'load') {
      const loadAllowed = await checkRateLimit(req, {
        action: 'financing_application_load',
        maxAttempts: 20,
        windowMinutes: 15,
      });
      if (!loadAllowed) return rateLimitedResponse(corsHeaders, 300);

      const { data, error } = await admin
        .from('financing_applications')
        .select('id, resume_token, current_step, completed_steps, purchase_data, applicant_data, employment_data, financial_data, co_applicant_data, references_data, quote_id, status, resume_expires_at')
        .eq('resume_token', input.resumeToken)
        .is('deleted_at', null)
        .maybeSingle();

      if (error || !data) return json({ error: 'Invalid or expired resume link' }, 404);
      if (data.status !== 'draft') return json({ error: 'This application has already been submitted' }, 409);
      if (!data.resume_expires_at || new Date(data.resume_expires_at).getTime() <= Date.now()) {
        return json({ error: 'This resume link has expired' }, 410);
      }

      return json({
        application: {
          ...data,
          applicant_data: stripSin(data.applicant_data as Record<string, unknown>),
          co_applicant_data: stripSin(data.co_applicant_data as Record<string, unknown> | null),
        },
      });
    }

    if (input.action === 'save') {
      const recipientAllowed = await checkRateLimit(req, {
        identifier: input.email.toLowerCase(),
        action: 'financing_application_save_email',
        maxAttempts: 5,
        windowMinutes: 60,
      });
      if (!recipientAllowed) return rateLimitedResponse(corsHeaders, 300);

      const safeApplicant = stripSin(input.draft.applicant);
      const safeCoApplicant = stripSin(input.draft.coApplicant);
      const resumeExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      let applicationId = input.applicationId;
      let resumeToken = input.resumeToken;

      if (applicationId && resumeToken) {
        const { data, error } = await admin
          .from('financing_applications')
          .update({
            user_id: userId,
            quote_id: input.draft.quoteId,
            purchase_data: input.draft.purchaseDetails || {},
            applicant_data: safeApplicant || {},
            employment_data: input.draft.employment || {},
            financial_data: input.draft.financial || {},
            co_applicant_data: input.draft.hasCoApplicant ? safeCoApplicant : null,
            references_data: input.draft.references || {},
            current_step: input.draft.currentStep,
            completed_steps: input.draft.completedSteps,
            resume_expires_at: resumeExpiresAt,
          })
          .eq('id', applicationId)
          .eq('resume_token', resumeToken)
          .eq('status', 'draft')
          .select('id, resume_token')
          .maybeSingle();

        if (error || !data) return json({ error: 'Saved application could not be updated' }, 404);
        applicationId = data.id;
        resumeToken = data.resume_token;
      } else {
        resumeToken = crypto.randomUUID();
        const { data, error } = await admin
          .from('financing_applications')
          .insert({
            user_id: userId,
            quote_id: input.draft.quoteId,
            purchase_data: input.draft.purchaseDetails || {},
            applicant_data: safeApplicant || {},
            employment_data: input.draft.employment || {},
            financial_data: input.draft.financial || {},
            co_applicant_data: input.draft.hasCoApplicant ? safeCoApplicant : null,
            references_data: input.draft.references || {},
            status: 'draft',
            current_step: input.draft.currentStep,
            completed_steps: input.draft.completedSteps,
            resume_token: resumeToken,
            resume_expires_at: resumeExpiresAt,
          })
          .select('id, resume_token')
          .single();

        if (error || !data) {
          console.error('[financing-application-api] Draft insert failed:', error?.message);
          return json({ error: 'Application could not be saved' }, 500);
        }
        applicationId = data.id;
        resumeToken = data.resume_token;
      }

      const siteUrl = Deno.env.get('APP_URL') || Deno.env.get('SITE_URL') || 'https://mercuryrepower.ca';
      const resumeUrl = `${siteUrl}/financing/resume?token=${resumeToken}`;
      const emailSent = await sendResumeEmail({
        email: input.email,
        applicantName: input.applicantName,
        completedSteps: input.draft.completedSteps.length,
        resumeUrl,
      });

      return json({ applicationId, resumeToken, resumeUrl, emailSent });
    }

    const submitAllowed = await checkRateLimit(req, {
      action: 'financing_application_submit',
      maxAttempts: 10,
      windowMinutes: 60,
    });
    if (!submitAllowed) return rateLimitedResponse(corsHeaders, 900);

    const safeApplicant = stripSin(input.application.applicant);
    const safeCoApplicant = stripSin(input.application.coApplicant);
    const submission = {
      user_id: userId,
      quote_id: input.application.quoteId,
      purchase_data: input.application.purchaseDetails || {},
      applicant_data: safeApplicant || {},
      employment_data: input.application.employment || {},
      financial_data: input.application.financial || {},
      co_applicant_data: input.application.hasCoApplicant ? safeCoApplicant : null,
      references_data: input.application.references || {},
      consent_data: input.application.consent,
      status: 'pending',
      current_step: TOTAL_STEPS,
      completed_steps: [1, 2, 3, 4, 5, 6, 7],
      applicant_sin_encrypted: input.applicantSinEncrypted,
      co_applicant_sin_encrypted: input.coApplicantSinEncrypted || null,
      resume_expires_at: null,
    };

    if (input.applicationId && input.resumeToken) {
      const { data, error } = await admin
        .from('financing_applications')
        .update(submission)
        .eq('id', input.applicationId)
        .eq('resume_token', input.resumeToken)
        .eq('status', 'draft')
        .select('id')
        .maybeSingle();

      if (error || !data) {
        console.error('[financing-application-api] Draft submit failed:', error?.message);
        return json({ error: 'Saved application could not be submitted' }, 404);
      }
      return json({ applicationId: data.id });
    }

    const { data, error } = await admin
      .from('financing_applications')
      .insert(submission)
      .select('id')
      .single();

    if (error || !data) {
      console.error('[financing-application-api] Submission insert failed:', error?.message);
      return json({ error: 'Application could not be submitted' }, 500);
    }
    return json({ applicationId: data.id });
  } catch (error) {
    console.error('[financing-application-api] Unexpected error:', (error as Error).message);
    return json({ error: 'The financing service could not complete this request' }, 500);
  }
});
