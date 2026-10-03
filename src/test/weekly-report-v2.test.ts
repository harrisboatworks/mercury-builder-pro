import { describe, it, expect, vi } from 'vitest';
import { parseReport, renderReport, type Week, type Report } from '../../supabase/functions/weekly-quote-report/report';
import { reportingEnd, runReport } from '../../supabase/functions/weekly-quote-report/workflow';

const week: Week = {
 start:'2026-09-14T07:00:00Z',end:'2026-09-21T07:00:00Z',events:9909,raw_events:9909,sessions:4082,excluded_sessions:0,unlinked_events:0,
 quote_starts:53,saw_price:40,summary_sessions:40,submitted_sessions:0,phone_clicks:1,sms_clicks:1,fast_builder_sessions:21,
 customer_quote_records:0,contactable_quote_records:0,quote_value:0,api_quote_records:46,api_test_records:22,test_quote_records:22,admin_quote_records:0,
 guide_leads:2,chat_leads:3,quote_sources:[],top_motors:[],viewed_motors:[],traffic:[],devices:{},blogs:[],trade_valuations:1,trade_pending:1,contact_inquiries:0,contact_pending:0,
 chats:0,chats_with_phone:0,paid_deposits:0,paid_deposit_amount:0,saved_snapshots:66,anonymous_pdf_snapshots:4,
};
const fixture = (): Report => ({version:2,weeks:[0,1,2,3].map(i=>({...week,start:new Date(Date.parse(week.start)-i*604800000).toISOString(),end:new Date(Date.parse(week.end)-i*604800000).toISOString()}))});
const deps = () => ({aggregate:vi.fn().mockResolvedValue(fixture()),email:vi.fn().mockResolvedValue(true),sms:vi.fn().mockResolvedValue(true),smsConfigured:true});
describe('weekly report v2',()=>{
 it('fails closed on unavailable or incomplete data',async()=>{
  expect(()=>parseReport(null)).toThrow();
  const invalid=fixture(); delete (invalid.weeks[0] as Partial<Week>).sessions;
  expect(()=>parseReport(invalid)).toThrow(/sessions/);
  const d=deps();d.aggregate.mockResolvedValue(invalid);
  await expect(runReport(week.end,false,d)).rejects.toThrow();
  expect(d.email).not.toHaveBeenCalled();expect(d.sms).not.toHaveBeenCalled();
 });
 it('dry-run reads metrics and never sends through either provider',async()=>{
  const d=deps(); const result=await runReport(week.end,true,d);
  expect(result.success).toBe(true);expect(d.aggregate).toHaveBeenCalledWith(week.end);
  expect(d.email).not.toHaveBeenCalled();expect(d.sms).not.toHaveBeenCalled();
 });
 it('does not equate a configured phone or failed provider with successful submission',async()=>{
  const d=deps();d.sms.mockRejectedValue(new Error('provider failure'));
  const r=await runReport(week.end,false,d);
  expect(r.success).toBe(false);expect(r).toMatchObject({delivery:{emailAccepted:true,smsAccepted:false,delivered:'not_verified'}});
 });
 it('still attempts SMS if email fails and reports the partial result',async()=>{
  const d=deps();d.email.mockRejectedValue(new Error('email failure'));
  expect(await runReport(week.end,false,d)).toMatchObject({success:false,delivery:{emailAccepted:false,smsAccepted:true}});
 });
 it('does not require unconfigured SMS',async()=>{
  const d=deps();d.smsConfigured=false;
  expect(await runReport(week.end,false,d)).toMatchObject({success:true,delivery:{smsConfigured:false,smsAccepted:false}});
  expect(d.sms).not.toHaveBeenCalled();
 });
 it('escapes untrusted breakdowns and preserves the difference between intent and commitment',()=>{
  const data=fixture();
  const hostile = '<img src=x onerror="alert(1)"> & <script>alert(1)</script>';
  data.weeks[0].blogs=[{path:hostile,sessions:1,quote_starts:0}];
  data.weeks[0].quote_sources=[{source:hostile,records:1}];
  data.weeks[0].traffic=[{source:hostile,sessions:1}];
  data.weeks[0].top_motors=[{model:hostile,records:1}];
  data.weeks[0].viewed_motors=[{model:hostile,sessions:1}];
  const r=renderReport(data);
  expect(r.html).not.toContain('<script>');expect(r.html).not.toContain('<img');
  expect(r.html.match(/&lt;img/g)).toHaveLength(5);
  expect(r.html).toContain('&quot;alert(1)&quot;');
  expect(r.html).not.toContain('&amp;lt;');
  expect(r.sms).toContain('4,082 tracked sessions');expect(r.sms).toContain('46 public API');
  expect(r.sms).toContain('not confirmed contacts or downloads');expect(r.sms).not.toContain('BIGGEST DROP');
  expect(r.html).toContain('Guide download leads: 2; captured chat leads: 3');
  expect(r.html).toContain('Quote-summary sessions with phone clicks: 1; with text clicks: 1');
  expect(r.sms).toContain('quote-summary sessions with phone/text clicks: 1/1 (not site-wide)');
  expect(r.sms.length).toBeLessThan(1500);
 });
 it('uses a stable half-open Monday reporting period despite schedule jitter',()=>{
  expect(reportingEnd(new Date('2026-09-21T07:00:45Z'))).toBe('2026-09-21T07:00:00.000Z');
  expect(reportingEnd(new Date('2026-09-21T06:59:59Z'))).toBe('2026-09-14T07:00:00.000Z');
  expect(reportingEnd(new Date('2026-09-23T20:00:00Z'))).toBe('2026-09-21T07:00:00.000Z');
 });
});
