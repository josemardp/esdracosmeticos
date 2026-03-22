import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Globe, Store } from "lucide-react";

type Origin = "all" | "manual" | "online";

interface UnifiedSale {
  id: string;
  code: string;
  customer: string;
  total: number;
  date: string;
  origin: "manual" | "online";
  channel: string;
  status: string;
}

export default function VendasConsolidadasPage() {
  const [items, setItems] = useState<UnifiedSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Origin>("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [salesRes, ordersRes] = await Promise.all([
        supabase
          .from("sales")
          .select("id, sale_code, customer_name, total, sale_date, status, channel:sales_channels(name)")
          .order("sale_date", { ascending: false })
          .limit(100),
        supabase
          .from("orders")
          .select("id, order_code, total, created_at, status, channel_origin, customer_id, customers(name)")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      const manual: UnifiedSale[] = (salesRes.data || []).map((s: any) => ({
        id: s.id,
        code: s.sale_code,
        customer: s.customer_name,
        total: s.total,
        date: s.sale_date,
        origin: "manual" as const,
        channel: s.channel?.name || "Manual",
        status: s.status,
      }));

      const online: UnifiedSale[] = (ordersRes.data || []).map((o: any) => ({
        id: o.id,
        code: o.order_code,
        customer: o.customers?.name || "Cliente",
        total: o.total,
        date: o.created_at,
        origin: "online" as const,
        channel: o.channel_origin || "Site",
        status: o.status,
      }));

      const all = [...manual, ...online].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setItems(all);
      setLoading(false);
    })();
  }, []);

  const filtered = filter === "all" ? items : items.filter((i) => i.origin === filter);

  const totalManual = items.filter((i) => i.origin === "manual").reduce((s, i) => s + i.total, 0);
  const totalOnline = items.filter((i) => i.origin === "online").reduce((s, i) => s + i.total, 0);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground mb-4">Vendas Consolidadas</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Store className="w-4 h-4 text-primary" />
            <span className="font-body text-[11px] text-muted-foreground">Vendas manuais</span>
          </div>
          <p className="font-display text-lg text-foreground">R$ {totalManual.toFixed(2)}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-primary" />
            <span className="font-body text-[11px] text-muted-foreground">Vendas online</span>
          </div>
          <p className="font-display text-lg text-foreground">R$ {totalOnline.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {([
          { key: "all", label: "Todas" },
          { key: "manual", label: "Manuais" },
          { key: "online", label: "Online" },
        ] as const).map((f) => (
          <Button key={f.key} variant={filter === f.key ? "default" : "outline"} size="sm" onClick={() => setFilter(f.key)}>
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-card border rounded-lg animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">Nenhuma venda encontrada.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <div key={s.id} className="bg-card border rounded-lg p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-body text-sm font-semibold text-foreground">{s.code}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {s.origin === "online" ? "🌐 Online" : "🏪 Manual"}
                  </Badge>
                </div>
                <p className="font-body text-xs text-muted-foreground truncate">{s.customer}</p>
                <p className="font-body text-[10px] text-muted-foreground">
                  {new Date(s.date).toLocaleDateString("pt-BR")} · {s.channel}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-body text-sm font-bold text-foreground">R$ {s.total.toFixed(2)}</p>
                <Badge variant={s.status === "completed" || s.status === "delivered" ? "default" : "secondary"} className="text-[10px]">
                  {s.status === "completed" ? "Concluída" : s.status === "pending" ? "Pendente" : s.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
