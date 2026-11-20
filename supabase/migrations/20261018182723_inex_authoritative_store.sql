-- iNEX compatibility store: one authoritative Postgres store for the existing domain APIs.
-- Apply only in the dedicated iNEX project. No data is deleted or imported by this schema.
create schema if not exists inex_private;
revoke all on schema inex_private from public, anon, authenticated;
grant usage on schema inex_private to service_role;
create table if not exists inex_private.store_guard (id integer primary key check(id=1));
insert into inex_private.store_guard(id) values(1) on conflict do nothing;
alter table inex_private.store_guard enable row level security;
grant select,update on inex_private.store_guard to service_role;
create table if not exists public.inex_documents (
 collection_id text not null check(length(collection_id) between 1 and 300),
 document_id text not null check(length(document_id) between 1 and 300),
 data jsonb not null default '{}'::jsonb check(jsonb_typeof(data)='object'),
 version bigint not null default 1 check(version>0),
 deleted boolean not null default false,
 updated_at timestamptz not null default now(),
 primary key(collection_id,document_id)
);
alter table public.inex_documents enable row level security;
revoke all on public.inex_documents from public,anon,authenticated;
grant select,insert,update,delete on public.inex_documents to service_role;
create index if not exists inex_documents_live on public.inex_documents(collection_id,document_id) where not deleted;
create index if not exists inex_documents_data on public.inex_documents using gin(data jsonb_path_ops) where not deleted;
create unique index if not exists inex_user_email on public.inex_documents(lower(data->>'email')) where collection_id='users' and not deleted and coalesce(data->>'email','')<>'';
create unique index if not exists inex_affiliate_user on public.inex_documents((data->>'userId')) where collection_id='affiliates' and not deleted and coalesce(data->>'userId','')<>'';
create unique index if not exists inex_affiliate_code on public.inex_documents((data->>'referralCode')) where collection_id='affiliates' and not deleted and coalesce(data->>'referralCode','')<>'';

create or replace function public.inex_get_document(p_collection text,p_id text)
returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce((select jsonb_build_object('data',case when deleted then null else data end,'version',version,'deleted',deleted) from public.inex_documents where collection_id=p_collection and document_id=p_id),'{"data":null,"version":0}'::jsonb);
$$;
create or replace function public.inex_scan_collection(p_collection text,p_filters jsonb default '[]',p_after text default '',p_limit integer default 500)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if jsonb_typeof(p_filters)<>'array' or jsonb_array_length(p_filters)>20 then raise exception 'Invalid filters';end if;
 if exists(select 1 from jsonb_array_elements(p_filters) f where f->>'op' not in ('==','array-contains') or coalesce(f->>'field','')='') then raise exception 'Invalid operator';end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('id',d.document_id,'data',d.data,'version',d.version) order by d.document_id),'[]'::jsonb) from (
 select * from public.inex_documents t where collection_id=p_collection and not deleted and document_id>p_after
 and not exists(select 1 from jsonb_array_elements(p_filters) f where not coalesce(case when f->>'op'='==' then jsonb_extract_path(t.data,variadic string_to_array(f->>'field','.'))=f->'value' else jsonb_extract_path(t.data,variadic string_to_array(f->>'field','.')) @> jsonb_build_array(f->'value') end,false))
 order by document_id limit greatest(1,least(p_limit,500)))d);
end;
$$;
create or replace function inex_private.deep_merge(a jsonb,b jsonb)
returns jsonb language sql immutable security invoker set search_path='' as $$
 select coalesce(jsonb_object_agg(coalesce(x.key,y.key),case when x.value is not null and y.value is not null and jsonb_typeof(x.value)='object' and jsonb_typeof(y.value)='object' and y.value<>'{}'::jsonb then inex_private.deep_merge(x.value,y.value) else coalesce(y.value,x.value) end),'{}'::jsonb)
 from jsonb_each(a) x full join jsonb_each(b) y on x.key=y.key;
$$;
revoke all on function inex_private.deep_merge(jsonb,jsonb) from public,anon,authenticated;
grant execute on function inex_private.deep_merge(jsonb,jsonb) to service_role;

create or replace function public.inex_commit(p_reads jsonb,p_writes jsonb)
returns jsonb language plpgsql volatile security invoker set search_path='' as $$
declare item jsonb; current_version bigint; current_data jsonb; is_deleted boolean; mode text; c text; id text;
begin
 if jsonb_typeof(p_reads)<>'array' or jsonb_typeof(p_writes)<>'array' or jsonb_array_length(p_reads)>1000 or jsonb_array_length(p_writes)>1000 then raise exception 'Invalid transaction';end if;
 -- Serializes commits, including concurrent creation of previously absent documents.
 perform g.id from inex_private.store_guard g where g.id=1 for update;
 for item in select * from jsonb_array_elements(p_reads) loop
  select version into current_version from public.inex_documents where collection_id=item->>'collection_id' and document_id=item->>'document_id';
  if coalesce(current_version,0)<>(item->>'version')::bigint then raise exception using errcode='40001',message='Concurrent update; retry transaction';end if;
 end loop;
 for item in select * from jsonb_array_elements(p_writes) loop
  c:=item->>'collection_id';id:=item->>'document_id';mode:=item->>'mode';
  if coalesce(c,'')='' or coalesce(id,'')='' or c like '%/%' or id like '%/%' or mode not in ('set','merge','update','create','delete') or jsonb_typeof(item->'data')<>'object' then raise exception 'Invalid write';end if;
  current_data:=null;is_deleted:=true;
  select data,deleted into current_data,is_deleted from public.inex_documents where collection_id=c and document_id=id;
  if mode='create' and current_data is not null and not is_deleted then raise exception using errcode='23505',message='Document already exists';end if;
  if mode='update' and (current_data is null or is_deleted) then raise exception using errcode='P0002',message='Document not found';end if;
  if mode='delete' then current_data:='{}'::jsonb;
  elsif mode='merge' then current_data:=inex_private.deep_merge(case when current_data is null or is_deleted then '{}'::jsonb else current_data end,item->'data');
  elsif mode='update' then current_data:=(case when current_data is null or is_deleted then '{}'::jsonb else current_data end)||(item->'data');
  else current_data:=item->'data';end if;
  insert into public.inex_documents as existing(collection_id,document_id,data,version,deleted,updated_at) values(c,id,current_data,1,mode='delete',now())
  on conflict(collection_id,document_id) do update set data=excluded.data,version=existing.version+1,deleted=excluded.deleted,updated_at=now();
 end loop;
 return jsonb_build_object('committed',true);
end;
$$;
revoke all on function public.inex_get_document(text,text) from public,anon,authenticated;
revoke all on function public.inex_scan_collection(text,jsonb,text,integer) from public,anon,authenticated;
revoke all on function public.inex_commit(jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.inex_get_document(text,text) to service_role;
grant execute on function public.inex_scan_collection(text,jsonb,text,integer) to service_role;
grant execute on function public.inex_commit(jsonb,jsonb) to service_role;
notify pgrst,'reload schema';
