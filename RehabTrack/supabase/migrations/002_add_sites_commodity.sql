-- Repair deployments whose existing public.sites table predates commodity support.
alter table if exists public.sites
  add column if not exists commodity text;

notify pgrst, 'reload schema';
