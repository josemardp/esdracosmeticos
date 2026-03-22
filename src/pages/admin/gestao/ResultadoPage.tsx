import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, ArrowDownCircle, ArrowUpCircle, Tag, Building2 } from "lucide-react";

interface FinCategory { id: string; name: string; }
interface CostCenter { id: string; name: string; }

interface Movement {
  type: string;
  amount: number;
  movement_date: string;
  financial_category_id: string | null;
  cost_center_id: string | null;
}

export default function ResultadoPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [categories, setCategories] = useState<FinCategory[]>([]);
  const [centers, setCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);

  // Default: last 6 months
  const today = new Date();
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  const [dateFrom, setDateFrom] = useState(sixMonthsAgo.toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(today.toISOString().slice(0, 10));

  const load = async () => {
    setLoading(true);
    const [movRes, catRes, ccRes] = await Promise.all([
      supabase
        .from("cash_movements")
        .select("type, amount, movement_date, financial_category_id, cost_center_id")
        .gte("movement_date", dateFrom + "T00:00:00")
        .lte("movement_date", dateTo + "T23:59:59")
        .order("movement_date")
        .limit(1000),
      supabase.from("financial_categories").select("id, name").order("name"),
      supabase.from("cost_centers").select("id, name").order("name"),
    ]);
    if (movRes.data) setMovements(movRes.data);
    if (catRes.data) setCategories(catRes.data);
    if (ccRes.data) setCenters(ccRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalIn = movements.filter((m) => m.type === "credit").reduce((s, m) => s + m.amount, 0);
  const totalOut = movements.filter((m) => m.type === "debit").reduce((s, m) => s + m.amount, 0);
  const saldo = totalIn - totalOut;

  const getCategoryName = (id: string | null) => categories.find((c) => c.id === id)?.name || "Sem categoria";
  const getCenterName = (id: string | null) => centers.find((c) => c.id === id)?.name || "Sem centro";

  // Monthly chart data
  const monthlyMap: Record<string, { entradas: number; saidas: number }> = {};
  movements.forEach((m) => {
    const d = new Date(m.movement_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap[key]) monthlyMap[key] = { entradas: 0, saidas: 0 };
    if (m.type === "credit") monthlyMap[key].entradas += m.amount;
    else monthlyMap[key].saidas += m.amount;
  });

  const chartData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => {
      const [y, mo] = key.split("-");
      return {
        mes: `${mo}/${y.slice(2)}`,
        Entradas: Number(val.entradas.toFixed(2)),
        Saídas: Number(val.saidas.toFixed(2)),
        Saldo: Number((val.entradas - val.saidas).toFixed(2)),
      };
    });

  // Expenses by category
  const byCategory: Record<string, number> = {};
  movements.filter((m) => m.type === "debit").forEach((m) => {
    const key = m.financial_category_id ? getCategoryName(m.financial_category_id) : "Sem categoria";
    byCategory[key] = (byCategory[key] || 0) + m.amount;
  });

  // By cost center
  const byCenter: Record<string, { income: number; expense: number }> = {};
  movements.forEach((m) => {
    const key = m.cost_center_id ? getCenterName(m.cost_center_id) : "Sem centro";
    if (!byCenter[key]) byCenter[key] = { income: 0, expense: 0 };
    if (m.type === "credit") byCenter[key].income += m.amount;
    else byCenter[key].expense += m.amount;
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground mb-6">Resultado Mensal</h1>

      {/* Period filter */}
      <div className="bg-card border rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1">
          <label className="font-body text-xs text-muted-foreground">De</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="font-body text-xs text-muted-foreground">Até</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <Button size="sm" onClick={load}>Aplicar</Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-card border rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-card border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownCircle className="w-4 h-4 text-success" />
                <span className="font-body text-xs text-muted-foreground">Total Entradas</span>
              </div>
              <p className="font-display text-xl text-success">R$ {totalIn.toFixed(2)}</p>
            </div>
            <div className="bg-card border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpCircle className="w-4 h-4 text-destructive" />
                <span className="font-body text-xs text-muted-foreground">Total Saídas</span>
              </div>
              <p className="font-display text-xl text-destructive">R$ {totalOut.toFixed(2)}</p>
            </div>
            <div className="bg-card border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="font-body text-xs text-muted-foreground">Resultado</span>
              </div>
              <p className={`font-display text-xl ${saldo >= 0 ? "text-success" : "text-destructive"}`}>R$ {saldo.toFixed(2)}</p>
            </div>
          </div>

          {/* Monthly chart */}
          {chartData.length > 0 && (
            <div className="bg-card border rounded-xl p-4 mb-6">
              <h3 className="font-body text-sm font-semibold text-foreground mb-4">Evolução Mensal</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Entradas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border rounded-xl p-4">
              <h3 className="font-body text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Despesas por Categoria
              </h3>
              {Object.keys(byCategory).length === 0 ? (
                <p className="font-body text-xs text-muted-foreground">Nenhuma despesa no período.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(byCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([name, value]) => {
                      const pct = totalOut > 0 ? ((value / totalOut) * 100).toFixed(1) : "0";
                      return (
                        <div key={name}>
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-body text-sm text-foreground truncate">{name}</span>
                            <span className="font-body text-sm font-bold text-destructive shrink-0">R$ {value.toFixed(2)} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-1.5">
                            <div className="bg-destructive h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="bg-card border rounded-xl p-4">
              <h3 className="font-body text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Resultado por Centro de Custo
              </h3>
              {Object.keys(byCenter).length === 0 ? (
                <p className="font-body text-xs text-muted-foreground">Nenhuma movimentação no período.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(byCenter)
                    .sort(([, a], [, b]) => (b.income - b.expense) - (a.income - a.expense))
                    .map(([name, val]) => (
                      <div key={name} className="flex justify-between items-center gap-2">
                        <span className="font-body text-sm text-foreground truncate">{name}</span>
                        <div className="flex gap-3 shrink-0 font-body text-xs">
                          <span className="text-success">+{val.income.toFixed(2)}</span>
                          <span className="text-destructive">-{val.expense.toFixed(2)}</span>
                          <span className={`font-bold ${val.income - val.expense >= 0 ? "text-success" : "text-destructive"}`}>
                            = {(val.income - val.expense).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
