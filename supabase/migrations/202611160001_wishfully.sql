-- Dedicated Wishfully data only. Other projects and tables are not changed.
begin;
create table if not exists public.wishfully_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null,
 revision bigint not null default 0 check (revision >= 0)
);
alter table public.wishfully_accounts enable row level security;
grant select, insert, update on public.wishfully_accounts to authenticated;
revoke all on public.wishfully_accounts from anon;
create policy "Wishfully read own lists" on public.wishfully_accounts
 for select to authenticated using ((select auth.uid()) = user_id);
create policy "Wishfully create own lists" on public.wishfully_accounts
 for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Wishfully update own lists" on public.wishfully_accounts
 for update to authenticated using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
 values ('wishfully-images','wishfully-images',false,2097152,array['image/webp'])
 on conflict (id) do nothing;
create policy "Wishfully read own images" on storage.objects
 for select to authenticated using (bucket_id='wishfully-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Wishfully upload own images" on storage.objects
 for insert to authenticated with check (bucket_id='wishfully-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
