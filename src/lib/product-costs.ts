import { supabase } from "@/integrations/supabase/client";

type ProductCost = { cost: number | null; avg_cost: number | null };

/**
 * Junta cost/avg_cost aos produtos. Essas colunas não são legíveis direto em
 * `products` (nem para cliente logado); só a RPC admin_product_costs() as
 * entrega, e apenas para admin.
 */
export async function withProductCosts<T extends { id: string }>(rows: T[]): Promise<(T & ProductCost)[]> {
  const { data } = await (supabase.rpc as any)("admin_product_costs");
  const costs = new Map<string, ProductCost>(
    ((data as any[]) || []).map((c) => [c.id, { cost: c.cost, avg_cost: c.avg_cost }]),
  );
  return rows.map((r) => ({ ...r, ...(costs.get(r.id) ?? { cost: null, avg_cost: null }) }));
}
