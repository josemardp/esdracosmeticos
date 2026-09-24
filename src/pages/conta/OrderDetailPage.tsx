import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatBRL } from "@/lib/format";
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

const outlineBtn = "inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium text-foreground shadow-[inset_0_0_0_1.5px_hsl(var(--foreground))]";

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

  if (loading) return <div className="h-60 animate-pulse rounded-2xl bg-secondary" />;
  if (!order) return (
    <div className="rounded-2xl bg-secondary px-6 py-12 text-center">
      <Package className="mx-auto mb-3 h-10 w-10 text-primary" aria-hidden />
      <p className="mb-6 text-base text-foreground">Pedido não encontrado.</p>
      <Link to="/conta/pedidos" className={outlineBtn}>Voltar aos pedidos</Link>
    </div>
  );

  const addr = order.shipping_address_snapshot as any;

  return (
    <div>
      <Link to="/conta/pedidos" className="mb-4 inline-flex min-h-11 items-center gap-1 text-[15px] text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" aria-hidden /> Voltar aos pedidos
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[26px] leading-tight text-foreground display-md">Pedido {order.order_code}</h2>
          <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
        </div>
        <div className="text-left sm:text-right">
          <span className="inline-block rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">{statusLabels[order.status] || order.status}</span>
          <p className="mt-1 text-sm text-muted-foreground">Pagamento: {paymentLabels[order.payment_status] || order.payment_status}</p>
        </div>
      </div>

      <section className="mb-6">
        <h3 className="mb-2 text-base font-medium text-foreground">Itens</h3>
        <ul className="border-t">
          {items.map(item => (
            <li key={item.id} className="flex items-start justify-between gap-4 border-b py-3">
              <div>
                <p className="text-[15px] text-foreground">{item.name_snapshot}</p>
                <p className="text-sm tabular-nums text-muted-foreground">{item.quantity} × {formatBRL(Number(item.unit_price))}</p>
              </div>
              <p className="text-[15px] font-medium tabular-nums text-foreground">{formatBRL(Number(item.subtotal))}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6 rounded-2xl bg-secondary p-5">
        <dl className="space-y-2 text-[15px] tabular-nums">
          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatBRL(Number(order.subtotal))}</dd></div>
          {Number(order.discount) > 0 && <div className="flex justify-between text-primary"><dt>Desconto</dt><dd>- {formatBRL(Number(order.discount))}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted-foreground">Frete</dt><dd>{formatBRL(Number(order.shipping))}</dd></div>
          <div className="mt-2 flex justify-between border-t border-foreground/15 pt-3 text-base font-semibold text-foreground"><dt>Total</dt><dd>{formatBRL(Number(order.total))}</dd></div>
        </dl>
        {order.payment_method && <p className="mt-3 text-sm text-muted-foreground">Forma de pagamento: {order.payment_method}</p>}
      </section>

      {addr && (
        <section className="mb-6">
          <h3 className="mb-2 text-base font-medium text-foreground">Endereço de entrega</h3>
          <p className="text-[15px] text-foreground">{addr.street}, {addr.number}{addr.complement ? `, ${addr.complement}` : ""}</p>
          <p className="text-sm text-muted-foreground">{addr.neighborhood}, {addr.city}/{addr.state}, CEP {addr.zip}</p>
        </section>
      )}

      <a href={whatsappUrl(`Olá, quero informações sobre meu pedido ${order.order_code}`)} target="_blank" rel="noopener noreferrer" className={outlineBtn}>
        <MessageCircle className="h-[18px] w-[18px]" aria-hidden /> Falar sobre este pedido
      </a>
    </div>
  );
}
