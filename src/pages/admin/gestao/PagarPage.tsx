import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, CheckCircle, Clock, AlertTriangle, Wallet } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Title {
  id: string;
  description: string;
  amount: number;
  paid_amount: number;
  due_date: string;
  status: string;
  installment_number: number;
  total_installments: number;
  supplier: { name: string } | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  partial: { label: "Parcial", color: "bg-blue-100 text-blue-800", icon: AlertTriangle },
  paid: { label: "Pago", color: "bg-green-100 text-green-800", icon: CheckCircle },
  overdue: { label: "Vencido", color: "bg-red-100 text-red-800", icon: AlertTriangle },
  cancelled: { label: "Cancelado", color: "bg-gray-100 text-gray-800", icon: Clock },
};

export default function PagarPage() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("payable_titles")
      .select("id, description, amount, paid_amount, due_date, status, installment_number, total_installments, supplier:suppliers(name)")
      .order("due_date");
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query.limit(200);
    if (data) setTitles(data as unknown as Title[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const totalPending = titles
    .filter(t => t.status === "pending" || t.status === "partial")
    .reduce((s, t) => s + (t.amount - t.paid_amount), 0);

  const markPaid = async (title: Title) => {
    if (payingId) return;
    setPayingId(title.id);
    try {
      const { error } = await supabase.rpc("register_payment", { p_title_id: title.id });
      if (error) {
        toast({ title: "Erro ao pagar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Pagamento registrado!" });
      }
    } finally {
      setPayingId(null);
      load();
    }
  };

  const isOverdue = (t: Title) => t.status === "pending" && new Date(t.due_date) < new Date(new Date().toDateString());

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground mb-4">Contas a Pagar</h1>

      <div className="bg-card border rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-4 h-4 text-destructive" />
          <span className="font-body text-xs text-muted-foreground">Total pendente</span>
        </div>
        <p className="font-display text-2xl text-destructive">R$ {totalPending.toFixed(2)}</p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: "all", label: "Todos" },
          { key: "pending", label: "Pendente" },
          { key: "partial", label: "Parcial" },
          { key: "paid", label: "Pago" },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`font-body text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === f.key ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-card border rounded-lg animate-pulse" />)}</div>
      ) : titles.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground text-center py-12">Nenhum título encontrado.</p>
      ) : (
        <div className="space-y-2">
          {titles.map(t => {
            const overdue = isOverdue(t);
            const remaining = t.amount - t.paid_amount;
            const sc = statusConfig[overdue ? "overdue" : t.status] || statusConfig.pending;
            const Icon = sc.icon;
            return (
              <div key={t.id} className="bg-card border rounded-lg p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <ArrowUpCircle className={`w-5 h-5 shrink-0 ${overdue ? "text-destructive" : "text-muted-foreground"}`} />
                  <div className="min-w-0">
                    <p className="font-body text-sm text-foreground truncate">{t.description}</p>
                    <p className="font-body text-[10px] text-muted-foreground">
                      {t.supplier?.name || "—"} · Venc. {new Date(t.due_date + "T00:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="font-body text-sm font-bold text-foreground">R$ {t.amount.toFixed(2)}</p>
                    {t.paid_amount > 0 && t.status !== "paid" && (
                      <p className="font-body text-[10px] text-muted-foreground">Pago: R$ {t.paid_amount.toFixed(2)}</p>
                    )}
                  </div>
                  <Badge className={`text-[10px] ${sc.color}`}><Icon className="w-3 h-3 mr-0.5" />{sc.label}</Badge>
                  {(t.status === "pending" || t.status === "partial") && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={payingId !== null}
                      onClick={() => markPaid(t)}
                      className="text-xs"
                    >
                      {payingId === t.id ? "Pagando..." : "Pagar"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
