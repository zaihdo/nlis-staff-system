create table if not exists public.availability (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  day text not null check (day in ('Monday','Tuesday','Wednesday','Thursday','Friday')),
  slot text not null,
  color text not null default '#4F46E5',
  created_at timestamptz not null default now(),
  unique (name, day, slot)
);

alter table public.availability enable row level security;

create policy "Allow public read access"
on public.availability for select
using (true);

create policy "Allow public insert access"
on public.availability for insert
with check (true);

create policy "Allow public update access"
on public.availability for update
using (true)
with check (true);

create policy "Allow public delete access"
on public.availability for delete
using (true);
