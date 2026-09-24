-- ============================================================
-- MIGRATION: 20260924000000_restrict_product_cost_authenticated.sql
-- Objetivo: Esconder cost e avg_cost também do cliente logado
-- (papel authenticated), mantendo o acesso do admin.
--
-- O admin e o cliente usam o mesmo papel no banco (authenticated), então
-- a leitura do custo passa a ser feita só pela função admin_product_costs(),
-- que confere has_role(auth.uid(), 'admin'). As telas de gestão que mostram
-- custo (Margem, Reposição, Resultado por Produto, Compras, Exportações)
-- usam src/lib/product-costs.ts.
--
-- Gravar custo (INSERT/UPDATE nas importações de CSV/NF-e) continua
-- permitido ao authenticated; quem limita a escrita ao admin é a RLS
-- "Admins manage products".
-- Coluna nova em products precisa de GRANT SELECT explícito ao
-- authenticated (e ao anon, se a vitrine for usá-la).
-- ============================================================

REVOKE SELECT ON public.products FROM authenticated;

GRANT SELECT (
  id, name, slug, sku, short_description, full_description, category_id,
  price, sale_price, inventory_count, min_inventory, active, featured,
  new_arrival, bestseller, cover_image, gallery, benefits, how_to_use,
  ingredients, created_at, updated_at, tags, brand, weight_volume
) ON public.products TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_product_costs()
RETURNS TABLE (id uuid, cost numeric, avg_cost numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT p.id, p.cost, p.avg_cost FROM public.products p;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_product_costs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_product_costs() TO authenticated;
