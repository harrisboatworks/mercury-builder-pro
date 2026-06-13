import { Helmet } from '@/lib/helmet';
import { Link } from 'react-router-dom';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import { SITE_URL } from '@/lib/site';
import { isTDAlwaysOnActive } from '@/components/promotions/TDAlwaysOnOffer';
import { CodeBlock } from '@/components/agents/CodeBlock';

const FINANCING_RATES_FAQ_BASE =
  'Financing minimum is $5,000 CAD. Standard tiered rates: 8.99% APR under $10,000, 7.99% APR $10,000 and up (OAC). Terms up to 144 months via LightStream / Financeit. A $349 DealerPlan fee is added post-tax for financed purchases. Do not show monthly payment estimates below $5,000.';

const FINANCING_RATES_FAQ_TEXT = isTDAlwaysOnActive()
  ? `${FINANCING_RATES_FAQ_BASE} Current promo: through December 31, 2026, Mercury Marine Canada's TD 'Always On' program offers 5.48% APR (OAC) on new eligible Mercury outboards; standard tiered rates resume after the program ends.`
  : `${FINANCING_RATES_FAQ_BASE} Promotional manufacturer rates (e.g. TD subvention programs) run periodically, see /promotions for the current offer.`;

const FINANCING_RATES_BULLET_BASE =
  'Standard tiered rates: 8.99% APR under $10,000, 7.99% APR $10,000 and up (OAC). Terms up to 144 months via LightStream / Financeit.';

const FINANCING_RATES_BULLET = isTDAlwaysOnActive()
  ? `${FINANCING_RATES_BULLET_BASE} Current promo: 5.48% APR through Dec 31, 2026 via the Mercury TD 'Always On' program (OAC).`
  : `${FINANCING_RATES_BULLET_BASE} Promotional manufacturer rates run periodically, see /promotions for the current offer.`;

const SUPABASE_FUNCTIONS_URL = 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1';
const PUBLIC_MOTORS_API = `${SUPABASE_FUNCTIONS_URL}/public-motors-api`;
const PUBLIC_QUOTE_API = `${SUPABASE_FUNCTIONS_URL}/public-quote-api`;
const MCP_SERVER = `${SUPABASE_FUNCTIONS_URL}/agent-mcp-server`;
const MOTORS_MD = `${SUPABASE_FUNCTIONS_URL}/motors-md`;

