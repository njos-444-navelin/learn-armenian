-- Mastery level (0-10) per letter. An id with no row is level 0 ("unmet"), the
-- same "no row = default state" convention as user_vocabulary_progress.
create table public.user_alphabet_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  letter_id text not null,
  level smallint not null default 0 check (level between 0 and 10),
  updated_at timestamptz not null default now(),
  primary key (user_id, letter_id)
);

alter table public.user_alphabet_progress enable row level security;

-- user_id leads the primary key, so the trainer's by-user lookup is covered.

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

-- RLS policies alone don't grant table-level privileges. Grant every operation
-- a policy above allows, in this same migration.
grant select, insert, update on public.user_alphabet_progress to authenticated;
