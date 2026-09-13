-- Lets a signed-in user take a dialogue back out of their "done" list — the
-- player's "Already done" button opens a confirm that posts the page's
-- `uncomplete` action (see [dialogueId]/+page.server.ts), which deletes the
-- row outright: "no row = not completed" is this table's whole convention
-- (see 20260908120000_create_user_dialogue_progress.sql), so there's no
-- flag to flip. Same lesson as the vocabulary migrations: the RLS policy
-- alone doesn't grant access, the table-level GRANT is required too.
create policy "Users can delete their own dialogue progress"
  on public.user_dialogue_progress
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant delete on public.user_dialogue_progress to authenticated;
