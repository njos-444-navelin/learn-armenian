-- Which dialogues a user has finished. No row means not completed yet, the
-- same convention as the other progress tables. Re-completing bumps
-- `completions` rather than adding a row, so "N of M" is just a row count.
create table public.user_dialogue_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  dialogue_id text not null,
  completed_at timestamptz not null default now(),
  completions integer not null default 1 check (completions >= 1),
  primary key (user_id, dialogue_id)
);

alter table public.user_dialogue_progress enable row level security;

-- user_id leads the primary key, so both by-user lookups are covered.

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

-- RLS policies alone don't grant table-level privileges. Grant every operation
-- a policy above allows, in this same migration.
grant select, insert, update on public.user_dialogue_progress to authenticated;
