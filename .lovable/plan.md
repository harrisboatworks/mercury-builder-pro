

## Plan: Voice Agent Quote Creation Workflow

### The Idea

Harris (the voice agent) currently helps customers browse motors, check prices, estimate trade-ins, and navigate the quote builder — but the customer still has to manually click through the UI to finalize a quote. By adding a `create_quote` server tool that calls your existing `agent-quote-api`, Harris can conversationally collect the needed info and build the quote end-to-end, just like a salesperson on the phone would.

### What Changes

**1. New ElevenLabs Server Tool: `create_customer_quote`**

Add a server tool in the ElevenLabs dashboard that calls your existing `agent-quote-api` endpoint. Harris already knows the motor from context, so it just needs to collect name, email, and optionally phone/trade-in details through natural conversation.

- **Endpoint:** `https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/agent-quote-api`
- **Method:** POST
- **Headers:** `x-agent-key: <your key>`, `Content-Type: application/json`
- **Body parameters:** `action` (always `"create_quote"`), `customer_name`, `customer_email`, `customer_phone`, `motor_id`, `promo_option`, `trade_in` object, `warranty_years`, `purchase_path`, `customer_notes`

**2. New Client Tool: `deliver_quote_link`**

After the server tool returns the `share_url`, Harris needs a client tool to display it on screen (toast + activity card) so the customer can tap/click the link. This goes in `useElevenLabsVoice.ts`.

**3. Update ElevenLabs System Prompt**

Add a "Phone Quoting" section to the agent's system prompt instructing Harris how to conversationally gather quote info:

```text
## PHONE QUOTING WORKFLOW
When a customer wants a quote, gather info naturally through conversation:
1. Motor selection — you likely already know this from the conversation
2. Name — "Who should I put this quote under?"
3. Email — "What's the best email to send this to?"
4. Phone (optional) — "Want me to text you the link too?"
5. Trade-in (optional) — "Are you trading anything in?"
6. Then call create_customer_quote with all collected info
7. After creating, use deliver_quote_link to show the link on screen
8. Read back the key numbers: price, any rebate, warranty coverage

RULES:
- Don't ask all questions at once — keep it conversational
- If they already told you their name/phone (e.g. from schedule_callback), reuse it
- Always confirm the motor before creating the quote
- After creating, say something like "Your quote is ready — I've put the link on your screen"
```

**4. Documentation Update**

Add a "Voice Agent Workflow" section to `AGENT_API_INSTRUCTIONS.md` documenting this flow, so any agent (external or voice) can follow the same pattern.

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useElevenLabsVoice.ts` | Add `create_customer_quote` server tool handler + `deliver_quote_link` client tool |
| `ELEVENLABS_VOICE_TOOLS_SETUP.md` | Document new server tool config + client tool config for ElevenLabs dashboard |
| `AGENT_API_INSTRUCTIONS.md` | Add Section 9: Voice Agent Workflow |

### Conversational Flow Example

```text
Customer: "I think I want the 150 FourStroke. Can you put together a quote?"
Harris: "Absolutely! The 150 FourStroke is a great choice. Who should I put this quote under?"
Customer: "Dave Wilson"
Harris: "Got it, Dave. What's the best email to send your quote to?"
Customer: "dave@email.com"
Harris: "Perfect. Are you trading in a motor?"
Customer: "Yeah, I've got a 2018 Yamaha 90, runs fine"
Harris: "Nice — that should get you around $4,000 credit. Let me build your quote..."
[calls create_customer_quote → gets back pricing]
Harris: "All set! Your quote for the 150 FourStroke comes to $16,200 after your trade-in 
         and the $500 Get 7 rebate. That includes 7 years of warranty. I've put the link 
         on your screen so you can review all the details."
[calls deliver_quote_link → toast + card appears]
```

### Why This Works Well

- **Zero new backend code** — the `agent-quote-api` already handles everything (pricing, dual-write, SMS notifications, promotions)
- Harris already has `check_inventory`, `estimate_trade_value`, and motor context — the quote is just the final step
- The admin still gets the SMS alert with both links
- The customer gets a real, saved quote they can open anytime

