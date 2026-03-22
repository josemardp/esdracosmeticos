import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PackageCheck, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface PO {
  id: string;
  po_code: string;
  total: number;
  status: string;
  order_date: string;
  supplier: { name: string } | null;
  items: { name: string; quantity: number; unit_cost: number; product_id: string | null }[];
}

export default function RecebimentoComprasPage() {
  const [pos, setPos] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiving, setReceiving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("purchase_orders")
      .select("id, po_code, total, status, order_date, supplier:suppliers(name)")
      .in("status", ["confirmed", "partial"])
      .order("order_date", { ascending: false })
      .limit(100);

    const items: PO[] = [];
    for (const po of (data || [])) {
      const { data: poItems } = await supabase
        .from("purchase_order_items")
        .select("name, quantity, unit_cost, product_id")
        .eq("purchase_order_id", po.id);
      items.push({ ...po, supplier: Array.isArray(po.supplier) ? po.supplier[0] : po.supplier, items: poItems || [] } as PO);
    }
    setPos(items);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleReceive = async (poId: string) => {
    setReceiving(poId);
    const { data, error } = await supabase.rpc("receive_purchase_order" as any, { p_po_id: poId });
    if (error) {
      toast({ title: "Erro ao receber", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Compra recebida ✓", description: `${(data as any)?.items_received || 0} itens entraram no estoque` });
      load();
    }
    setReceiving(null);
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div>
      <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-4">Recebimento de Compras</h1>
      <p className="font-body text-sm text-muted-foreground mb-6">
        Confirme o recebimento para dar entrada no estoque e atualizar custos.
      </p>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-card border rounded-xl animate-pulse" />)}</div>
      ) : pos.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <PackageCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">Nenhuma compra pendente de recebimento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pos.map(po => (
            <div key={po.id} className="bg-card border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-body text-sm font-semibold text-foreground">{po.po_code}</h3>
                  <p className="font-body text-xs text-muted-foreground">
                    {po.supplier?.name || "—"} · {new Date(po.order_date).toLocaleDateString("pt-BR")} · {fmt(po.total)}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleReceive(po.id)}
                  disabled={receiving === po.id}
                >
                  {receiving === po.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Package className="w-4 h-4 mr-1" />}
                  Receber
                </Button>
              </div>
              <div className="space-y-1">
                {po.items.map((item, i) => (
                  <div key={i} className="font-body text-xs text-muted-foreground flex justify-between">
                    <span>{item.name}</span>
                    <span>{item.quantity} un × {fmt(item.unit_cost)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
