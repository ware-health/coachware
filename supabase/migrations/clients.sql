-- Create clients table to manage client entities
create table if not exists public.clients (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- If signup_at existed before, drop it (safe no-op if absent)
alter table if exists public.clients
  drop column if exists signup_at;

-- Seed example client (safe to run repeatedly)
insert into public.clients (id, email, name)
values (
  'ed247159-3899-414e-8c6e-858bb6e6407d',
  'uchoge2@gmail.com',
  'Oluchi Isiuwe'
)
on conflict (id) do nothing;



