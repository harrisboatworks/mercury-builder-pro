-- Aggregate inside PostgreSQL: the API row limit must never truncate a report.
-- Only the authenticated reporting Edge function (service_role) may call this.
create or replace function public.weekly_report_v2(p_end timestamptz)
returns jsonb
language sql stable security invoker
set search_path = public, pg_temp
set statement_timeout = '30s'
set timezone = 'UTC'
as $report$
with weeks as (
  select i, p_end - (i + 1) * interval '7 days' as starts,
         p_end - i * interval '7 days' as ends
  from generate_series(0, 3) i
), event_base as materialized (
  select w.i, e.*,
    coalesce(e.event_data->>'is_test', 'false') = 'true'
      or coalesce(e.event_data->>'is_bot', 'false') = 'true'
      or coalesce(e.event_data->>'environment', '') in ('test','development','preview') as explicitly_excluded
  from weeks w join public.quote_activity_events e
    on e.created_at >= w.starts and e.created_at < w.ends
), excluded_sessions as (
  select distinct i, session_id from event_base where explicitly_excluded
), events as materialized (
  select e.* from event_base e where not e.explicitly_excluded
    and not exists(select 1 from excluded_sessions x where x.i=e.i and x.session_id=e.session_id)
), sessions as materialized (
  select i, session_id, min(created_at) as first_at,
    min(created_at) filter(where event_type='motor_selected') as motor_at,
    max(created_at) filter(where event_type='summary_viewed') as summary_at,
    bool_or(event_type='quote_submitted') as submitted,
    bool_or(event_type='phone_click') as phone_clicked,
    bool_or(event_type='sms_click') as sms_clicked,
    (array_agg(coalesce(nullif(device_type,''),'unknown') order by created_at,id))[1] as device,
    (array_agg(coalesce(nullif(utm_source,''),
      nullif(substring(referrer from '^https?://(?:www\.)?([^/:?#]+)'),''),'direct') order by created_at,id))[1] as source
  from events where nullif(session_id,'') is not null group by i,session_id
), quote_base as materialized (
  select w.i, q.*,
    coalesce(q.quote_data->>'is_test','false')='true'
      or lower(coalesce(q.customer_email,'')) ~ '@(example\.(com|org|net)|[^@]+\.test)$' as marked_test,
    coalesce(q.lead_source,'')='public-quote-api' as api_quote,
    coalesce(q.is_admin_quote,false) or q.created_by_admin is not null as admin_quote,
    (nullif(btrim(q.customer_email),'') is not null
      and lower(q.customer_email) !~ '@(placeholder\.com|example\.(com|org|net)|[^@]+\.test)$')
      or nullif(btrim(q.customer_phone),'') is not null as has_contact,
    coalesce(nullif(q.quote_data->>'motorModel',''), nullif(q.quote_data->>'motor_model',''),
      nullif(q.quote_data#>>'{motor,model}',''), nullif(q.quote_data#>>'{selectedMotor,model}',''),
      nullif(q.quote_data#>>'{items,0,name}',''), nullif(q.quote_data->>'model',''), 'Not recorded') as motor_name
  from weeks w join public.customer_quotes q on q.created_at >= w.starts and q.created_at < w.ends
), quotes as materialized (
  select * from quote_base where not marked_test and not api_quote and not admin_quote
), sources as (
  -- Source counts are records, not deduplicated people. No PII leaves this function.
  select w.i, 'trade_valuation' as source, count(t.id) as records,
    count(*) filter(where t.status='new') as pending
  from weeks w left join public.trade_valuation_leads t on t.created_at >= w.starts and t.created_at < w.ends
    and (nullif(btrim(t.customer_email),'') is not null or nullif(btrim(t.customer_phone),'') is not null)
    and lower(coalesce(t.customer_email,'')) !~ '@(placeholder\.com|example\.(com|org|net)|[^@]+\.test)$'
    and coalesce(t.raw_payload->>'is_test','false') <> 'true'
  group by w.i
), contacts as (
  select w.i, count(c.id) as records, count(c.id) filter(where c.status='new') as pending
  from weeks w left join public.contact_inquiries c on c.created_at>=w.starts and c.created_at<w.ends
    and lower(c.email) !~ '@(placeholder\.com|example\.(com|org|net)|[^@]+\.test)$'
  group by w.i
), chats as (
  select w.i, count(c.id) as conversations,
    count(c.id) filter(where nullif(btrim(c.customer_phone),'') is not null) as with_phone
  from weeks w left join public.chat_conversations c on c.created_at>=w.starts and c.created_at<w.ends
    and coalesce(c.context->>'is_test','false') <> 'true'
  group by w.i
), deposits as (
  -- Paid timestamp, never quote creation or requested deposit amount.
  select w.i, count(s.id) as records, coalesce(sum(s.deposit_amount),0) as amount
  from weeks w left join public.saved_quotes s on s.deposit_paid_at>=w.starts and s.deposit_paid_at<w.ends
    and s.deposit_status='paid'
    and lower(coalesce(s.email,'')) !~ '@(placeholder\.com|example\.(com|org|net)|[^@]+\.test)$'
    and coalesce(s.quote_state->>'is_test','false') <> 'true'
  group by w.i
), saved as (
  -- A saved PDF snapshot precedes generation: do not label this completed downloads.
  select w.i, count(s.id) as records,
    count(s.id) filter(where lower(s.email)='pdf-download@placeholder.com') as anonymous_pdf_snapshots
  from weeks w left join public.saved_quotes s on s.created_at>=w.starts and s.created_at<w.ends
    and lower(coalesce(s.email,'')) !~ '@(example\.(com|org|net)|[^@]+\.test)$'
    and coalesce(s.quote_state->>'is_test','false') <> 'true'
  group by w.i
), blog_paths as (
  select e.i,e.session_id,split_part(split_part(e.page_path,'?',1),'#',1) as path,min(e.created_at) as blog_at
  from events e where e.event_type='page_view' and e.page_path like '/blog/%'
  group by e.i,e.session_id,split_part(split_part(e.page_path,'?',1),'#',1)
), blog_counts as (
  select b.i,b.path,count(distinct b.session_id) as sessions,
    count(distinct b.session_id) filter(where s.motor_at>b.blog_at) as quote_starts
  from blog_paths b left join sessions s using(i,session_id) group by b.i,b.path
), result as (
 select w.i,jsonb_build_object(
   'start',w.starts,'end',w.ends,
   'events',(select count(*) from events e where e.i=w.i),
   'raw_events',(select count(*) from event_base e where e.i=w.i),
   'sessions',(select count(*) from sessions s where s.i=w.i),
   'excluded_sessions',(select count(*) from excluded_sessions s where s.i=w.i),
   'unlinked_events',(select count(*) from events e where e.i=w.i and nullif(e.session_id,'') is null),
   'quote_starts',(select count(*) from sessions s where s.i=w.i and motor_at is not null),
   'saw_price',(select count(*) from sessions s where s.i=w.i and summary_at>=motor_at),
   'summary_sessions',(select count(*) from sessions s where s.i=w.i and summary_at is not null),
   'submitted_sessions',(select count(*) from sessions s where s.i=w.i and submitted),
   'phone_clicks',(select count(*) from sessions s where s.i=w.i and phone_clicked),
   'sms_clicks',(select count(*) from sessions s where s.i=w.i and sms_clicked),
   'fast_builder_sessions',(select count(*) from sessions s where s.i=w.i and summary_at>=motor_at and summary_at-motor_at<interval '1 second'),
   'customer_quote_records',(select count(*) from quotes q where q.i=w.i),
   'contactable_quote_records',(select count(*) from quotes q where q.i=w.i and has_contact),
   'quote_value',(select coalesce(sum(final_price),0) from quotes q where q.i=w.i and has_contact),
   'api_quote_records',(select count(*) from quote_base q where q.i=w.i and api_quote),
   'api_test_records',(select count(*) from quote_base q where q.i=w.i and api_quote and marked_test),
   'test_quote_records',(select count(*) from quote_base q where q.i=w.i and marked_test),
   'admin_quote_records',(select count(*) from quote_base q where q.i=w.i and admin_quote),
   'quote_sources',coalesce((select jsonb_agg(t) from (select coalesce(lead_source,'unattributed') source,count(*) records from quotes q where q.i=w.i and has_contact group by 1 order by 2 desc,1 limit 10) t),'[]'),
   'top_motors',coalesce((select jsonb_agg(t) from (select motor_name model,count(*) records from quotes q where q.i=w.i and has_contact group by 1 order by 2 desc,1 limit 5) t),'[]'),
   'viewed_motors',coalesce((select jsonb_agg(t) from (select coalesce(nullif(motor_model,''),'Not recorded') model,count(distinct session_id) sessions from events e where e.i=w.i and event_type='motor_selected' group by 1 order by 2 desc,1 limit 5) t),'[]'),
   'traffic',coalesce((select jsonb_agg(t) from (select source,count(*) sessions from sessions s where s.i=w.i group by 1 order by 2 desc,1 limit 5) t),'[]'),
   'devices',coalesce((select jsonb_object_agg(device,n) from (select device,count(*) n from sessions s where s.i=w.i group by 1) t),'{}'),
   'blogs',coalesce((select jsonb_agg(t) from (select path,sessions,quote_starts from blog_counts b where b.i=w.i order by quote_starts desc,sessions desc,path limit 5) t),'[]'),
   'trade_valuations',coalesce((select records from sources s where s.i=w.i),0),
   'trade_pending',coalesce((select pending from sources s where s.i=w.i),0),
   'contact_inquiries',(select records from contacts c where c.i=w.i),
   'contact_pending',(select pending from contacts c where c.i=w.i),
   'chats',(select conversations from chats c where c.i=w.i),
   'chats_with_phone',(select with_phone from chats c where c.i=w.i),
   'paid_deposits',(select records from deposits d where d.i=w.i),
   'paid_deposit_amount',(select amount from deposits d where d.i=w.i),
   'saved_snapshots',(select records from saved s where s.i=w.i),
   'anonymous_pdf_snapshots',(select anonymous_pdf_snapshots from saved s where s.i=w.i)
 ) as data from weeks w
)
select jsonb_build_object('version',2,'weeks',jsonb_agg(data order by i)) from result;
$report$;
revoke all on function public.weekly_report_v2(timestamptz) from public, anon, authenticated;
grant execute on function public.weekly_report_v2(timestamptz) to service_role;
