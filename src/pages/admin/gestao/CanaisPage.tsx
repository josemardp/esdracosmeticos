import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface ChannelData { name: string; revenue: number; count: number; }

export default function CanaisPage() {
  const [data, setData] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - period * 86400000).toISOString();

      const [salesRes, channelsRes, ordersRes] = await Promise.all([
        supabase.from("sales").select("channel_id, total").gte("sale_date", since),
        supabase.from("sales_channels").select("id, name"),
        supabase.from("orders").select("total, channel_origin").gte("created_at", since).neq("status", "cancelled"),
      ]);

      const channelMap = new Map((channelsRes.data || []).map((c: any) => [c.id, c.name]));
      const result: Record<string, ChannelData> = {};

      for (const s of (salesRes.data || [])) {
        const name = channelMap.get((s as any).channel_id) || "Outro";
        if (!result[name]) result[name] = { name, revenue: 0, count: 0 };
        result[name].revenue += (s as any).total || 0;
        result[name].count += 1;
      }

      for (const o of (ordersRes.data || [])) {
        const name = "E-commerce";
        if (!result[name]) result[name] = { name, revenue: 0, count: 0 };
        result[name].revenue += (o as any).total || 0;
        result[name].count += 1;
      }

      setData(Object.values(result).sort((a, b) => b.revenue - a.revenue));
      setLoading(false);
    })();
  }, [period]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const tickFmt = (v: number) => v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v.toFixed(0)}`;

  return (
    <div>
      <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-4">Resultado por Canal</h1>

      <div className="flex gap-2 mb-6">
        {[7, 30, 90, 365].map(d => (
          <Button key={d} variant={period === d ? "default" : "outline"} size="sm" onClick={() => setPeriod(d)}>
            {d === 365 ? "1 ano" : `${d} dias`}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="h-64 bg-card border rounded-xl animate-pulse" />
      ) : data.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">Sem dados no período.</p>
        </div>
      ) : (
        <>
          <div className="bg-card border rounded-xl p-4 mb-4" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={tickFmt} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="revenue" name="Receita" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {data.map(d => (
              <div key={d.name} className="bg-card border rounded-xl p-3 flex items-center justify-between">
                <div>
                  <h3 className="font-body text-sm font-medium text-foreground">{d.name}</h3>
                  <p className="font-body text-xs text-muted-foreground">{d.count} venda(s)</p>
                </div>
                <p className="font-body text-sm font-bold text-foreground">{fmt(d.revenue)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
