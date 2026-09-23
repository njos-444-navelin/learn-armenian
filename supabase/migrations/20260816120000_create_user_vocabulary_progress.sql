-- Per-word SRS progress; src/lib/srs/scheduler.ts produces these values from a
-- grade. A pair with no row is still a "new" card, so this only ever holds
-- words the learner has actually studied.
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

-- Supports the training session's due_at-filtered scan without a full sort.
-- Single-deck lookups are already covered by the primary key.
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
