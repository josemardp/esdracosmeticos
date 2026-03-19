import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Boxes, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface Product { id: string; name: string; sku: string | null; inventory_count: number; min_inventory: number; active: boolean; }

export default function AdminStockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "low">("all");

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase.from("products").select("id, name, sku, inventory_count, min_inventory, active").order("name");
    if (filter === "low") query = query.lt("inventory_count", 5);
    const { data } = await query;
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [filter]);

  const updateStock = async (id: string, newCount: number) => {
    if (newCount < 0) { toast({ title: "Estoque não pode ser negativo", variant: "destructive" }); return; }
    await supabase.from("products").update({ inventory_count: newCount }).eq("id", id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, inventory_count: newCount } : p));
    toast({ title: "Estoque atualizado" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl lg:text-3xl text-foreground">Controle de Estoque</h1>
        <div className="flex gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>Todos</Button>
          <Button variant={filter === "low" ? "default" : "outline"} size="sm" onClick={() => setFilter("low")}>
            <AlertTriangle className="w-3 h-3 mr-1" /> Baixo
          </Button>
        </div>
      </div>

      {loading ? <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-card border rounded-xl animate-pulse" />)}</div> : products.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Boxes className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">Nenhum produto {filter === "low" ? "com estoque baixo" : ""}.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map(p => (
            <div key={p.id} className={`bg-card border rounded-xl p-4 flex items-center justify-between ${p.inventory_count < p.min_inventory ? 'border-warning/40' : ''}`}>
              <div>
                <h3 className="font-body text-sm font-medium text-foreground">{p.name}</h3>
                <p className="font-body text-xs text-muted-foreground">{p.sku || "Sem SKU"} · Mín: {p.min_inventory}</p>
              </div>
              <div className="flex items-center gap-2">
                {p.inventory_count < p.min_inventory && <AlertTriangle className="w-4 h-4 text-warning" />}
                <Input
                  type="number"
                  value={p.inventory_count}
                  onChange={e => updateStock(p.id, parseInt(e.target.value) || 0)}
                  className="w-20 text-center font-body text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
