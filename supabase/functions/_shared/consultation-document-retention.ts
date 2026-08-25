import {
  CONSULTATION_DOCUMENTS_BUCKET,
  canonicalConsultationDocumentPath,
  parseConsultationDocumentId,
} from "./consultation-document-policy.ts";
import type { ConsultationDocumentJobStatus } from "./consultation-document-mint.ts";

export const CONSULTATION_MINT_GRACE_MS = 15 * 60 * 1000;
export const CONSULTATION_EXPIRED_PURGE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;
export const CONSULTATION_RETENTION_BATCH = 50;

export type ConsultationRetentionAction =
  | {
    type: "cleanup_failed_job";
    jobId: string;
    documentId: string | null;
    storageKey: string | null;
  }
  | {
    type: "cleanup_orphan_document";
    documentId: string;
    storageKey: string;
  }
  | {
    type: "revoke_expired_capability";
    capabilityId: string;
  }
  | {
    type: "purge_expired_document";
    documentId: string;
    storageKey: string;
  };

export interface ConsultationRetentionJob {
  id: string;
  status: ConsultationDocumentJobStatus;
  documentId: string | null;
  storageKey: string | null;
  updatedAt: string;
}

export interface ConsultationRetentionCapability {
  id: string;
  expiresAt: string;
  revokedAt: string | null;
}

export interface ConsultationRetentionDocument {
  id: string;
  storageKey: string;
  createdAt: string;
  capabilities: ConsultationRetentionCapability[];
}

export interface ConsultationRetentionStore {
  removePdf(path: string): Promise<void>;
  deleteDocument(id: string): Promise<void>;
  revokeCapability(id: string, revokedAt: string): Promise<void>;
  markJobCleaned(id: string): Promise<void>;
}

export interface ConsultationRetentionSummary {
  cleaned: number;
  revoked: number;
  purged: number;
  failed: number;
}

