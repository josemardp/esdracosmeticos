import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Sale {
  id: string;
  sale_code: string;
  customer_name: string;
  total: number;
  status: string;
  sale_date: string;
  installments: number;
  channel: { name: string } | null;
  payment: { name: string } | null;
}

export default function VendasPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("id, sale_code, customer_name, total, status, sale_date, installments, channel:sales_channels(name), payment:payment_methods(name)")
        .order("sale_date", { ascending: false })
        .limit(100);
      if (data) setSales(data as any);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-card border rounded-lg animate-pulse" />)}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-foreground">Vendas</h1>
        <Link to="/admin/gestao/venda-rapida">
          <Button size="sm"><ShoppingBag className="w-4 h-4 mr-1.5" /> Nova Venda</Button>
        </Link>
      </div>

      {sales.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground mb-4">Nenhuma venda registrada ainda.</p>
          <Link to="/admin/gestao/venda-rapida"><Button>Registrar primeira venda</Button></Link>
        </div>
      ) : (
        <div className="space-y-2">
          {sales.map((s) => (
            <div key={s.id} className="bg-card border rounded-lg p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-body text-sm font-semibold text-foreground">{s.sale_code}</span>
                  <Badge variant="outline" className="text-[10px]">{(s.channel as any)?.name || "—"}</Badge>
                </div>
                <p className="font-body text-xs text-muted-foreground truncate">{s.customer_name}</p>
                <p className="font-body text-[10px] text-muted-foreground">
                  {new Date(s.sale_date).toLocaleDateString("pt-BR")} · {(s.payment as any)?.name || "—"}
                  {s.installments > 1 ? ` · ${s.installments}x` : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-body text-sm font-bold text-foreground">R$ {s.total.toFixed(2)}</p>
                <Badge variant={s.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                  {s.status === "completed" ? "Concluída" : s.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
