-- Applied to production on 2026-09-18 (supabase_migrations version 20260918010124).
-- Read-only companion to public.upsert_soft_lead_quote.
-- Returns the canonical saved_quotes.reference_number (HBW-12345) for the caller's own
-- soft-saved quote so the quote summary can display the same number staff see in admin.
-- Additive: does not change upsert_soft_lead_quote or any table.
-- Access model matches the soft save: the caller must present the high-entropy quote
-- session id both as the argument and in the x-quote-session-id request header.
-- Rollback: drop function public.get_soft_lead_reference(text);
create or replace function public.get_soft_lead_reference(p_session_id text)
returns text
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  request_headers jsonb := coalesce(
    nullif(pg_catalog.current_setting('request.headers', true), '')::jsonb,
    '{}'::jsonb
  );
  v_reference text;
begin
  if p_session_id is null
    or p_session_id !~ '^qa_[0-9a-f]{24}$'
    or (request_headers ->> 'x-quote-session-id') is distinct from p_session_id
  then
    raise exception 'Invalid quote session' using errcode = '22023';
  end if;

  select sq.reference_number
    into v_reference
  from public.saved_quotes sq
  where sq.session_id = p_session_id
    and sq.is_soft_lead is true
    and (sq.user_id is null or sq.user_id = auth.uid())
  order by sq.updated_at desc nulls last, sq.created_at desc nulls last, sq.id desc
  limit 1;

  return v_reference;
end;
$function$;

revoke all on function public.get_soft_lead_reference(text) from public;
grant execute on function public.get_soft_lead_reference(text) to anon, authenticated, service_role;

comment on function public.get_soft_lead_reference(text) is
  'Returns the reference_number of the caller''s own soft-saved quote. Requires x-quote-session-id header to equal p_session_id. Read-only.';
