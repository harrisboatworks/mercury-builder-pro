import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { corsHeaders } from "../_shared/cors.ts";
import { KB_DOCUMENTS } from "../_shared/format-kb-documents.ts";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const ELEVENLABS_AGENT_ID = "agent_0501kdexvsfkfx8a240g7ts27dy1";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

interface SyncResult {
  documentName: string;
  documentId: string | null;
  success: boolean;
  error?: string;
}

// Create a KB document from text
async function createKnowledgeBaseDocument(content: string, name: string): Promise<string | null> {
  console.log(`Creating KB document: ${name} (${content.length} chars)`);
  
  const response = await fetch("https://api.elevenlabs.io/v1/convai/knowledge-base/text", {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: name,
      text: content,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to create KB document ${name}:`, error);
    throw new Error(`Failed to create KB document: ${error}`);
  }

  const data = await response.json();
  console.log(`Created KB document ${name}:`, data.id || data.document_id);
  return data.id || data.document_id;
}

// List existing KB documents to find ones to update
async function listKnowledgeBaseDocuments(): Promise<Array<{ id: string; name: string }>> {
  console.log("Listing existing KB documents...");
  
  const response = await fetch("https://api.elevenlabs.io/v1/convai/knowledge-base", {
    method: "GET",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY!,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to list KB documents:", error);
    return [];
  }

  const data = await response.json();
  console.log("Existing KB documents:", data);
  
  // Handle different response formats
  if (Array.isArray(data)) {
    return data.map((doc: any) => ({ id: doc.id || doc.document_id, name: doc.name }));
  }
  if (data.documents && Array.isArray(data.documents)) {
    return data.documents.map((doc: any) => ({ id: doc.id || doc.document_id, name: doc.name }));
  }
  
  return [];
}

// Delete a KB document
async function deleteKnowledgeBaseDocument(documentId: string): Promise<boolean> {
  console.log(`Deleting KB document: ${documentId}`);
  
  const response = await fetch(`https://api.elevenlabs.io/v1/convai/knowledge-base/${documentId}`, {
    method: "DELETE",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY!,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.warn(`Failed to delete KB document ${documentId}:`, error);
    return false;
  }

  console.log(`Deleted KB document: ${documentId}`);
  return true;
}

// Get current agent configuration
async function getAgentConfig(): Promise<any> {
  console.log("Fetching current agent configuration...");
  
  const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${ELEVENLABS_AGENT_ID}`, {
    method: "GET",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY!,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to get agent config:", error);
    throw new Error(`Failed to get agent config: ${error}`);
  }

  return await response.json();
}

// Trigger RAG index computation for a document
async function triggerRagIndex(documentId: string): Promise<void> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/knowledge-base/${documentId}/rag-index`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "e5_mistral_7b_instruct" }),
    }
  );
  if (!response.ok) {
    const error = await response.text();
    // 409/400 often mean "already indexing/indexed" — log & continue to poll
    console.warn(`triggerRagIndex ${documentId} non-ok:`, response.status, error);
  }
}

