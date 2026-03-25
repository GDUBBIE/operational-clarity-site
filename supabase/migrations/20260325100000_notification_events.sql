create table if not exists public.oc_notification_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.oc_sessions(id) on delete cascade,
  event_type text not null check (event_type in ('session_started', 'session_summary_ready', 'contact_submitted', 'package_selected')),
  priority text not null check (priority in ('normal', 'high')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  dedupe_key text not null,
  summary_card jsonb not null default '{}'::jsonb,
  delivery_channels jsonb not null default '{}'::jsonb,
  retry_count integer not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (session_id, event_type),
  unique (dedupe_key)
);

create index if not exists oc_notification_events_status_idx
  on public.oc_notification_events (status, priority, created_at desc);

create index if not exists oc_notification_events_session_idx
  on public.oc_notification_events (session_id, created_at desc);

drop trigger if exists oc_notification_events_set_updated_at on public.oc_notification_events;
create trigger oc_notification_events_set_updated_at
before update on public.oc_notification_events
for each row execute function public.oc_set_updated_at();

alter table public.oc_notification_events enable row level security;
