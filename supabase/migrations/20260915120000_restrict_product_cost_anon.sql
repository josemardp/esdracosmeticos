-- ============================================================
-- MIGRATION: 20260915120000_restrict_product_cost_anon.sql
-- Objetivo: Revogar permissão de leitura das colunas de custo
-- (cost e avg_cost) na tabela products para o papel público anônimo (anon).
--
-- O papel authenticated continua com acesso para o painel admin.
-- ============================================================

REVOKE SELECT (cost, avg_cost) ON public.products FROM anon;
