import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { KB_DOCUMENTS } from "../_shared/format-kb-documents.ts";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

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

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`\nSync complete: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: failCount === 0,
        message: `Synced ${successCount} of ${results.length} documents`,
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
