import { readFileSync } from 'node:fs';
import { describe, it, expect, vi } from 'vitest';
import { runPublicQuoteTool, parseMcpToolArguments } from '../../../supabase/functions/_shared/public-agent-mcp';
import { runPublicArticleTool, searchPublicArticles, getPublicArticle, parseSearchArticlesArgs, parseGetArticleArgs, ARTICLE_INDEX_BYTE_LIMIT } from '../../../supabase/functions/_shared/public-blog-mcp';
import { buildAgentBlogIndex, blogCitationFields } from '../../../scripts/lib/public-blog-catalog.mjs';
import { readPublicMcpCatalog, synchronizeAgentContractDocs } from '../../../scripts/lib/agent-contract-docs.mjs';
import { formatDateOnly, calendarDateOnly } from '../formatDateOnly';
import { blogPostingAuthor, visibleBlogAuthorName } from '../blogCitation.js';

const motor_id = '00000000-0000-4000-8000-000000000001';
const parsed = (result: any) => JSON.parse(result.content[0].text);
const article = { slug: 'mercury-90-review', title: 'Mercury 90 HP review', description: 'Ontario motor selection', keywords: ['outboard fit'], datePublished: '2026-04-12', dateModified: '2026-10-06', author: 'Jay Harris' };
const catalog = () => buildAgentBlogIndex({ englishArticles: [article], todayYmd: '2026-10-12' });

describe('quote consent and side effects', () => {
  it('never forwards contact through read-only calculation', async () => {
    const api = vi.fn().mockResolvedValue({ pricing: {}, lead_captured: false });
    await runPublicQuoteTool('build_quote', { motor_id, contact: {}, email: 'ignored@example.invalid' }, api);
    expect(api).toHaveBeenCalledOnce();
    expect(api.mock.calls[0][1]).not.toHaveProperty('contact');
    expect(api.mock.calls[0][1]).not.toHaveProperty('email');
    api.mockClear();
    await expect(runPublicQuoteTool('build_quote', { motor_id, contact: { name: 'Test' } }, api)).rejects.toThrow('submit_quote_lead');
    expect(api).not.toHaveBeenCalled();
  });
  it.each([undefined, false, 'true', 1])('refuses lead submission without boolean consent: %s', async consent => {
    const api = vi.fn();
    await expect(runPublicQuoteTool('submit_quote_lead', { motor_id, consent, contact: { name: 'Test', email: 'test@example.invalid' } }, api)).rejects.toThrow('consent=true');
    expect(api).not.toHaveBeenCalled();
  });
  it('requires valid contact and checks the actual upstream storage result', async () => {
    const api = vi.fn().mockResolvedValue({ lead_captured: false, lead_capture_error: 'storage unavailable' });
    await expect(runPublicQuoteTool('submit_quote_lead', { motor_id, consent: true, contact: { name: 'Test', email: 'bad' } }, api)).rejects.toThrow('email');
    expect(api).not.toHaveBeenCalled();
    const result = await runPublicQuoteTool('submit_quote_lead', { motor_id, consent: true, contact: { name: 'Test', email: "o'connor@example.invalid" } }, api);
    expect(result.isError).toBe(true);
    expect(api.mock.calls[0][1]).not.toHaveProperty('consent');
    api.mockResolvedValue({ lead_captured: true, lead_id: 'fixture-only' });
    expect((await runPublicQuoteTool('submit_quote_lead', { motor_id, consent: true, contact: { name: 'Test', email: 'test@example.invalid' } }, api)).isError).toBeUndefined();
    expect(() => parseMcpToolArguments('submit_quote_lead', { motor_id, consent: true, contact: {} })).toThrow();
  });
});

