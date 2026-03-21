import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Package, Users, DollarSign, AlertTriangle, Clock, PackageX, MessageSquare, TrendingUp, BarChart3, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Stats {
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  totalRevenue: number;
  lowStock: number;
  zeroStock: number;
  pendingOrders: number;
  pendingTickets: number;
  avgTicket: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
}

interface TopProduct { name: string; qty: number; revenue: number; }
interface OrdersByStatus { status: string; count: number; }
interface RevenueByMonth { month: string; revenue: number; orders: number; }

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmado", processing: "Em preparo",
  shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
};
const STATUS_COLORS = ["hsl(var(--warning))", "hsl(var(--primary))", "hsl(var(--info))", "hsl(38,92%,50%)", "hsl(var(--success))", "hsl(var(--destructive))"];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, totalProducts: 0, totalCustomers: 0, totalRevenue: 0, lowStock: 0, zeroStock: 0, pendingOrders: 0, pendingTickets: 0, avgTicket: 0, ordersThisMonth: 0, revenueThisMonth: 0 });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<OrdersByStatus[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueByMonth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [orders, products, customers, lowStock, zeroStock, pendingOrders, tickets, monthOrders] = await Promise.all([
        supabase.from("orders").select("total, status, created_at", { count: "exact" }),
        supabase.from("products").select("id", { count: "exact" }),
        supabase.from("customers").select("id", { count: "exact" }),
        supabase.from("products").select("id", { count: "exact" }).lt("inventory_count", 5).gt("inventory_count", 0),
        supabase.from("products").select("id", { count: "exact" }).eq("inventory_count", 0),
        supabase.from("orders").select("id", { count: "exact" }).eq("status", "pending"),
        supabase.from("support_tickets").select("id", { count: "exact" }).eq("status", "new"),
        supabase.from("orders").select("total").gte("created_at", startOfMonth),
      ]);

      const allOrders = orders.data ?? [];
      const revenue = allOrders.reduce((s, o) => s + Number(o.total), 0);
      const monthRevenue = (monthOrders.data ?? []).reduce((s, o) => s + Number(o.total), 0);
      const avgTicket = allOrders.length > 0 ? revenue / allOrders.length : 0;

      // Orders by status
      const statusMap: Record<string, number> = {};
      allOrders.forEach(o => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
      setOrdersByStatus(Object.entries(statusMap).map(([status, count]) => ({ status, count })));

      // Revenue by month (last 6 months)
      const monthMap: Record<string, { revenue: number; orders: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap[key] = { revenue: 0, orders: 0 };
      }
      allOrders.forEach(o => {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthMap[key]) { monthMap[key].revenue += Number(o.total); monthMap[key].orders += 1; }
      });
      setRevenueByMonth(Object.entries(monthMap).map(([month, d]) => ({
        month: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short' }),
        revenue: d.revenue, orders: d.orders
      })));

      // Top products
      const { data: topItems } = await supabase.from("order_items").select("product_id, name_snapshot, quantity, subtotal").limit(500);
      const prodMap: Record<string, TopProduct> = {};
      (topItems ?? []).forEach(item => {
        const key = item.product_id || item.name_snapshot;
        if (!prodMap[key]) prodMap[key] = { name: item.name_snapshot, qty: 0, revenue: 0 };
        prodMap[key].qty += item.quantity;
        prodMap[key].revenue += Number(item.subtotal);
      });
      setTopProducts(Object.values(prodMap).sort((a, b) => b.qty - a.qty).slice(0, 5));

      setStats({
        totalOrders: orders.count ?? 0, totalProducts: products.count ?? 0,
        totalCustomers: customers.count ?? 0, totalRevenue: revenue,
        lowStock: lowStock.count ?? 0, zeroStock: zeroStock.count ?? 0,
        pendingOrders: pendingOrders.count ?? 0, pendingTickets: tickets.count ?? 0,
        avgTicket, ordersThisMonth: monthOrders.data?.length ?? 0, revenueThisMonth: monthRevenue,
      });
      setLoading(false);
    };
    fetchAll();
  }, []);

  const cards = [
    { label: "Faturamento Total", value: `R$ ${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-success" },
    { label: "Pedidos", value: stats.totalOrders, icon: ShoppingCart, color: "text-primary" },
    { label: "Ticket Médio", value: `R$ ${stats.avgTicket.toFixed(2)}`, icon: TrendingUp, color: "text-gold" },
    { label: "Clientes", value: stats.totalCustomers, icon: Users, color: "text-info" },
  ];

  const secondaryCards = [
    { label: "Faturamento Mês", value: `R$ ${stats.revenueThisMonth.toFixed(2)}`, icon: BarChart3, color: "text-primary" },
    { label: "Pedidos Mês", value: stats.ordersThisMonth, icon: ShoppingCart, color: "text-info" },
    { label: "Produtos Ativos", value: stats.totalProducts, icon: Package, color: "text-muted-foreground" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-6">Dashboard</h1>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-card border rounded-xl p-6 animate-pulse h-24" />)}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {cards.map(c => (
              <div key={c.label} className="bg-card border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-body text-xs text-muted-foreground uppercase tracking-wide">{c.label}</span>
                  <c.icon className={`w-4 h-4 ${c.color}`} />
                </div>
                <p className="font-display text-xl lg:text-2xl font-semibold text-foreground">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {secondaryCards.map(c => (
              <div key={c.label} className="bg-card border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <c.icon className={`w-3.5 h-3.5 ${c.color}`} />
                  <span className="font-body text-[11px] text-muted-foreground uppercase tracking-wide">{c.label}</span>
                </div>
                <p className="font-display text-lg font-semibold text-foreground">{c.value}</p>
              </div>
            ))}
          </div>

          {/* Alerts */}
          <div className="space-y-2 mb-6">
            {stats.pendingOrders > 0 && (
              <Link to="/admin/pedidos" className="flex items-center justify-between bg-warning/10 border border-warning/20 rounded-lg p-4 hover:bg-warning/15 transition-colors">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-warning" />
                  <p className="font-body text-sm text-foreground"><strong>{stats.pendingOrders}</strong> pedido(s) pendente(s)</p>
                </div>
                <Button variant="outline" size="sm">Ver pedidos</Button>
              </Link>
            )}
            {stats.zeroStock > 0 && (
              <Link to="/admin/estoque" className="flex items-center justify-between bg-destructive/10 border border-destructive/20 rounded-lg p-4 hover:bg-destructive/15 transition-colors">
                <div className="flex items-center gap-3">
                  <PackageX className="w-5 h-5 text-destructive" />
                  <p className="font-body text-sm text-foreground"><strong>{stats.zeroStock}</strong> produto(s) sem estoque</p>
                </div>
                <Button variant="outline" size="sm">Ver estoque</Button>
              </Link>
            )}
            {stats.lowStock > 0 && (
              <Link to="/admin/estoque" className="flex items-center justify-between bg-warning/10 border border-warning/20 rounded-lg p-4 hover:bg-warning/15 transition-colors">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <p className="font-body text-sm text-foreground"><strong>{stats.lowStock}</strong> produto(s) com estoque baixo</p>
                </div>
                <Button variant="outline" size="sm">Ver estoque</Button>
              </Link>
            )}
            {stats.pendingTickets > 0 && (
              <Link to="/admin/suporte" className="flex items-center justify-between bg-info/10 border border-info/20 rounded-lg p-4 hover:bg-info/15 transition-colors">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-info" />
                  <p className="font-body text-sm text-foreground"><strong>{stats.pendingTickets}</strong> ticket(s) pendente(s)</p>
                </div>
                <Button variant="outline" size="sm">Ver suporte</Button>
              </Link>
            )}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Revenue Chart */}
            <div className="bg-card border rounded-xl p-5">
              <h3 className="font-body text-sm font-semibold text-foreground mb-4">Faturamento (últimos 6 meses)</h3>
              {revenueByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={revenueByMonth}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                    <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, 'Faturamento']} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="font-body text-xs text-muted-foreground text-center py-8">Sem dados suficientes</p>}
            </div>

            {/* Orders by Status */}
            <div className="bg-card border rounded-xl p-5">
              <h3 className="font-body text-sm font-semibold text-foreground mb-4">Funil de Pedidos</h3>
              {ordersByStatus.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={ordersByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                        {ordersByStatus.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 flex-1">
                    {ordersByStatus.map((s, i) => (
                      <div key={s.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                          <span className="font-body text-xs text-muted-foreground">{STATUS_LABELS[s.status] || s.status}</span>
                        </div>
                        <span className="font-body text-xs font-semibold text-foreground">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <p className="font-body text-xs text-muted-foreground text-center py-8">Sem pedidos</p>}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-card border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-body text-sm font-semibold text-foreground flex items-center gap-2"><Star className="w-4 h-4 text-gold" /> Produtos Mais Vendidos</h3>
              <Link to="/admin/produtos" className="font-body text-xs text-primary hover:underline flex items-center gap-1">Ver todos <ArrowRight className="w-3 h-3" /></Link>
            </div>
            {topProducts.length > 0 ? (
              <div className="space-y-2.5">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center font-body text-xs font-bold text-muted-foreground shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-foreground line-clamp-1">{p.name}</p>
                      <p className="font-body text-[11px] text-muted-foreground">{p.qty} unidades · R$ {p.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="font-body text-xs text-muted-foreground text-center py-6">Nenhuma venda registrada</p>}
          </div>
        </>
      )}
    </div>
  );
}
