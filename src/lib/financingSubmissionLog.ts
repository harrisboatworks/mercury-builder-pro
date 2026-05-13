// Lightweight logger for financing submission outcomes.
// Writes to public.financing_submission_logs (admin-readable).
import { supabase } from '@/integrations/supabase/client';

export type SubmissionStage =
  | 'encrypt_applicant_sin'
  | 'encrypt_co_applicant_sin'
  | 'db_upsert'
  | 'submission';

export type SubmissionOutcome = 'success' | 'failure';

interface LogParams {
  stage: SubmissionStage;
  outcome: SubmissionOutcome;
  correlationId: string;
  applicationId?: string | null;
  userId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logFinancingSubmission(params: LogParams): Promise<void> {
  try {
    await supabase.from('financing_submission_logs').insert({
      application_id: params.applicationId ?? null,
      user_id: params.userId ?? null,
      stage: params.stage,
      outcome: params.outcome,
      correlation_id: params.correlationId,
      error_code: params.errorCode ?? null,
      error_message: params.errorMessage ? String(params.errorMessage).slice(0, 1000) : null,
      metadata: { ...(params.metadata ?? {}), correlation_id: params.correlationId },
    });
  } catch (e) {
    // Never let logging itself break the user flow
    console.warn('financingSubmissionLog: insert failed', e);
  }
}
