import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search, ShoppingCart, DollarSign, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Customer {
  id: string; name: string; email: string; phone: string | null; created_at: string;
  order_count: number; total_spent: number; last_order_at: string | null;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "spent" | "orders">("recent");

  useEffect(() => {
    const fetch = async () => {
      const { data: custs } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
      const customerList = (custs ?? []) as any[];

      // Enrich with order data
      const { data: orders } = await supabase.from("orders").select("customer_id, total, created_at");
      const orderMap: Record<string, { count: number; spent: number; last: string | null }> = {};
      (orders ?? []).forEach(o => {
        if (!orderMap[o.customer_id]) orderMap[o.customer_id] = { count: 0, spent: 0, last: null };
        orderMap[o.customer_id].count += 1;
        orderMap[o.customer_id].spent += Number(o.total);
        if (!orderMap[o.customer_id].last || o.created_at > orderMap[o.customer_id].last!) {
          orderMap[o.customer_id].last = o.created_at;
        }
      });

      setCustomers(customerList.map(c => ({
        ...c,
        order_count: orderMap[c.id]?.count ?? 0,
        total_spent: orderMap[c.id]?.spent ?? 0,
        last_order_at: orderMap[c.id]?.last ?? null,
      })));
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = customers
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone?.includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "spent") return b.total_spent - a.total_spent;
      if (sortBy === "orders") return b.order_count - a.order_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const recurrentCount = customers.filter(c => c.order_count >= 2).length;

  return (
    <div>
      <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-2">Clientes</h1>
      <p className="font-body text-sm text-muted-foreground mb-6">{customers.length} clientes · {recurrentCount} recorrentes (2+ pedidos)</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, e-mail ou telefone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Button variant={sortBy === "recent" ? "default" : "outline"} size="sm" onClick={() => setSortBy("recent")}>
            <ArrowUpDown className="w-3.5 h-3.5 mr-1" /> Recentes
          </Button>
          <Button variant={sortBy === "spent" ? "default" : "outline"} size="sm" onClick={() => setSortBy("spent")}>
            <DollarSign className="w-3.5 h-3.5 mr-1" /> Valor
          </Button>
          <Button variant={sortBy === "orders" ? "default" : "outline"} size="sm" onClick={() => setSortBy("orders")}>
            <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Pedidos
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-card border rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">{search ? "Nenhum resultado encontrado." : "Nenhum cliente cadastrado."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.id} className="bg-card border rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-body text-sm font-medium text-foreground">{c.name}</h3>
                  {c.order_count >= 2 && <span className="bg-primary/10 text-primary text-[10px] font-body font-semibold px-2 py-0.5 rounded-full">Recorrente</span>}
                </div>
                <p className="font-body text-xs text-muted-foreground">{c.email} {c.phone && `· ${c.phone}`}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-body text-sm font-semibold text-foreground">{c.order_count} pedido{c.order_count !== 1 ? 's' : ''}</p>
                <p className="font-body text-xs text-muted-foreground">R$ {c.total_spent.toFixed(2)}</p>
              </div>
              <p className="font-body text-xs text-muted-foreground shrink-0 hidden sm:block">{new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
