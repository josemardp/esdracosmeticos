import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Package, MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/whatsapp";

interface OrderDetail {
  id: string; order_code: string; status: string; payment_status: string;
  payment_method: string | null; subtotal: number; discount: number; shipping: number;
  total: number; created_at: string; shipping_address_snapshot: any;
}

interface OrderItem {
  id: string; name_snapshot: string; quantity: number; unit_price: number; subtotal: number;
}

const statusLabels: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmado", processing: "Em preparo",
  shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
};
const paymentLabels: Record<string, string> = {
  pending: "Aguardando", paid: "Pago", refunded: "Estornado", failed: "Falhou",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      const { data: customer } = await supabase.from("customers").select("id").eq("user_id", user.id).maybeSingle();
      if (!customer) { setLoading(false); return; }
      const { data: o } = await supabase.from("orders").select("id, order_code, status, payment_status, payment_method, subtotal, discount, shipping, total, created_at, shipping_address_snapshot").eq("id", id).eq("customer_id", customer.id).maybeSingle();
      if (o) {
        setOrder(o as OrderDetail);
        const { data: oi } = await supabase.from("order_items").select("id, name_snapshot, quantity, unit_price, subtotal").eq("order_id", o.id);
        setItems((oi as OrderItem[]) ?? []);
      }
      setLoading(false);
    };
    load();
  }, [user, id]);

  if (loading) return <div className="animate-pulse h-60 bg-secondary rounded-xl" />;
  if (!order) return (
    <div className="text-center py-12">
      <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
      <p className="font-body text-sm text-muted-foreground mb-4">Pedido não encontrado.</p>
      <Link to="/conta/pedidos"><Button variant="outline" size="sm">Voltar aos pedidos</Button></Link>
    </div>
  );

  const addr = order.shipping_address_snapshot as any;

  return (
    <div>
      <Link to="/conta/pedidos" className="inline-flex items-center gap-1 font-body text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Voltar aos pedidos
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl text-foreground">{order.order_code}</h2>
          <p className="font-body text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
        </div>
        <div className="text-right">
          <span className="inline-block bg-primary/10 text-primary font-body text-xs font-medium px-3 py-1 rounded-full">{statusLabels[order.status] || order.status}</span>
          <p className="font-body text-xs text-muted-foreground mt-1">Pgto: {paymentLabels[order.payment_status] || order.payment_status}</p>
        </div>
      </div>

      {/* Items */}
      <div className="bg-card border rounded-xl p-5 mb-4">
        <h3 className="font-body text-sm font-semibold text-foreground mb-3">Itens do Pedido</h3>
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <p className="font-body text-sm text-foreground">{item.name_snapshot}</p>
                <p className="font-body text-xs text-muted-foreground">{item.quantity}x R$ {Number(item.unit_price).toFixed(2)}</p>
              </div>
              <p className="font-body text-sm font-medium text-foreground">R$ {Number(item.subtotal).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-card border rounded-xl p-5 mb-4">
        <div className="space-y-2 font-body text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {Number(order.subtotal).toFixed(2)}</span></div>
          {Number(order.discount) > 0 && <div className="flex justify-between text-primary"><span>Desconto</span><span>- R$ {Number(order.discount).toFixed(2)}</span></div>}
          <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>R$ {Number(order.shipping).toFixed(2)}</span></div>
          <div className="flex justify-between font-semibold text-foreground border-t pt-2 mt-2"><span>Total</span><span>R$ {Number(order.total).toFixed(2)}</span></div>
        </div>
        {order.payment_method && <p className="font-body text-xs text-muted-foreground mt-3">Método: {order.payment_method}</p>}
      </div>

      {/* Address */}
      {addr && (
        <div className="bg-card border rounded-xl p-5 mb-4">
          <h3 className="font-body text-sm font-semibold text-foreground mb-2">Endereço de Entrega</h3>
          <p className="font-body text-sm text-muted-foreground">{addr.street}, {addr.number}{addr.complement ? ` - ${addr.complement}` : ""}</p>
          <p className="font-body text-xs text-muted-foreground">{addr.neighborhood} · {addr.city}/{addr.state} · CEP {addr.zip}</p>
        </div>
      )}

      <a href={`https://wa.me/5518991459429?text=Olá,%20quero%20informações%20sobre%20meu%20pedido%20${order.order_code}`} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm"><MessageCircle className="w-4 h-4 mr-2" /> Falar sobre este pedido</Button>
      </a>
    </div>
  );
}
