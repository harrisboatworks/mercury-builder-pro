-- Run ONLY in a disposable empty PostgreSQL database. No production data needed.
\set ON_ERROR_STOP on
begin;
do $$ begin
  if exists(select 1 from information_schema.tables where table_schema='public') then
    raise exception 'Fixture requires an empty disposable database';
  end if;
end $$;
create role anon;
create role authenticated;
create role service_role;
create table quote_activity_events(id int,session_id text,created_at timestamptz,event_type text,event_data jsonb,page_path text,device_type text,utm_source text,referrer text,motor_model text);
create table customer_quotes(id int,created_at timestamptz,quote_data jsonb,customer_email text,customer_phone text,lead_source text,is_admin_quote boolean,created_by_admin uuid,final_price numeric);
create table trade_valuation_leads(id int,created_at timestamptz,status text,customer_email text,customer_phone text,raw_payload jsonb);
create table contact_inquiries(id int,created_at timestamptz,status text,email text);
create table chat_conversations(id int,created_at timestamptz,context jsonb,customer_phone text);
create table saved_quotes(id int,created_at timestamptz,deposit_paid_at timestamptz,deposit_status text,deposit_amount numeric,email text,quote_state jsonb);
\ir ../migrations/20260921160000_weekly_report_v2.sql
insert into quote_activity_events select i,'session-'||i,'2026-09-15T12:00Z','page_view','{}','/blog/example', 'mobile',null,null,null from generate_series(1,1501) i;
insert into quote_activity_events values
 (2000,'builder','2026-09-15T12:00Z','page_view','{}','/blog/first','desktop',null,'https://www.google.com/search?q=private',null),
 (2001,'builder','2026-09-15T12:01Z','motor_selected','{}','/quote/motor-selection',null,null,null,'115 Pro XS'),
 (2002,'builder','2026-09-15T12:01:00.2Z','summary_viewed','{}','/quote/summary',null,null,null,null),
 (2003,'builder','2026-09-15T12:02Z','page_view','{}','/blog/after',null,null,null,null),
 (2004,'test','2026-09-15T12:00Z','motor_selected','{}','/quote/motor-selection',null,null,null,null),
 (2005,'test','2026-09-15T12:01Z','summary_viewed','{"is_test":true}','/quote/summary',null,null,null,null),
 (2006,'boundary','2026-09-21T07:00Z','motor_selected','{}','/quote/motor-selection',null,null,null,null),
 (2007,'previous','2026-09-14T06:59:59Z','motor_selected','{}','/quote/motor-selection',null,null,null,null);
insert into customer_quotes values
 (1,'2026-09-15T12:00Z','{"items":[{"name":"115 Pro XS"}]}','person@customer.invalid',null,'website',false,null,10000),
 (2,'2026-09-15T12:00Z','{}','test@example.com',null,'public-quote-api',false,null,20000),
 (3,'2026-09-15T12:00Z','{}','person@customer.invalid',null,'public-quote-api',false,null,30000),
 (4,'2026-09-15T12:00Z','{}','person@customer.invalid',null,'website',true,null,40000),
 (5,'2026-09-15T12:00Z','{}','pdf-download@placeholder.com',null,'pdf_download',false,null,50000);
insert into trade_valuation_leads values(1,'2026-09-19T12:00Z','new','person@customer.invalid',null,'{}');
-- Old saved quote, paid this week: must count by paid date.
insert into saved_quotes values(1,'2026-08-01T12:00Z','2026-09-19T12:00Z','paid',500,'person@customer.invalid','{}'),
 (2,'2026-09-19T12:00Z',null,'pending',1000,'person@customer.invalid','{}'),
 (3,'2026-09-19T12:00Z',null,null,null,'pdf-download@placeholder.com','{}');
do $$ declare r jsonb; w jsonb; begin
 r:=weekly_report_v2('2026-09-21T07:00Z'); w:=r->'weeks'->0;
 assert (w->>'sessions')::int=1502, 'must count beyond API cap and exclude the whole marked session';
 assert (w->>'quote_starts')::int=1 and (w->>'saw_price')::int=1, 'optional steps cannot break the journey';
 assert (w->>'fast_builder_sessions')::int=1, 'fast sessions remain included';
 assert (w->>'excluded_sessions')::int=1;
 assert (w->>'contactable_quote_records')::int=1 and (w->>'quote_value')::numeric=10000;
 assert (w->>'api_quote_records')::int=2 and (w->>'api_test_records')::int=1, 'API is not synonymous with test';
 assert w->'top_motors'->0->>'model'='115 Pro XS', 'items motor fallback';
 assert (w->>'paid_deposits')::int=1 and (w->>'paid_deposit_amount')::numeric=500, 'paid timestamp, not creation or pending amounts';
 assert (w->>'anonymous_pdf_snapshots')::int=1;
 assert (w->>'trade_valuations')::int=1 and (w->>'contact_inquiries')::int=0;
 assert (r->'weeks'->1->>'quote_starts')::int=1, 'half-open week boundaries';
 assert (r->'weeks'->2->>'trade_valuations')::int=0, 'empty left joins must not count one';
 assert exists(select 1 from jsonb_array_elements(w->'blogs') b where b->>'path'='/blog/first' and b->>'quote_starts'='1');
 assert exists(select 1 from jsonb_array_elements(w->'blogs') b where b->>'path'='/blog/after' and b->>'quote_starts'='0');
 assert not has_function_privilege('anon','public.weekly_report_v2(timestamptz)','execute');
 assert not has_function_privilege('authenticated','public.weekly_report_v2(timestamptz)','execute');
 assert has_function_privilege('service_role','public.weekly_report_v2(timestamptz)','execute');
 raise notice 'Weekly report SQL regression checks passed';
end $$;
rollback;
