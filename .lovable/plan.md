# Plan: Filter Counts, Share Link, and Tool-Intent Fallback

Three independent improvements addressing UX confidence on filters, instant quote access in chat, and reliable quote creation from web chat.

---

## 1. Validate filters & show "X motors match" counts

**Goal:** Show live match counts on HP / Price / Stock filters as the user adjusts them, validated against the cached inventory dataset.

**Current state:**
- `MotorSelectionPage.tsx` already shows `{finalFilteredMotors.length} results` (line 982), but only as a small grey label after filtering.
- `ConfigFilterSheet.tsx` already computes per-pill counts for HP/start/control/shaft/in-stock.
- `MotorFilters.tsx` (older sidebar) and `MotorFinderWizard.tsx` (HP/price range sliders) do **not** show counts as you drag.
- `QuickHPFilters.tsx` already computes counts but doesn't display them on the pill.

**Changes:**
- **`QuickHPFilters.tsx`** — render the count next to each HP label (e.g. `25 HP · 4`, dimmed when 0). Re-use the existing `getCount()` function.
- **`MotorFinderWizard.tsx`** — accept the live `motors` array as a prop, compute matches for the current `hpRange` + `priceRange` + `stockStatus`, and display "**12 motors match**" prominently above the Apply button. Disable Apply when 0.
- **`MotorFilters.tsx`** — same: add a memoized count line ("12 motors match these filters") under the sliders, plus per-stock-status counts on those buttons (mirroring the existing category counts pattern).
- **`MotorSelectionPage.tsx`** — promote the `{N} results` label from tiny grey text to a small badge ("**12 motors match**") so it's visible after Apply.

**Validation:** All counts derive from the same `processedMotors` list the grid renders, so they are guaranteed to match.

---

## 2. Clickable share/view link in web chat after quote creation

**Goal:** When a quote is created via the web chat agent, the assistant's reply includes a tappable link to open the PDF/summary page immediately.

**Approach:**
- The new `create_quote` tool (added in step 3 below) returns `{ quote_id, share_url, summary, … }` from `voice-create-quote`.
- After a successful tool call, the chat appends a final assistant message in the format:
  ```
  ✅ Quote HBW-XXXXX created — emailed to you.
  [View your quote →](https://mercuryquote.ca/q/<share_token>)
  ```
- The existing `ChatBubble.tsx` already parses markdown `[text](url)` links via `parseMessageText` and routes external URLs as new-tab anchors. No new render code needed — the link will be clickable automatically.
- For the share URL we use the existing `share_token` already returned by `agent-quote-api` (which generates `/q/:token` shareable URLs).

---

## 3. Non-streaming fallback in web chat for tool-intent messages

**Current gap:** `ai-chatbot-stream/index.ts` has **no tool definitions** in either the streaming or non-streaming OpenAI calls. So today it cannot create quotes — it can only discuss them.

**Approach (per earlier approval — "Non-streaming fallback when tool intent detected"):**

### Edge function: `supabase/functions/ai-chatbot-stream/index.ts`

1. **Detect tool intent before model call** — lightweight regex check on the incoming `message`:
   ```
   /(create|send|make|build|generate|email)\s+(me\s+)?(a\s+)?quote/i
   /(book|reserve)\b.*\b(me|this|the)\b/i
   ```
   If matched, set `forceNonStreaming = true` AND inject the `create_quote` tool spec into the OpenAI request.

2. **Add `create_quote` tool definition** (OpenAI function-calling schema) with required fields: `customer_name`, `customer_email`, `motor_id`, optional `customer_phone`, `purchase_path`, `customer_notes`. Description tells the model: "Use ONLY when the customer has provided their full name, email, and selected a specific motor. Otherwise ask for missing info first."

3. **Tool-call execution path (non-streaming only):**
   - Run the OpenAI request without `stream: true` and with `tools: [createQuoteTool]`, `tool_choice: 'auto'`.
   - If the response contains `tool_calls`, parse the args, POST internally to `voice-create-quote` (or `agent-quote-api` directly with the server-side `AGENT_QUOTE_API_KEY`), passing `conversation_id` from `context` and `conversation_channel: 'web_chat'`.
   - Feed the tool result back into a second OpenAI call (standard tool-loop pattern) so the model produces the final natural-language confirmation including the share link.
   - Return the final reply as a normal JSON `{ reply, quote_id, share_url, … }` response.

4. **Streaming path stays unchanged** for normal chat (no tools, lowest latency).

### Client: `src/lib/streamParser.ts`

5. **Add tool-intent detection mirror** on the client (same regex). When matched, call the function with `stream: false` directly — skipping the SSE attempt entirely. This avoids the wasted streaming round-trip and the brief "fallback warning" log.

6. **Surface returned `share_url`** — when the JSON response contains `share_url`, append the `[View your quote →](url)` markdown to the reply before invoking `onDone`, so existing chat surfaces (`InlineChatDrawer`, `EnhancedChatWidget`, `MotorInlineChatPanel`) render it without changes.

### Conversation linking (already wired in agent-quote-api per last turn)
- `conversation_id` is read from chat context and threaded through, so the new quote row links back to the transcript via `customer_quotes.quote_data.conversation_id` and `chat_conversations.context.quote_ids`.

---

## Files touched

**Frontend (4):**
- `src/components/motors/QuickHPFilters.tsx` — show counts on pills
- `src/components/quote-builder/MotorFinderWizard.tsx` — live match count above Apply
- `src/components/quote-builder/MotorFilters.tsx` — match count + per-stock counts
- `src/pages/quote/MotorSelectionPage.tsx` — promote results badge
- `src/lib/streamParser.ts` — tool-intent detection + share-link injection

**Edge function (1):**
- `supabase/functions/ai-chatbot-stream/index.ts` — `create_quote` tool, non-streaming tool loop

**No DB migrations, no new secrets, no new edge functions.** Re-uses `voice-create-quote` from the previous turn.

---

## Out of scope
- Voice agent share-link rendering (already returned in the tool result; voice agent will speak it naturally).
- Server-side PDF attachment (deferred per earlier decision — link-only email).
- Refactoring the streaming path to support tools (kept fast & simple per "Non-streaming fallback" choice).
