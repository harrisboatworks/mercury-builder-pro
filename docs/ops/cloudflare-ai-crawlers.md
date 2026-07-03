# Cloudflare AI Crawler Access

Last reviewed: 2026-07-03

## Policy

AI crawlers and AI-used search crawlers are allowed full public access on HBW web properties. Do not enable Cloudflare AI crawler blocking or managed robots.txt rules that add `Disallow: /` for AI bots.

Treat Bing/Microsoft access as part of the AI-citation surface. Microsoft Copilot-style grounded answers can use Bing Search/Bing Custom Search results, so blocking `Bingbot`, Bing preview fetchers, or Microsoft retrieval bots can suppress AI citations even when a model-branded bot is allowed.

`ai-train=no` content signals are acceptable only if they do not bundle crawler `Disallow` directives. If Cloudflare forces `Disallow` rules with Content Signals, leave Content Signals off.

## mercuryrepower.ca

Cloudflare account: `Harrisboatworks@hotmail.com's Account`
Zone: `mercuryrepower.ca`
Zone ID: `124284915495a5976a44376e0785276e`

Dashboard state on 2026-07-03:

- `Security > Settings > Bot traffic > Configure AI bot policies`: Search, Agent, and Training are all `Allow (do not block)`.
- `Security > Settings > Bot traffic > Block AI bots [Deprecating on September 15]`: `Blocks AI Bots scope: Do not block (off)`.
- `AI Crawl Control > Signals`: `www.mercuryrepower.ca/robots.txt` and `mercuryrepower.ca/robots.txt` return `200 OK`; Content Signals are `Not set`; Robots.txt violations shows `No violations found`.
- `Security > Security rules`: Custom rules `0/5`, Rate limiting rules `0/1`, Managed rules not created.

Connector access note, 2026-07-03: the Cloudflare connector can list the `mercuryrepower.ca` zone, but the current token returned authorization errors for `/bot_management`, `/settings/waf`, `/firewall/rules`, `/filters`, and custom ruleset endpoints. Browser-dashboard verification was completed through the logged-in Chrome profile. Keep the connector/API token scoped to read Bot Management, WAF, Firewall Rules, Filters, and Rulesets if future runs should prove the same state without browser control.

The repo `public/robots.txt` is the source of truth for Mercury robots policy.

## harrisboatworks.ca

`harrisboatworks.ca` is not present in the Harrisboatworks@hotmail.com Cloudflare account. DNS uses `ns1.ldv-dns.com`, `ns2.ldv-dns.com`, and `ns3.ldv-dns.com`; `www.harrisboatworks.ca` points at `origin.spark-ldv-cf.live`.

This means the Cloudflare challenge layer for `harrisboatworks.ca` is controlled by DealerSpike/LeadVenture infrastructure, not the Mercury Cloudflare zone in this account.

Observed on 2026-07-03:

- `https://harrisboatworks.ca/robots.txt` returns 200 and does not contain a Cloudflare Managed content block.
- `https://harrisboatworks.ca/` returns 403 with `cf-mitigated: challenge` for AI crawler user agents.

DealerSpike/LeadVenture needs to allow verified AI crawlers or disable AI-crawler challenge/blocking for the HBW property without weakening general malicious-bot protection.

## Regression Guard

`npm run growth:check` asserts:

- `Cloudflare Managed` must not appear in robots.txt.
- The allowlisted AI crawler groups must not contain `Disallow: /`.
- `harrisboatworks.ca/robots.txt` is checked with the same assertion when reachable.
- Representative AI/search user agents must receive HTTP 200, with no `cf-mitigated: challenge`, on key Mercury AI surfaces: `/`, `/robots.txt`, `/llms.txt`, `/catalog.md`, `/pricing-reference`, `/pricing-reference.md`, `/repower`, `/blog/best-mercury-dealer-ontario-hbw-difference`, and `/zh`.

Allowlisted AI/search crawler groups currently include `GPTBot`, `ChatGPT-User`, `OAI-SearchBot`, `ClaudeBot`, `Claude-Web`, `anthropic-ai`, `Bingbot`, `BingPreview`, `MicrosoftPreview`, `msnbot`, `MSNBot`, `Google-Extended`, `CCBot`, `Amazonbot`, `Applebot`, `Applebot-Extended`, `Bytespider`, `Meta-ExternalAgent`, `meta-externalagent`, `PerplexityBot`, `Perplexity-User`, `Diffbot`, `cohere-ai`, `Cohere-Web`, `YouBot`, `PhindBot`, `MistralAI-User`, `KimiBot`, `Kimi-User`, `Kimi-SearchBot`, `DeepSeekBot`, `DeepSeek-Crawler`, `DeepSeek`, `ChatGLM-Spider`, `ZhipuBot`, `Qwen`, `Tongyi`, `AliyunBot`, `AliyunCrawler`, `AlibabaCloud`, `Baiduspider`, `BaiduAI`, `Baidu-YiYan`, `ERNIEBot`, `ERNIE-Bot`, `Sogou web spider`, `360Spider`, `YisouSpider`, `PetalBot`, `TencentBot`, `YuanbaoBot`, `HunyuanAide`, `iFlytekBot`, `Xinghuo`, `PanguBot`, `MiniMaxBot`, `MoonshotAI`, `MoonshotBot`, and `Wenxiaobai`.