// Poll the RAG index status for a document. Returns "ready" | "failed" | "pending" | "unknown".
// Optional `debugLog` triggers a raw JSON dump of the response (used for one pending doc per poll).
async function getRagIndexStatus(documentId: string, debugLog = false): Promise<string> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/knowledge-base/${documentId}/rag-index`,
    {
      method: "GET",
      headers: { "xi-api-key": ELEVENLABS_API_KEY! },
    }
  );
  if (!response.ok) return "unknown";
  const data = await response.json();
  if (debugLog) {
    console.log(`RAG index raw status for ${documentId}:`, JSON.stringify(data));
  }
  // Response shape varies; look for common status fields
  const indexes = Array.isArray(data) ? data : (data.indexes ?? [data]);
  // Ready statuses: strictly terminal-success values. "created" means the index
  // record exists but is still computing — do NOT treat it as ready.
  const READY = new Set(["succeeded", "ready", "success"]);
  const PENDING = new Set(["created", "creating", "processing", "pending", "in_progress", "running", "queued"]);
  const FAILED = new Set(["failed", "error"]);
  for (const idx of indexes) {
    const status = (idx?.status ?? idx?.rag_index_status ?? "").toString().toLowerCase();
    if (READY.has(status)) return "ready";
  }
  for (const idx of indexes) {
    const status = (idx?.status ?? idx?.rag_index_status ?? "").toString().toLowerCase();
    if (FAILED.has(status)) return "failed";
  }
  for (const idx of indexes) {
    const status = (idx?.status ?? idx?.rag_index_status ?? "").toString().toLowerCase();
    if (PENDING.has(status)) return "pending";
  }
  return "pending";
}

// Wait for all documents to have ready RAG indexes
async function waitForRagIndexes(
  documentIds: string[],
  { intervalMs = 2500, timeoutMs = 150_000 }: { intervalMs?: number; timeoutMs?: number } = {}
): Promise<{ ready: string[]; notReady: string[] }> {
  const ready = new Set<string>();
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const pending = documentIds.filter(id => !ready.has(id));
    if (pending.length === 0) break;
    let loggedRawThisCycle = false;
    for (const id of pending) {
      const shouldLogRaw = !loggedRawThisCycle;
      const status = await getRagIndexStatus(id, shouldLogRaw);
      if (shouldLogRaw) loggedRawThisCycle = true;
      console.log(`RAG index status ${id}: ${status}`);
      if (status === "ready") ready.add(id);
      if (status === "failed") {
        return { ready: [...ready], notReady: documentIds.filter(d => !ready.has(d)) };
      }
    }
    if (ready.size === documentIds.length) break;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return {
    ready: [...ready],
    notReady: documentIds.filter(d => !ready.has(d)),
  };
}


// Apply exact-string find/replace to a prompt. Returns updated text + report.
function applyPromptReplacements(
  prompt: string,
  replacements: Array<{ find: string; replace: string }>
): { updated: string; report: Array<{ find: string; status: "applied" | "not_found"; count?: number }> } {
  let updated = prompt;
  const report: Array<{ find: string; status: "applied" | "not_found"; count?: number }> = [];
  for (const r of replacements) {
    if (!r || typeof r.find !== "string" || typeof r.replace !== "string" || r.find.length === 0) {
      report.push({ find: String(r?.find ?? ""), status: "not_found" });
      continue;
    }
    if (!updated.includes(r.find)) {
      report.push({ find: r.find, status: "not_found" });
      continue;
    }
    let count = 0;
    // Replace all occurrences (exact string, no regex)
    while (updated.includes(r.find)) {
      updated = updated.replace(r.find, r.replace);
      count++;
      if (count > 1000) break; // safety
    }
    report.push({ find: r.find, status: "applied", count });
  }
  return { updated, report };
}

// Attach documents to the agent's knowledge base (optionally repair prompt).
async function attachDocumentsToAgent(
  newDocuments: Array<{ id: string; name: string }>,
  agentConfig: any,
  updatedPromptText?: string | null,
): Promise<void> {
  console.log(`Attaching ${newDocuments.length} documents to agent...`);

  // Get existing knowledge base documents
  const existingKB = agentConfig.conversation_config?.agent?.prompt?.knowledge_base || [];
  console.log(`Agent has ${existingKB.length} existing KB documents`);
  
  // Static document names to identify and replace
  const staticDocNames = Object.values(KB_DOCUMENTS).map(d => d.name.toLowerCase());
  
  // Filter out old static docs, keep other docs (like motor inventory)
  const preservedDocs = existingKB.filter((doc: any) => {
    const docName = (doc.name || "").toLowerCase();
    const isStaticDoc = staticDocNames.some(name => 
      docName.includes(name.toLowerCase()) || 
      name.toLowerCase().includes(docName)
    );
    if (isStaticDoc) {
      console.log(`Replacing existing static doc: ${doc.name}`);
    }
    return !isStaticDoc;
  });
  
  console.log(`Preserving ${preservedDocs.length} non-static documents`);
  
  const normalizedPreserved = preservedDocs.map((doc: any) => ({
    type: doc.type ?? "text",
    name: doc.name,
    id: doc.id,
    usage_mode: "auto",
  }));

  const mergedKB = [
    ...normalizedPreserved,
    ...newDocuments.map(d => ({
      type: "text",
      name: d.name,
      id: d.id,
      usage_mode: "auto",
    })),
  ];

  console.log(`Updating agent with ${mergedKB.length} total KB documents (usage_mode=auto, rag enabled)`);

  const promptPayload: Record<string, unknown> = {
    knowledge_base: mergedKB,
    rag: {
      enabled: true,
      embedding_model: "e5_mistral_7b_instruct",
      max_documents_length: 50000,
      max_vector_distance: 0.6,
    },
  };
  if (typeof updatedPromptText === "string") {
    promptPayload.prompt = updatedPromptText;
  }

  const updateResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${ELEVENLABS_AGENT_ID}`, {
    method: "PATCH",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversation_config: {
        agent: {
          prompt: promptPayload,
        },
      },
    }),
  });

  if (!updateResponse.ok) {
    const error = await updateResponse.text();
    console.error("ELEVENLABS_STATIC_KB_ATTACH_FAILED", "Failed to update agent with KB documents:", error);
    throw new Error(`Failed to attach documents to agent: ${error}`);
  }

  console.log("Successfully attached documents to agent");
}


serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting static KB sync...");

    // Validate API key
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    // Parse request body for optional document selection + debug flag + promptReplacements
    let selectedDocs: string[] | null = null;
    let debug = false;
    let promptReplacements: Array<{ find: string; replace: string }> = [];
    try {
      const body = await req.json();
      if (body?.documents && Array.isArray(body.documents)) {
        selectedDocs = body.documents;
      }
      if (body?.debug === true) {
        debug = true;
      }
      if (Array.isArray(body?.promptReplacements)) {
        promptReplacements = body.promptReplacements;
      }
    } catch {
      // No body or invalid JSON - sync all documents
    }


    // Fetch current agent config up-front (used for debug + baseline)
    const agentConfigBefore = await getAgentConfig();
    const currentPromptText: string =
      agentConfigBefore?.conversation_config?.agent?.prompt?.prompt ?? "";
    const currentKB: Array<{ id: string; name: string; type?: string }> =
      agentConfigBefore?.conversation_config?.agent?.prompt?.knowledge_base ?? [];

    // Get list of existing documents to check for updates
    const existingDocs = await listKnowledgeBaseDocuments();
    console.log(`Found ${existingDocs.length} existing KB documents`);

    const results: SyncResult[] = [];
    const createdDocuments: Array<{ id: string; name: string }> = [];
    // Docs we intend to delete *after* a successful agent PATCH
    const oldDocsToDelete: Array<{ id: string; name: string }> = [];

    // Process each document: generate + create new. Do NOT delete old yet.
    for (const [key, docConfig] of Object.entries(KB_DOCUMENTS)) {
      if (selectedDocs && !selectedDocs.includes(key)) {
        console.log(`Skipping ${docConfig.name} (not in selection)`);
        continue;
      }

      try {
        console.log(`\nProcessing: ${docConfig.name}`);

        const gen = docConfig.generator as (sb?: any) => string | Promise<string>;
        const content = await Promise.resolve(
          docConfig.requiresSupabase ? gen(supabaseAdmin) : gen()
        );
        console.log(`Generated ${content.length} characters`);

        // Identify (but don't yet delete) the existing doc for this slot
        const existing = existingDocs.find(d =>
          d.name.toLowerCase().includes(key.replace('_', ' ')) ||
          d.name.toLowerCase() === docConfig.name.toLowerCase()
        );
        if (existing) {
          console.log(`Marking existing document for post-attach deletion: ${existing.name} (${existing.id})`);
          oldDocsToDelete.push(existing);
        }

        // Create new document first
        const documentId = await createKnowledgeBaseDocument(content, docConfig.name);
        if (documentId) {
          createdDocuments.push({ id: documentId, name: docConfig.name });
        }

        results.push({
          documentName: docConfig.name,
          documentId,
          success: true,
        });

      } catch (error) {
        console.error(`Error processing ${docConfig.name}:`, error);
        results.push({
          documentName: docConfig.name,
          documentId: null,
          success: false,
          error: error.message,
        });
      }
    }

    // Trigger + await RAG indexing for all newly created docs BEFORE PATCHing agent
    let ragNotReady: string[] = [];
    if (createdDocuments.length > 0) {
      console.log(`Triggering RAG index for ${createdDocuments.length} new documents...`);
      for (const d of createdDocuments) {
        try { await triggerRagIndex(d.id); } catch (e) { console.warn(`triggerRagIndex threw for ${d.id}:`, e); }
      }
      const { ready, notReady } = await waitForRagIndexes(
        createdDocuments.map(d => d.id),
        { intervalMs: 2500, timeoutMs: 150_000 }
      );
      console.log(`RAG indexing done. ready=${ready.length} notReady=${notReady.length}`);
      ragNotReady = notReady;
      if (notReady.length === 0) {
        // Grace sleep — ElevenLabs sometimes reports "ready" a beat before the
        // agent PATCH endpoint accepts the doc. 3s buffer avoids rag_index_not_ready.
        console.log("RAG ready — 3s grace sleep before agent PATCH");
        await new Promise(r => setTimeout(r, 3000));
      }
    }


    // Apply prompt replacements (if any) against the pre-fetched agent config
    let promptReport: Array<{ find: string; status: "applied" | "not_found"; count?: number }> = [];
    let updatedPromptText: string | null = null;
    if (promptReplacements.length > 0) {
      const { updated, report } = applyPromptReplacements(currentPromptText, promptReplacements);
      promptReport = report;
      // Only send prompt in PATCH if at least one replacement actually applied
      if (report.some(r => r.status === "applied")) {
        updatedPromptText = updated;
      }
    }
    const replacementsApplied = promptReport.filter(r => r.status === "applied").length;

    // Attach all created documents to the agent BEFORE deleting anything
    let attachError: string | null = null;
    if (ragNotReady.length > 0) {
      attachError = `RAG index not ready for ${ragNotReady.length} document(s): ${ragNotReady.join(", ")}`;
      console.error("ELEVENLABS_STATIC_KB_ATTACH_FAILED", attachError);
    } else if (createdDocuments.length > 0 || updatedPromptText !== null) {
      try {
        await attachDocumentsToAgent(createdDocuments, agentConfigBefore, updatedPromptText);
        console.log(`Successfully attached ${createdDocuments.length} documents to agent`);
      } catch (error) {
        attachError = (error as Error).message;
        console.error("ELEVENLABS_STATIC_KB_ATTACH_FAILED", "Failed to attach documents to agent:", attachError);
      }
    }

    // If the PATCH failed, DO NOT delete old docs — the agent must keep
    // pointing at working documents. Also try to clean up the newly created
    // (now orphaned) docs so we don't accumulate junk.
    if (attachError) {
      for (const doc of createdDocuments) {
        try { await deleteKnowledgeBaseDocument(doc.id); } catch (_) { /* best effort */ }
      }
      return new Response(
        JSON.stringify({
          success: false,
          marker: "ELEVENLABS_STATIC_KB_ATTACH_FAILED",
          message: `Created ${createdDocuments.length} documents but failed to attach to agent: ${attachError}`,
          results,
          documentsProcessed: results.length,
          successCount: results.filter(r => r.success).length,
          failCount: results.filter(r => !r.success).length,
          ragNotReady,
          promptReplacements: promptReport,
          replacementsApplied,
          ...(debug ? {
            debug: {
              currentPromptTextPreview: currentPromptText.slice(0, 5000),
              currentPromptTextLength: currentPromptText.length,
              currentKnowledgeBase: currentKB.map(d => ({ id: d.id, name: d.name, type: d.type })),
            },
          } : {}),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // PATCH succeeded — now it's safe to delete the replaced old docs
    const deletionResults: Array<{ id: string; name: string; deleted: boolean }> = [];
    for (const doc of oldDocsToDelete) {
      // Guard: skip if this id happens to also be in the newly attached set
      if (createdDocuments.some(nd => nd.id === doc.id)) continue;
      const ok = await deleteKnowledgeBaseDocument(doc.id);
      deletionResults.push({ id: doc.id, name: doc.name, deleted: ok });
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`\nSync complete: ${successCount} success, ${failCount} failed, ${deletionResults.filter(d => d.deleted).length} old docs deleted, ${replacementsApplied} prompt replacements applied`);

    return new Response(
      JSON.stringify({
        success: failCount === 0,
        message: `Synced and attached ${successCount} of ${results.length} documents to agent`,
        results,
        documentsProcessed: results.length,
        successCount,
        failCount,
        oldDocsDeleted: deletionResults,
        promptReplacements: promptReport,
        replacementsApplied,
        ...(debug ? {
          debug: {
            currentPromptTextPreview: currentPromptText.slice(0, 5000),
            currentPromptTextLength: currentPromptText.length,
            currentKnowledgeBase: currentKB.map(d => ({ id: d.id, name: d.name, type: d.type })),
          },
        } : {}),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );


  } catch (error) {
    console.error("Static KB sync error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
