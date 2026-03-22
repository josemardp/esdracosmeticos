import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

interface MonthData {
  month: string;
  receber: number;
  pagar: number;
  saldo: number;
}

export default function ProjecaoPage() {
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Get next 6 months of pending titles
      const today = new Date();
      const limit = new Date(today);
      limit.setMonth(limit.getMonth() + 6);

      const [{ data: receber }, { data: pagar }] = await Promise.all([
        supabase
          .from("receivable_titles")
          .select("amount, paid_amount, due_date")
          .in("status", ["pending"])
          .gte("due_date", today.toISOString().split("T")[0])
          .lte("due_date", limit.toISOString().split("T")[0])
          .limit(500),
        supabase
          .from("payable_titles")
          .select("amount, paid_amount, due_date")
          .in("status", ["pending", "partial"])
          .gte("due_date", today.toISOString().split("T")[0])
          .lte("due_date", limit.toISOString().split("T")[0])
          .limit(500),
      ]);

      // Group by month
      const months: Record<string, { receber: number; pagar: number }> = {};
      const monthLabels: string[] = [];

      for (let i = 0; i < 6; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        months[key] = { receber: 0, pagar: 0 };
        monthLabels.push(key);
      }

      (receber || []).forEach(r => {
        const key = r.due_date.substring(0, 7);
        if (months[key]) months[key].receber += (r.amount - r.paid_amount);
      });

      (pagar || []).forEach(p => {
        const key = p.due_date.substring(0, 7);
        if (months[key]) months[key].pagar += (p.amount - p.paid_amount);
      });

      const chartData: MonthData[] = monthLabels.map(key => {
        const d = new Date(key + "-01");
        return {
          month: d.toLocaleDateString("pt-BR", { month: "short" }),
          receber: parseFloat(months[key].receber.toFixed(2)),
          pagar: parseFloat(months[key].pagar.toFixed(2)),
          saldo: parseFloat((months[key].receber - months[key].pagar).toFixed(2)),
        };
      });

      setData(chartData);
      setLoading(false);
    })();
  }, []);

  const totalReceber = data.reduce((s, d) => s + d.receber, 0);
  const totalPagar = data.reduce((s, d) => s + d.pagar, 0);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground mb-4">Projeção Financeira</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-card border rounded-xl p-4">
          <span className="font-body text-xs text-muted-foreground">Total a Receber</span>
          <p className="font-display text-xl text-success">R$ {totalReceber.toFixed(2)}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <span className="font-body text-xs text-muted-foreground">Total a Pagar</span>
          <p className="font-display text-xl text-destructive">R$ {totalPagar.toFixed(2)}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="font-body text-xs text-muted-foreground">Saldo Projetado</span>
          </div>
          <p className={`font-display text-xl ${(totalReceber - totalPagar) >= 0 ? "text-success" : "text-destructive"}`}>
            R$ {(totalReceber - totalPagar).toFixed(2)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 bg-card border rounded-xl animate-pulse" />
      ) : data.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground text-center py-12">Sem dados para projeção.</p>
      ) : (
        <div className="bg-card border rounded-xl p-4">
          <h2 className="font-body text-sm font-semibold text-foreground mb-4">Próximos 6 meses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `R$ ${value.toFixed(2)}`,
                  name === "receber" ? "A Receber" : name === "pagar" ? "A Pagar" : "Saldo",
                ]}
              />
              <Legend formatter={v => v === "receber" ? "A Receber" : v === "pagar" ? "A Pagar" : "Saldo"} />
              <Bar dataKey="receber" fill="hsl(var(--success, 142 71% 45%))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pagar" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
