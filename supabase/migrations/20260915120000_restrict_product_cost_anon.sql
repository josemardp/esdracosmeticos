-- ============================================================
-- MIGRATION: 20260915120000_restrict_product_cost_anon.sql
-- Objetivo: Revogar permissão de leitura das colunas de custo
-- (cost e avg_cost) na tabela products para o papel público anônimo (anon).
--
-- O anon tinha SELECT na tabela inteira. No Postgres, um REVOKE só das
-- colunas não anula o grant de tabela, então é preciso revogar a tabela
-- e devolver o SELECT coluna a coluna, sem cost e avg_cost.
-- Consequência: o anon não pode mais usar select=* em products; todas as
-- consultas públicas do site já usam lista explícita de colunas (conferido
-- em 15/09/2026). Coluna nova em products precisa de GRANT explícito ao anon
-- se a vitrine for usá-la.
--
-- O papel authenticated continua com acesso para o painel admin.
-- ============================================================

REVOKE SELECT ON public.products FROM anon;

GRANT SELECT (
  id, name, slug, sku, short_description, full_description, category_id,
  price, sale_price, inventory_count, min_inventory, active, featured,
  new_arrival, bestseller, cover_image, gallery, benefits, how_to_use,
  ingredients, created_at, updated_at, tags, brand, weight_volume
) ON public.products TO anon;
