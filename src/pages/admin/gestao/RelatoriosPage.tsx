import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowDownCircle, ArrowUpCircle, Filter, Tag, Building2 } from "lucide-react";

interface FinCategory { id: string; name: string; }
interface CostCenter { id: string; name: string; }

interface Movement {
  id: string;
  type: string;
  amount: number;
  description: string;
  movement_date: string;
  financial_category_id: string | null;
  cost_center_id: string | null;
}

export default function RelatoriosPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [categories, setCategories] = useState<FinCategory[]>([]);
  const [centers, setCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = today.toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(firstDay);
  const [dateTo, setDateTo] = useState(lastDay);
  const [filterType, setFilterType] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterCenter, setFilterCenter] = useState<string>("");

  const load = async () => {
    setLoading(true);
    const [catRes, ccRes] = await Promise.all([
      supabase.from("financial_categories").select("id, name").eq("active", true).order("name"),
      supabase.from("cost_centers").select("id, name").eq("active", true).order("name"),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (ccRes.data) setCenters(ccRes.data);
    await applyFilters();
  };

  const applyFilters = async () => {
    setLoading(true);
    let query = supabase
      .from("cash_movements")
      .select("id, type, amount, description, movement_date, financial_category_id, cost_center_id")
      .gte("movement_date", dateFrom + "T00:00:00")
      .lte("movement_date", dateTo + "T23:59:59")
      .order("movement_date", { ascending: false })
      .limit(500);

    if (filterType) query = query.eq("type", filterType);
    if (filterCategory) query = query.eq("financial_category_id", filterCategory);
    if (filterCenter) query = query.eq("cost_center_id", filterCenter);

    const { data } = await query;
    if (data) setMovements(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalIn = movements.filter((m) => m.type === "credit").reduce((s, m) => s + m.amount, 0);
  const totalOut = movements.filter((m) => m.type === "debit").reduce((s, m) => s + m.amount, 0);
  const saldo = totalIn - totalOut;

  const getCategoryName = (id: string | null) => categories.find((c) => c.id === id)?.name || "Sem categoria";
  const getCenterName = (id: string | null) => centers.find((c) => c.id === id)?.name || "Sem centro";

  // Group by category
  const byCategory: Record<string, number> = {};
  movements.forEach((m) => {
    const key = m.financial_category_id ? getCategoryName(m.financial_category_id) : "Sem categoria";
    byCategory[key] = (byCategory[key] || 0) + (m.type === "debit" ? m.amount : 0);
  });

  // Group by center
  const byCenter: Record<string, { income: number; expense: number }> = {};
  movements.forEach((m) => {
    const key = m.cost_center_id ? getCenterName(m.cost_center_id) : "Sem centro";
    if (!byCenter[key]) byCenter[key] = { income: 0, expense: 0 };
    if (m.type === "credit") byCenter[key].income += m.amount;
    else byCenter[key].expense += m.amount;
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground mb-6">Relatórios</h1>

      {/* Filters */}
      <div className="bg-card border rounded-xl p-4 mb-6 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="font-body text-sm font-semibold text-foreground">Filtros</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="h-10 rounded-md border bg-background px-3 font-body text-sm">
            <option value="">Todos os tipos</option>
            <option value="credit">Entradas</option>
            <option value="debit">Saídas</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="h-10 rounded-md border bg-background px-3 font-body text-sm">
            <option value="">Todas categorias</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterCenter} onChange={(e) => setFilterCenter(e.target.value)} className="h-10 rounded-md border bg-background px-3 font-body text-sm">
            <option value="">Todos centros</option>
            {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <Button size="sm" onClick={applyFilters}>Aplicar filtros</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-card border rounded-xl p-4">
          <span className="font-body text-xs text-muted-foreground">Entradas no período</span>
          <p className="font-display text-xl text-success">R$ {totalIn.toFixed(2)}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <span className="font-body text-xs text-muted-foreground">Saídas no período</span>
          <p className="font-display text-xl text-destructive">R$ {totalOut.toFixed(2)}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <span className="font-body text-xs text-muted-foreground">Saldo do período</span>
          <p className={`font-display text-xl ${saldo >= 0 ? "text-success" : "text-destructive"}`}>R$ {saldo.toFixed(2)}</p>
        </div>
      </div>

      {/* Despesas por categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border rounded-xl p-4">
          <h3 className="font-body text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4" /> Despesas por Categoria
          </h3>
          {Object.keys(byCategory).length === 0 ? (
            <p className="font-body text-xs text-muted-foreground">Nenhuma despesa no período.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(byCategory)
                .filter(([, v]) => v > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([name, value]) => (
                  <div key={name} className="flex justify-between items-center">
                    <span className="font-body text-sm text-foreground truncate">{name}</span>
                    <span className="font-body text-sm font-bold text-destructive shrink-0">R$ {value.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="bg-card border rounded-xl p-4">
          <h3 className="font-body text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Leitura por Centro de Custo
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

      {/* Movement list */}
      <h2 className="font-body text-sm font-semibold text-foreground mb-3">
        Movimentações ({movements.length})
      </h2>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-card border rounded-lg animate-pulse" />)}</div>
      ) : movements.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground text-center py-12">Nenhuma movimentação encontrada.</p>
      ) : (
        <div className="space-y-2">
          {movements.map((m) => (
            <div key={m.id} className="bg-card border rounded-lg p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {m.type === "credit" ? <ArrowDownCircle className="w-4 h-4 text-success shrink-0" /> : <ArrowUpCircle className="w-4 h-4 text-destructive shrink-0" />}
                <div className="min-w-0">
                  <p className="font-body text-sm text-foreground truncate">{m.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="font-body text-[10px] text-muted-foreground">
                      {new Date(m.movement_date).toLocaleDateString("pt-BR")}
                    </span>
                    {m.financial_category_id && (
                      <span className="text-[10px] font-body bg-primary/10 text-primary px-1.5 py-0 rounded-full">{getCategoryName(m.financial_category_id)}</span>
                    )}
                    {m.cost_center_id && (
                      <span className="text-[10px] font-body bg-accent text-accent-foreground px-1.5 py-0 rounded-full">{getCenterName(m.cost_center_id)}</span>
                    )}
                  </div>
                </div>
              </div>
              <span className={`font-body text-sm font-bold shrink-0 ${m.type === "credit" ? "text-success" : "text-destructive"}`}>
                {m.type === "credit" ? "+" : "-"}R$ {m.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
