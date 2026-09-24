import { describe, it, expect, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }));

import { withProductCosts } from "@/lib/product-costs";

describe("withProductCosts", () => {
  it("junta custo por id pela RPC de admin", async () => {
    rpc.mockResolvedValue({ data: [{ id: "a", cost: 10, avg_cost: 12 }], error: null });
    const out = await withProductCosts([{ id: "a", name: "A" }, { id: "b", name: "B" }]);
    expect(rpc).toHaveBeenCalledWith("admin_product_costs");
    expect(out).toEqual([
      { id: "a", name: "A", cost: 10, avg_cost: 12 },
      { id: "b", name: "B", cost: null, avg_cost: null },
    ]);
  });

  it("sem permissão (não admin) devolve custo vazio em vez de quebrar a tela", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "Acesso negado" } });
    const out = await withProductCosts([{ id: "a" }]);
    expect(out).toEqual([{ id: "a", cost: null, avg_cost: null }]);
  });
});
