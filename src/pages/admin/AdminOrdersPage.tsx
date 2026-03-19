import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart } from "lucide-react";

interface Order {
  id: string; order_code: string; status: string; payment_status: string;
  total: number; channel_origin: string; created_at: string;
  customers: { name: string; email: string } | null;
}

const statusLabels: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmado", processing: "Em preparo",
  shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
};

const paymentLabels: Record<string, string> = {
  pending: "Aguardando", paid: "Pago", refunded: "Estornado", failed: "Falhou",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase.from("orders").select("id, order_code, status, payment_status, total, channel_origin, created_at, customers(name, email)").order("created_at", { ascending: false });
    setOrders((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    fetchOrders();
  };

  return (
    <div>
      <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-6">Pedidos</h1>
      {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-card border rounded-xl animate-pulse" />)}</div> : orders.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">Nenhum pedido registrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map(o => (
            <div key={o.id} className="bg-card border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-body text-sm font-semibold text-foreground">{o.order_code}</p>
                  <p className="font-body text-xs text-muted-foreground">{o.customers?.name || "—"} · {o.customers?.email || ""}</p>
                </div>
                <div className="text-right">
                  <p className="font-body text-sm font-semibold text-foreground">R$ {Number(o.total).toFixed(2)}</p>
                  <p className="font-body text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")} · {o.channel_origin}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} className="border rounded px-2 py-1 font-body text-xs bg-background text-foreground">
                  {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <span className="font-body text-xs text-muted-foreground">Pgto: {paymentLabels[o.payment_status] || o.payment_status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
