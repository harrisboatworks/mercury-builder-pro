export interface ExistingFinancingApplication {
  id: string;
  user_id: string | null;
  status: string;
  submission_id: string | null;
}

export function preserveFinancingOwner(
  existingUserId: string | null,
  requestUserId: string | null,
): string | null {
  return existingUserId ?? requestUserId;
}

export function isMatchingSubmittedApplication(
  application: ExistingFinancingApplication,
  submissionId?: string,
): boolean {
  return Boolean(
    submissionId
    && application.submission_id === submissionId
    && application.status !== 'draft',
  );
}
