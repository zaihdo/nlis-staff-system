create table if not exists public.users (
  id uuid not null default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  color text not null default '#4F46E5',
  created_at timestamptz not null default now(),
  unique (first_name, last_name)
);

insert into public.users (first_name, last_name, color)
values
  ('Zaidh', 'Imran', '#007AFF'),
  ('Mohamed', 'Abdallah', '#34C759'),
  ('Mohamed', 'Ameen', '#FF3B30'),
  ('Mohamed', 'Asif', '#AF52DE'),
  ('Ahmed', 'Elbanna', '#FF9500'),
  ('Abderrahmane', 'Allouache', '#00C7BE'),
  ('Ahmed', 'Fekry', '#FF2D55'),
  ('Fazal', 'Rahman', '#30D158'),
  ('Mohamed', 'El Kady', '#FFB000'),
  ('Ibrahim', 'Alnahhal', '#5AC8FA')
on conflict (first_name, last_name) do nothing;

create table if not exists public.availability (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  date text not null,
  hour int not null check (hour between 0 and 23),
  color text not null default '#4F46E5',
  created_at timestamptz not null default now(),
  unique (name, date, hour)
);

grant usage on schema public to anon;
grant all on table public.users to anon;
grant all on table public.availability to anon;

alter table public.availability enable row level security;
alter table public.users enable row level security;

drop policy if exists "Allow public read access" on public.availability;
drop policy if exists "Allow public insert access" on public.availability;
drop policy if exists "Allow public update access" on public.availability;
drop policy if exists "Allow public delete access" on public.availability;
drop policy if exists "Allow public users read access" on public.users;
drop policy if exists "Allow public users write access" on public.users;

create policy "Allow public users read access"
on public.users for select
using (true);

create policy "Allow public users write access"
on public.users for all
using (true)
with check (true);

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
