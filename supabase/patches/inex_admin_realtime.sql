-- Additive server-only change metadata. No document contents are published.
create table if not exists public.inex_collection_revisions(collection_id text primary key,revision bigint not null default 1,changed_at timestamptz not null default now());
alter table public.inex_collection_revisions enable row level security;
revoke all on public.inex_collection_revisions from public,anon,authenticated;
grant select,insert,update on public.inex_collection_revisions to service_role;
drop policy if exists inex_revisions_deny on public.inex_collection_revisions;
create policy inex_revisions_deny on public.inex_collection_revisions for all to anon,authenticated using(false) with check(false);
insert into public.inex_collection_revisions(collection_id) select distinct collection_id from public.inex_documents on conflict do nothing;
create or replace function inex_private.track_collection_revision() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 insert into public.inex_collection_revisions as r(collection_id,revision,changed_at) values(coalesce(new.collection_id,old.collection_id),1,clock_timestamp()) on conflict(collection_id) do update set revision=r.revision+1,changed_at=excluded.changed_at;
 return null;
end;
$$;
revoke all on function inex_private.track_collection_revision() from public,anon,authenticated;
grant execute on function inex_private.track_collection_revision() to service_role;
drop trigger if exists inex_revision_changed on public.inex_documents;
create trigger inex_revision_changed after insert or update or delete on public.inex_documents for each row execute function inex_private.track_collection_revision();
create or replace function public.inex_revision_snapshot() returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_object_agg(collection_id,revision::text),'{}'::jsonb) from public.inex_collection_revisions;
$$;
revoke all on function public.inex_revision_snapshot() from public,anon,authenticated;
grant execute on function public.inex_revision_snapshot() to service_role;
-- Existing equal/contains predicates remain the authority; containment only prunes candidates.
create or replace function public.inex_scan_collection(p_collection text,p_filters jsonb default '[]',p_after text default '',p_limit integer default 500)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare filter_value jsonb;parts text[];i integer;prefilter jsonb:='{}';piece jsonb;
begin
 if jsonb_typeof(p_filters)<>'array' or jsonb_array_length(p_filters)>20 then raise exception 'Invalid filters';end if;
 if exists(select 1 from jsonb_array_elements(p_filters) x where x->>'op' not in ('==','array-contains') or coalesce(x->>'field','')='') then raise exception 'Invalid operator';end if;
 for filter_value in select * from jsonb_array_elements(p_filters) loop
  if not(filter_value?'value') then return '[]'::jsonb;end if;
  if strpos(filter_value->>'field','.')>0 then continue;end if;
  parts:=string_to_array(filter_value->>'field','.');piece:=case when filter_value->>'op'='array-contains' then jsonb_build_array(filter_value->'value') else filter_value->'value' end;
  for i in reverse array_length(parts,1)..1 loop piece:=jsonb_build_object(parts[i],piece);end loop;
  prefilter:=inex_private.deep_merge(prefilter,piece);
 end loop;
 return(select coalesce(jsonb_agg(jsonb_build_object('id',d.document_id,'data',d.data,'version',d.version) order by d.document_id),'[]'::jsonb) from(
 select t.document_id,t.data,t.version from public.inex_documents t where collection_id=p_collection and not deleted and document_id>p_after and t.data @> prefilter
 and not exists(select 1 from jsonb_array_elements(p_filters) f where not coalesce(case when f->>'op'='==' then jsonb_extract_path(t.data,variadic string_to_array(f->>'field','.'))=f->'value' else jsonb_extract_path(t.data,variadic string_to_array(f->>'field','.')) @> jsonb_build_array(f->'value') end,false))
 order by document_id limit greatest(1,least(p_limit,500)))d);
end;
$$;
-- Both old GIN indexes had identical keys and predicates; retain inex_documents_data.
drop index if exists public.inex_documents_match;
create or replace function public.inex_user_by_email(p_email text) returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce((select data from public.inex_documents where collection_id='users' and not deleted and coalesce(data->>'email','')<>'' and lower(data->>'email')=lower(trim(p_email)) limit 1),'null'::jsonb);
$$;
revoke all on function public.inex_user_by_email(text) from public,anon,authenticated;
grant execute on function public.inex_user_by_email(text) to service_role;
analyze public.inex_documents;
notify pgrst,'reload schema';
