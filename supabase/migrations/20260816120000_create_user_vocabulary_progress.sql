-- Tracks a signed-in user's spaced-repetition progress on individual
-- vocabulary words (see src/lib/srs/scheduler.ts for the scheduling logic
-- that produces these column values from a grade). A word only gets a row
-- here once the user has graded it at least once through the trainer — a
-- (deck_id, word_id) pair with no row is still a "new" card, so this table
-- only ever holds words the learner has actually studied, not every word in
-- every deck they've added to their collection.
create table public.user_vocabulary_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  deck_id text not null,
  word_id text not null,
  phase text not null check (phase in ('learning', 'relearning', 'review')),
  step smallint not null default 0,
  interval_days real not null default 0,
  ease_factor real not null default 2.5,
  due_at timestamptz not null,
  reps integer not null default 0,
  lapses integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, deck_id, word_id)
);

alter table public.user_vocabulary_progress enable row level security;

-- Loading a training session scans every one of a user's due/new cards
-- filtered by due_at — this index supports that without a full-table sort.
-- (user_id, deck_id, word_id) is the primary key, so lookups scoped to a
-- single deck already have index support without a separate index.
create index user_vocabulary_progress_due_idx
  on public.user_vocabulary_progress (user_id, due_at);

create policy "Users can view their own review progress"
  on public.user_vocabulary_progress
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can record their own review progress"
  on public.user_vocabulary_progress
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own review progress"
  on public.user_vocabulary_progress
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
