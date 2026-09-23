-- A user's chosen UI language. Read on landing at "/", so a returning user who
-- has made the choice skips the picker.
create table public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  preferred_locale text not null check (preferred_locale in ('en', 'ru')),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

-- The primary key's index already covers the by-user lookup.

create policy "Users can view their own preferences"
  on public.user_preferences
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can set their own preferences"
  on public.user_preferences
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own preferences"
  on public.user_preferences
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- RLS policies alone don't grant access. Grant every operation a policy above
-- allows, in this same migration.
grant select, insert, update on public.user_preferences to authenticated;
