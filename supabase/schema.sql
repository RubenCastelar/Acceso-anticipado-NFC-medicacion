create extension if not exists pgcrypto;

create table if not exists public.waitlist_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  consent_launch boolean not null default false,
  consent_updates boolean not null default false,
  source text not null default 'landing-nfcuidado',
  locale text not null default 'es',
  created_at timestamptz not null default now()
);

create unique index if not exists waitlist_leads_email_unique
  on public.waitlist_leads (lower(email));

grant usage on schema public to anon;
grant insert on table public.waitlist_leads to anon;

alter table public.waitlist_leads enable row level security;

drop policy if exists "allow_anon_insert_waitlist" on public.waitlist_leads;
create policy "allow_anon_insert_waitlist"
on public.waitlist_leads
for insert
to anon
with check (
  consent_launch = true
  and email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
);

drop policy if exists "deny_anon_read_waitlist" on public.waitlist_leads;
create policy "deny_anon_read_waitlist"
on public.waitlist_leads
for select
to anon
using (false);
