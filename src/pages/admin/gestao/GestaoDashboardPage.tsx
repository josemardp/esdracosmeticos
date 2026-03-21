import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ShoppingBag, Clock, Wallet, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GestaoDashboardPage() {
  const [stats, setStats] = useState({ totalSales: 0, totalRevenue: 0, pendingAmount: 0, cashBalance: 0 });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [salesRes, titlesRes, cashRes, recentRes] = await Promise.all([
        supabase.from("sales").select("total").eq("status", "completed"),
        supabase.from("receivable_titles").select("amount, paid_amount").eq("status", "pending"),
        supabase.from("cash_accounts").select("balance").eq("active", true).limit(1).single(),
        supabase.from("sales").select("id, sale_code, customer_name, total, sale_date, channel:sales_channels(name)").order("sale_date", { ascending: false }).limit(5),
      ]);

      const totalRevenue = salesRes.data?.reduce((s, r) => s + r.total, 0) || 0;
      const pendingAmount = titlesRes.data?.reduce((s, r) => s + (r.amount - r.paid_amount), 0) || 0;

      setStats({
        totalSales: salesRes.data?.length || 0,
        totalRevenue,
        pendingAmount,
        cashBalance: cashRes.data?.balance || 0,
      });
      setRecentSales(recentRes.data || []);
      setLoading(false);
    })();
  }, []);

  const cards = [
    { label: "Vendas", value: stats.totalSales, icon: ShoppingBag, color: "text-primary" },
    { label: "Faturamento", value: `R$ ${stats.totalRevenue.toFixed(2)}`, icon: TrendingUp, color: "text-success" },
    { label: "A receber", value: `R$ ${stats.pendingAmount.toFixed(2)}`, icon: Clock, color: "text-yellow-600" },
    { label: "Saldo caixa", value: `R$ ${stats.cashBalance.toFixed(2)}`, icon: Wallet, color: "text-primary" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-foreground">Gestão</h1>
        <Link to="/admin/gestao/venda-rapida">
          <Button size="sm"><Plus className="w-4 h-4 mr-1.5" /> Nova Venda</Button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <c.icon className={`w-4 h-4 ${c.color}`} />
              <span className="font-body text-[11px] text-muted-foreground">{c.label}</span>
            </div>
            <p className="font-display text-lg text-foreground">{loading ? "..." : c.value}</p>
          </div>
        ))}
      </div>

      {/* Recent sales */}
      <h2 className="font-body text-sm font-semibold text-foreground mb-3">Vendas recentes</h2>
      {recentSales.length === 0 && !loading ? (
        <p className="font-body text-sm text-muted-foreground text-center py-8">Nenhuma venda registrada ainda.</p>
      ) : (
        <div className="space-y-2">
          {recentSales.map((s: any) => (
            <div key={s.id} className="bg-card border rounded-lg p-3 flex items-center justify-between">
              <div>
                <span className="font-body text-sm font-semibold text-foreground">{s.sale_code}</span>
                <p className="font-body text-xs text-muted-foreground">{s.customer_name} · {s.channel?.name}</p>
              </div>
              <div className="text-right">
                <p className="font-body text-sm font-bold">R$ {s.total.toFixed(2)}</p>
                <p className="font-body text-[10px] text-muted-foreground">{new Date(s.sale_date).toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 mt-8">
        <Link to="/admin/gestao/vendas" className="bg-card border rounded-xl p-4 text-center hover:shadow-sm transition-shadow">
          <ShoppingBag className="w-6 h-6 text-primary mx-auto mb-2" />
          <span className="font-body text-sm text-foreground">Todas as vendas</span>
        </Link>
        <Link to="/admin/gestao/receber" className="bg-card border rounded-xl p-4 text-center hover:shadow-sm transition-shadow">
          <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
          <span className="font-body text-sm text-foreground">Contas a receber</span>
        </Link>
        <Link to="/admin/gestao/caixa" className="bg-card border rounded-xl p-4 text-center hover:shadow-sm transition-shadow">
          <Wallet className="w-6 h-6 text-primary mx-auto mb-2" />
          <span className="font-body text-sm text-foreground">Caixa</span>
        </Link>
        <Link to="/admin/gestao/clientes" className="bg-card border rounded-xl p-4 text-center hover:shadow-sm transition-shadow">
          <TrendingUp className="w-6 h-6 text-success mx-auto mb-2" />
          <span className="font-body text-sm text-foreground">Clientes</span>
        </Link>
      </div>
    </div>
  );
}
