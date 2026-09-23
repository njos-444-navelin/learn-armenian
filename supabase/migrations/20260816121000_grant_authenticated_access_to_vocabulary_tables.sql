-- RLS policies alone don't grant access: Postgres checks table-level
-- privileges first. Both tables were created without a GRANT to
-- `authenticated`, so every read and write failed with "permission denied".
grant select, insert on public.user_vocabulary_decks to authenticated;
grant select, insert, update on public.user_vocabulary_progress to authenticated;