function parseTime(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function olderThan(iso: string, now: Date, graceMs: number): boolean {
  const parsed = parseTime(iso);
  return Number.isFinite(parsed) && parsed + graceMs <= now.getTime();
}

export function isRetainedConsultationStorageKey(storageKey: string | null | undefined): boolean {
  if (!storageKey) return false;
  if (
    storageKey.includes("spec-sheets")
    || storageKey.includes("/storage/v1/object/")
    || !storageKey.startsWith("consultation/")
    || !storageKey.endsWith("/quote.pdf")
  ) {
    return false;
  }
  try {
    return storageKey === canonicalConsultationDocumentPath(storageKey.slice("consultation/".length, -"/quote.pdf".length));
  } catch {
    return false;
  }
}

function retainedDocumentRef(documentId: string | null, storageKey: string | null): {
  documentId: string | null;
  storageKey: string | null;
} {
  if (storageKey && !isRetainedConsultationStorageKey(storageKey)) {
    return { documentId: null, storageKey: null };
  }
  const fromKey = isRetainedConsultationStorageKey(storageKey) ? storageKey : null;
  if (!documentId) return { documentId: null, storageKey: fromKey };
  try {
    const parsed = parseConsultationDocumentId(documentId);
    const canonical = canonicalConsultationDocumentPath(parsed);
    if (fromKey && fromKey !== canonical) return { documentId: null, storageKey: null };
    return { documentId: parsed, storageKey: fromKey || canonical };
  } catch {
    return { documentId: null, storageKey: fromKey };
  }
}

function capabilityExpired(capability: ConsultationRetentionCapability, now: Date): boolean {
  const expiresAt = parseTime(capability.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt <= now.getTime();
}

function capabilityInactive(capability: ConsultationRetentionCapability, now: Date): boolean {
  return Boolean(capability.revokedAt) || capabilityExpired(capability, now);
}

export function planConsultationRetention(input: {
  now: Date;
  jobs: ConsultationRetentionJob[];
  documents: ConsultationRetentionDocument[];
}): ConsultationRetentionAction[] {
  const actions: ConsultationRetentionAction[] = [];
  const cleanedDocuments = new Set<string>();

  for (const job of input.jobs) {
    if (job.status !== "started" && job.status !== "failed") continue;
    if (!olderThan(job.updatedAt, input.now, CONSULTATION_MINT_GRACE_MS)) continue;
    const retained = retainedDocumentRef(job.documentId, job.storageKey);
    actions.push({
      type: "cleanup_failed_job",
      jobId: job.id,
      documentId: retained.documentId,
      storageKey: retained.storageKey,
    });
    if (retained.documentId) cleanedDocuments.add(retained.documentId);
  }

  for (const document of input.documents) {
    if (!isRetainedConsultationStorageKey(document.storageKey)) continue;
    if (cleanedDocuments.has(document.id)) continue;

    if (document.capabilities.length === 0) {
      if (!olderThan(document.createdAt, input.now, CONSULTATION_MINT_GRACE_MS)) continue;
      actions.push({
        type: "cleanup_orphan_document",
        documentId: document.id,
        storageKey: document.storageKey,
      });
      cleanedDocuments.add(document.id);
      continue;
    }

    for (const capability of document.capabilities) {
      if (!capability.revokedAt && capabilityExpired(capability, input.now)) {
        actions.push({
          type: "revoke_expired_capability",
          capabilityId: capability.id,
        });
      }
    }

    if (
      document.capabilities.every((capability) => capabilityInactive(capability, input.now))
    ) {
      const latestExpiry = Math.max(...document.capabilities.map((capability) => parseTime(capability.expiresAt)));
      if (
        Number.isFinite(latestExpiry)
        && latestExpiry + CONSULTATION_EXPIRED_PURGE_GRACE_MS <= input.now.getTime()
      ) {
        actions.push({
          type: "purge_expired_document",
          documentId: document.id,
          storageKey: document.storageKey,
        });
        cleanedDocuments.add(document.id);
      }
    }
  }

  return actions.slice(0, CONSULTATION_RETENTION_BATCH);
}

export async function applyConsultationRetention(
  actions: ConsultationRetentionAction[],
  store: ConsultationRetentionStore,
  now = new Date(),
): Promise<ConsultationRetentionSummary> {
  const summary: ConsultationRetentionSummary = {
    cleaned: 0,
    revoked: 0,
    purged: 0,
    failed: 0,
  };
  const revokedAt = now.toISOString();

  for (const action of actions) {
    try {
      if (action.type === "revoke_expired_capability") {
        await store.revokeCapability(action.capabilityId, revokedAt);
        summary.revoked += 1;
        continue;
      }
      if (action.type === "cleanup_failed_job") {
        if (action.storageKey) await store.removePdf(action.storageKey);
        if (action.documentId) await store.deleteDocument(action.documentId);
        await store.markJobCleaned(action.jobId);
        summary.cleaned += 1;
        continue;
      }
      if (action.type === "cleanup_orphan_document") {
        await store.removePdf(action.storageKey);
        await store.deleteDocument(action.documentId);
        summary.cleaned += 1;
        continue;
      }
      await store.removePdf(action.storageKey);
      await store.deleteDocument(action.documentId);
      summary.purged += 1;
    } catch {
      summary.failed += 1;
    }
  }

  return summary;
}

export function createSupabaseConsultationRetentionStore(supabase: {
  from: (table: string) => {
    update: (row: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: unknown }>;
    };
    delete: () => {
      eq: (column: string, value: string) => Promise<{ error: unknown }>;
    };
  };
  storage: {
    from: (bucket: string) => {
      remove: (paths: string[]) => Promise<{ error: unknown }>;
    };
  };
}): ConsultationRetentionStore {
  return {
    async removePdf(path) {
      if (!isRetainedConsultationStorageKey(path)) return;
      const { error } = await supabase.storage.from(CONSULTATION_DOCUMENTS_BUCKET).remove([path]);
      if (error) throw error;
    },
    async deleteDocument(id) {
      const documentId = parseConsultationDocumentId(id);
      const { error } = await supabase.from("consultation_documents").delete().eq("id", documentId);
      if (error) throw error;
    },
    async revokeCapability(id, revokedAt) {
      const capabilityId = parseConsultationDocumentId(id);
      const { error } = await supabase
        .from("consultation_document_capabilities")
        .update({ revoked_at: revokedAt })
        .eq("id", capabilityId);
      if (error) throw error;
    },
    async markJobCleaned(id) {
      const jobId = parseConsultationDocumentId(id);
      const { error } = await supabase
        .from("consultation_document_jobs")
        .update({ status: "cleaned", error_name: null, updated_at: new Date().toISOString() })
        .eq("id", jobId);
      if (error) throw error;
    },
  };
}

export function assertRetentionActionSafe(action: ConsultationRetentionAction): void {
  const serialized = JSON.stringify(action);
  if (serialized.includes("cd_") || serialized.includes("documentAccessUrl") || serialized.includes("spec-sheets")) {
    throw new Error("Retention action leaked a secret or public storage path");
  }
}
