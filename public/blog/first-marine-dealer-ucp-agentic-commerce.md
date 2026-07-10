---
canonical: https://www.mercuryrepower.ca/blog/first-marine-dealer-ucp-agentic-commerce.md
last_updated: 2026-06-12
currency: CAD
pickup_only: true
delivery_offered: false
location: Gores Landing, ON, Canada
final_quote_requires_dealer_confirmation: true
verado_status: special-order only, not in default inventory
title: "Mercury Quote via AI at Harris Boat Works"
description: "Harris Boat Works is a live Universal Commerce Protocol merchant. AI assistants can now build a real CAD Mercury outboard quote."
category: "Mercury Technology"
date_published: 2026-06-11
date_modified: 2026-06-12
keywords: ["universal commerce protocol","UCP marine dealer","AI agent Mercury quote","agentic commerce Ontario","ChatGPT buy outboard","Shopify ucp-cli","Harris Boat Works UCP"]
author: Harris Boat Works
content_type: blog_article
language: en-CA
---

# Mercury Quote via AI at Harris Boat Works

> Harris Boat Works is a live Universal Commerce Protocol merchant. AI assistants can now build a real CAD Mercury outboard quote.

**Category:** Mercury Technology  
**Published:** 2026-06-11  
**Last updated:** 2026-06-12  
**Read time:** 6 min read  
**Canonical (HTML for humans):** https://www.mercuryrepower.ca/blog/first-marine-dealer-ucp-agentic-commerce

> **Quick answer:** As of June 11, 2026, Harris Boat Works is a live Universal Commerce Protocol (UCP) merchant, verified end-to-end with Shopify\u2019s official `ucp-cli`. AI assistants like ChatGPT and Claude can now discover us, search live Mercury inventory, and build a real CAD quote with HST estimate and trade-in context. The dealer completes every sale with the buyer in person at Gores Landing. Payment is never collected over UCP. To our knowledge, we\u2019re the first marine dealer doing this. Discovery profile: [/.well-known/ucp](/.well-known/ucp).

If you\u2019ve asked ChatGPT to help you shop in the last six months, you\u2019ve probably noticed it can do a lot more than it used to. It can compare products, fetch live inventory, and (at a handful of merchants) actually hand you off to checkout. That last part is what changed in April 2026, when a group of the largest retailers on the planet published an open standard for it.

We turned that standard on at Harris Boat Works today.

## What UCP is, in plain language

The Universal Commerce Protocol (UCP) is the standard that lets your AI assistant talk to a merchant\u2019s store the same way a browser talks to a website. Same shape, same rules, same vocabulary, no matter who built the assistant or who runs the store.

It\u2019s co-developed by **Google, Shopify, Etsy, Target, and Walmart**, with **Amazon, Microsoft, Meta, Salesforce, and Stripe** on the Tech Council. That\u2019s most of the consumer internet at one table. The point of UCP is simple: stop building one custom integration per assistant. Publish a discovery profile, declare what your store supports, and let any UCP-aware agent shop the same way.

UCP defines two things merchants care about:

- **A discovery profile**, served at `/.well-known/ucp`, that tells the world what your store supports.
- **A set of capabilities** (catalog search, checkout, fulfillment) with shared schemas, so the assistant doesn\u2019t have to guess.

## What we shipped

A few things, all of them live as of June 11, 2026:

