import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { KB_DOCUMENTS } from "../_shared/format-kb-documents.ts";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const ELEVENLABS_AGENT_ID = "agent_0501kdexvsfkfx8a240g7ts27dy1";

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

// Attach documents to the agent's knowledge base
async function attachDocumentsToAgent(newDocuments: Array<{ id: string; name: string }>): Promise<void> {
  console.log(`Attaching ${newDocuments.length} documents to agent...`);
  
  // Get current agent config to preserve existing documents
  const agentConfig = await getAgentConfig();
  
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
  
  // Merge: preserved docs + new static docs
  const mergedKB = [
    ...preservedDocs,
    ...newDocuments.map(d => ({
      type: "text",
      name: d.name,
      id: d.id,
    })),
  ];
  
  console.log(`Updating agent with ${mergedKB.length} total KB documents`);
  
  // Update the agent with merged knowledge base
  const updateResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${ELEVENLABS_AGENT_ID}`, {
    method: "PATCH",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversation_config: {
        agent: {
          prompt: {
            knowledge_base: mergedKB,
          },
        },
      },
    }),
  });

  if (!updateResponse.ok) {
    const error = await updateResponse.text();
    console.error("Failed to update agent with KB documents:", error);
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

    // Parse request body for optional document selection
    let selectedDocs: string[] | null = null;
    try {
      const body = await req.json();
      if (body.documents && Array.isArray(body.documents)) {
        selectedDocs = body.documents;
      }
    } catch {
      // No body or invalid JSON - sync all documents
    }

    // Get list of existing documents to check for updates
    const existingDocs = await listKnowledgeBaseDocuments();
    console.log(`Found ${existingDocs.length} existing KB documents`);

    const results: SyncResult[] = [];
    const createdDocuments: Array<{ id: string; name: string }> = [];

    // Process each document
    for (const [key, docConfig] of Object.entries(KB_DOCUMENTS)) {
      // Skip if specific documents were requested and this isn't one of them
      if (selectedDocs && !selectedDocs.includes(key)) {
        console.log(`Skipping ${docConfig.name} (not in selection)`);
        continue;
      }

      try {
        console.log(`\nProcessing: ${docConfig.name}`);
        
        // Generate the document content
        const content = docConfig.generator();
        console.log(`Generated ${content.length} characters`);

        // Check if document already exists (by name match)
        const existing = existingDocs.find(d => 
          d.name.toLowerCase().includes(key.replace('_', ' ')) ||
          d.name.toLowerCase() === docConfig.name.toLowerCase()
        );

        if (existing) {
          console.log(`Found existing document: ${existing.name} (${existing.id}) - deleting...`);
          await deleteKnowledgeBaseDocument(existing.id);
        }

        // Create new document
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

    // Attach all created documents to the agent
    if (createdDocuments.length > 0) {
      try {
        await attachDocumentsToAgent(createdDocuments);
        console.log(`Successfully attached ${createdDocuments.length} documents to agent`);
      } catch (error) {
        console.error("Failed to attach documents to agent:", error);
        // Don't fail the whole operation, but note it in response
        return new Response(
          JSON.stringify({
            success: false,
            message: `Created ${createdDocuments.length} documents but failed to attach to agent: ${error.message}`,
            results,
            documentsProcessed: results.length,
            successCount: results.filter(r => r.success).length,
            failCount: results.filter(r => !r.success).length,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`\nSync complete: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: failCount === 0,
        message: `Synced and attached ${successCount} of ${results.length} documents to agent`,
        results,
        documentsProcessed: results.length,
        successCount,
        failCount,
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
