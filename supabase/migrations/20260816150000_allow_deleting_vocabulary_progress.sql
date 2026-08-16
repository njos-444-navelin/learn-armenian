-- Lets a signed-in user clear their own SRS progress rows, needed so
-- removing a deck from the collection (see removeFromCollection in
-- [deckId]/+page.server.ts) can also wipe that deck's per-word progress —
-- otherwise re-adding a removed deck would resurrect old due dates instead
-- of starting the deck fresh. Same lesson as the earlier vocabulary
-- migrations: the RLS policy alone doesn't grant access, the table-level
-- GRANT is required too.
create policy "Users can delete their own review progress"
  on public.user_vocabulary_progress
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant delete on public.user_vocabulary_progress to authenticated;
