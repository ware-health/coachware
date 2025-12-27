-- Create client_plans relationship table
create table if not exists public.client_plans (
  id uuid default gen_random_uuid() primary key,
  clientId text not null,
  planId uuid not null references public.routine_plans(id) on delete cascade,
  owner uuid not null references auth.users(id) on delete cascade,
  createdAt timestamptz default now()
);

-- Enforce one link per client/plan/owner
create unique index if not exists client_plans_client_plan_owner_uq
  on public.client_plans (clientId, planId, owner);

-- Helpful indexes
create index if not exists client_plans_owner_idx on public.client_plans (owner);
create index if not exists client_plans_client_idx on public.client_plans (clientId);
create index if not exists client_plans_plan_idx on public.client_plans (planId);