describe('published public article retrieval', () => {
  it('excludes hidden, draft, scheduled and noindex pilot articles without altering source dates', () => {
    const rows = [article, { ...article, slug: 'hidden', hidden: true }, { ...article, slug: 'draft', draft: true }, { ...article, slug: 'future', publishDate: '2027-01-01' }, { ...article, slug: 'noindex', noindex: true }];
    const index = buildAgentBlogIndex({ englishArticles: rows, localizedGroups: [{ prefix: 'zh-hant', language: 'zh-Hant', articles: [article] }], todayYmd: '2026-10-12' });
    expect(index.articles.map(a => a.slug)).toEqual([article.slug]);
    expect(index.articles[0].date_published).toBe(article.datePublished);
    expect(index.articles[0].date_modified).toBe(article.dateModified);
  });
  it('resolves multi-term queries, returns citation metadata and identifies partial lists', async () => {
    const index = buildAgentBlogIndex({ englishArticles: [article, { ...article, slug: 'another-90' }], todayYmd: '2026-10-12' });
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(index)));
    const result = parsed(await searchPublicArticles({ query: 'Ontario 90 Mercury', limit: 1 }, fetcher, '2026-10-12'));
    expect(result.count).toBe(1); expect(result.total_matches).toBe(2); expect(result.has_more).toBe(true);
    expect(result.articles[0].citation_url).not.toMatch(/\.md$/);
    expect(result.articles[0].date_modified).toBe('2026-10-06');
  });
  it('rejects arbitrary URLs and invalid arguments before any request', async () => {
    const fetcher = vi.fn();
    for (const args of [{ url: 'http://127.0.0.1/private' }, { query: 'x'.repeat(121) }, { limit: 11 }, { language: 'zh-Hant' }]) {
      await expect(runPublicArticleTool('search_articles', args, fetcher)).rejects.toThrow();
    }
    for (const slug of ['../private', 'https://example.com/private', 'foo%2fsecret']) expect(() => parseGetArticleArgs({ slug })).toThrow();
    expect(() => parseSearchArticlesArgs({ limit: '5' })).toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('reads only a listed fixed-origin path and marks long text as truncated without inventing fragments', async () => {
    const fetcher = vi.fn(async (url: string) => url.endsWith('.json') ? new Response(JSON.stringify(catalog())) : new Response('## Public heading\n' + '中'.repeat(14000)));
    const result = parsed(await getPublicArticle({ slug: article.slug, language: 'en-CA' }, fetcher, '2026-10-12'));
    expect(result.truncated).toBe(true); expect(result.text.length).toBeLessThanOrEqual(12000);
    expect(result.headings[0]).not.toHaveProperty('citation_url');
    expect(fetcher.mock.calls.map(c => c[0])).toEqual(['https://www.mercuryrepower.ca/agent-blog-index.json', 'https://www.mercuryrepower.ca/blog/mercury-90-review.md']);
    const missing = await getPublicArticle({ slug: 'private', language: 'en-CA' }, vi.fn().mockResolvedValue(new Response(JSON.stringify(catalog()))), '2026-10-12');
    expect(missing.isError).toBe(true);
  });
  it('reports upstream failures and applies byte limits to multibyte index responses', async () => {
    const httpError = await searchPublicArticles({ limit: 5 }, vi.fn().mockResolvedValue(new Response('not public', { status: 503 })), '2026-10-12');
    expect(httpError.isError).toBe(true); expect(parsed(httpError).status).toBe(503);
    const tooLarge = await searchPublicArticles({ limit: 5 }, vi.fn().mockResolvedValue(new Response('中'.repeat(Math.ceil(ARTICLE_INDEX_BYTE_LIMIT / 3) + 1))), '2026-10-12');
    expect(tooLarge.isError).toBe(true); expect(parsed(tooLarge).error).toContain('size limit');
  });
});

describe('citation and discovery contracts', () => {
  it('preserves calendar dates in Toronto and UTC, including DST dates', () => {
    for (const date of ['2026-04-12', '2026-03-08', '2026-11-01']) {
      expect(calendarDateOnly(date, 'America/Toronto')).toBe(date); expect(calendarDateOnly(date, 'UTC')).toBe(date);
    }
    expect(formatDateOnly('2026-04-12', 'zh-CN')).toContain('12');
    expect(formatDateOnly('2026-02-31', 'en-CA')).toBe('2026-02-31');
  });
  it('derives author identity from the declared source and keeps publisher separate', () => {
    expect(blogPostingAuthor('Jay Harris', 'https://www.mercuryrepower.ca')['@type']).toBe('Person');
    expect(blogPostingAuthor('Harris Boat Works', 'https://www.mercuryrepower.ca')['@type']).toBe('Organization');
    expect(visibleBlogAuthorName('Not Jay Harris')).toBe('Not Jay Harris');
    const front = blogCitationFields(article, { htmlUrl: 'https://www.mercuryrepower.ca/blog/mercury-90-review' }).join('\n');
    expect(front).toContain('author: "Jay Harris"'); expect(front).toContain('publisher: "Harris Boat Works"');
    expect(front).toContain('citation_url: https://www.mercuryrepower.ca/blog/mercury-90-review');
  });
  it('derives manifest tool hints from actual catalogs and keeps checkout writes explicit', () => {
    const tools = readPublicMcpCatalog(readFileSync('supabase/functions/agent-mcp-server/index.ts', 'utf8'));
    expect(tools).toHaveLength(8);
    expect(tools.find(t => t.name === 'build_quote')!.annotations.readOnlyHint).toBe(true);
    expect(tools.find(t => t.name === 'submit_quote_lead')!.annotations).toMatchObject({ readOnlyHint: false, idempotentHint: false });
    const ucp = readPublicMcpCatalog(readFileSync('supabase/functions/ucp-checkout/index.ts', 'utf8'), 'MCP_TOOLS');
    expect(ucp.find(t => t.name === 'get_checkout')!.annotations.readOnlyHint).toBe(true);
    expect(ucp.find(t => t.name === 'cancel_checkout')!.annotations.destructiveHint).toBe(true);
    const llms = readFileSync('public/llms.txt', 'utf8');
    const once = synchronizeAgentContractDocs(llms, readFileSync('supabase/functions/ucp-checkout/index.ts', 'utf8'));
    expect(synchronizeAgentContractDocs(once, readFileSync('supabase/functions/ucp-checkout/index.ts', 'utf8'))).toBe(once);
    expect(once).toContain('submit_quote_lead');
  });
  it('places quote no-store exceptions after generic caching and retains static caching', () => {
    const headers = JSON.parse(readFileSync('vercel.json', 'utf8')).headers;
    const generic = headers.findIndex((h: any) => h.source === '/(.*)');
    for (const path of ['/api/agents/quote', '/api/agents/quote/:path*']) {
      const idx = headers.findIndex((h: any) => h.source === path);
      expect(idx).toBeGreaterThan(generic);
      expect(headers[idx].headers).toContainEqual({ key: 'Cache-Control', value: 'no-store' });
    }
    expect(headers.find((h: any) => h.source === '/assets/(.*)').headers[0].value).toContain('immutable');
  });
});
