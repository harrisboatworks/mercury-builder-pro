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

/**
 * An observed anonymous row needs a compare-and-set guard even when the current
 * request is also anonymous. Otherwise it could clear an owner claimed between
 * the read and write.
 */
export function requiresUnownedOwnerGuard(existingUserId: string | null): boolean {
  return existingUserId === null;
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
