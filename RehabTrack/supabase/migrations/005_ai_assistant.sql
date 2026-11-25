-- AI assistant: conversations, messages, and generated dashboard insights.
create extension if not exists pgcrypto;

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  title text not null default 'New conversation',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ai_conversations add column if not exists title text not null default 'New conversation';
alter table public.ai_conversations add column if not exists site_id uuid references public.sites(id) on delete set null;
alter table public.ai_conversations add column if not exists messages jsonb not null default '[]'::jsonb;
alter table public.ai_conversations add column if not exists updated_at timestamptz not null default now();

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  site_id uuid references public.sites(id) on delete cascade,
  insight text not null,
  category text not null default 'general',
  severity text not null default 'info' check (severity in ('info','low','medium','high','critical')),
  source_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create index if not exists ai_conversations_user_updated_idx on public.ai_conversations(user_id, updated_at desc);
create index if not exists ai_messages_conversation_created_idx on public.ai_messages(conversation_id, created_at);
create index if not exists ai_messages_user_created_idx on public.ai_messages(user_id, created_at desc);
create index if not exists ai_insights_user_created_idx on public.ai_insights(user_id, created_at desc);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_insights enable row level security;

drop policy if exists "AI conversation owner" on public.ai_conversations;
create policy "AI conversation owner" on public.ai_conversations for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "AI message owner" on public.ai_messages;
create policy "AI message owner" on public.ai_messages for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "AI insight owner" on public.ai_insights;
create policy "AI insight owner" on public.ai_insights for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.ai_conversations to authenticated;
grant select, insert, update, delete on public.ai_messages to authenticated;
grant select, insert, update, delete on public.ai_insights to authenticated;
revoke all on public.ai_conversations from anon;
revoke all on public.ai_messages from anon;
revoke all on public.ai_insights from anon;
notify pgrst, 'reload schema';
