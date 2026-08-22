-- Minimal PKCE authorization-code bridge for the Grok custom MCP connector.
-- Only short-lived code hashes are persisted; access tokens remain Edge Function secrets.

create table if not exists public.grok_oauth_codes (
  code_hash text primary key check (length(code_hash) = 64),
  code_challenge text not null check (length(code_challenge) between 43 and 128),
  redirect_uri text not null check (length(redirect_uri) between 12 and 1024),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.grok_oauth_codes enable row level security;

revoke all on table public.grok_oauth_codes from public, anon, authenticated;
grant all on table public.grok_oauth_codes to service_role;

create or replace function public.grok_oauth_store_code(
  p_code_hash text,
  p_code_challenge text,
  p_redirect_uri text,
  p_expires_at timestamptz
)
returns void
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
begin
  if length(p_code_hash) <> 64
     or length(p_code_challenge) < 43
     or length(p_redirect_uri) < 12
     or p_expires_at <= now()
     or p_expires_at > now() + interval '10 minutes' then
    raise exception 'invalid authorization code parameters';
  end if;

  delete from public.grok_oauth_codes
  where expires_at < now() - interval '1 day';

  insert into public.grok_oauth_codes (
    code_hash,
    code_challenge,
    redirect_uri,
    expires_at
  ) values (
    p_code_hash,
    p_code_challenge,
    p_redirect_uri,
    p_expires_at
  )
  on conflict (code_hash) do nothing;
end;
$function$;

create or replace function public.grok_oauth_consume_code(
  p_code_hash text,
  p_code_challenge text,
  p_redirect_uri text
)
returns boolean
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
begin
  update public.grok_oauth_codes
  set used_at = now()
  where code_hash = p_code_hash
    and code_challenge = p_code_challenge
    and redirect_uri = p_redirect_uri
    and used_at is null
    and expires_at > now();

  return found;
end;
$function$;

revoke all on function public.grok_oauth_store_code(text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.grok_oauth_consume_code(text, text, text) from public, anon, authenticated;
grant execute on function public.grok_oauth_store_code(text, text, text, timestamptz) to service_role;
grant execute on function public.grok_oauth_consume_code(text, text, text) to service_role;
