-- Wishfully shared wishlist migration (1 male + 1 female lists)
-- Disables email login requirements; allows shared cloud state across devices
begin;

create table if not exists public.wishfully_state (
 id integer primary key default 1 check (id = 1),
 payload jsonb not null,
 revision bigint not null default 0 check (revision >= 0)
);

alter table public.wishfully_state enable row level security;
grant all on public.wishfully_state to anon, authenticated, service_role;

drop policy if exists "Allow shared wishfully_state read" on public.wishfully_state;
create policy "Allow shared wishfully_state read" on public.wishfully_state
 for select to public using (true);

drop policy if exists "Allow shared wishfully_state insert" on public.wishfully_state;
create policy "Allow shared wishfully_state insert" on public.wishfully_state
 for insert to public with check (true);

drop policy if exists "Allow shared wishfully_state update" on public.wishfully_state;
create policy "Allow shared wishfully_state update" on public.wishfully_state
 for update to public using (true) with check (true);

-- Copy any existing wishes from wishfully_accounts if present
do $$
begin
 if exists (select from pg_tables where schemaname = 'public' and tablename = 'wishfully_accounts') then
  insert into public.wishfully_state (id, payload, revision)
  select 1, payload, revision from public.wishfully_accounts limit 1
  on conflict (id) do nothing;
 end if;
end $$;

-- Shared image storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
 values ('wishfully-images', 'wishfully-images', true, 2097152, array['image/webp'])
 on conflict (id) do update set public = true;

drop policy if exists "Allow shared wishfully-images read" on storage.objects;
create policy "Allow shared wishfully-images read" on storage.objects
 for select to public using (bucket_id = 'wishfully-images');

drop policy if exists "Allow shared wishfully-images insert" on storage.objects;
create policy "Allow shared wishfully-images insert" on storage.objects
 for insert to public with check (bucket_id = 'wishfully-images');

commit;
