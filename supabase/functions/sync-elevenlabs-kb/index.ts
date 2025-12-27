import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const ELEVENLABS_AGENT_ID = "agent_0501kdexvsfkfx8a240g7ts27dy1"; // Same as conversation-token
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface Motor {
  id: string;
  model: string;
  model_display: string;
  horsepower: number;
  msrp: number;
  dealer_price: number;
  in_stock: boolean;
  stock_quantity: number;
  motor_type: string;
  shaft: string;
  family: string;
  availability: string;
  stock_number: string;
}

// Format a single motor entry for the KB document
function formatMotorEntry(motor: Motor): string {
  const hp = motor.horsepower || 0;
  const displayName = motor.model_display || motor.model || `${hp} HP Motor`;
  const price = motor.msrp || motor.dealer_price || 0;
  const inStock = motor.in_stock && (motor.stock_quantity || 0) > 0;
  
  let entry = `### ${displayName} (${hp} HP)\n`;
  
  if (motor.stock_number) {
    entry += `- Stock Number: ${motor.stock_number}\n`;
  }
  
  if (price > 0) {
    entry += `- Price: $${price.toLocaleString()} CAD\n`;
  }
  
  if (motor.motor_type || motor.family) {
    const type = [motor.motor_type, motor.family].filter(Boolean).join(', ');
    entry += `- Type: ${type}\n`;
  }
  
  if (motor.shaft) {
    entry += `- Shaft: ${motor.shaft}\n`;
  }
  
  entry += `- Availability: ${inStock ? 'In Stock ✓' : motor.availability || 'Available to Order'}\n`;
  
  return entry;
}

// Format all inventory data as a structured document
function formatInventoryDocument(motors: Motor[]): string {
  const now = new Date().toISOString();
  
  // Separate in-stock vs available to order
  const inStockMotors = motors.filter(m => m.in_stock && (m.stock_quantity || 0) > 0);
  const availableMotors = motors.filter(m => !m.in_stock || (m.stock_quantity || 0) === 0);
  
  // Sort by horsepower
  inStockMotors.sort((a, b) => (a.horsepower || 0) - (b.horsepower || 0));
  availableMotors.sort((a, b) => (a.horsepower || 0) - (b.horsepower || 0));
  
  let doc = `# Harris Boatworks Mercury Outboard Motor Inventory
Updated: ${now}

This is the current inventory for Harris Boatworks, an authorized Mercury Marine dealer in Vancouver, BC, Canada. All prices are in Canadian Dollars (CAD).

## IMPORTANT NOTES
- All prices are in CAD (Canadian Dollars)
- Never quote exact prices - always direct customers to use the quote builder
- Harris Boatworks does NOT offer delivery - customer pickup only
- Location: Vancouver, BC, Canada

`;

  // In-stock section
  doc += `## IN-STOCK MOTORS (Ready for Immediate Pickup)
${inStockMotors.length > 0 ? `We currently have ${inStockMotors.length} motors in stock.\n\n` : 'No motors currently in stock. All motors available to order.\n\n'}`;

  for (const motor of inStockMotors) {
    doc += formatMotorEntry(motor) + '\n';
  }

  // Available to order section
  doc += `\n## AVAILABLE TO ORDER
${availableMotors.length} models available to order.\n\n`;

  // Group by HP range for cleaner organization
  const hpRanges = [
    { min: 0, max: 15, label: 'Portable (2.5-15 HP)' },
    { min: 15, max: 40, label: 'Mid-Range (15-40 HP)' },
    { min: 40, max: 115, label: 'High Power (40-115 HP)' },
    { min: 115, max: 200, label: 'V6 (115-200 HP)' },
    { min: 200, max: 600, label: 'Verado & V8+ (200+ HP)' },
  ];

  for (const range of hpRanges) {
    const motorsInRange = availableMotors.filter(m => 
      (m.horsepower || 0) >= range.min && (m.horsepower || 0) < range.max
    );
    
    if (motorsInRange.length > 0) {
      doc += `### ${range.label}\n`;
      for (const motor of motorsInRange.slice(0, 10)) { // Limit to 10 per range to keep doc size manageable
        doc += formatMotorEntry(motor) + '\n';
      }
      if (motorsInRange.length > 10) {
        doc += `... and ${motorsInRange.length - 10} more models in this range.\n\n`;
      }
    }
  }

  // Model code decoder
  doc += `
## MODEL CODE DECODER
Understanding Mercury model names:

### Start Type
- E = Electric Start
- M = Manual Start (Pull Start)

### Shaft Length
- S = Short Shaft (15")
- L = Long Shaft (20")
- XL = Extra Long Shaft (25")
- XXL = Extra Extra Long (30")

### Steering/Control
- H = Tiller Handle
- PT = Power Trim & Tilt
- CT = Command Thrust (High Thrust Gearcase)
- DTS = Digital Throttle & Shift

### Special Designations
- Pro XS = High Performance Racing
- SeaPro = Commercial Duty
- Verado = Premium V6/V8 with supercharger
- FourStroke = Standard 4-stroke engine

### Examples
- "9.9 ELH" = 9.9 HP, Electric start, Long shaft, tiller Handle
- "150 CXL Pro XS" = 150 HP, Counter-rotation, Extra Long shaft, Pro XS performance
- "300 CXXL Verado" = 300 HP, Counter-rotation, Extra Extra Long shaft, Verado premium

## PRODUCT LINES

### FourStroke (Most Popular)
- Reliable, fuel-efficient 4-stroke engines
- Range: 2.5 HP to 150 HP
- Best for: Recreational boating, fishing

### Pro XS (Performance)
- Optimized for speed and acceleration
- Range: 115 HP to 300 HP
- Best for: Bass boats, performance fishing

### SeaPro (Commercial)
- Built for heavy-duty commercial use
- Range: 15 HP to 300 HP
- Best for: Commercial fishing, charters

### Verado (Premium)
- Supercharged V6 and V8 engines
- Range: 175 HP to 600 HP
- Best for: Large boats, premium performance
- Features: Quietest, smoothest operation
`;

  return doc;
}

