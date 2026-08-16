-- Lets a signed-in user remove a deck from their own collection (the
-- confirm-modal "Remove" flow in [deckId]/+page.svelte). Mirrors the two
-- earlier vocabulary migrations: an RLS policy alone isn't enough, table-
-- level privileges must be granted too (see
-- grant_authenticated_access_to_vocabulary_tables.sql for the bug this
-- exact omission caused last time).
create policy "Users can remove decks from their own collection"
  on public.user_vocabulary_decks
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant delete on public.user_vocabulary_decks to authenticated;
