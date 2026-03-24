create table if not exists public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  age integer not null check (age > 0),
  document_number text not null unique,
  email text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pressure_records (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  record_date date not null,
  record_time time not null,
  ta_systolic integer not null check (ta_systolic between 50 and 300),
  ta_diastolic integer not null check (ta_diastolic between 30 and 200),
  heart_rate integer not null check (heart_rate between 20 and 260),
  position text not null,
  observations text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists pressure_records_user_id_idx
  on public.pressure_records (user_id, record_date desc, record_time desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (
    id,
    first_name,
    last_name,
    age,
    document_number,
    email
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce((new.raw_user_meta_data->>'age')::integer, 0),
    coalesce(new.raw_user_meta_data->>'document_number', ''),
    coalesce(new.raw_user_meta_data->>'email', new.email, '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.user_profiles enable row level security;
alter table public.pressure_records enable row level security;

drop policy if exists "Users can read own profile" on public.user_profiles;
drop policy if exists "Users can insert own profile" on public.user_profiles;
drop policy if exists "Users can update own profile" on public.user_profiles;
drop policy if exists "Users can read own records" on public.pressure_records;
drop policy if exists "Users can insert own records" on public.pressure_records;
drop policy if exists "Users can update own records" on public.pressure_records;
drop policy if exists "Users can delete own records" on public.pressure_records;

create policy "Users can read own profile"
  on public.user_profiles for select to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.user_profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.user_profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can read own records"
  on public.pressure_records for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own records"
  on public.pressure_records for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own records"
  on public.pressure_records for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own records"
  on public.pressure_records for delete to authenticated
  using (auth.uid() = user_id);
