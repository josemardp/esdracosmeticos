import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { TrendingUp, AlertTriangle, CalendarDays, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

interface MonthData {
  month: string;
  receber: number;
  pagar: number;
  saldo: number;
}

interface BlockTotals {
  receber: number;
  pagar: number;
}

export default function ProjecaoPage() {
  const [overdue, setOverdue] = useState<BlockTotals>({ receber: 0, pagar: 0 });
  const [next30, setNext30] = useState<BlockTotals>({ receber: 0, pagar: 0 });
  const [chartData, setChartData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const d30 = new Date(today);
      d30.setDate(d30.getDate() + 30);
      const d30Str = d30.toISOString().split("T")[0];
      const d6m = new Date(today);
      d6m.setMonth(d6m.getMonth() + 6);
      const d6mStr = d6m.toISOString().split("T")[0];

      const openStatuses = ["pending", "partial"];

      const [
        { data: recOverdue },
        { data: pagOverdue },
        { data: rec30 },
        { data: pag30 },
        { data: rec6m },
        { data: pag6m },
      ] = await Promise.all([
        supabase.from("receivable_titles").select("amount, paid_amount").in("status", openStatuses).lt("due_date", todayStr).limit(500),
        supabase.from("payable_titles").select("amount, paid_amount").in("status", openStatuses).lt("due_date", todayStr).limit(500),
        supabase.from("receivable_titles").select("amount, paid_amount").in("status", openStatuses).gte("due_date", todayStr).lte("due_date", d30Str).limit(500),
        supabase.from("payable_titles").select("amount, paid_amount").in("status", openStatuses).gte("due_date", todayStr).lte("due_date", d30Str).limit(500),
        supabase.from("receivable_titles").select("amount, paid_amount, due_date").in("status", openStatuses).gte("due_date", todayStr).lte("due_date", d6mStr).limit(500),
        supabase.from("payable_titles").select("amount, paid_amount, due_date").in("status", openStatuses).gte("due_date", todayStr).lte("due_date", d6mStr).limit(500),
      ]);

      const sum = (rows: any[] | null) => (rows || []).reduce((s, r) => s + (r.amount - r.paid_amount), 0);

      setOverdue({ receber: sum(recOverdue), pagar: sum(pagOverdue) });
      setNext30({ receber: sum(rec30), pagar: sum(pag30) });

      // Chart — group by month
      const months: Record<string, { receber: number; pagar: number }> = {};
      const monthKeys: string[] = [];
      for (let i = 0; i < 6; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        months[key] = { receber: 0, pagar: 0 };
        monthKeys.push(key);
      }

      (rec6m || []).forEach(r => {
        const key = r.due_date.substring(0, 7);
        if (months[key]) months[key].receber += (r.amount - r.paid_amount);
      });
      (pag6m || []).forEach(p => {
        const key = p.due_date.substring(0, 7);
        if (months[key]) months[key].pagar += (p.amount - p.paid_amount);
      });

      setChartData(monthKeys.map(key => {
        const d = new Date(key + "-01");
        return {
          month: d.toLocaleDateString("pt-BR", { month: "short" }),
          receber: parseFloat(months[key].receber.toFixed(2)),
          pagar: parseFloat(months[key].pagar.toFixed(2)),
          saldo: parseFloat((months[key].receber - months[key].pagar).toFixed(2)),
        };
      }));

      setLoading(false);
    })();
  }, []);

  const fmt = (v: number) => `R$ ${v.toFixed(2)}`;

  const SummaryCards = ({ title, icon: Icon, data, iconColor }: { title: string; icon: any; data: BlockTotals; iconColor: string }) => {
    const saldo = data.receber - data.pagar;
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <h2 className="font-display text-sm font-semibold text-foreground">{title}</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border rounded-xl p-3">
            <span className="font-body text-[10px] text-muted-foreground">A Receber</span>
            <p className="font-display text-lg text-success">{fmt(data.receber)}</p>
          </div>
          <div className="bg-card border rounded-xl p-3">
            <span className="font-body text-[10px] text-muted-foreground">A Pagar</span>
            <p className="font-display text-lg text-destructive">{fmt(data.pagar)}</p>
          </div>
          <div className="bg-card border rounded-xl p-3">
            <span className="font-body text-[10px] text-muted-foreground">Saldo</span>
            <p className={`font-display text-lg ${saldo >= 0 ? "text-success" : "text-destructive"}`}>{fmt(saldo)}</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <h1 className="font-display text-2xl text-foreground mb-4">Projeção Financeira</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 bg-card border rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground mb-4">Projeção Financeira</h1>

      {(overdue.receber > 0 || overdue.pagar > 0) && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6">
          <SummaryCards title="Vencido" icon={AlertTriangle} data={overdue} iconColor="text-destructive" />
        </div>
      )}

      <SummaryCards title="Próximos 30 dias" icon={CalendarDays} data={next30} iconColor="text-primary" />

      <div className="bg-card border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="font-body text-sm font-semibold text-foreground">Próximos 6 meses</h2>
        </div>
        {chartData.every(d => d.receber === 0 && d.pagar === 0) ? (
          <p className="font-body text-sm text-muted-foreground text-center py-12">Sem dados para projeção.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} domain={[
                (dataMin: number) => {
                  const saldoVencido = overdue.receber - overdue.pagar;
                  return Math.min(dataMin, saldoVencido) * 1.1;
                },
                'auto'
              ]} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `R$ ${value.toFixed(2)}`,
                  name === "receber" ? "A Receber (futuro)" : name === "pagar" ? "A Pagar (futuro)" : "Saldo",
                ]}
              />
              <Legend formatter={v => v === "receber" ? "A Receber (futuro)" : v === "pagar" ? "A Pagar (futuro)" : "Saldo"} />
              <Bar dataKey="receber" fill="hsl(var(--success, 142 71% 45%))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pagar" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              <ReferenceLine
                y={overdue.receber - overdue.pagar}
                stroke={overdue.receber > 0 || overdue.pagar > 0 ? "#f59e0b" : "transparent"}
                strokeDasharray="6 3"
                strokeWidth={2}
                label={
                  overdue.receber > 0 || overdue.pagar > 0
                    ? {
                        value: `Saldo vencido: R$ ${(overdue.receber - overdue.pagar).toFixed(2)}`,
                        position: "insideTopRight",
                        fontSize: 11,
                        fill: "#f59e0b",
                        fontWeight: 600,
                      }
                    : undefined
                }
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
