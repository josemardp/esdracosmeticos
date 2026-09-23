-- ============================================================
-- MIGRATION: 20260923210000_lock_upsert_products_from_nfe.sql
-- Objetivo: Fechar a função upsert_products_from_nfe para chamadas via API.
--
-- A função é SECURITY DEFINER (roda como dono) e não confere se quem chama
-- é admin; estava executável por anon e authenticated, ou seja, qualquer
-- visitante podia criar produtos e alterar custo e estoque via RPC.
-- Nenhuma tela do site usa essa função (a importação de NF-e do admin
-- grava direto na tabela). Fica só para service_role.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.upsert_products_from_nfe(jsonb[]) FROM PUBLIC, anon, authenticated;
