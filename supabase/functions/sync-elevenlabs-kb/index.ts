import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { corsHeaders } from "../_shared/cors.ts";
import { KB_DOCUMENTS } from "../_shared/format-kb-documents.ts";
import { requireAdmin } from "../_shared/admin-auth.ts";

// ... keep existing code (constants, interfaces, helper functions through syncStaticDocuments)

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Admin auth check
  const authResult = await requireAdmin(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  try {
    console.log("Starting ElevenLabs KB sync...");

    // Validate required env vars
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    // Create Supabase client with service role for full access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch current inventory
    console.log("Fetching motor inventory...");
    const { data: motors, error: motorsError } = await supabase
      .from("motor_models")
      .select("id, model, model_display, horsepower, msrp, dealer_price, in_stock, stock_quantity, motor_type, shaft, family, availability, stock_number")
      .order("horsepower", { ascending: true });

    if (motorsError) {
      throw new Error(`Failed to fetch motors: ${motorsError.message}`);
    }

    console.log(`Fetched ${motors?.length || 0} motors`);

    // Format inventory document
    const inventoryDoc = formatInventoryDocument(motors || []);
    const docName = `Harris Boatworks Inventory - ${new Date().toISOString().split('T')[0]}`;

    // Get existing sync state
    const { data: syncState } = await supabase
      .from("elevenlabs_sync_state")
      .select("*")
      .eq("agent_id", ELEVENLABS_AGENT_ID)
      .single();

    // Delete old document if exists
    if (syncState?.document_id) {
      console.log("Deleting old KB document...");
      await deleteKnowledgeBaseDocument(syncState.document_id);
    }

    // Create new inventory document
    console.log("Creating new inventory KB document...");
    const newDocumentId = await createKnowledgeBaseDocument(inventoryDoc, docName);

    if (!newDocumentId) {
      throw new Error("Failed to create inventory KB document - no ID returned");
    }

    // Sync static documents
    console.log("Syncing static KB documents...");
    const { docs: staticDocs, results: staticResults } = await syncStaticDocuments();
    
    const staticSuccessCount = staticResults.filter(r => r.success).length;
    const staticFailCount = staticResults.filter(r => !r.success).length;
    console.log(`Static docs: ${staticSuccessCount} success, ${staticFailCount} failed`);

    // Update agent with ALL documents (inventory + static)
    console.log("Updating agent with all KB documents...");
    await updateAgentKnowledgeBase(newDocumentId, docName, staticDocs);

    // Calculate stats
    const inStockCount = motors?.filter(m => m.in_stock && (m.stock_quantity || 0) > 0).length || 0;

    // Update or create sync state
    const syncData = {
      agent_id: ELEVENLABS_AGENT_ID,
      document_id: newDocumentId,
      document_name: docName,
      last_synced_at: new Date().toISOString(),
      sync_status: "success",
      motor_count: motors?.length || 0,
      in_stock_count: inStockCount,
      error_message: null,
    };

    if (syncState) {
      await supabase
        .from("elevenlabs_sync_state")
        .update(syncData)
        .eq("id", syncState.id);
    } else {
      await supabase
        .from("elevenlabs_sync_state")
        .insert(syncData);
    }

    console.log("Full KB sync completed successfully!");

    return new Response(
      JSON.stringify({
        success: true,
        documentId: newDocumentId,
        documentName: docName,
        motorCount: motors?.length || 0,
        inStockCount,
        staticDocsCount: staticSuccessCount,
        staticDocsFailed: staticFailCount,
        staticResults,
        message: `Synced inventory + ${staticSuccessCount} static documents`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("KB sync error:", error);

    // Try to log error to sync state
    try {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
      await supabase
        .from("elevenlabs_sync_state")
        .upsert({
          agent_id: ELEVENLABS_AGENT_ID,
          sync_status: "error",
          error_message: error.message,
          last_synced_at: new Date().toISOString(),
        }, { onConflict: "agent_id" });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

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
