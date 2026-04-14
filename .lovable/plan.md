

# Fix AI Chat & Voice Agent: Pricing, Promotions, and ProKicker Knowledge

## Problems Found

### 1. Chatbot uses wrong pricing hierarchy
The `ai-chatbot-stream` uses `sale_price || msrp` everywhere, completely skipping `dealer_price`. This means motors without an explicit `sale_price` show full MSRP instead of the correct "Our Price" (dealer_price). Affected locations:
- `buildGroupedInventorySummary()` line 161: `m.sale_price || m.msrp`
- `buildSystemPrompt()` line 780: `m.sale_price || m.msrp || m.price`
- `getMotorsForComparison()` lines 1877/1881: `motor1.sale_price || motor1.msrp`
- `getMotorsForHP()` line 1895: `m.sale_price || m.msrp`
- DB queries don't even fetch `dealer_price`

### 2. No ProKicker knowledge in any AI agent
- The chatbot system prompt has no section explaining ProKicker vs regular tiller motors
- The voice `realtime-session` prompt has zero ProKicker mention
- The `mercury-knowledge.ts` shared knowledge base has no ProKicker entry
- Customers asking "what's the difference between a 9.9 tiller and a ProKicker?" get no useful answer

### 3. Voice agent has hardcoded promotion dates
The `realtime-session` prompt has "Get 7 (Jan 12 – Mar 31, 2026)" hardcoded. When the promo ends or changes, the voice agent will give stale info. It should fetch from the database like the chatbot does.

## Changes

### File 1: `supabase/functions/ai-chatbot-stream/index.ts`

**a) Add `dealer_price` to all DB queries:**
- `getCurrentMotorInventory()` — add `dealer_price` to select
- `getMotorsForHP()` — add `dealer_price` to select
- `getMotorsForComparison()` — add `dealer_price` to select

**b) Fix pricing hierarchy in all price references:**
Replace `m.sale_price || m.msrp` with the correct hierarchy:
```
sale_price || (dealer_price < msrp ? dealer_price : null) || msrp
```
Apply to: `buildGroupedInventorySummary`, `buildSystemPrompt` (motor context), comparison context, HP-specific motor listing.

**c) Add ProKicker knowledge section to system prompt:**
Add a dedicated section explaining:
- ProKicker is a purpose-built trolling/kicker motor, NOT a regular tiller motor
- Optimized gear ratio for slow-speed trolling precision
- Higher gear ratio = more thrust at low RPM, less top speed
- Specialized propeller for trolling
- Best for: salmon/walleye trolling, kicker motor on larger boats
- vs Regular 9.9 tiller: standard gear ratio, general-purpose, works as primary or auxiliary motor
- ProKicker is NOT compatible with SmartCraft Connect

### File 2: `supabase/functions/realtime-session/index.ts`

**a) Fetch promotions from database** instead of hardcoding them. Query the `promotions` table for active promos and inject them into the instructions dynamically.

**b) Add ProKicker vs tiller knowledge** to the voice instructions so the agent can answer verbally.

### File 3: `supabase/functions/_shared/mercury-knowledge.ts`

Add ProKicker family entry to the shared knowledge base so both chatbot and voice agents can reference it.

## Result
- All AI agents show the correct "Our Price" (dealer_price) instead of MSRP
- Promotions are always current — fetched from database, not hardcoded
- Agents can clearly explain ProKicker vs regular tiller motors
- No pricing math changes — purely data sourcing and knowledge fixes