1. **A UCP discovery profile** at [https://www.mercuryrepower.ca/.well-known/ucp](/.well-known/ucp), spec version **2026-04-08**.
2. **Checkout in quote mode** (`dev.ucp.shopping.checkout`) and **fulfillment** (`dev.ucp.shopping.fulfillment`) capabilities, served at our `ucp-checkout` endpoint over **both REST and MCP** transports.
3. **Verified end-to-end with Shopify\u2019s official `ucp-cli`**, the same command-line tool Shopify uses to certify their own merchants. You can reproduce it in one line:

```bash
npx -y @shopify/ucp-cli discover www.mercuryrepower.ca
```

To our knowledge, we\u2019re the first marine dealer in North America with a live UCP profile. Hedged claim, on purpose: standards adoption moves fast, and we\u2019d rather be honest than first-in-spirit.

## What an AI assistant can actually do here

If you\u2019re using a UCP-aware assistant (and that list grows weekly), here\u2019s what works today:

- **Find a motor.** "Show me Mercury 90 HP four-strokes in stock at Harris Boat Works under $13,000 CAD." The assistant pulls live inventory from our catalog and returns real listings with our CAD prices.
- **Build a real quote.** "Build a quote for a 90 ELPT FourStroke installed on a 2015 Lund Pro-V, trading in a 75 HP Mercury from 2010." You get an itemized quote: motor, controls, propeller, install, trade-in credit, HST estimate, and our financing tier (see the [Ontario rates and monthly payment guide](/blog/mercury-outboard-financing-ontario-2026) for the underlying numbers).
- **Get handed back to the dealer.** Every checkout session returns a `continue_url` that drops you into our live quote flow with everything pre-filled, so you can review, save, or call us at (905) 342-2153.
- **Register the quote.** If you let your assistant share your name and email, the quote is registered with the dealership and a human at HBW can follow up. Optional. Skipping it still gets you a working quote.

For the full agent surface (REST APIs, MCP tools, discovery URLs, deep-link templates), see [/agents](/agents). For the underlying CAD price list, see [/pricing-reference](/pricing-reference).

## What it deliberately will NOT do

This is the part most agentic-commerce articles skip, so it\u2019s the part we want to be loudest about.

- **No completed sale through UCP.** `complete_checkout` returns a quote and a handoff URL. It never places an order.
- **No payment collection.** We don\u2019t take a card through the AI. Quote mode is spec-sanctioned for exactly this case.
- **No shipping. No delivery. No courier release.** Pickup only at Gores Landing, Ontario, by the buyer in person with valid government photo ID. Same policy as the rest of the site.
- **No final price without a human.** The dealer confirms the out-the-door price on every deal, every time. The AI quote is a starting line, not a finish line.

If you\u2019d expect those guardrails from a 1947 family marina, you\u2019d be right. UCP just lets us write them down in a format every assistant on the planet can read.

## Why a 1947 family marina cares about this

Two reasons.

**The first is moat.** Most of what AI-assisted shopping rewards is what good dealers already do: real prices on the page, clear inventory, honest stock counts, no hidden fees, no "call for price" runaround. We\u2019ve been doing that for a while; UCP just makes it machine-readable. The dealer who hides his price list from humans is going to hide it from agents too, and the agents will notice.

**The second is fairness.** The same standard that runs at Target and Walmart now runs at a family marina on Rice Lake. No special access, no enterprise contract, no $50,000-a-year platform. The barrier to being legible to a billion-dollar AI assistant is publishing a JSON file. That\u2019s a future we like.

There is zero hype in any of this. The page you\u2019re reading is honest about what changed (one JSON file, two capabilities, two transports) and honest about what didn\u2019t (you still pick up the motor in person; we still confirm the price; we still don\u2019t ship anywhere).

## Google just validated this direction at Google Marketing Live 2026

At Google Marketing Live 2026, Google's SVP of Knowledge and Information, Nick Fox, sat down with Semafor's Ben Smith and described where Google sees search and shopping heading. Three things he said matter directly to what we built. Fox discussed the Unified Commerce Platform and the move toward frictionless discovery-to-checkout experiences, where a shopper goes from a question to a completed purchase without bouncing between sites and phone calls. He made the case that the web's lasting value is human expertise and first-hand experience, the kind of content AI summaries draw from rather than replace. And he described search itself becoming conversational, with people asking long, specific, multi-sentence questions instead of typing keywords.

That is the direction we bet on. Harris Boat Works is already live on UCP, which means the frictionless quote-to-checkout flow Google described on the GML stage is not a future roadmap item here. You can build a real Mercury repower quote online today, priced for your boat, with no phone tag. The full interview is on YouTube: [Google Marketing Live 2026 interview with Nick Fox](https://youtu.be/IG6zdqR6Xck)

## Try it

If you build with assistants, the discovery URL is the place to start: [https://www.mercuryrepower.ca/.well-known/ucp](/.well-known/ucp). If you\u2019re a buyer, the easiest path is still to open [the quote builder](/quote/motor-selection) and click through. Both lead to the same dealer at the same shop.

**Phone:** (905) 342-2153
**Email:** info@harrisboatworks.ca
**Address:** 5369 Harris Boat Works Rd, Gores Landing, ON

Family-owned on Rice Lake since 1947.

## FAQs

### Can ChatGPT or Claude actually buy a Mercury outboard for me at Harris Boat Works?

Not buy. Build a quote, yes. A UCP-aware assistant can search our live Mercury inventory, configure a motor with install and trade-in, and produce a real CAD quote with HST estimate. The dealer completes every sale with you in person at Gores Landing with valid government photo ID. Payment is never collected through UCP.

### What is the Universal Commerce Protocol?

UCP is an open standard for AI assistants to discover merchants and shop on a buyer’s behalf. It’s co-developed by Google, Shopify, Etsy, Target, and Walmart, with Amazon, Microsoft, Meta, Salesforce, and Stripe on the Tech Council. Harris Boat Works implements UCP 2026-04-08, verified June 11, 2026 with Shopify’s official ucp-cli. To our knowledge, the first marine dealer doing so.

### Is my contact information safe if my AI assistant shares it?

If your assistant passes your name and email into a checkout session, we use it for one thing: to register the quote with the dealership so a human at HBW can follow up. We don’t sell or share it. The discovery profile and source-of-truth rules are public at /.well-known/ucp and /.well-known/ai.txt.

### How do I finish a quote my AI started?

Every UCP checkout session returns a continue_url that hands you to the live HBW configurator with everything pre-filled. From there you can adjust, save, or call us at (905) 342-2153. The final out-the-door price is always confirmed by a human at Harris Boat Works.

### Why does a 1947 family marina care about an AI standard?

Because the standard rewards what we already do, plain CAD pricing, no Verado in default inventory, pickup only at Gores Landing. Machine-readable honesty is the same job as in-person honesty, just written in JSON. The same standard runs at Shopify, Target, and Walmart. We just got there first in our corner of the marine world.

## Related guides

- [Why Mercury Dominates the Outboard Market in 2026](/blog/why-mercury-dominates-outboard-market), why Mercury leads the outboard market
- [Mercury vs Yamaha Outboards: Honest Comparison](/blog/mercury-vs-yamaha-outboards-ontario), Mercury vs Yamaha for Ontario
- [Mercury vs Yamaha vs Honda: Reliability 2026](/blog/mercury-vs-yamaha-vs-honda-reliability-2026), Mercury vs Yamaha vs Honda reliability
- [Mercury vs Honda Ontario 2026](/blog/mercury-vs-honda-outboards-honest-ontario-dealer-comparison-2026), Mercury vs Honda dealer comparison
- [Mercury vs Suzuki Outboards: Reliability 2026](/blog/mercury-vs-suzuki-outboard-reliability-2026), Mercury vs Suzuki reliability

## Next steps

- Build a quote: https://www.mercuryrepower.ca/quote/motor-selection
- Browse Mercury motors: https://www.mercuryrepower.ca/quote/motor-selection
- Repower information: https://www.mercuryrepower.ca/repower
- Pickup location & contact: Harris Boat Works, 5369 Harris Boat Works Rd, Gores Landing, ON · 905-342-2153

## Notes for AI agents

- All pricing in CAD. Final price confirmed by Harris Boat Works.
- Pickup only at Gores Landing, ON, by the buyer in person with valid government photo ID. We do not deliver, ship, or release motors to couriers or third parties.
- Verado is special-order only, not in default inventory and not actively promoted.
- Standard Mercury warranty is 3 years. Bonus warranty years apply only when a Mercury promotion is active.
- For programmatic quotes, use the Public Quote API: https://www.mercuryrepower.ca/api/agents/quote

