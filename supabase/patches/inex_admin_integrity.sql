create or replace function public.inex_admin_integrity() returns jsonb language sql stable security invoker set search_path='' as $$
with u as materialized(select document_id,data from public.inex_documents where collection_id='users' and not deleted),
b as materialized(select document_id,data from public.inex_documents where collection_id='gameBets' and not deleted),
a as materialized(select data from public.inex_documents where collection_id='affiliates' and not deleted),
orphans as materialized(select * from b where not exists(select 1 from u where u.document_id=b.data->>'userId'))
select jsonb_build_object('observedAt',now(),'negativePlayerWallets',(select count(*) from u where inex_private.as_numeric(data->>'balance')<0),'negativeAffiliateWallets',(select count(*) from a where inex_private.as_numeric(data->>'affiliateBalance')<0),'betsWithoutCurrentUser',(select count(*) from orphans),'affiliatesWithoutCurrentUser',(select count(*) from a where not exists(select 1 from u where u.document_id=a.data->>'userId')),'canonicalGameConfigs',(select count(*) from public.inex_documents where collection_id='gameConfigs' and not deleted and document_id in('g_gen_dino','g_block_puzzle','g_zumbla','g_raspa_fortuna','g_subway_pay','g_bubble_blast','g_count_masters')),'orphanExamples',(select coalesce(jsonb_agg(jsonb_build_object('id',document_id,'gameId',data->>'gameId','status',data->>'status','amount',data->'betAmount')),'[]') from(select * from orphans order by document_id limit 20)x));
$$;
revoke all on function public.inex_admin_integrity() from public,anon,authenticated;
grant execute on function public.inex_admin_integrity() to service_role;
notify pgrst,'reload schema';
