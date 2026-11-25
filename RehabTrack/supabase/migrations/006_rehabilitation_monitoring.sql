-- Before/after rehabilitation monitoring: private imagery, timelines, and field observations.
create extension if not exists pgcrypto;

alter table public.profiles add column if not exists role text not null default 'viewer';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin','inspector','viewer'));

create table if not exists public.rehabilitation_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  image_date date not null,
  image_type text not null default 'current' check (image_type in ('before','during','current')),
  source text not null default 'field' check (source in ('field','drone','satellite','other')),
  rehabilitation_stage text,
  latitude double precision,
  longitude double precision,
  comments text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint rehabilitation_images_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint rehabilitation_images_longitude_range check (longitude is null or longitude between -180 and 180)
);

create table if not exists public.rehabilitation_timelines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  image_id uuid references public.rehabilitation_images(id) on delete set null,
  event_date date not null,
  title text not null,
  description text not null default '',
  event_type text not null default 'milestone' check (event_type in ('milestone','survey','assessment','other')),
  created_at timestamptz not null default now()
);

create table if not exists public.rehabilitation_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  image_id uuid references public.rehabilitation_images(id) on delete cascade,
  observation_date date not null default current_date,
  observation text not null,
  analysis_type text not null default 'field' check (analysis_type in ('field','ai','metric')),
  vegetation_percent numeric check (vegetation_percent is null or vegetation_percent between 0 and 100),
  stabilization_percent numeric check (stabilization_percent is null or stabilization_percent between 0 and 100),
  erosion_reduction_percent numeric check (erosion_reduction_percent is null or erosion_reduction_percent between 0 and 100),
  water_management_percent numeric check (water_management_percent is null or water_management_percent between 0 and 100),
  created_at timestamptz not null default now()
);

create index if not exists rehab_images_site_date_idx on public.rehabilitation_images(site_id, image_date desc);
create index if not exists rehab_images_user_created_idx on public.rehabilitation_images(user_id, created_at desc);
create index if not exists rehab_timeline_site_date_idx on public.rehabilitation_timelines(site_id, event_date desc);
create index if not exists rehab_observations_site_date_idx on public.rehabilitation_observations(site_id, observation_date desc);

alter table public.rehabilitation_images enable row level security;
alter table public.rehabilitation_timelines enable row level security;
alter table public.rehabilitation_observations enable row level security;

drop policy if exists "rehab images owner or admin read" on public.rehabilitation_images;
create policy "rehab images owner or admin read" on public.rehabilitation_images for select to authenticated
using (user_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "rehab images uploader insert" on public.rehabilitation_images;
create policy "rehab images uploader insert" on public.rehabilitation_images for insert to authenticated
with check (user_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','inspector')));
drop policy if exists "rehab images uploader update" on public.rehabilitation_images;
create policy "rehab images uploader update" on public.rehabilitation_images for update to authenticated
using ((user_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','inspector'))) or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check ((user_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','inspector'))) or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "rehab images uploader delete" on public.rehabilitation_images;
create policy "rehab images uploader delete" on public.rehabilitation_images for delete to authenticated
using ((user_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','inspector'))) or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Keep project records private to their creator; administrators can manage all project records.
DO $$ DECLARE tbl text; BEGIN
  FOREACH tbl IN ARRAY ARRAY['rehabilitation_timelines','rehabilitation_observations'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'rehab '||tbl||' owner/admin read', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ''admin''))', 'rehab '||tbl||' owner/admin read', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'rehab '||tbl||' contributor insert', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN (''admin'',''inspector'')))', 'rehab '||tbl||' contributor insert', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'rehab '||tbl||' contributor update', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING ((user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN (''admin'',''inspector''))) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ''admin'')) WITH CHECK ((user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN (''admin'',''inspector''))) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ''admin''))', 'rehab '||tbl||' contributor update', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'rehab '||tbl||' contributor delete', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING ((user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN (''admin'',''inspector''))) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ''admin''))', 'rehab '||tbl||' contributor delete', tbl);
  END LOOP;
END $$;

grant select, insert, update, delete on public.rehabilitation_images to authenticated;
grant select, insert, update, delete on public.rehabilitation_timelines to authenticated;
grant select, insert, update, delete on public.rehabilitation_observations to authenticated;
revoke all on public.rehabilitation_images from anon;
revoke all on public.rehabilitation_timelines from anon;
revoke all on public.rehabilitation_observations from anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rehabilitation-images','rehabilitation-images',false,209715200,array['image/jpeg','image/png','image/webp','image/tiff','image/heic','image/heif'])
on conflict (id) do update set public=false,file_size_limit=209715200,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "rehabilitation image storage read" on storage.objects;
create policy "rehabilitation image storage read" on storage.objects for select to authenticated
using (bucket_id='rehabilitation-images' and ((storage.foldername(name))[1]=auth.uid()::text or exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')));
drop policy if exists "rehabilitation image storage upload" on storage.objects;
create policy "rehabilitation image storage upload" on storage.objects for insert to authenticated
with check (bucket_id='rehabilitation-images' and (storage.foldername(name))[1]=auth.uid()::text and exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','inspector')));
drop policy if exists "rehabilitation image storage update" on storage.objects;
create policy "rehabilitation image storage update" on storage.objects for update to authenticated
using (bucket_id='rehabilitation-images' and (((storage.foldername(name))[1]=auth.uid()::text and exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','inspector'))) or exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')))
with check (bucket_id='rehabilitation-images' and (((storage.foldername(name))[1]=auth.uid()::text and exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','inspector'))) or exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')));
drop policy if exists "rehabilitation image storage delete" on storage.objects;
create policy "rehabilitation image storage delete" on storage.objects for delete to authenticated
using (bucket_id='rehabilitation-images' and (((storage.foldername(name))[1]=auth.uid()::text and exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','inspector'))) or exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')));

notify pgrst, 'reload schema';
