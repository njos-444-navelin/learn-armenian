-- Tracks a signed-in user's chosen UI language (see src/lib/i18n/locale.ts
-- for the set of supported locales). Written whenever the user picks a
-- language on the home screen or switches via the user menu, and read on
-- landing at "/" so a returning user who has ever made this choice skips
-- straight to their lessons instead of being asked again.
create table public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  preferred_locale text not null check (preferred_locale in ('en', 'ru')),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

-- user_id is the primary key, so its index already supports the by-user
-- lookup done on every home page load — no separate index needed.

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

-- RLS policies alone don't grant access — see
-- 20260816121000_grant_authenticated_access_to_vocabulary_tables.sql for the
-- bug this caused the first time it was missed. Grant every operation a
-- policy above allows, in this same migration.
grant select, insert, update on public.user_preferences to authenticated;
