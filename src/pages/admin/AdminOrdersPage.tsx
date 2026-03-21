import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Search, Filter, Clock, CheckCircle, Truck, XCircle, Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

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

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-info/10 text-info border-info/20",
  processing: "bg-primary/10 text-primary border-primary/20",
  shipped: "bg-info/10 text-info border-info/20",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const paymentColors: Record<string, string> = {
  pending: "text-warning",
  paid: "text-success",
  refunded: "text-muted-foreground",
  failed: "text-destructive",
};

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase.from("orders").select("id, order_code, status, payment_status, total, channel_origin, created_at, customers(name, email)").order("created_at", { ascending: false });
    setOrders((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Status atualizado para "${statusLabels[status]}"` });
    fetchOrders();
  };

  const filtered = orders.filter(o => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.order_code.toLowerCase().includes(q) || o.customers?.name?.toLowerCase().includes(q) || o.customers?.email?.toLowerCase().includes(q);
    }
    return true;
  });

  const pendingCount = orders.filter(o => o.status === "pending").length;
  const pendingPaymentCount = orders.filter(o => o.payment_status === "pending" && o.status !== "cancelled").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl lg:text-3xl text-foreground">Pedidos</h1>
        <span className="font-body text-xs text-muted-foreground">{orders.length} total</span>
      </div>

      {/* Alerts */}
      {(pendingCount > 0 || pendingPaymentCount > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {pendingCount > 0 && (
            <button onClick={() => setStatusFilter("pending")} className="flex items-center gap-2 bg-warning/10 border border-warning/20 rounded-lg px-3 py-2 hover:bg-warning/20 transition-colors">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="font-body text-xs text-foreground"><strong>{pendingCount}</strong> pedido(s) pendente(s)</span>
            </button>
          )}
          {pendingPaymentCount > 0 && (
            <div className="flex items-center gap-2 bg-info/10 border border-info/20 rounded-lg px-3 py-2">
              <Clock className="w-4 h-4 text-info" />
              <span className="font-body text-xs text-foreground"><strong>{pendingPaymentCount}</strong> aguardando pagamento</span>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por código, nome ou email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 font-body text-sm bg-background text-foreground min-w-[150px]"
        >
          <option value="all">Todos os status</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-card border rounded-xl animate-pulse" />)}</div> : filtered.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">{search || statusFilter !== "all" ? "Nenhum pedido encontrado com esses filtros." : "Nenhum pedido registrado."}</p>
          {(search || statusFilter !== "all") && (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => { setSearch(""); setStatusFilter("all"); }}>Limpar filtros</Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(o => {
            const StatusIcon = statusIcons[o.status] || Clock;
            return (
              <div key={o.id} className={`bg-card border rounded-xl p-4 ${o.status === "pending" ? "border-warning/30" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColors[o.status] || "bg-muted"}`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-body text-sm font-semibold text-foreground">{o.order_code}</p>
                      <p className="font-body text-xs text-muted-foreground">{o.customers?.name || "—"} · {o.customers?.email || ""}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-sm font-semibold text-foreground">R$ {Number(o.total).toFixed(2)}</p>
                    <p className="font-body text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 pt-2 border-t">
                  <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} className="border rounded px-2 py-1 font-body text-xs bg-background text-foreground">
                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <span className={`font-body text-xs font-medium ${paymentColors[o.payment_status] || "text-muted-foreground"}`}>
                    Pgto: {paymentLabels[o.payment_status] || o.payment_status}
                  </span>
                  <span className="font-body text-[10px] text-muted-foreground ml-auto">{o.channel_origin}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
