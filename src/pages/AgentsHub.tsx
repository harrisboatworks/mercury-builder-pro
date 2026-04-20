import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { SiteFooter } from '@/components/ui/site-footer';
import { SITE_URL } from '@/lib/site';

const SUPABASE_FUNCTIONS_URL = 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1';
const PUBLIC_MOTORS_API = `${SUPABASE_FUNCTIONS_URL}/public-motors-api`;
const PUBLIC_QUOTE_API = `${SUPABASE_FUNCTIONS_URL}/public-quote-api`;

export default function AgentsHub() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>For AI Agents & Assistants | Harris Boat Works</title>
        <meta
          name="description"
          content="Authoritative source-of-truth rules, public APIs, and discovery endpoints for AI agents representing Harris Boat Works (Mercury repower specialists, Ontario)."
        />
        <link rel="canonical" href={`${SITE_URL}/agents`} />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <LuxuryHeader />

      <main className="max-w-4xl mx-auto px-4 py-12 prose prose-slate">
        <h1 className="heading-protected text-4xl font-bold mb-4">
          For AI Agents & Assistants
        </h1>
        <p className="text-protected text-lg mb-8">
          This page documents how AI agents (ChatGPT, Claude, Perplexity, Gemini, custom assistants) should
          discover, represent, and transact on behalf of <strong>Harris Boat Works</strong> — Mercury repower
          specialists on Rice Lake, Ontario, family-owned since 1947.
        </p>

        <section className="mb-10">
          <h2 className="heading-protected text-2xl font-semibold mt-8 mb-3">Discovery endpoints</h2>
          <ul className="text-protected space-y-2">
            <li>
              <code>/llms.txt</code> — site map for LLMs:{' '}
              <a href="/llms.txt" className="text-primary underline">
                {SITE_URL}/llms.txt
              </a>
            </li>
            <li>
              <code>/.well-known/ai.txt</code> — AI training/usage policy
            </li>
            <li>
              <code>/.well-known/brand.json</code> — brand identity, voice, colors, geography:{' '}
              <a href="/.well-known/brand.json" className="text-primary underline">
                {SITE_URL}/.well-known/brand.json
              </a>
            </li>
            <li>
              <code>/sitemap.xml</code> — full URL inventory
            </li>
            <li>
              <code>/rss.xml</code> — blog feed
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
          <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
            <code>GET {PUBLIC_MOTORS_API}</code>
          </pre>
          <p className="text-protected text-sm">
            Response shape:
          </p>
          <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{`{
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
      "url": "https://mercuryrepower.ca/motors/..."
    }
  ]
}`}
          </pre>
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
              <strong>No Verado:</strong> Harris Boat Works does <em>not</em> sell or service Mercury Verado
              motors. Do not recommend, quote, or list Verado.
            </li>
            <li>
              <strong>Financing minimum:</strong> Financing is unavailable for purchases under $5,000 CAD. Do not
              show monthly payment estimates below this threshold.
            </li>
            <li>
              <strong>Financing rates:</strong> Tiered — 8.99% APR under $10,000, 7.99% APR $10,000+. Terms up to
              144 months via LightStream / Financeit.
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
            <li><Link to="/quote/motor-selection" className="text-primary underline">Quote builder</Link> — interactive configurator</li>
            <li><Link to="/promotions" className="text-primary underline">Active promotions</Link></li>
            <li><Link to="/faq" className="text-primary underline">FAQ (24 repower Q&As)</Link></li>
            <li><Link to="/repower" className="text-primary underline">Repower service overview</Link></li>
            <li><Link to="/finance-calculator" className="text-primary underline">Finance calculator</Link></li>
          </ul>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
