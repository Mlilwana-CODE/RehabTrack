-- Ensure generated reports persist for the authenticated owner and remain readable after reload.
-- Run against the same Supabase project configured by the production app.
create extension if not exists pgcrypto;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  site_id uuid references public.sites(id) on delete cascade,
  report_type text,
  period_start date,
  period_end date,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reports add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.reports alter column user_id set default auth.uid();
alter table public.reports add column if not exists site_id uuid references public.sites(id) on delete cascade;
alter table public.reports add column if not exists report_type text;
alter table public.reports add column if not exists period_start date;
alter table public.reports add column if not exists period_end date;
alter table public.reports add column if not exists content jsonb not null default '{}'::jsonb;
alter table public.reports add column if not exists created_at timestamptz not null default now();
alter table public.reports add column if not exists updated_at timestamptz not null default now();

-- Recover ownership for existing site-linked reports whose user_id was not populated.
update public.reports as report
set user_id = site.user_id
from public.sites as site
where report.site_id = site.id
  and report.user_id is distinct from site.user_id;

create index if not exists reports_user_created_at_idx
  on public.reports (user_id, created_at desc);

alter table public.reports enable row level security;

-- Remove old policies so access cannot be broadened by a permissive legacy policy.
do $$
declare policy_record record;
begin
  for policy_record in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'reports'
  loop
    execute format('drop policy if exists %I on public.reports', policy_record.policyname);
  end loop;
end $$;

create policy "report owner access"
on public.reports
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

revoke all on public.reports from anon;
grant select, insert, update, delete on public.reports to authenticated;

notify pgrst, 'reload schema';
