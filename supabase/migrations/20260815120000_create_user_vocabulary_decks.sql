-- Tracks which vocabulary decks (see src/lib/content/vocabulary/catalog.ts)
-- a signed-in user has voluntarily added to their personal practice
-- collection. Deck content itself (words, translations) lives in code, not
-- here — this table only records the user's choice, keyed by the deck's
-- static string id. Adding is a one-way, explicit action (an "Add to my
-- collection" button); there is no automatic add.
create table public.user_vocabulary_decks (
  user_id uuid not null references auth.users (id) on delete cascade,
  deck_id text not null,
  added_at timestamptz not null default now(),
  primary key (user_id, deck_id)
);

alter table public.user_vocabulary_decks enable row level security;

-- (user_id, deck_id) is the primary key, so its index already supports
-- lookups filtered by user_id alone — no separate index needed.

create policy "Users can view their own added decks"
  on public.user_vocabulary_decks
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add decks to their own collection"
  on public.user_vocabulary_decks
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
