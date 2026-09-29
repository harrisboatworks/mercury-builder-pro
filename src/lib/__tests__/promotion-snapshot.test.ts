// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { selectSnapshotPromotion, loadSnapshotPromotion, renderSnapshotPromotion, promotionDay } from '../../../scripts/lib/promotion-snapshot.mjs';
const now = new Date('2026-09-29T20:00:00Z');
const campaign = { name: 'Current campaign', is_active: true, start_date: '2026-09-14', end_date: '2026-10-30', priority: 1, bonus_description: 'Canadian residents only', promo_options: { options: [{ id: 'cash_rebate' }] }, details: { coverage_summary: 'Source coverage', financing_qualification: 'Source financing qualification', eligibility: { products: ['Eligible products'], use: 'Recreational', stock_requirement: 'Source stock rule', exclusions: ['Excluded product'] }, requirements: ['Registration deadline'], legal: 'Complete source legal conditions' } };
describe('public promotion snapshot', () => {
  it('matches structured campaign preference and active priority', () => {
    const rows = [{ ...campaign, name: 'inactive', is_active: false, priority: 100 }, { ...campaign, name: 'future', start_date: '2026-10-01', priority: 99 }, { ...campaign, name: 'expired', end_date: '2026-09-28', priority: 98 }, { ...campaign, name: 'undated', end_date: null }, { ...campaign, name: 'plain', priority: 90, promo_options: null }, campaign];
    expect(selectSnapshotPromotion(rows, now)?.name).toBe('Current campaign');
    expect(selectSnapshotPromotion([campaign, { ...campaign, name: 'higher', priority: 2 }], now)?.name).toBe('higher');
  });
  it('uses Toronto inclusive day boundaries, including DST', () => {
    expect(promotionDay(new Date('2026-10-31T03:59:59Z'))).toBe('2026-10-30');
    expect(selectSnapshotPromotion([campaign], new Date('2026-10-31T03:59:59Z'))).not.toBeNull();
    expect(selectSnapshotPromotion([campaign], new Date('2026-10-31T04:00:00Z'))).toBeNull();
    expect(selectSnapshotPromotion([campaign], new Date('2026-09-14T03:59:59Z'))).toBeNull();
    expect(selectSnapshotPromotion([campaign], new Date('2026-09-14T04:00:00Z'))).not.toBeNull();
    expect(promotionDay(new Date('2026-12-01T04:30:00Z'))).toBe('2026-11-30');
  });
  it('rejects malformed responses instead of pretending no campaign exists', () => {
    expect(() => selectSnapshotPromotion({}, now)).toThrow();
    expect(() => selectSnapshotPromotion([{...campaign,end_date:'2026-02-30'}],now)).toThrow();
    expect(() => selectSnapshotPromotion([{...campaign,name:null}],now)).toThrow();
    expect(() => renderSnapshotPromotion({...campaign,details:{legal:{html:'bad'}}})).toThrow();
  });
  it('preserves all source-owned restrictions and escapes untrusted text', () => {
    const html = renderSnapshotPromotion({...campaign,name:'<script>bad</script>',details:{...campaign.details,legal:'Terms <b>must</b> apply & remain'}});
    for (const phrase of ['Canadian residents only','Source coverage','Source financing qualification','Eligible products','Source stock rule','Registration deadline','Excluded product','2026-09-14','2026-10-30']) expect(html).toContain(phrase);
    expect(html).toContain('&lt;script&gt;'); expect(html).not.toContain('<script>');
    expect(html).toContain('Terms &lt;b&gt;must&lt;/b&gt; apply &amp; remain');
  });
  it('uses a no-rate inquiry fallback only for a valid empty catalog', () => {
    expect(selectSnapshotPromotion([],now)).toBeNull();
    const html=renderSnapshotPromotion(null); expect(html).toContain('Check current Mercury offers'); expect(html).not.toContain('%');
  });
  it('fetches only public fields with the same page date filters and fails closed', async () => {
    let observed: URL;
    const fetcher=async(url: URL)=>{observed=url; return {ok:true,json:async()=>[campaign]};};
    expect((await loadSnapshotPromotion({baseUrl:'https://example.test',publicKey:'public',fetcher,now})).name).toBe(campaign.name);
    expect(observed!.searchParams.get('start_date')).toBe('lte.2026-09-29');
    expect(observed!.searchParams.get('end_date')).toBe('gte.2026-09-29');
    expect(observed!.searchParams.get('select')).not.toBe('*');
    await expect(loadSnapshotPromotion({baseUrl:'https://example.test',publicKey:'public',fetcher:async()=>({ok:false,status:503}),now})).rejects.toThrow('HTTP 503');
  });
  it('both owning generators use per-quote guidance rather than cached offer assertions', () => {
    for(const file of ['scripts/static-prerender.mjs','scripts/generate-markdown-twins.mjs']) {
      const source=readFileSync(file,'utf8');
      expect(source).not.toContain('Current promotional offer:');
      expect(source).not.toContain('Financing is available on eligible totals over');
      expect(source).toContain('Financing: ${agentFinancingGuidance}');
    }
  });
});
