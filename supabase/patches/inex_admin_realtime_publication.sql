-- Apply in Supabase after the metadata patch; only collection names and counters are replicated.
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='inex_collection_revisions') then
  alter publication supabase_realtime add table public.inex_collection_revisions;
 end if;
end $$;
