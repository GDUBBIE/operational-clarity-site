create extension if not exists pgcrypto;

create or replace function public.oc_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.oc_business_types (
  slug text primary key,
  label text not null,
  parent_slug text references public.oc_business_types(slug),
  classification_level text not null default 'primary' check (classification_level in ('primary', 'secondary', 'sub_industry')),
  description text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.oc_business_models (
  slug text primary key,
  label text not null,
  description text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.oc_symptom_tags (
  slug text primary key,
  label text not null,
  description text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.oc_cause_tags (
  slug text primary key,
  label text not null,
  description text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.oc_operating_archetypes (
  slug text primary key,
  label text not null,
  description text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.oc_recommendation_library (
  id text primary key,
  slug text not null unique,
  title text not null,
  category text not null,
  description text not null,
  applies_to_business_types text[] not null default '{}'::text[],
  addresses_symptoms text[] not null default '{}'::text[],
  related_causes text[] not null default '{}'::text[],
  expected_impact text,
  difficulty_level text,
  time_horizon text,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.oc_sessions (
  id uuid primary key default gen_random_uuid(),
  client_session_id text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  completion_status text not null default 'in_progress' check (completion_status in ('in_progress', 'completed', 'abandoned', 'contact_submitted')),
  transcript jsonb not null default '[]'::jsonb,
  extracted_json jsonb not null default '{}'::jsonb,
  findings_json jsonb not null default '{}'::jsonb,
  recommendations_json jsonb not null default '[]'::jsonb,
  assessment_score integer,
  context_score integer,
  confidence_label text,
  confidence_value numeric(5,4),
  buy_signal text,
  buy_signal_score integer,
  contact_submitted boolean not null default false,
  source text,
  channel text,
  page_url text,
  build_version text,
  session_path text[] not null default '{}'::text[],
  branch_path text[] not null default '{}'::text[],
  last_completed_step text,
  drop_off_step text,
  low_confidence boolean not null default false,
  extraction_confidence numeric(5,4),
  stages_seen text[] not null default '{}'::text[],
  question_sequence jsonb not null default '[]'::jsonb,
  surfaced_questions jsonb not null default '[]'::jsonb,
  usefulness_feedback jsonb,
  product_learning_json jsonb not null default '{}'::jsonb,
  normalized_snapshot jsonb not null default '{}'::jsonb,
  notes jsonb not null default '{}'::jsonb
);

create table if not exists public.oc_session_features (
  session_id uuid primary key references public.oc_sessions(id) on delete cascade,
  primary_business_type text references public.oc_business_types(slug),
  secondary_business_type text references public.oc_business_types(slug),
  sub_industry text references public.oc_business_types(slug),
  business_model text references public.oc_business_models(slug),
  business_model_tags text[] not null default '{}'::text[],
  size_band text,
  team_structure text,
  operational_complexity text,
  primary_problem text,
  secondary_problem text,
  symptom_tags text[] not null default '{}'::text[],
  inferred_cause_tags text[] not null default '{}'::text[],
  recommendation_ids text[] not null default '{}'::text[],
  urgency_level text,
  clarity_level text,
  operating_archetype text references public.oc_operating_archetypes(slug),
  benchmark_segment text,
  benchmark_ready boolean not null default false,
  classification_confidence numeric(5,4),
  normalized_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.oc_session_business_models (
  session_id uuid not null references public.oc_sessions(id) on delete cascade,
  business_model_slug text not null references public.oc_business_models(slug),
  is_primary boolean not null default false,
  source text,
  confidence numeric(5,4),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (session_id, business_model_slug)
);

create table if not exists public.oc_session_symptom_tags (
  session_id uuid not null references public.oc_sessions(id) on delete cascade,
  symptom_slug text not null references public.oc_symptom_tags(slug),
  source text,
  confidence numeric(5,4),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (session_id, symptom_slug)
);

create table if not exists public.oc_session_cause_tags (
  session_id uuid not null references public.oc_sessions(id) on delete cascade,
  cause_slug text not null references public.oc_cause_tags(slug),
  source text,
  confidence numeric(5,4),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (session_id, cause_slug)
);

create table if not exists public.oc_session_recommendations (
  session_id uuid not null references public.oc_sessions(id) on delete cascade,
  recommendation_id text not null references public.oc_recommendation_library(id),
  source text,
  rank integer,
  confidence numeric(5,4),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (session_id, recommendation_id)
);

create index if not exists oc_sessions_completion_idx on public.oc_sessions (completion_status, contact_submitted, created_at desc);
create index if not exists oc_sessions_business_snapshot_gin on public.oc_sessions using gin (normalized_snapshot);
create index if not exists oc_sessions_stage_path_gin on public.oc_sessions using gin (session_path);
create index if not exists oc_sessions_stage_seen_gin on public.oc_sessions using gin (stages_seen);
create index if not exists oc_session_features_business_idx on public.oc_session_features (primary_business_type, business_model, size_band);
create index if not exists oc_session_features_symptoms_gin on public.oc_session_features using gin (symptom_tags);
create index if not exists oc_session_features_causes_gin on public.oc_session_features using gin (inferred_cause_tags);
create index if not exists oc_session_features_recommendations_gin on public.oc_session_features using gin (recommendation_ids);
create index if not exists oc_recommendation_business_types_gin on public.oc_recommendation_library using gin (applies_to_business_types);
create index if not exists oc_recommendation_symptoms_gin on public.oc_recommendation_library using gin (addresses_symptoms);
create index if not exists oc_recommendation_causes_gin on public.oc_recommendation_library using gin (related_causes);

drop trigger if exists oc_business_types_set_updated_at on public.oc_business_types;
create trigger oc_business_types_set_updated_at before update on public.oc_business_types for each row execute function public.oc_set_updated_at();

drop trigger if exists oc_business_models_set_updated_at on public.oc_business_models;
create trigger oc_business_models_set_updated_at before update on public.oc_business_models for each row execute function public.oc_set_updated_at();

drop trigger if exists oc_symptom_tags_set_updated_at on public.oc_symptom_tags;
create trigger oc_symptom_tags_set_updated_at before update on public.oc_symptom_tags for each row execute function public.oc_set_updated_at();

drop trigger if exists oc_cause_tags_set_updated_at on public.oc_cause_tags;
create trigger oc_cause_tags_set_updated_at before update on public.oc_cause_tags for each row execute function public.oc_set_updated_at();

drop trigger if exists oc_operating_archetypes_set_updated_at on public.oc_operating_archetypes;
create trigger oc_operating_archetypes_set_updated_at before update on public.oc_operating_archetypes for each row execute function public.oc_set_updated_at();

drop trigger if exists oc_recommendation_library_set_updated_at on public.oc_recommendation_library;
create trigger oc_recommendation_library_set_updated_at before update on public.oc_recommendation_library for each row execute function public.oc_set_updated_at();

drop trigger if exists oc_sessions_set_updated_at on public.oc_sessions;
create trigger oc_sessions_set_updated_at before update on public.oc_sessions for each row execute function public.oc_set_updated_at();

drop trigger if exists oc_session_features_set_updated_at on public.oc_session_features;
create trigger oc_session_features_set_updated_at before update on public.oc_session_features for each row execute function public.oc_set_updated_at();

alter table public.oc_business_types enable row level security;
alter table public.oc_business_models enable row level security;
alter table public.oc_symptom_tags enable row level security;
alter table public.oc_cause_tags enable row level security;
alter table public.oc_operating_archetypes enable row level security;
alter table public.oc_recommendation_library enable row level security;
alter table public.oc_sessions enable row level security;
alter table public.oc_session_features enable row level security;
alter table public.oc_session_business_models enable row level security;
alter table public.oc_session_symptom_tags enable row level security;
alter table public.oc_session_cause_tags enable row level security;
alter table public.oc_session_recommendations enable row level security;

insert into public.oc_business_types (slug, label, parent_slug, classification_level, description, sort_order)
values
  ('steel_fabrication', 'Steel fabrication', null, 'primary', 'Steel and metal fabrication businesses.', 10),
  ('custom_fabrication', 'Custom fabrication', 'steel_fabrication', 'secondary', 'Made-to-order metal fabrication work.', 20),
  ('trucking_logistics', 'Trucking / logistics', null, 'primary', 'Fleet, freight, and routing businesses.', 30),
  ('freight_hauling', 'Freight hauling', 'trucking_logistics', 'secondary', 'Freight hauling and carrier operations.', 40),
  ('last_mile_delivery', 'Last-mile delivery', 'trucking_logistics', 'secondary', 'Dense local delivery and route operations.', 50),
  ('commercial_cleaning', 'Commercial cleaning', null, 'primary', 'Janitorial and facility cleaning businesses.', 60),
  ('janitorial_recurring', 'Janitorial recurring service', 'commercial_cleaning', 'secondary', 'Recurring cleaning contract operations.', 70),
  ('landscaping', 'Landscaping', null, 'primary', 'Landscape and grounds service businesses.', 80),
  ('grounds_maintenance', 'Grounds maintenance', 'landscaping', 'secondary', 'Recurring grounds maintenance and route work.', 90),
  ('hvac', 'HVAC', null, 'primary', 'Heating, cooling, and mechanical service businesses.', 100),
  ('commercial_hvac', 'Commercial HVAC', 'hvac', 'secondary', 'Commercial mechanical service and install.', 110),
  ('residential_hvac', 'Residential HVAC', 'hvac', 'secondary', 'Residential replacement and service work.', 120),
  ('general_contractor', 'General contractor', null, 'primary', 'General contracting and project-led construction.', 130),
  ('trade_contractor', 'Trade contractor', null, 'primary', 'Specialty trade contractors.', 140),
  ('specialty_subcontractor', 'Specialty subcontractor', 'trade_contractor', 'secondary', 'Framing, drywall, concrete, and similar trade specialists.', 150),
  ('agency_consulting', 'Agency / consulting', null, 'primary', 'Agency and consulting businesses.', 160),
  ('marketing_agency', 'Marketing agency', 'agency_consulting', 'secondary', 'Marketing and creative agency work.', 170),
  ('ops_consulting', 'Operations consulting', 'agency_consulting', 'secondary', 'Operations and process advisory work.', 180),
  ('manufacturing', 'Manufacturing', null, 'primary', 'Production-based manufacturing businesses.', 190),
  ('job_shop_manufacturing', 'Job shop manufacturing', 'manufacturing', 'secondary', 'High-mix, low-volume production shops.', 200),
  ('distribution', 'Distribution', null, 'primary', 'Wholesale and distribution businesses.', 210),
  ('wholesale_distribution', 'Wholesale distribution', 'distribution', 'secondary', 'Inventory and warehouse-led wholesale operations.', 220),
  ('retail_local_service', 'Retail / local service', null, 'primary', 'Storefront and local service businesses.', 230),
  ('auto_service', 'Auto service', 'retail_local_service', 'secondary', 'Automotive and repair service operations.', 240),
  ('professional_service', 'Professional service', null, 'primary', 'Professional-service firms and practices.', 250),
  ('medical_practice', 'Medical practice', 'professional_service', 'secondary', 'Clinic and medical-practice operations.', 260),
  ('other', 'Other', null, 'primary', 'Fallback category for unclassified businesses.', 999)
on conflict (slug) do update
set
  label = excluded.label,
  parent_slug = excluded.parent_slug,
  classification_level = excluded.classification_level,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.oc_business_models (slug, label, description, sort_order)
values
  ('project_based', 'Project-based', 'Revenue is earned one project or job at a time.', 10),
  ('recurring_revenue', 'Recurring revenue', 'Revenue repeats through contracts, retainers, or maintenance.', 20),
  ('quote_heavy', 'Quote-heavy', 'Estimating and quoting are a major part of the workflow.', 30),
  ('route_heavy', 'Route-heavy', 'Scheduling, routes, and stop density drive the day.', 40),
  ('inventory_heavy', 'Inventory-heavy', 'Inventory flow and stock position matter materially.', 50),
  ('labor_heavy', 'Labor-heavy', 'Crew utilization and labor management dominate performance.', 60),
  ('owner_led', 'Owner-led', 'A large share of decision-making still sits with the owner.', 70),
  ('field_service', 'Field service', 'Execution depends on technicians or crews in the field.', 80),
  ('office_and_field', 'Office + field', 'Both office coordination and field execution matter.', 90),
  ('transactional', 'Transactional', 'Work is mostly handled as repeated one-off transactions.', 100),
  ('production_based', 'Production-based', 'Throughput and production flow matter most.', 110)
on conflict (slug) do update
set
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.oc_symptom_tags (slug, label, description, sort_order)
values
  ('low_win_rate', 'Low win rate', 'The business is quoting or selling but converting too little.', 10),
  ('busy_but_unprofitable', 'Busy but unprofitable', 'The company is busy but not seeing healthy margin.', 20),
  ('owner_bottleneck', 'Owner bottleneck', 'Too much still depends on the owner.', 30),
  ('scheduling_chaos', 'Scheduling chaos', 'The schedule is reactive, unstable, or constantly changing.', 40),
  ('cash_flow_pressure', 'Cash flow pressure', 'Cash timing and collections are under pressure.', 50),
  ('backlog_instability', 'Backlog instability', 'Backlog or pipeline is too lumpy to plan confidently.', 60),
  ('low_visibility', 'Low visibility', 'The business lacks reliable operating visibility.', 70),
  ('rework', 'Rework', 'Mistakes, callbacks, or restarts are happening too often.', 80),
  ('slow_collections', 'Slow collections', 'Receivables and collections are moving too slowly.', 90),
  ('team_dependency', 'Team dependency', 'A few people carry too much operational load.', 100),
  ('underpriced_work', 'Underpriced work', 'The business is winning or doing work at weak prices.', 110),
  ('inconsistent_follow_through', 'Inconsistent follow-through', 'Tasks and commitments are not sticking.', 120),
  ('weak_handoff', 'Weak handoff', 'Critical information is getting lost between stages or teams.', 130),
  ('capacity_constraint', 'Capacity constrained', 'Demand outpaces available labor or throughput.', 140),
  ('demand_uncertainty', 'Demand uncertainty', 'Lead flow or demand is too unpredictable.', 150),
  ('scope_creep', 'Scope creep', 'Work expands beyond the original scope too often.', 160),
  ('margin_leak', 'Margin leak', 'Margin is eroding through misses, leakage, or cost drift.', 170),
  ('dispatch_noise', 'Dispatch noise', 'Dispatch and routing changes create daily noise.', 180),
  ('no_kpi_discipline', 'Weak KPI discipline', 'The business is not operating from a stable scorecard.', 190),
  ('sales_pipeline_gap', 'Sales pipeline gap', 'The business has a weak or inconsistent qualified pipeline.', 200)
on conflict (slug) do update
set
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.oc_cause_tags (slug, label, description, sort_order)
values
  ('poor_bid_selection', 'Poor bid selection', 'The team is bidding or chasing the wrong work.', 10),
  ('weak_scope_alignment', 'Weak scope alignment', 'Scope is not getting aligned across sales and delivery.', 20),
  ('pricing_visibility_gap', 'Pricing visibility gap', 'The business lacks real pricing and margin visibility.', 30),
  ('owner_centralized_decisions', 'Owner-centralized decisions', 'Decision rights remain too centralized around the owner.', 40),
  ('no_capacity_planning', 'No capacity planning', 'Labor and demand are not being planned in a stable way.', 50),
  ('weak_dispatch_system', 'Weak dispatch system', 'Dispatching is too manual or fragmented.', 60),
  ('poor_job_costing', 'Poor job costing', 'Actual performance is not being compared to estimates.', 70),
  ('inconsistent_process_adherence', 'Inconsistent process adherence', 'Processes exist but are not consistently followed.', 80),
  ('unclear_roles', 'Unclear roles', 'Ownership and responsibilities are not clear enough.', 90),
  ('missing_forecasting', 'Missing forecasting', 'The business cannot look ahead with enough clarity.', 100),
  ('fragmented_tooling', 'Fragmented tooling', 'Information is scattered across too many disconnected tools.', 110),
  ('weak_metric_discipline', 'Weak metric discipline', 'Leadership is not running the business from clear metrics.', 120),
  ('reactive_firefighting', 'Reactive firefighting', 'The operating cadence is dominated by urgent reactions.', 130),
  ('labor_mismatch', 'Labor mismatch', 'The labor mix or skill mix does not match demand well.', 140),
  ('weak_sales_qualification', 'Weak sales qualification', 'Sales is spending time on low-fit work.', 150),
  ('no_standard_operating_rhythm', 'No standard operating rhythm', 'There is no stable review and decision cadence.', 160),
  ('weak_cash_collection_process', 'Weak cash collection process', 'Collections and invoice follow-up lack structure.', 170)
on conflict (slug) do update
set
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.oc_operating_archetypes (slug, label, description)
values
  ('busy_but_blind', 'Busy but blind', 'The business is active, but visibility and operating control are weak.'),
  ('growing_but_owner_locked', 'Growing but owner locked', 'Demand is present, but the owner remains the bottleneck.'),
  ('selling_but_underpricing', 'Selling but underpricing', 'The company can win work, but pricing quality is weak.'),
  ('chaotic_execution', 'Chaotic execution', 'Execution is noisy, reactive, and hard to stabilize.'),
  ('kpi_weak_but_stable', 'KPI weak but stable', 'The core business is relatively stable, but metrics discipline is light.'),
  ('demand_rich_capacity_constrained', 'Demand rich, capacity constrained', 'Demand is healthy, but labor or throughput is limiting performance.'),
  ('profitable_core_weak_growth_engine', 'Profitable core, weak growth engine', 'The business has a healthy core but weak demand or growth consistency.')
on conflict (slug) do update
set
  label = excluded.label,
  description = excluded.description;

insert into public.oc_recommendation_library (
  id,
  slug,
  title,
  category,
  description,
  applies_to_business_types,
  addresses_symptoms,
  related_causes,
  expected_impact,
  difficulty_level,
  time_horizon
)
values
  ('create_gc_pick_rule', 'create_gc_pick_rule', 'Create a go / no-go job selection rule', 'sales', 'Define a short qualification rule so the team stops pursuing jobs that do not fit margin, scope, or capacity.', array['general_contractor', 'trade_contractor', 'steel_fabrication', 'manufacturing', 'agency_consulting']::text[], array['low_win_rate', 'busy_but_unprofitable', 'backlog_instability']::text[], array['poor_bid_selection', 'weak_sales_qualification']::text[], 'Higher hit rate and fewer low-fit jobs', 'medium', '2-4 weeks'),
  ('standardize_scope_sheet', 'standardize_scope_sheet', 'Standardize the scope sheet and handoff packet', 'delivery', 'Use a shared scope capture template so sales, operations, and field teams start with the same job assumptions.', array['general_contractor', 'trade_contractor', 'hvac', 'steel_fabrication', 'agency_consulting']::text[], array['weak_handoff', 'scope_creep', 'rework']::text[], array['weak_scope_alignment', 'unclear_roles']::text[], 'Fewer surprises and cleaner project starts', 'medium', '1-3 weeks'),
  ('track_hit_rate_by_scope', 'track_hit_rate_by_scope', 'Track hit rate by scope and customer type', 'sales', 'Segment wins and losses by work type so pricing and qualification decisions can improve over time.', array['general_contractor', 'trade_contractor', 'agency_consulting', 'professional_service', 'steel_fabrication']::text[], array['low_win_rate', 'sales_pipeline_gap']::text[], array['poor_bid_selection', 'weak_sales_qualification']::text[], 'Clearer targeting and better quoting decisions', 'medium', '2-6 weeks'),
  ('implement_job_costing_review', 'implement_job_costing_review', 'Implement a weekly job costing review', 'margin', 'Compare estimate versus actual labor, material, and change-order performance on active jobs.', array['steel_fabrication', 'manufacturing', 'general_contractor', 'trade_contractor', 'hvac']::text[], array['busy_but_unprofitable', 'margin_leak', 'underpriced_work']::text[], array['pricing_visibility_gap', 'poor_job_costing']::text[], 'Faster margin corrections and better pricing visibility', 'medium', '1-4 weeks'),
  ('build_owner_handoff_lane', 'build_owner_handoff_lane', 'Build an owner handoff lane', 'leadership', 'Define which decisions must stay with the owner and which can move to the team with clear rules.', array['hvac', 'landscaping', 'commercial_cleaning', 'agency_consulting', 'professional_service', 'trade_contractor']::text[], array['owner_bottleneck', 'team_dependency', 'inconsistent_follow_through']::text[], array['owner_centralized_decisions', 'unclear_roles']::text[], 'More delegation without losing control', 'high', '3-8 weeks'),
  ('set_weekly_capacity_planning', 'set_weekly_capacity_planning', 'Set a weekly capacity planning cadence', 'operations', 'Review demand, labor, and schedule loading every week before the work becomes a fire drill.', array['hvac', 'landscaping', 'commercial_cleaning', 'trucking_logistics', 'general_contractor', 'trade_contractor']::text[], array['capacity_constraint', 'scheduling_chaos', 'backlog_instability']::text[], array['no_capacity_planning', 'missing_forecasting']::text[], 'Better crew loading and fewer emergency reschedules', 'medium', '1-2 weeks'),
  ('launch_dispatch_board', 'launch_dispatch_board', 'Launch a simple dispatch board', 'operations', 'Use one shared board for routes, appointments, crew status, and schedule changes.', array['trucking_logistics', 'hvac', 'landscaping', 'commercial_cleaning']::text[], array['dispatch_noise', 'scheduling_chaos', 'low_visibility']::text[], array['weak_dispatch_system', 'fragmented_tooling']::text[], 'Less routing chaos and clearer daily execution', 'low', '1-2 weeks'),
  ('create_margin_guardrails', 'create_margin_guardrails', 'Create pricing and margin guardrails', 'margin', 'Set floor rules for gross margin, labor assumptions, and change-order triggers before work is quoted.', array['general_contractor', 'trade_contractor', 'hvac', 'steel_fabrication', 'professional_service']::text[], array['underpriced_work', 'busy_but_unprofitable', 'margin_leak']::text[], array['pricing_visibility_gap', 'poor_job_costing']::text[], 'Fewer low-margin jobs and faster pricing decisions', 'medium', '1-3 weeks'),
  ('define_role_scoreboards', 'define_role_scoreboards', 'Define role scoreboards', 'management', 'Give each core role a few measurable outcomes so coaching and accountability can happen on facts instead of memory.', array['agency_consulting', 'professional_service', 'hvac', 'commercial_cleaning', 'landscaping', 'manufacturing']::text[], array['team_dependency', 'no_kpi_discipline', 'inconsistent_follow_through']::text[], array['unclear_roles', 'weak_metric_discipline']::text[], 'Clearer accountability and better day-to-day follow-through', 'medium', '2-4 weeks'),
  ('standardize_closeout_checklist', 'standardize_closeout_checklist', 'Standardize the closeout checklist', 'delivery', 'Use one end-of-job checklist for documentation, billing, punch items, and customer communication.', array['general_contractor', 'trade_contractor', 'hvac', 'steel_fabrication', 'professional_service']::text[], array['rework', 'weak_handoff', 'slow_collections']::text[], array['inconsistent_process_adherence', 'weak_scope_alignment']::text[], 'Cleaner finish, faster billing, fewer dropped details', 'low', '1-2 weeks'),
  ('set_collections_cadence', 'set_collections_cadence', 'Set a collections cadence', 'cash', 'Create a recurring invoice follow-up routine with named ownership and aging thresholds.', array['general_contractor', 'trade_contractor', 'professional_service', 'commercial_cleaning', 'distribution']::text[], array['cash_flow_pressure', 'slow_collections']::text[], array['weak_cash_collection_process', 'unclear_roles']::text[], 'Faster cash conversion and fewer aged receivables', 'low', '1-2 weeks'),
  ('install_daily_flash_kpis', 'install_daily_flash_kpis', 'Install a daily flash KPI sheet', 'visibility', 'Track a short daily scorecard for schedule health, capacity, cash, and margin signals.', array['hvac', 'landscaping', 'commercial_cleaning', 'manufacturing', 'distribution', 'trucking_logistics']::text[], array['low_visibility', 'no_kpi_discipline', 'busy_but_unprofitable']::text[], array['weak_metric_discipline', 'fragmented_tooling']::text[], 'Faster visibility and fewer surprises', 'low', '1-2 weeks'),
  ('segment_customers_by_fit', 'segment_customers_by_fit', 'Segment customers by fit and profitability', 'strategy', 'Separate strong-fit work from distracting work so sales and operations can focus on the healthiest part of the business.', array['agency_consulting', 'professional_service', 'general_contractor', 'trade_contractor', 'distribution']::text[], array['busy_but_unprofitable', 'demand_uncertainty', 'backlog_instability']::text[], array['poor_bid_selection', 'weak_sales_qualification']::text[], 'Cleaner growth choices and healthier delivery mix', 'medium', '2-6 weeks')
on conflict (id) do update
set
  slug = excluded.slug,
  title = excluded.title,
  category = excluded.category,
  description = excluded.description,
  applies_to_business_types = excluded.applies_to_business_types,
  addresses_symptoms = excluded.addresses_symptoms,
  related_causes = excluded.related_causes,
  expected_impact = excluded.expected_impact,
  difficulty_level = excluded.difficulty_level,
  time_horizon = excluded.time_horizon;

create or replace view public.oc_benchmark_session_facts as
select
  s.id as session_id,
  s.client_session_id,
  s.created_at,
  s.completed_at,
  s.completion_status,
  s.contact_submitted,
  s.source,
  s.channel,
  s.assessment_score,
  s.context_score,
  s.confidence_label,
  s.confidence_value,
  s.extraction_confidence,
  s.low_confidence,
  f.primary_business_type,
  f.secondary_business_type,
  f.sub_industry,
  f.business_model,
  f.business_model_tags,
  f.size_band,
  f.team_structure,
  f.operational_complexity,
  f.primary_problem,
  f.secondary_problem,
  f.urgency_level,
  f.clarity_level,
  f.operating_archetype,
  f.benchmark_segment,
  f.benchmark_ready
from public.oc_sessions s
left join public.oc_session_features f
  on f.session_id = s.id;

create or replace view public.oc_benchmark_business_type_summary as
select
  coalesce(primary_business_type, 'other') as primary_business_type,
  count(*) as session_count,
  count(*) filter (where completion_status in ('completed', 'contact_submitted')) as completed_session_count,
  round(
    100.0 * count(*) filter (where completion_status in ('completed', 'contact_submitted')) / nullif(count(*), 0),
    2
  ) as completion_rate_pct,
  round(avg(assessment_score)::numeric, 2) as avg_assessment_score,
  round(avg(context_score)::numeric, 2) as avg_context_score,
  round(avg(confidence_value)::numeric, 2) as avg_confidence_value,
  round(avg(extraction_confidence)::numeric, 2) as avg_extraction_confidence
from public.oc_benchmark_session_facts
group by coalesce(primary_business_type, 'other');

create or replace view public.oc_benchmark_symptom_frequency as
select
  coalesce(f.primary_business_type, 'other') as primary_business_type,
  t.symptom_slug,
  count(*) as session_count
from public.oc_session_symptom_tags t
join public.oc_session_features f
  on f.session_id = t.session_id
group by coalesce(f.primary_business_type, 'other'), t.symptom_slug;

create or replace view public.oc_benchmark_cause_frequency as
select
  coalesce(f.primary_business_type, 'other') as primary_business_type,
  t.cause_slug,
  count(*) as session_count
from public.oc_session_cause_tags t
join public.oc_session_features f
  on f.session_id = t.session_id
group by coalesce(f.primary_business_type, 'other'), t.cause_slug;

create or replace view public.oc_benchmark_recommendation_frequency as
select
  coalesce(f.primary_business_type, 'other') as primary_business_type,
  r.recommendation_id,
  count(*) as session_count
from public.oc_session_recommendations r
join public.oc_session_features f
  on f.session_id = r.session_id
group by coalesce(f.primary_business_type, 'other'), r.recommendation_id;

create or replace view public.oc_benchmark_score_distribution as
select
  coalesce(primary_business_type, 'other') as primary_business_type,
  width_bucket(least(greatest(coalesce(assessment_score, 0), 0), 99), 0, 100, 10) as score_band,
  count(*) as session_count
from public.oc_benchmark_session_facts
where assessment_score is not null
group by coalesce(primary_business_type, 'other'), width_bucket(least(greatest(coalesce(assessment_score, 0), 0), 99), 0, 100, 10);

create or replace view public.oc_product_learning_summary as
select
  completion_status,
  last_completed_step,
  drop_off_step,
  count(*) as session_count,
  round(avg(case when low_confidence then 1 else 0 end)::numeric, 2) as low_confidence_rate,
  round(avg(extraction_confidence)::numeric, 2) as avg_extraction_confidence,
  round(avg(jsonb_array_length(question_sequence))::numeric, 2) as avg_question_count
from public.oc_sessions
group by completion_status, last_completed_step, drop_off_step;
