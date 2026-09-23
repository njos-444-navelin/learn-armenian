-- Lets a user clear their own SRS progress, so removing a deck also wipes its
-- per-word progress and re-adding it starts fresh. The RLS policy needs the
-- table-level GRANT alongside it.
create policy "Users can delete their own review progress"
  on public.user_vocabulary_progress
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant delete on public.user_vocabulary_progress to authenticated;
