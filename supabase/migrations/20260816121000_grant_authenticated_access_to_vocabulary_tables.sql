-- RLS policies alone don't grant access — Postgres still checks table-level
-- privileges first. Both user_vocabulary_decks and user_vocabulary_progress
-- were created without an explicit GRANT to `authenticated`, which meant
-- every read/write from the app failed with "permission denied for table"
-- regardless of the RLS policies being correct (caught via live testing of
-- the "Add to my collection" button — this was the actual cause of it
-- silently doing nothing).
grant select, insert on public.user_vocabulary_decks to authenticated;
grant select, insert, update on public.user_vocabulary_progress to authenticated;
