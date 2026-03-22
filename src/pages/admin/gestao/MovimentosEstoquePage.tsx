import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownUp, PackagePlus, PackageMinus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Movement {
  id: string;
  quantity: number;
  type: string;
  reason: string;
  reference_type: string | null;
  balance_after: number;
  cost_at_time: number | null;
  created_at: string;
  product_name?: string;
}

interface Product { id: string; name: string; inventory_count: number; }

export default function MovimentosEstoquePage() {
  const { user } = useAuth();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjProduct, setAdjProduct] = useState("");
  const [adjQty, setAdjQty] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: movs } = await supabase
      .from("stock_movements" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    const { data: prods } = await supabase.from("products").select("id, name, inventory_count").order("name");
    setProducts((prods as Product[]) || []);

    const prodMap = new Map((prods || []).map((p: any) => [p.id, p.name]));
    setMovements(((movs as any[]) || []).map(m => ({ ...m, product_name: prodMap.get(m.product_id) || "—" })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdjust = async () => {
    if (!adjProduct || !adjQty) return;
    setSaving(true);
    const { error } = await supabase.rpc("adjust_stock" as any, {
      p_product_id: adjProduct,
      p_new_quantity: parseInt(adjQty),
      p_reason: adjReason || "Ajuste manual",
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Estoque ajustado ✓" });
      setShowAdjust(false);
      setAdjProduct("");
      setAdjQty("");
      setAdjReason("");
      load();
    }
    setSaving(false);
  };

  const filtered = movements.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.product_name?.toLowerCase().includes(q) || m.reason.toLowerCase().includes(q);
  });

  const typeLabel: Record<string, string> = { entry: "Entrada", exit: "Saída", adjustment: "Ajuste" };
  const typeColor: Record<string, string> = { entry: "text-emerald-600", exit: "text-destructive", adjustment: "text-warning" };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="font-display text-2xl lg:text-3xl text-foreground">Movimentações de Estoque</h1>
        <Button size="sm" onClick={() => setShowAdjust(true)}>
          <ArrowDownUp className="w-4 h-4 mr-1" /> Ajustar Estoque
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por produto ou motivo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-card border rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <ArrowDownUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">Nenhuma movimentação encontrada.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => (
            <div key={m.id} className="bg-card border rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {m.type === "entry" ? <PackagePlus className="w-4 h-4 text-emerald-600 shrink-0" /> : <PackageMinus className="w-4 h-4 text-destructive shrink-0" />}
                <div>
                  <p className="font-body text-sm font-medium text-foreground">{m.product_name}</p>
                  <p className="font-body text-xs text-muted-foreground">{m.reason} · {new Date(m.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-body text-sm font-semibold ${typeColor[m.type] || ""}`}>
                  {m.type === "exit" ? "-" : "+"}{m.quantity} un
                </p>
                <p className="font-body text-xs text-muted-foreground">Saldo: {m.balance_after}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdjust} onOpenChange={setShowAdjust}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajustar Estoque</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <select value={adjProduct} onChange={e => setAdjProduct(e.target.value)} className="w-full border rounded-lg px-3 py-2 font-body text-sm bg-background">
              <option value="">Selecione o produto</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (atual: {p.inventory_count})</option>)}
            </select>
            <Input type="number" placeholder="Nova quantidade" value={adjQty} onChange={e => setAdjQty(e.target.value)} />
            <Input placeholder="Motivo do ajuste" value={adjReason} onChange={e => setAdjReason(e.target.value)} />
            <Button onClick={handleAdjust} disabled={saving || !adjProduct || !adjQty} className="w-full">
              {saving ? "Salvando..." : "Confirmar Ajuste"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