// Create a new KB document from text
// Endpoint: POST /v1/convai/knowledge-base/text
async function createKnowledgeBaseDocument(content: string, name: string): Promise<string | null> {
  console.log(`Creating KB document: ${name}`);
  
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
    console.error("Failed to create KB document:", error);
    throw new Error(`Failed to create KB document: ${error}`);
  }

  const data = await response.json();
  console.log("Created KB document:", data);
  return data.id || data.document_id;
}

// Delete a KB document
// Endpoint: DELETE /v1/convai/knowledge-base/{document_id}
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
    console.warn("Failed to delete KB document (may not exist):", error);
    return false;
  }

  console.log("Deleted KB document successfully");
  return true;
}

// Update agent to use new KB document
// Based on ElevenLabs SDK, the knowledge_base is nested under conversation_config.agent.prompt.knowledge_base
async function updateAgentKnowledgeBase(agentId: string, documentId: string, documentName: string): Promise<boolean> {
  console.log(`Updating agent ${agentId} with KB document ${documentId}`);
  
  // First, get current agent config to see structure
  const getResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
    method: "GET",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY!,
    },
  });

  if (!getResponse.ok) {
    const error = await getResponse.text();
    console.error("Failed to get agent config:", error);
    throw new Error(`Failed to get agent config: ${error}`);
  }

  const agentConfig = await getResponse.json();
  console.log("Current agent config structure:", JSON.stringify(agentConfig, null, 2).slice(0, 500));

  // Update agent with new document in knowledge base
  // The structure is: conversation_config.agent.prompt.knowledge_base
  const updateResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
    method: "PATCH",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversation_config: {
        agent: {
          prompt: {
            knowledge_base: [
              {
                type: "text",
                name: documentName,
                id: documentId,
              }
            ]
          }
        }
      }
    }),
  });

  if (!updateResponse.ok) {
    const error = await updateResponse.text();
    console.error("Failed to update agent:", error);
    throw new Error(`Failed to update agent: ${error}`);
  }

  console.log("Agent updated successfully");
  return true;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    // Create new document
    console.log("Creating new KB document...");
    const newDocumentId = await createKnowledgeBaseDocument(inventoryDoc, docName);

    if (!newDocumentId) {
      throw new Error("Failed to create new KB document - no ID returned");
    }

    // Update agent to use new document
    console.log("Updating agent with new KB document...");
    await updateAgentKnowledgeBase(ELEVENLABS_AGENT_ID, newDocumentId, docName);

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

    console.log("KB sync completed successfully!");

    return new Response(
      JSON.stringify({
        success: true,
        documentId: newDocumentId,
        documentName: docName,
        motorCount: motors?.length || 0,
        inStockCount,
        message: "Knowledge base synced successfully",
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
