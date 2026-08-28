import { supabase } from '@/integrations/supabase/client';

export const FINANCING_STORAGE_KEYS = [
  'financingApplication',
  'financing_draft',
  'financing_application',
] as const;

type JsonObject = Record<string, unknown>;

export interface FinancingDraftData {
  purchaseDetails: JsonObject | null;
  applicant: JsonObject | null;
  employment: JsonObject | null;
  financial: JsonObject | null;
  coApplicant: JsonObject | null;
  hasCoApplicant: boolean;
  references: JsonObject | null;
  quoteId: string | null;
  currentStep: number;
  completedSteps: number[];
}

export interface FinancingApiSaveResult {
  applicationId: string;
  resumeToken: string;
  resumeUrl: string;
  emailSent: boolean;
}

export interface FinancingApiLoadResult {
  application: Record<string, unknown>;
}

export interface FinancingApiSubmitResult {
  applicationId: string;
}

export function stripSin<T extends JsonObject | null | undefined>(person: T): T {
  if (!person) return person;
  const cleaned = { ...person };
  delete cleaned.sin;
  return cleaned as T;
}

export function stripLocalSensitiveFields<T extends JsonObject | null | undefined>(person: T): T {
  if (!person) return person;
  const cleaned = stripSin(person);
  delete cleaned.dateOfBirth;
  return cleaned as T;
}

export function clearFinancingStorage(storage: Pick<Storage, 'removeItem'> = localStorage): void {
  FINANCING_STORAGE_KEYS.forEach((key) => storage.removeItem(key));
}

async function invokeFinancingApi<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('financing-application-api', { body });

  if (error) {
    throw new Error(error.message || 'The financing service could not be reached.');
  }

  if (!data || data.error) {
    throw new Error(data?.error || 'The financing service returned an invalid response.');
  }

  return data as T;
}

export async function saveFinancingDraft(params: {
  draft: FinancingDraftData;
  email: string;
  applicantName?: string;
  applicationId?: string | null;
  resumeToken?: string | null;
}): Promise<FinancingApiSaveResult> {
  return invokeFinancingApi<FinancingApiSaveResult>({
    action: 'save',
    email: params.email,
    applicantName: params.applicantName,
    applicationId: params.applicationId || undefined,
    resumeToken: params.resumeToken || undefined,
    draft: {
      ...params.draft,
      applicant: stripSin(params.draft.applicant),
      coApplicant: stripSin(params.draft.coApplicant),
    },
  });
}

export async function loadFinancingDraft(resumeToken: string): Promise<FinancingApiLoadResult> {
  return invokeFinancingApi<FinancingApiLoadResult>({
    action: 'load',
    resumeToken,
  });
}

export async function submitFinancingApplication(params: {
  application: Omit<FinancingDraftData, 'currentStep' | 'completedSteps'> & {
    consent: JsonObject;
  };
  applicantSinEncrypted: string;
  coApplicantSinEncrypted?: string | null;
  applicationId?: string | null;
  resumeToken?: string | null;
}): Promise<FinancingApiSubmitResult> {
  return invokeFinancingApi<FinancingApiSubmitResult>({
    action: 'submit',
    applicationId: params.applicationId || undefined,
    resumeToken: params.resumeToken || undefined,
    applicantSinEncrypted: params.applicantSinEncrypted,
    coApplicantSinEncrypted: params.coApplicantSinEncrypted || undefined,
    application: {
      ...params.application,
      applicant: stripSin(params.application.applicant),
      coApplicant: stripSin(params.application.coApplicant),
    },
  });
}
