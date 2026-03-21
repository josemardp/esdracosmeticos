import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Boxes, AlertTriangle, Search, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface Product { id: string; name: string; sku: string | null; inventory_count: number; min_inventory: number; active: boolean; }

export default function AdminStockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "low" | "zero">("all");
  const [search, setSearch] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase.from("products").select("id, name, sku, inventory_count, min_inventory, active").order("name");
    if (filter === "low") query = query.lt("inventory_count", 5).gt("inventory_count", 0);
    if (filter === "zero") query = query.eq("inventory_count", 0);
    const { data } = await query;
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [filter]);

  const updateStock = async (id: string, newCount: number) => {
    if (newCount < 0) { toast({ title: "Estoque não pode ser negativo", variant: "destructive" }); return; }
    const { error } = await supabase.from("products").update({ inventory_count: newCount }).eq("id", id);
    if (error) { toast({ title: "Erro ao atualizar estoque", description: error.message, variant: "destructive" }); return; }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, inventory_count: newCount } : p));
    toast({ title: "Estoque atualizado ✓" });
  };

  const filtered = products.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  const zeroCount = products.filter(p => p.inventory_count === 0).length;
  const lowCount = products.filter(p => p.inventory_count > 0 && p.inventory_count < p.min_inventory).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl lg:text-3xl text-foreground">Controle de Estoque</h1>
      </div>

      {/* Summary badges */}
      {(zeroCount > 0 || lowCount > 0) && filter === "all" && (
        <div className="flex flex-wrap gap-2 mb-4">
          {zeroCount > 0 && (
            <button onClick={() => setFilter("zero")} className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 hover:bg-destructive/15 transition-colors">
              <PackageX className="w-4 h-4 text-destructive" />
              <span className="font-body text-xs"><strong>{zeroCount}</strong> zerado(s)</span>
            </button>
          )}
          {lowCount > 0 && (
            <button onClick={() => setFilter("low")} className="flex items-center gap-2 bg-warning/10 border border-warning/20 rounded-lg px-3 py-2 hover:bg-warning/15 transition-colors">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="font-body text-xs"><strong>{lowCount}</strong> baixo(s)</span>
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou SKU..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>Todos</Button>
          <Button variant={filter === "low" ? "default" : "outline"} size="sm" onClick={() => setFilter("low")}>
            <AlertTriangle className="w-3 h-3 mr-1" /> Baixo
          </Button>
          <Button variant={filter === "zero" ? "default" : "outline"} size="sm" onClick={() => setFilter("zero")}>
            <PackageX className="w-3 h-3 mr-1" /> Zerado
          </Button>
        </div>
      </div>

      {loading ? <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-card border rounded-xl animate-pulse" />)}</div> : filtered.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Boxes className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">Nenhum produto {filter === "low" ? "com estoque baixo" : filter === "zero" ? "com estoque zerado" : "encontrado"}.</p>
          {(search || filter !== "all") && (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => { setSearch(""); setFilter("all"); }}>Limpar filtros</Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} className={`bg-card border rounded-xl p-4 flex items-center justify-between ${
              p.inventory_count === 0 ? 'border-destructive/30 bg-destructive/5' : p.inventory_count < p.min_inventory ? 'border-warning/30 bg-warning/5' : ''
            }`}>
              <div className="flex items-center gap-3">
                {p.inventory_count === 0 ? (
                  <PackageX className="w-5 h-5 text-destructive shrink-0" />
                ) : p.inventory_count < p.min_inventory ? (
                  <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                ) : (
                  <Boxes className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
                <div>
                  <h3 className="font-body text-sm font-medium text-foreground">{p.name}</h3>
                  <p className="font-body text-xs text-muted-foreground">{p.sku || "Sem SKU"} · Mín: {p.min_inventory} {!p.active && "· Inativo"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={p.inventory_count}
                  onChange={e => updateStock(p.id, parseInt(e.target.value) || 0)}
                  className={`w-20 text-center font-body text-sm ${p.inventory_count === 0 ? 'border-destructive/40' : p.inventory_count < p.min_inventory ? 'border-warning/40' : ''}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
