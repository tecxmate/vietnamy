-- Vietnamy app operations store.
--
-- Heavy objects stay in Cloudflare R2. These tables hold small operational
-- product data: message events, feedback, notifications, email logs, and push
-- subscriptions/events.
--
-- Runtime access should go through the server using the Supabase service role.
-- RLS is enabled now so direct client access is denied until explicit policies
-- are added with real authenticated user IDs.

create extension if not exists pgcrypto;

create table if not exists public.email_logs (
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

create index if not exists email_logs_at_idx on public.email_logs(at desc);
create index if not exists email_logs_type_idx on public.email_logs(type);

create table if not exists public.message_events (
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
  on public.message_events(scenario_id, channel, variant_id, event);
create index if not exists message_events_at_idx on public.message_events(at desc);
create index if not exists message_events_user_idx on public.message_events(user_id, at desc);

create table if not exists public.push_subscriptions (
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
  on public.push_subscriptions(user_id, active);

create table if not exists public.push_events (
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
  on public.push_events(template_id, scenario_id, type);
create index if not exists push_events_user_idx on public.push_events(user_id, at desc);

create table if not exists public.feedback_reports (
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
  on public.feedback_reports(status, severity, at desc);
create index if not exists feedback_reports_user_idx
  on public.feedback_reports(user_id, at desc);

create table if not exists public.notifications (
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
  on public.notifications(recipient_id, read, at desc);

alter table public.email_logs enable row level security;
alter table public.message_events enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.push_events enable row level security;
alter table public.feedback_reports enable row level security;
alter table public.notifications enable row level security;
