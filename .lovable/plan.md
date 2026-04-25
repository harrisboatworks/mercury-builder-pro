
<plan-step>B1: Add `AgentCTAButton` + `agentPrompts.ts` and place across Index hero, /repower, /motors/{slug}, /trade-in-value, /finance-calculator, cost-guide blog, cheapest-Mercury blog, quote summary</plan-step>
<plan-step>B4: Harden agent business rules in ai-chatbot, ai-chatbot-stream, realtime-session edge functions + AI-Chatbot-Knowledge-Base.md (CAD only, Pickup Gores Landing, Verado special-order, no guessed prices, trade-in intake)</plan-step>
<plan-step>B5: Expand AgentsHub with capabilities/sources/limitations/human-confirmation sections + SoftwareApplication JSON-LD</plan-step>
<plan-step>A1: Enrich MotorPage with best-fit, not-ideal-for, install notes, monthly finance estimate, related motors, related guides, agent CTAs; verified-image-only enforcement</plan-step>
<plan-step>B2: Post-quote AgentQuoteActions panel — Email quote, Send to Harris, Save link, Get trade-in valuation (deep-link to /trade-in-value), Calendly follow-up; extend agent-quote-api to return quoteDraftId</plan-step>
<plan-step>B3: Create agent_events table + RLS + agentAnalytics.ts wrapper + /admin/agent-funnel page</plan-step>
<plan-step>A3: Build TrustStrip + WhatHappensNext components, mount on Index/Repower/MotorPage/TradeInValuePage/quote summary</plan-step>
<plan-step>A2: Generate 5 AI case-study heroes (Nano Banana Pro) with all 7 guardrails → src/data/caseStudies.ts → /case-studies index + /case-studies/:slug detail + sitemap inclusion + cross-links</plan-step>
<plan-step>A5: IndexNow setup — INDEXNOW_KEY secret, public key file, indexnow-ping edge function, post-deploy hook, manual admin trigger</plan-step>
<plan-step>A4: Memory file mem://seo/cross-domain-verado-alignment.md cataloguing harrisboatworks.ca contradictions + recommended copy</plan-step>
<plan-step>C1: Extend build verification — fail if motorPageRoutes/caseStudyRoutes empty, missing Product JSON-LD, missing self-canonical, INDEXNOW key file missing</plan-step>
<plan-step>C2: Live-prod recheck after deploy — sitemap counts, sample pages, /.well-known/ai.txt clean, IndexNow 200, Verado consistency</plan-step>
