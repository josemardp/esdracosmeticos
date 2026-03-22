import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, Search, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ProductResult {
  id: string; name: string; sku: string | null;
  price: number; sale_price: number | null;
  cost: number | null; avg_cost: number | null;
  totalSold: number; totalRevenue: number;
}

export default function ProdutosResultadoPage() {
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"revenue" | "margin" | "qty">("revenue");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [prodsRes, saleItemsRes, orderItemsRes] = await Promise.all([
        supabase.from("products").select("id, name, sku, price, sale_price, cost, avg_cost"),
        supabase.from("sale_items").select("product_id, quantity, subtotal"),
        supabase.from("order_items").select("product_id, quantity, subtotal"),
      ]);

      const prodMap = new Map<string, ProductResult>();
      for (const p of (prodsRes.data || []) as any[]) {
        prodMap.set(p.id, { ...p, totalSold: 0, totalRevenue: 0 });
      }

      for (const item of [...(saleItemsRes.data || []), ...(orderItemsRes.data || [])] as any[]) {
        if (item.product_id && prodMap.has(item.product_id)) {
          const pr = prodMap.get(item.product_id)!;
          pr.totalSold += item.quantity || 0;
          pr.totalRevenue += item.subtotal || 0;
        }
      }

      setProducts(Array.from(prodMap.values()).filter(p => p.totalSold > 0));
      setLoading(false);
    })();
  }, []);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const getMarginPct = (p: ProductResult) => {
    if (p.totalRevenue === 0) return 0;
    const costTotal = (p.avg_cost || p.cost || 0) * p.totalSold;
    return ((p.totalRevenue - costTotal) / p.totalRevenue) * 100;
  };

  const sorted = [...products]
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "revenue") return b.totalRevenue - a.totalRevenue;
      if (sortBy === "qty") return b.totalSold - a.totalSold;
      return getMarginPct(b) - getMarginPct(a);
    });

  return (
    <div>
      <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-4">Resultado por Produto</h1>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1">
          {([["revenue", "Receita"], ["qty", "Qtd"], ["margin", "Margem"]] as const).map(([k, l]) => (
            <Button key={k} variant={sortBy === k ? "default" : "outline"} size="sm" onClick={() => setSortBy(k)}>
              {l}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-card border rounded-xl animate-pulse" />)}</div>
      ) : sorted.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">Sem dados de vendas ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(p => {
            const marginPct = getMarginPct(p);
            const costTotal = (p.avg_cost || p.cost || 0) * p.totalSold;
            const profit = p.totalRevenue - costTotal;
            return (
              <div key={p.id} className="bg-card border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-body text-sm font-medium text-foreground">{p.name}</h3>
                  <p className="font-body text-xs text-muted-foreground">
                    {p.totalSold} un · Receita: {fmt(p.totalRevenue)} · Custo: {fmt(costTotal)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-body text-sm font-bold ${marginPct >= 30 ? "text-emerald-600" : marginPct >= 15 ? "text-warning" : "text-destructive"}`}>
                    {marginPct.toFixed(1)}%
                  </p>
                  <p className="font-body text-xs text-muted-foreground">{fmt(profit)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
