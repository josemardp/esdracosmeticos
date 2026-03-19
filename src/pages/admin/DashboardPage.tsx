import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Package, Users, DollarSign, AlertTriangle } from "lucide-react";

interface Stats {
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  totalRevenue: number;
  lowStock: number;
  pendingTickets: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, totalProducts: 0, totalCustomers: 0, totalRevenue: 0, lowStock: 0, pendingTickets: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [orders, products, customers, lowStock, tickets] = await Promise.all([
        supabase.from("orders").select("total", { count: "exact" }),
        supabase.from("products").select("id", { count: "exact" }),
        supabase.from("customers").select("id", { count: "exact" }),
        supabase.from("products").select("id", { count: "exact" }).lt("inventory_count", 5),
        supabase.from("support_tickets").select("id", { count: "exact" }).eq("status", "new"),
      ]);
      const revenue = orders.data?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;
      setStats({
        totalOrders: orders.count ?? 0,
        totalProducts: products.count ?? 0,
        totalCustomers: customers.count ?? 0,
        totalRevenue: revenue,
        lowStock: lowStock.count ?? 0,
        pendingTickets: tickets.count ?? 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Pedidos", value: stats.totalOrders, icon: ShoppingCart, color: "text-primary" },
    { label: "Faturamento", value: `R$ ${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-success" },
    { label: "Produtos", value: stats.totalProducts, icon: Package, color: "text-info" },
    { label: "Clientes", value: stats.totalCustomers, icon: Users, color: "text-gold" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-6">Dashboard</h1>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-card border rounded-xl p-6 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((c) => (
              <div key={c.label} className="bg-card border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-body text-xs text-muted-foreground uppercase tracking-wide">{c.label}</span>
                  <c.icon className={`w-4 h-4 ${c.color}`} />
                </div>
                <p className="font-display text-2xl font-semibold text-foreground">{c.value}</p>
              </div>
            ))}
          </div>

          {/* Alerts */}
          {(stats.lowStock > 0 || stats.pendingTickets > 0) && (
            <div className="space-y-3">
              {stats.lowStock > 0 && (
                <div className="flex items-center gap-3 bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <p className="font-body text-sm text-foreground">
                    <strong>{stats.lowStock}</strong> produto(s) com estoque baixo
                  </p>
                </div>
              )}
              {stats.pendingTickets > 0 && (
                <div className="flex items-center gap-3 bg-info/10 border border-info/20 rounded-lg p-4">
                  <AlertTriangle className="w-5 h-5 text-info" />
                  <p className="font-body text-sm text-foreground">
                    <strong>{stats.pendingTickets}</strong> ticket(s) de suporte pendente(s)
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
