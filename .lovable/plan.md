

# Add `list_accessories` Action to Agent Quote API

## What
Add a new `list_accessories` action that returns the full accessories catalog (propellers, controls, batteries, maintenance items) from the existing `ACCESSORIES_DATA` in `src/lib/accessories-data.ts`. This gives the agent access to the general accessories catalog beyond motor-specific options.

## Changes

### `supabase/functions/agent-quote-api/index.ts`
- Add `list_accessories` case to the switch statement
- Implement `listAccessories` function that:
  - Embeds or imports the accessories catalog data (since edge functions can't import from `src/`)
  - Accepts optional `category` filter (propellers, controls, batteries, maintenance) and `search` text
  - Returns items with id, name, category, price, description, part number, compatibility, and in-stock status
- Add `"list_accessories"` to the `available_actions` array

Since edge functions can't import from `src/lib/accessories-data.ts`, the catalog data will be embedded directly in the function. The dataset is ~400 lines but the API response will be a simplified projection (id, name, category, price, partNumber, compatibility, shortDescription).

### `AGENT_API_INSTRUCTIONS.md`
- Document the new `list_accessories` action with request/response examples
- Add guidance: "Use `list_motor_options` for motor-specific options and `list_accessories` for general catalog items like propellers, controls, and batteries"
- Add to the example workflows section