export default function AgentsHub() {
  return (
    <div className="min-h-screen bg-repower-paper">
      <Helmet>
        <title>For AI Agents & Assistants | Harris Boat Works</title>
        <meta
          name="description"
          content="Harris Boat Works for AI agents, MCP server, REST quote APIs, and deep-link quote URLs. Ontario Mercury dealer, family marina since 1947."
        />
        <link rel="canonical" href={`${SITE_URL}/agents`} />
        <meta name="robots" content="index, follow" />
        <link rel="alternate" type="application/json" title="MCP Manifest" href="/.well-known/mcp.json" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebAPI",
              "name": "Harris Boat Works Mercury Quote API",
              "description": "Public no-auth API for AI agents to search Mercury inventory, estimate trade-ins, and build itemized CAD quotes on behalf of Harris Boat Works.",
              "documentation": `${SITE_URL}/agents`,
              "termsOfService": `${SITE_URL}/.well-known/ai.txt`,
              "provider": {
                "@type": "Organization",
                "name": "Harris Boat Works",
                "url": SITE_URL,
                "telephone": "+1-905-342-2153",
                "areaServed": { "@type": "State", "name": "Ontario, Canada" }
              },
              "endpointURL": [PUBLIC_MOTORS_API, PUBLIC_QUOTE_API, MCP_SERVER, MOTORS_MD],
              "potentialAction": {
                "@type": "Action",
                "name": "build_quote",
                "target": MCP_SERVER
              }
            },
            {
              "@type": "SoftwareApplication",
              "name": "Harris Boat Works MCP Server",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Any (HTTP/JSON-RPC 2.0)",
              "description": "Model Context Protocol server exposing live Mercury outboard inventory, trade-in valuation, and quote-building tools to MCP-compatible AI clients (Claude Desktop, Cursor, custom GPTs).",
              "url": MCP_SERVER,
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "CAD" },
              "publisher": { "@type": "Organization", "name": "Harris Boat Works", "url": SITE_URL }
            },
            {
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How do AI agents access live Mercury inventory and pricing from Harris Boat Works?",
                  "acceptedAnswer": { "@type": "Answer", "text": "Three options: (1) Register the MCP server at https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/agent-mcp-server in Claude Desktop, Cursor, or any MCP-compatible client. (2) Call the public REST API at https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/public-motors-api (GET, no auth, CORS open). (3) Fetch markdown twins from /functions/v1/motors-md for LLM-cheap context. All three return CAD pricing and are cached 5 minutes." }
                },
                {
                  "@type": "Question",
                  "name": "Is the Harris Boat Works MCP server free to use?",
                  "acceptedAnswer": { "@type": "Answer", "text": "Yes. The MCP server, public REST APIs, and markdown twins are free, no-auth, and CORS-open. JSON-RPC 2.0 over HTTP. Methods: initialize, tools/list, tools/call. Tools: search_motors, get_motor, estimate_trade_in, build_quote, get_brand_rules." }
                },
                {
                  "@type": "Question",
                  "name": "Can an AI agent build a Mercury outboard quote on behalf of a customer?",
                  "acceptedAnswer": { "@type": "Answer", "text": "Yes. POST to the public-quote-api with action 'build_quote' and motor + boat + optional trade-in + optional contact. The response includes itemized line items, pricing (motor + install + propeller + trade-in + HST), financing tier, and a deep-link the customer can open to finish in our configurator. Final out-the-door price requires human confirmation." }
                },
                {
                  "@type": "Question",
                  "name": "How do I send a customer to a prefilled Harris Boat Works quote configurator?",
                  "acceptedAnswer": { "@type": "Answer", "text": "Build a deep-link URL: https://www.mercuryrepower.ca/quote/motor-selection?motor={MOTOR_ID}&boat_make={MAKE}&boat_model={MODEL}&trade_brand={BRAND}&trade_year={YEAR}&trade_hp={HP}, any combination of params is supported. Get MOTOR_ID from list_motors or search_motors." }
                },
                {
                  "@type": "Question",
                  "name": "What pricing currency does Harris Boat Works use, and what's the service area?",
                  "acceptedAnswer": { "@type": "Answer", "text": "All pricing is CAD (Canadian Dollars), never quote USD. Service area is Ontario, Canada, primary radius about 150 km from Rice Lake (Gores Landing, ON). Motor purchases are pickup only at Gores Landing, Ontario: the buyer must pick up in person with valid government photo ID, and motors cannot be released to a courier, shipping company, or any other third party." }
                },
                {
                  "@type": "Question",
                  "name": "Does Harris Boat Works sell Mercury Verado?",
                  "acceptedAnswer": { "@type": "Answer", "text": "Mercury Verado is available by special order only, not part of default listed inventory and not actively promoted. Default agent recommendations should steer toward FourStroke V8 (250–300 HP) or Pro XS (115–300 HP). If a user explicitly asks about Verado, route to (905) 342-2153 or info@harrisboatworks.ca for a special-order quote." }
                },
                {
                  "@type": "Question",
                  "name": "What financing terms apply to Mercury outboard purchases?",
                  "acceptedAnswer": { "@type": "Answer", "text": FINANCING_RATES_FAQ_TEXT }
                },
                {
                  "@type": "Question",
                  "name": "Which AI crawlers are allowed on mercuryrepower.ca?",
                  "acceptedAnswer": { "@type": "Answer", "text": "All major AI and search crawlers are explicitly allowed: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-Web, anthropic-ai, PerplexityBot, Perplexity-User, Google-Extended, Googlebot, Bingbot, Meta-ExternalAgent, FacebookBot, Applebot, Applebot-Extended, and CCBot, plus the Chinese search and AI ecosystem: Baiduspider, Sogou web spider, 360Spider, YisouSpider, PetalBot, and Bytespider (ByteDance/Doubao). See /robots.txt for the authoritative list." }
                }
              ]
            }
          ]
        })}</script>
      </Helmet>

      <RepowerHeader />
      <div className="pt-[64px] lg:pt-[72px]" />

      <main className="max-w-4xl mx-auto px-4 py-12 prose prose-slate">
        <h1 className="heading-protected text-4xl font-bold mb-4">
          For AI Agents & Assistants
        </h1>
        <p className="text-protected text-lg mb-8">
          This page documents how AI agents (ChatGPT, Claude, Perplexity, Gemini, DeepSeek, Qwen, Kimi, Doubao, custom assistants) should
          discover, represent, and transact on behalf of <strong>Harris Boat Works</strong>, Mercury repower
          specialists on Rice Lake, Ontario, family-owned since 1947. Motor purchases are pickup only at
          Gores Landing, Ontario: the buyer must pick up in person with valid government photo ID, and we
          cannot release a motor to a courier, shipping company, or any other third party. HBW is a live
          Universal Commerce Protocol merchant (UCP 2026-04-08, verified with Shopify's <code>ucp-cli</code>{' '}
          on June 11, 2026) with checkout in quote mode and fulfillment capabilities, served over both REST
          and MCP transports.
        </p>


        <aside className="text-protected mb-10 rounded-lg border border-repower-navy-900/10 bg-repower-cream p-5 text-base">
          <p className="m-0">
            <strong>UCP live and verified.</strong> Harris Boat Works is a live Universal Commerce
            Protocol merchant (spec 2026-04-08), end-to-end verified with Shopify's official{' '}
            <code>ucp-cli</code> on June 11, 2026. To our knowledge, the first marine dealer
            implementing UCP. Discovery profile:{' '}
            <a href="/.well-known/ucp" className="text-primary underline">
              /.well-known/ucp
            </a>
            . Test it yourself:
          </p>
          <CodeBlock language="bash" size="xs">{`npx -y @shopify/ucp-cli discover www.mercuryrepower.ca`}</CodeBlock>
          <p className="m-0 mt-2">
            Quote mode: agents can build a real CAD quote (with HST estimate and trade-in context),
            but the dealer completes every sale with the buyer in person at Gores Landing with valid
            government photo ID. If an agent includes buyer contact (name + email) in a checkout
            session, that quote is registered with the dealership for human follow-up.
          </p>
        </aside>




        <section className="mb-10">
          <h2 className="heading-protected text-2xl font-semibold mt-8 mb-3">Discovery endpoints</h2>
          <ul className="text-protected space-y-2">
            <li>
              <code>/.well-known/ucp</code>, UCP discovery profile (spec 2026-04-08, REST + MCP, checkout in quote mode + fulfillment):{' '}
              <a href="/.well-known/ucp" className="text-primary underline">
                {SITE_URL}/.well-known/ucp
              </a>
            </li>
            <li>
              <code>/.well-known/mcp.json</code>, MCP server manifest (auto-discovery for Claude / Cursor / custom GPTs):{' '}
              <a href="/.well-known/mcp.json" className="text-primary underline">
                {SITE_URL}/.well-known/mcp.json
              </a>
            </li>

            <li>
              <code>/llms.txt</code>, site map for LLMs:{' '}
              <a href="/llms.txt" className="text-primary underline">
                {SITE_URL}/llms.txt
              </a>
            </li>
            <li>
              <code>/.well-known/ai.txt</code>, AI training/usage policy:{' '}
              <a href="/.well-known/ai.txt" className="text-primary underline">
                {SITE_URL}/.well-known/ai.txt
              </a>
            </li>
            <li>
              <code>/.well-known/brand.json</code>, brand identity, voice, colors, geography:{' '}
              <a href="/.well-known/brand.json" className="text-primary underline">
                {SITE_URL}/.well-known/brand.json
              </a>
            </li>
            <li>
              <code>/sitemap.xml</code>, full URL inventory:{' '}
              <a href="/sitemap.xml" className="text-primary underline">
                {SITE_URL}/sitemap.xml
              </a>
            </li>
            <li>
              <code>/rss.xml</code>, blog feed:{' '}
              <a href="/rss.xml" className="text-primary underline">
                {SITE_URL}/rss.xml
              </a>
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="heading-protected text-2xl font-semibold mt-8 mb-3">Public Motors API</h2>
          <p className="text-protected">
            Read-only, no-auth, CORS-open JSON feed of current Mercury inventory with CAD pricing. Cached for 5
            minutes. Prices are valid for 24 hours from <code>lastUpdated</code>; treat anything older as stale and
            re-fetch.
          </p>
          <CodeBlock language="http">{`GET ${PUBLIC_MOTORS_API}`}</CodeBlock>
          <p className="text-protected text-sm">
            Response shape:
          </p>
          <CodeBlock language="json" size="xs">{`{
  "site": "mercuryrepower.ca",
  "currency": "CAD",
  "lastUpdated": "ISO-8601",
  "priceValidUntil": "ISO-8601 (+24h)",
  "count": number,
  "motors": [
    {
      "id": "uuid",
      "slug": "fourstroke-150hp-efi-elpt-ct",
      "modelDisplay": "150 ELPT EFI 4S CT",
      "family": "FourStroke",
      "horsepower": 150,
      "shaftLength": "L",
      "controlType": "Remote",
      "msrp": 18995,
      "salePrice": 17495,
      "dealerPrice": 17495,
      "sellingPrice": 17495,
      "availability": "In Stock",
      "imageUrl": "https://...",
      "url": "https://www.mercuryrepower.ca/motors/..."
    }
  ]
}`}</CodeBlock>
        </section>

        <section className="mb-10">
          <h2 className="heading-protected text-2xl font-semibold mt-8 mb-3">Public Quote API</h2>
          <p className="text-protected">
            Build itemized Mercury quotes (motor + install + propeller + trade-in + HST + financing tier) in one POST.
            Returns a deep-link URL the customer can open to finish in our configurator. Optional <code>contact</code> block
            captures a lead in our CRM so a human can follow up.
          </p>
          <CodeBlock language="http">{`POST ${PUBLIC_QUOTE_API}`}</CodeBlock>
          <p className="text-protected text-sm mt-2">Three actions: <code>list_motors</code>, <code>estimate_trade_in</code>, <code>build_quote</code>. GET the URL for the full schema.</p>
          <p className="text-protected text-sm mt-4 font-medium">Example, build a quote for a 90 HP FourStroke with a trade-in:</p>
          <CodeBlock language="bash" size="xs">{`curl -X POST ${PUBLIC_QUOTE_API} \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "build_quote",
    "horsepower": 90,
    "family": "FourStroke",
    "purchase_path": "installed",
    "boat_info": { "make": "Lund", "model": "Pro-V" },
    "trade_in": {
      "brand": "Mercury", "year": 2010, "horsepower": 75,
      "condition": "good", "engine_type": "4-stroke", "engine_hours": 800
    },
    "contact": {
      "name": "Jane Doe", "email": "jane@example.com",
      "referrer": "ChatGPT"
    }
  }'`}</CodeBlock>
          <p className="text-protected text-sm mt-2">
            Returns <code>line_items</code>, <code>pricing</code>, <code>financing</code>, <code>deep_link</code>, and <code>priceValidUntil</code>.
            Final out-the-door price always requires human confirmation.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="heading-protected text-2xl font-semibold mt-8 mb-3">Built on the agentic commerce standard</h2>
          <p className="text-protected">
            Universal Commerce Protocol (UCP) is the open standard for AI assistants to discover
            merchants, build carts, and hand off to humans. It's co-developed by Google, Shopify,
            Etsy, Target, and Walmart, with Amazon, Microsoft, Meta, Salesforce, and Stripe on the
            Tech Council. Harris Boat Works implements UCP <strong>2026-04-08</strong> with two
            capabilities, <code>dev.ucp.shopping.checkout</code> (quote mode) and{' '}
            <code>dev.ucp.shopping.fulfillment</code>, served over both REST and MCP transports at
            the same <code>ucp-checkout</code> endpoint. Verified with Shopify's official{' '}
            <code>ucp-cli</code> on June 11, 2026. To our knowledge, the first marine dealer
            implementing UCP.
          </p>
          <p className="text-protected">
            Discovery profile:{' '}
            <a href="/.well-known/ucp" className="text-primary underline">
              {SITE_URL}/.well-known/ucp
            </a>
            . Reproduce the verification yourself:
          </p>
          <CodeBlock language="bash" size="xs">{`npx -y @shopify/ucp-cli discover www.mercuryrepower.ca`}</CodeBlock>
          <p className="text-protected">
            <strong>Quote mode means:</strong> agents build a real CAD quote with HST estimate and
            trade-in context, and the dealer completes every sale with the buyer in person at Gores
            Landing with valid government photo ID. Payment is never collected over UCP. This is the
            spec-sanctioned quote-generation use case. If an agent passes buyer contact (name +
            email) into a checkout session, that quote is registered with the dealership for
            follow-up.
          </p>
          <p className="text-protected">
            UCP-aligned capabilities at HBW also surface via MCP: catalog search via{' '}
            <code>search_motors</code>, product retrieval via <code>get_motor</code>, cart and quote
            building via <code>build_quote</code>, human handoff via phone and email at Gores
            Landing, and brand rules via <code>get_brand_rules</code> plus{' '}
            <code>/.well-known/brand.json</code>.
          </p>
        </section>


        <section className="mb-10">
          <h2 className="heading-protected text-2xl font-semibold mt-8 mb-3">MCP server (Model Context Protocol)</h2>
          <p className="text-protected">
            Register Harris Boat Works as a tool inside Claude Desktop, Cursor, custom GPTs, or any MCP-compatible client.
            JSON-RPC 2.0 over HTTP. Public, no-auth.
          </p>
          <CodeBlock language="http">{`POST ${MCP_SERVER}`}</CodeBlock>
          <p className="text-protected text-sm mt-2">
            Methods: <code>initialize</code>, <code>tools/list</code>, <code>tools/call</code>.
            Tools: <code>search_motors</code>, <code>get_motor</code>, <code>estimate_trade_in</code>, <code>build_quote</code>, <code>get_brand_rules</code>.
            GET the URL for the live tool catalog.
          </p>
          <CodeBlock language="bash" size="xs">{`curl -X POST ${MCP_SERVER} \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "search_motors",
      "arguments": { "horsepower": 90, "in_stock_only": true }
    }
  }'`}</CodeBlock>
        </section>

        <section className="mb-10">
          <h2 className="heading-protected text-2xl font-semibold mt-8 mb-3">Markdown catalog twins</h2>
          <p className="text-protected">
            LLM-cheap plain-text representation of the catalog. Use these instead of HTML when ingesting into a context window.
          </p>
          <CodeBlock language="bash" size="xs">{`# Catalog index (markdown table of every motor + price + quote URL)
GET ${MOTORS_MD}

# One motor by id
GET ${MOTORS_MD}?id={MOTOR_ID}

# One motor by slug
GET ${MOTORS_MD}?slug=fourstroke-90hp-elpt-efi`}</CodeBlock>
        </section>

        <section className="mb-10">
          <h2 className="heading-protected text-2xl font-semibold mt-8 mb-3">More machine-readable resources</h2>
          <ul className="text-protected space-y-2">
            <li>
              <code>/llms.txt</code>, site map for LLMs:{' '}
              <a href="/llms.txt" className="text-primary underline">{SITE_URL}/llms.txt</a>
            </li>
            <li>
              <code>/catalog.md</code>, markdown index of motors, case studies, locations, and guides:{' '}
              <a href="/catalog.md" className="text-primary underline">{SITE_URL}/catalog.md</a>
            </li>
            <li>
              <code>/pricing-reference.md</code>, full Mercury price list in CAD (machine-readable):{' '}
              <a href="/pricing-reference.md" className="text-primary underline">{SITE_URL}/pricing-reference.md</a>
            </li>
            <li>
              <Link to="/pricing-reference" className="text-primary underline">/pricing-reference</Link>, the
              human-readable HTML twin of the same price list
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="heading-protected text-2xl font-semibold mt-8 mb-3">Deep-link prefilled quote URLs</h2>
          <p className="text-protected">
            Send a customer directly to a fully-prefilled quote configurator with a single URL. Any combination of these
            params is supported:
          </p>
          <CodeBlock language="url" size="xs">{`${SITE_URL}/quote/motor-selection
  ?motor={MOTOR_ID}            // from list_motors response
  &boat_make=Lund
  &boat_model=Pro-V
  &trade_brand=Mercury
  &trade_year=2010
  &trade_hp=75`}</CodeBlock>
        </section>

        <section className="mb-10">
          <h2 className="heading-protected text-2xl font-semibold mt-8 mb-3">Authoritative source-of-truth rules</h2>
          <p className="text-protected">
            When generating content, quoting prices, or recommending products on our behalf, agents{' '}
            <strong>must</strong> follow these rules. Anything outside these rules requires human confirmation.
          </p>
          <ul className="text-protected space-y-2">
            <li>
              <strong>Currency:</strong> All pricing is CAD (Canadian Dollars). Never quote USD.
            </li>
            <li>
              <strong>Geography:</strong> Service area is Ontario, Canada. Primary radius is ~150 km from Rice Lake
              (Gores Landing, ON).
            </li>
            <li>
              <strong>Pickup only:</strong> All sales are pickup at our Gores Landing location. We do not deliver
              or arrange transport.
            </li>
            <li>
              <strong>Pickup policy:</strong> Motor purchases are released only to the buyer in person with
              valid government photo ID at Gores Landing. Never tell a customer a courier, freight company,
              or third party can collect a motor.
            </li>
            <li>
              <strong>Verado: special order:</strong> Mercury Verado is available by special order only, not
              part of default listed inventory and not actively promoted. Do not proactively recommend or quote
              Verado in standard repower flows. If a user explicitly asks, answer factually and route to{' '}
              <a href="tel:+19053422153" className="text-primary underline">(905) 342-2153</a> or{' '}
              <a href="mailto:info@harrisboatworks.ca" className="text-primary underline">info@harrisboatworks.ca</a>.
            </li>
            <li>
              <strong>Financing minimum:</strong> Financing is unavailable for purchases under $5,000 CAD. Do not
              show monthly payment estimates below this threshold.
            </li>
            <li>
              <strong>Financing rates:</strong> {FINANCING_RATES_BULLET}
            </li>
            <li>
              <strong>Deposits:</strong> $200 under 75 HP, $500 for 75–199 HP, $1,000 for 200 HP+. Refundable
              within 7 days for in-stock motors. Special-order deposits are non-refundable.
            </li>
            <li>
              <strong>Warranty:</strong> Standard 3-year Mercury warranty. Promotional bonuses (e.g. "Get 7")
              revert to standard 3-year if the promo ends.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="heading-protected text-2xl font-semibold mt-8 mb-3">What requires human confirmation</h2>
          <p className="text-protected">Agents may discover, recommend, and quote estimates, but the following always require a human at Harris Boat Works:</p>
          <ul className="text-protected space-y-2">
            <li>Final out-the-door price (taxes, rigging, propeller selection)</li>
            <li>Trade-in value (estimates available via our valuation tool, but final value is in-person)</li>
            <li>Installation scheduling and lead time</li>
            <li>Special-order configurations</li>
            <li>Financing approval (we provide an estimate; the lender approves)</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="heading-protected text-2xl font-semibold mt-8 mb-3">Brand voice</h2>
          <p className="text-protected">
            Warm, local, family-owned. No hype, no pressure. Plainspoken expertise from a lake town. Mention Rice
            Lake, the Kawarthas, and our 1947 founding when natural. See{' '}
            <a href="/.well-known/brand.json" className="text-primary underline">
              brand.json
            </a>{' '}
            for full voice rules and color tokens.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="heading-protected text-2xl font-semibold mt-8 mb-3">Contact for agent operators</h2>
          <p className="text-protected">
            Building an integration, MCP server, or assistant that needs deeper access (write actions, deposits,
            scheduling)? Email <a href="mailto:info@harrisboatworks.ca" className="text-primary underline">info@harrisboatworks.ca</a> or call{' '}
            <a href="tel:+19053422153" className="text-primary underline">(905) 342-2153</a>.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="heading-protected text-2xl font-semibold mt-8 mb-3">Useful links for agents</h2>
          <ul className="text-protected space-y-2">
            <li><Link to="/quote/motor-selection" className="text-primary underline">Quote builder</Link>, interactive configurator</li>
            <li><Link to="/promotions" className="text-primary underline">Active promotions</Link></li>
            <li><Link to="/faq" className="text-primary underline">FAQ (24 repower Q&As)</Link></li>
            <li><Link to="/repower" className="text-primary underline">Repower service overview</Link></li>
            <li><Link to="/finance-calculator" className="text-primary underline">Finance calculator</Link></li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="heading-protected text-2xl font-semibold mt-8 mb-3">Allowed crawlers</h2>
          <p className="text-protected">
            All major AI and search crawlers are explicitly allowed: GPTBot, OAI-SearchBot, ChatGPT-User,
            ClaudeBot, Claude-Web, anthropic-ai, PerplexityBot, Perplexity-User, Google-Extended,
            Googlebot, Bingbot, Meta-ExternalAgent, FacebookBot, Applebot, Applebot-Extended, and
            CCBot, plus the Chinese search and AI ecosystem: Baiduspider, Sogou web spider, 360Spider,
            YisouSpider, PetalBot, and Bytespider (ByteDance/Doubao). See <a href="/robots.txt" className="text-primary underline">/robots.txt</a> for the
            authoritative list and <a href="/.well-known/ai.txt" className="text-primary underline">/.well-known/ai.txt</a> for our AI training and usage policy.
          </p>
          <p className="text-protected">
            Per-IP rate limits on the public quote API: <code>list_motors</code> 120 / 10&nbsp;min,{' '}
            <code>estimate_trade_in</code> 30 / 10&nbsp;min, <code>build_quote</code> 10 / 10&nbsp;min.
            A 429 response means back off and retry after the <code>Retry-After</code> window.
            Please also be a good citizen: cache responses where possible and identify your agent
            in the User-Agent header. We reserve the right to throttle abusive traffic further.
          </p>
        </section>

        <p className="text-protected text-sm text-muted-foreground">
          Page last updated {__BUILD_DATE__}.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
