-- Lets a user take a dialogue back out of their "done" list. The row is
-- deleted outright, since "no row = not completed" is this table's convention.
-- The RLS policy needs the table-level GRANT alongside it.
create policy "Users can delete their own dialogue progress"
  on public.user_dialogue_progress
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant delete on public.user_dialogue_progress to authenticated;
