import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExecutivoPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState({ revenue: 0, expenses: 0, orders: 0, newCustomers: 0, avgTicket: 0, productsSold: 0 });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - period * 86400000).toISOString();

      const [salesRes, movRes, ordersRes, customersRes] = await Promise.all([
        supabase.from("sales").select("total").gte("sale_date", since),
        supabase.from("cash_movements").select("type, amount").gte("movement_date", since),
        supabase.from("orders").select("total").gte("created_at", since).neq("status", "cancelled"),
        supabase.from("customers").select("id").gte("created_at", since),
      ]);

      const salesTotal = (salesRes.data || []).reduce((s, r) => s + (r.total || 0), 0);
      const ordersTotal = (ordersRes.data || []).reduce((s, r) => s + (r.total || 0), 0);
      const revenue = salesTotal + ordersTotal;
      const totalOrders = (salesRes.data?.length || 0) + (ordersRes.data?.length || 0);

      const credits = (movRes.data || []).filter((m: any) => m.type === "credit").reduce((s: number, m: any) => s + m.amount, 0);
      const debits = (movRes.data || []).filter((m: any) => m.type === "debit").reduce((s: number, m: any) => s + m.amount, 0);

      setData({
        revenue,
        expenses: debits,
        orders: totalOrders,
        newCustomers: customersRes.data?.length || 0,
        avgTicket: totalOrders > 0 ? revenue / totalOrders : 0,
        productsSold: 0,
      });
      setLoading(false);
    })();
  }, [period]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const cards = [
    { label: "Receita", value: fmt(data.revenue), icon: TrendingUp, color: "text-emerald-600" },
    { label: "Despesas", value: fmt(data.expenses), icon: TrendingDown, color: "text-destructive" },
    { label: "Resultado", value: fmt(data.revenue - data.expenses), icon: DollarSign, color: data.revenue - data.expenses >= 0 ? "text-emerald-600" : "text-destructive" },
    { label: "Vendas", value: String(data.orders), icon: ShoppingCart, color: "text-primary" },
    { label: "Ticket Médio", value: fmt(data.avgTicket), icon: BarChart3, color: "text-primary" },
    { label: "Novos Clientes", value: String(data.newCustomers), icon: Users, color: "text-primary" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-4">Painel Executivo</h1>

      <div className="flex gap-2 mb-6">
        {[7, 30, 90, 365].map(d => (
          <Button key={d} variant={period === d ? "default" : "outline"} size="sm" onClick={() => setPeriod(d)}>
            {d === 365 ? "1 ano" : `${d} dias`}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{[1,2,3,4,5,6].map(i => <div key={i} className="h-24 bg-card border rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {cards.map(c => (
            <div key={c.label} className="bg-card border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <c.icon className={`w-5 h-5 ${c.color}`} />
                <p className="font-body text-xs text-muted-foreground">{c.label}</p>
              </div>
              <p className={`font-display text-xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
