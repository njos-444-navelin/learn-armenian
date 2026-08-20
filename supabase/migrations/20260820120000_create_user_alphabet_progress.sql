-- Tracks a signed-in user's mastery level (0-10) per Armenian alphabet
-- letter. A letter only gets a row here once the user has answered at
-- least one drill question on it — an id with no row is still level 0
-- ("unmet"), matching the same "no stored row = default state" convention
-- as user_vocabulary_progress/NEW_CARD.
create table public.user_alphabet_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  letter_id text not null,
  level smallint not null default 0 check (level between 0 and 10),
  updated_at timestamptz not null default now(),
  primary key (user_id, letter_id)
);

alter table public.user_alphabet_progress enable row level security;

-- user_id is the leading column of the primary key, so the by-user lookup
-- the trainer's load does (all 39 letters' levels for one user, no
-- due-date filter) already has index support — no separate index needed,
-- same reasoning as user_preferences.

create policy "Users can view their own alphabet progress"
  on public.user_alphabet_progress
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can record their own alphabet progress"
  on public.user_alphabet_progress
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own alphabet progress"
  on public.user_alphabet_progress
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- RLS policies alone don't grant table-level privileges — see
-- 20260816121000_grant_authenticated_access_to_vocabulary_tables.sql for
-- the bug this caused the first time it was missed. Grant every operation
-- a policy above allows, in this same migration.
grant select, insert, update on public.user_alphabet_progress to authenticated;
