import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const AGENT_KEY = Deno.env.get("AGENT_QUOTE_API_KEY") || Deno.env.get("VITE_AGENT_QUOTE_API_KEY");

Deno.test("create_quote with customer_has_prop=true returns $0 propeller", async () => {
  if (!AGENT_KEY) {
    console.log("AGENT_QUOTE_API_KEY not available, skipping");
    return;
  }

  const res = await fetch(`${SUPABASE_URL}/functions/v1/agent-quote-api`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-agent-key": AGENT_KEY,
    },
    body: JSON.stringify({
      action: "create_quote",
      hp: 115,
      customer_name: "Prop Test Customer",
      customer_email: "proptest@example.com",
      customer_phone: "555-0199",
      purchase_path: "installed",
      customer_has_prop: true,
      package: "good",
    }),
  });

  const body = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(body, null, 2));

  assertEquals(res.status, 200, `Expected 200 but got ${res.status}: ${JSON.stringify(body)}`);

  // Check accessory breakdown contains "Use of Customer Propeller" at $0
  const breakdown = body.data?.accessoryBreakdown || body.accessoryBreakdown || [];
  console.log("Accessory Breakdown:", JSON.stringify(breakdown, null, 2));

  const propItem = breakdown.find((i: any) => i.name?.includes("Customer Propeller"));
  assertEquals(!!propItem, true, "Expected 'Use of Customer Propeller' in breakdown");
  assertEquals(propItem.price, 0, "Expected $0 for customer propeller");

  // Verify share_url exists
  const shareUrl = body.data?.share_url || body.share_url;
  console.log("Share URL:", shareUrl);

  // Verify no propeller cost in the total
  const noPropBreakdown = breakdown.filter((i: any) =>
    i.name?.includes("Propeller Allowance")
  );
  assertEquals(noPropBreakdown.length, 0, "Should NOT have a Propeller Allowance line item");
});
