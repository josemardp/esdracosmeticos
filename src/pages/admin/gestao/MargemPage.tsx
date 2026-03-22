import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Search, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Product {
  id: string; name: string; sku: string | null;
  price: number; sale_price: number | null;
  cost: number | null; avg_cost: number | null;
  inventory_count: number; active: boolean;
}

export default function MargemPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"margin" | "name">("margin");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, sku, price, sale_price, cost, avg_cost, inventory_count, active")
        .order("name");
      setProducts((data as any[]) || []);
      setLoading(false);
    })();
  }, []);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const pct = (v: number) => `${v.toFixed(1)}%`;

  const getMargin = (p: Product) => {
    const sell = p.sale_price || p.price;
    const c = p.avg_cost || p.cost || 0;
    if (sell === 0) return { value: 0, pct: 0 };
    return { value: sell - c, pct: ((sell - c) / sell) * 100 };
  };

  const filtered = products
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "margin") return getMargin(a).pct - getMargin(b).pct;
      return a.name.localeCompare(b.name);
    });

  const marginColor = (pct: number) => pct >= 40 ? "text-emerald-600" : pct >= 20 ? "text-warning" : "text-destructive";

  return (
    <div>
      <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-4">Margem por Produto</h1>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm" onClick={() => setSortBy(s => s === "margin" ? "name" : "margin")}>
          <ArrowUpDown className="w-3 h-3 mr-1" /> {sortBy === "margin" ? "Por margem" : "Por nome"}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-card border rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const m = getMargin(p);
            const sell = p.sale_price || p.price;
            const c = p.avg_cost || p.cost || 0;
            return (
              <div key={p.id} className="bg-card border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-body text-sm font-medium text-foreground">{p.name}</h3>
                  <p className="font-body text-xs text-muted-foreground">
                    Venda: {fmt(sell)} · Custo: {fmt(c)} {!p.active && "· Inativo"}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-body text-sm font-bold ${marginColor(m.pct)}`}>{pct(m.pct)}</p>
                  <p className="font-body text-xs text-muted-foreground">{fmt(m.value)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
