alter table public.sites
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

notify pgrst, 'reload schema';
