-- Tracks which dialogues a signed-in user has finished. A dialogue only gets
-- a row here once the user taps "mark it done" at the end of it — an id with
-- no row is simply not completed yet, matching the "no stored row = default
-- state" convention of user_alphabet_progress/user_vocabulary_progress.
-- Re-completing a dialogue bumps `completions` and refreshes `completed_at`
-- rather than adding a second row, so the account dashboard's "N of M
-- completed" count is just a row count.
create table public.user_dialogue_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  dialogue_id text not null,
  completed_at timestamptz not null default now(),
  completions integer not null default 1 check (completions >= 1),
  primary key (user_id, dialogue_id)
);

alter table public.user_dialogue_progress enable row level security;

-- user_id leads the primary key, so the by-user lookups (all of a user's
-- completed dialogues; one dialogue for one user) already have index
-- support — same reasoning as user_alphabet_progress.

create policy "Users can view their own dialogue progress"
  on public.user_dialogue_progress
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can record their own dialogue progress"
  on public.user_dialogue_progress
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own dialogue progress"
  on public.user_dialogue_progress
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- RLS policies alone don't grant table-level privileges — see
-- 20260816121000_grant_authenticated_access_to_vocabulary_tables.sql for
-- the bug this caused the first time it was missed. Grant every operation
-- a policy above allows, in this same migration.
grant select, insert, update on public.user_dialogue_progress to authenticated;
