-- Additive read optimization. Wallet reads and writes remain authoritative.
create index if not exists inex_documents_recent on public.inex_documents(collection_id,(data->>'createdAt') desc nulls last,document_id) where not deleted;
create index if not exists inex_documents_match on public.inex_documents using gin(data jsonb_path_ops) where not deleted;
create or replace function public.inex_recent_documents(p_collection text,p_match jsonb default '{}',p_limit integer default 200)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if coalesce(p_collection,'')='' or jsonb_typeof(p_match)<>'object' or p_limit<1 or p_limit>5000 then raise exception 'Invalid recent query'; end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('id',d.document_id,'data',d.data,'version',d.version) order by d.data->>'createdAt' desc nulls last,d.document_id),'[]'::jsonb)
 from (select document_id,data,version from public.inex_documents where collection_id=p_collection and not deleted and data @> p_match order by data->>'createdAt' desc nulls last,document_id limit p_limit)d);
end;
$$;
revoke all on function public.inex_recent_documents(text,jsonb,integer) from public,anon,authenticated;
grant execute on function public.inex_recent_documents(text,jsonb,integer) to service_role;
analyze public.inex_documents;
notify pgrst,'reload schema';
