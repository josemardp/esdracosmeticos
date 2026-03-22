import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, PackageX, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string; name: string; sku: string | null;
  inventory_count: number; min_inventory: number;
  cost: number | null; avg_cost: number | null; active: boolean;
}

export default function ReposicaoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, sku, inventory_count, min_inventory, cost, avg_cost, active")
        .lte("inventory_count", 999) // get all, filter client-side
        .order("inventory_count", { ascending: true });
      const needsReorder = ((data as any[]) || []).filter((p: Product) => p.inventory_count <= p.min_inventory);
      setProducts(needsReorder);
      setLoading(false);
    })();
  }, []);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const suggestedQty = (p: Product) => Math.max(p.min_inventory * 2 - p.inventory_count, p.min_inventory);

  return (
    <div>
      <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-2">Reposição de Estoque</h1>
      <p className="font-body text-sm text-muted-foreground mb-6">
        Produtos abaixo do estoque mínimo que precisam de recompra.
      </p>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-card border rounded-xl animate-pulse" />)}</div>
      ) : products.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <ShoppingCart className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">Todos os produtos estão com estoque adequado!</p>
        </div>
      ) : (
        <>
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 mb-4">
            <p className="font-body text-sm text-destructive font-medium">
              {products.length} produto(s) precisam de reposição
            </p>
          </div>
          <div className="space-y-2">
            {products.map(p => (
              <div key={p.id} className={`bg-card border rounded-xl p-4 flex items-center justify-between ${
                p.inventory_count === 0 ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5"
              }`}>
                <div className="flex items-center gap-3">
                  {p.inventory_count === 0 ? (
                    <PackageX className="w-5 h-5 text-destructive shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                  )}
                  <div>
                    <h3 className="font-body text-sm font-medium text-foreground">{p.name}</h3>
                    <p className="font-body text-xs text-muted-foreground">
                      Atual: {p.inventory_count} · Mín: {p.min_inventory} · Custo: {fmt(p.avg_cost || p.cost || 0)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-body text-xs text-muted-foreground">Sugestão: +{suggestedQty(p)} un</p>
                  <p className="font-body text-xs text-muted-foreground">≈ {fmt(suggestedQty(p) * (p.avg_cost || p.cost || 0))}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/gestao/compras")}>
            <ShoppingCart className="w-4 h-4 mr-1" /> Ir para Compras
          </Button>
        </>
      )}
    </div>
  );
}
