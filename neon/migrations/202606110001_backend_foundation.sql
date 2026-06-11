-- Neon/Postgres foundation for the post-Supabase migration.
--
-- Supabase remains the primary runtime backend until app flags are flipped.
-- These tables mirror the app-owned data without Supabase auth.users or RLS.

create extension if not exists pgcrypto;

create table if not exists profiles (
  id text primary key,
  email text not null default '',
  full_name text not null default '',
  avatar_url text not null default '',
  ui_language text not null default 'en',
  dialect text not null default 'north',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_progress (
  user_id text primary key references profiles(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists saved_words (
  user_id text not null references profiles(id) on delete cascade,
  word_id text not null,
  source text not null default 'lesson',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, word_id, source)
);

create index if not exists saved_words_user_source_idx
  on saved_words(user_id, source, updated_at desc);

create table if not exists auth_users (
  id text primary key default gen_random_uuid()::text,
  name text,
  email text unique,
  email_verified timestamptz,
  image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists auth_accounts (
  user_id text not null references auth_users(id) on delete cascade,
  type text not null,
  provider text not null,
  provider_account_id text not null,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  primary key (provider, provider_account_id)
);

create table if not exists auth_sessions (
  session_token text primary key,
  user_id text not null references auth_users(id) on delete cascade,
  expires timestamptz not null
);

create table if not exists auth_verification_tokens (
  identifier text not null,
  token text not null,
  expires timestamptz not null,
  primary key (identifier, token)
);

create table if not exists supabase_user_migrations (
  supabase_user_id uuid primary key,
  auth_user_id text references auth_users(id) on delete set null,
  email text,
  migrated_at timestamptz not null default now()
);

create table if not exists email_logs (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  type text not null default 'generic',
  recipient_email text not null default '',
  subject text not null default '',
  success boolean not null default false,
  skipped boolean not null default false,
  provider_id text,
  error_message text
);

create index if not exists email_logs_at_idx on email_logs(at desc);
create index if not exists email_logs_type_idx on email_logs(type);

create table if not exists message_events (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  message_instance_id text,
  scenario_id text not null default '',
  variant_id text not null default '',
  channel text not null default '',
  event text not null default 'rendered',
  user_id text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists message_events_lookup_idx
  on message_events(scenario_id, channel, variant_id, event);
create index if not exists message_events_at_idx on message_events(at desc);
create index if not exists message_events_user_idx on message_events(user_id, at desc);

create table if not exists push_subscriptions (
  id text primary key,
  user_id text not null default 'anonymous',
  user_name text not null default '',
  platform text not null default 'web',
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  subscription jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent integer not null default 0,
  clicked integer not null default 0
);

create index if not exists push_subscriptions_user_idx
  on push_subscriptions(user_id, active);

create table if not exists push_events (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  type text not null,
  notification_id text not null default '',
  template_id text not null default '',
  scenario_id text not null default '',
  variant_id text not null default '',
  subscription_id text not null default '',
  user_id text not null default 'anonymous',
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists push_events_template_idx
  on push_events(template_id, scenario_id, type);
create index if not exists push_events_user_idx on push_events(user_id, at desc);

create table if not exists feedback_reports (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  status text not null default 'open',
  kind text not null default 'bug',
  severity text not null default 'med',
  subject text not null,
  body text not null,
  name text not null default '',
  email text not null default '',
  user_id text not null default 'anonymous',
  pathname text not null default '/',
  viewport text not null default '',
  screenshot_url text not null default '',
  user_agent text not null default '',
  app_version text not null default 'dev',
  client_logs jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists feedback_reports_status_idx
  on feedback_reports(status, severity, at desc);
create index if not exists feedback_reports_user_idx
  on feedback_reports(user_id, at desc);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  recipient_id text not null default 'anonymous',
  recipient_email text not null default '',
  type text not null default 'system',
  title text not null,
  message text not null,
  url text not null default '/',
  read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists notifications_recipient_idx
  on notifications(recipient_id, read, at desc);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
before update on profiles
for each row execute function set_updated_at();

drop trigger if exists user_progress_set_updated_at on user_progress;
create trigger user_progress_set_updated_at
before update on user_progress
for each row execute function set_updated_at();

drop trigger if exists saved_words_set_updated_at on saved_words;
create trigger saved_words_set_updated_at
before update on saved_words
for each row execute function set_updated_at();
