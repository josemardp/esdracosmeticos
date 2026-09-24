import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Package, ChevronRight, ShoppingBag, RotateCcw } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { toast } from "@/hooks/use-toast";

interface Order {
  id: string; order_code: string; status: string; payment_status: string; total: number; created_at: string;
}

interface OrderItem {
  id: string; product_id: string | null; name_snapshot: string; quantity: number; unit_price: number;
}

const primaryBtn = "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-deep";

const statusLabels: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmado", processing: "Em preparo",
  shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/25 text-foreground",
  confirmed: "bg-primary/10 text-primary",
  processing: "bg-info/10 text-info",
  shipped: "bg-gold/15 text-foreground",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function OrdersPage() {
  const { user } = useAuth();
  const { addItem } = useCart();
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

  const handleReorder = async (orderId: string) => {
    const { data: items } = await supabase.from("order_items").select("product_id, name_snapshot, quantity, unit_price").eq("order_id", orderId);
    if (!items || items.length === 0) return;

    // Get current products for stock/price check
    const productIds = items.filter(i => i.product_id).map(i => i.product_id!);
    const { data: products } = await supabase.from("products").select("id, name, slug, price, sale_price, cover_image, inventory_count").in("id", productIds);

    let added = 0;
    (products ?? []).forEach(p => {
      if (p.inventory_count > 0) {
        addItem({ id: p.id, name: p.name, slug: p.slug, price: p.price, sale_price: p.sale_price, cover_image: p.cover_image, inventory_count: p.inventory_count });
        added++;
      }
    });

    if (added > 0) {
      toast({ title: `${added} produto(s) adicionado(s) à sacola` });
    } else {
      toast({ title: "Nenhum produto disponível", description: "Os itens deste pedido estão esgotados.", variant: "destructive" });
    }
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-secondary" />)}</div>;

  return (
    <div>
      <h2 className="mb-4 font-display text-[26px] leading-tight text-foreground display-md">Pedidos</h2>
      {orders.length === 0 ? (
        <div className="rounded-2xl bg-secondary px-6 py-12 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-primary" aria-hidden />
          <p className="mb-6 text-base text-foreground">Você ainda não fez nenhum pedido.</p>
          <Link to="/loja" className={primaryBtn}><ShoppingBag className="h-[18px] w-[18px]" aria-hidden /> Ver a loja</Link>
        </div>
      ) : (
        <ul className="border-t">
          {orders.map(o => (
            <li key={o.id} className="border-b py-4">
              <Link to={`/conta/pedidos/${o.id}`} className="flex min-h-11 items-center justify-between gap-4">
                <div>
                  <p className="text-base font-medium text-foreground">{o.order_code}</p>
                  <p className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-base font-medium tabular-nums text-foreground">{formatBRL(Number(o.total))}</p>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[o.status] || "bg-secondary text-muted-foreground"}`}>
                      {statusLabels[o.status] || o.status}
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden />
                </div>
              </Link>
              {(o.status === "delivered" || o.status === "confirmed") && (
                <button onClick={() => handleReorder(o.id)} className="mt-3 inline-flex h-11 items-center gap-2 rounded-full px-5 text-[15px] font-medium text-foreground shadow-[inset_0_0_0_1.5px_hsl(var(--foreground))]">
                  <RotateCcw className="h-4 w-4" aria-hidden /> Comprar de novo
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
