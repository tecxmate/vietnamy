-- Supabase Auth identity + learner-owned progress.
--
-- This keeps heavy assets in R2 and stores only per-user identity/progress
-- records in Supabase. Client access is guarded by auth.uid() RLS policies.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  avatar_url text not null default '',
  ui_language text not null default 'en',
  dialect text not null default 'north',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_words (
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id text not null,
  source text not null default 'lesson',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, word_id, source)
);

create index if not exists saved_words_user_source_idx
  on public.saved_words(user_id, source, updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists user_progress_set_updated_at on public.user_progress;
create trigger user_progress_set_updated_at
before update on public.user_progress
for each row execute function public.set_updated_at();

drop trigger if exists saved_words_set_updated_at on public.saved_words;
create trigger saved_words_set_updated_at
before update on public.saved_words
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.saved_words enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "user_progress_select_own" on public.user_progress;
create policy "user_progress_select_own"
on public.user_progress for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "user_progress_insert_own" on public.user_progress;
create policy "user_progress_insert_own"
on public.user_progress for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "user_progress_update_own" on public.user_progress;
create policy "user_progress_update_own"
on public.user_progress for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "user_progress_delete_own" on public.user_progress;
create policy "user_progress_delete_own"
on public.user_progress for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "saved_words_select_own" on public.saved_words;
create policy "saved_words_select_own"
on public.saved_words for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "saved_words_insert_own" on public.saved_words;
create policy "saved_words_insert_own"
on public.saved_words for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "saved_words_update_own" on public.saved_words;
create policy "saved_words_update_own"
on public.saved_words for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "saved_words_delete_own" on public.saved_words;
create policy "saved_words_delete_own"
on public.saved_words for delete
to authenticated
using (user_id = auth.uid());

-- notifications.recipient_id is text because the app originally supported
-- anonymous recipients. Authenticated users may only read/update rows addressed
-- to their auth.users.id string. Server-side service-role writes still bypass RLS.
alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications for select
to authenticated
using (recipient_id = auth.uid()::text);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
on public.notifications for update
to authenticated
using (recipient_id = auth.uid()::text)
with check (recipient_id = auth.uid()::text);
