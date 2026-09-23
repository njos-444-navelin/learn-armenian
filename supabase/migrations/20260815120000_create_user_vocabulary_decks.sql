-- Which vocabulary decks a user has added to their collection. Deck content
-- lives in code; this records only the choice, keyed by the deck's string id.
create table public.user_vocabulary_decks (
  user_id uuid not null references auth.users (id) on delete cascade,
  deck_id text not null,
  added_at timestamptz not null default now(),
  primary key (user_id, deck_id)
);

alter table public.user_vocabulary_decks enable row level security;

-- The primary key's index already covers lookups by user_id alone.

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
