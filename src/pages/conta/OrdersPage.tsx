import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Package } from "lucide-react";

interface Order {
  id: string; order_code: string; status: string; payment_status: string; total: number; created_at: string;
}

const statusLabels: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmado", processing: "Em preparo",
  shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: customer } = await supabase.from("customers").select("id").eq("user_id", user.id).maybeSingle();
      if (customer) {
        const { data } = await supabase.from("orders").select("id, order_code, status, payment_status, total, created_at").eq("customer_id", customer.id).order("created_at", { ascending: false });
        setOrders((data as Order[]) ?? []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />)}</div>;

  return (
    <div>
      <h2 className="font-display text-xl text-foreground mb-6">Meus Pedidos</h2>
      {orders.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">Você ainda não fez nenhum pedido.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} className="bg-card border rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="font-body text-sm font-semibold text-foreground">{o.order_code}</p>
                <p className="font-body text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="text-right">
                <p className="font-body text-sm font-semibold text-foreground">R$ {Number(o.total).toFixed(2)}</p>
                <p className="font-body text-xs text-muted-foreground">{statusLabels[o.status] || o.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
