-- Lets a user remove a deck from their own collection. An RLS policy isn't
-- enough on its own; the table-level GRANT is required too (see
-- grant_authenticated_access_to_vocabulary_tables.sql).
create policy "Users can remove decks from their own collection"
  on public.user_vocabulary_decks
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant delete on public.user_vocabulary_decks to authenticated;
