

The user wants:
1. Continue P2 deferred AX work
2. Tell them what to do in Google Search Console / external platforms
3. Build a **public quote API** for agents (like ChatGPT, Perplexity, Claude can quote a Mercury via mercuryrepower.ca)
4. Goal: dominate the 200km radius for Mercury repower searches

Let me check what exists for agent-quote-api already, since memory mentions it.

Key context from memory:
- `agent-quote-api` Edge Function already exists, internal use, respects pricing hierarchy, max 200 limit
- `public-motors-api` was just shipped (read-only motor list)
- There's no public quote-builder API for external agents yet

Plan structure:
- **Wave A (this turn — code I can ship):** Public agent quote API + deep-link prefilled `/quote?...` URLs + last-updated timestamps + Product+Offer JSON-LD on motor pages
- **Wave B (you do externally):** Google Search Console actions, GBP, citations
- **Wave C (next turn):** MD page twins, MCP server

Keep concise.

