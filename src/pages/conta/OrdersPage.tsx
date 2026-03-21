import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Package, ChevronRight, ShoppingBag, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Order {
  id: string; order_code: string; status: string; payment_status: string; total: number; created_at: string;
}

interface OrderItem {
  id: string; product_id: string | null; name_snapshot: string; quantity: number; unit_price: number;
}

const statusLabels: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmado", processing: "Em preparo",
  shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-primary/10 text-primary",
  processing: "bg-info/10 text-info",
  shipped: "bg-gold/10 text-gold",
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
      toast({ title: `${added} produto(s) adicionado(s) ao carrinho` });
    } else {
      toast({ title: "Nenhum produto disponível", description: "Os itens deste pedido estão esgotados.", variant: "destructive" });
    }
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />)}</div>;

  return (
    <div>
      <h2 className="font-display text-xl text-foreground mb-6">Meus Pedidos</h2>
      {orders.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground mb-4">Você ainda não fez nenhum pedido.</p>
          <Link to="/loja"><Button><ShoppingBag className="w-4 h-4 mr-2" /> Explorar Produtos</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} className="bg-card border rounded-xl p-5">
              <Link to={`/conta/pedidos/${o.id}`} className="flex items-center justify-between hover:opacity-80 transition-opacity">
                <div>
                  <p className="font-body text-sm font-semibold text-foreground">{o.order_code}</p>
                  <p className="font-body text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-body text-sm font-semibold text-foreground">R$ {Number(o.total).toFixed(2)}</p>
                    <span className={`inline-block font-body text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[o.status] || 'bg-secondary text-muted-foreground'}`}>
                      {statusLabels[o.status] || o.status}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
              {(o.status === "delivered" || o.status === "confirmed") && (
                <div className="mt-3 pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => handleReorder(o.id)} className="text-xs">
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Comprar novamente
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
