import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface Title {
  id: string;
  description: string;
  amount: number;
  paid_amount: number;
  due_date: string;
  status: string;
  installment_number: number;
  total_installments: number;
  customer: { name: string } | null;
  payment: { name: string } | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  paid: { label: "Pago", color: "bg-green-100 text-green-800", icon: CheckCircle },
  overdue: { label: "Vencido", color: "bg-red-100 text-red-800", icon: AlertTriangle },
};

export default function ReceberPage() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("pending");

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("receivable_titles")
      .select("id, description, amount, paid_amount, due_date, status, installment_number, total_installments, customer:customers(name), payment:payment_methods(name)")
      .order("due_date", { ascending: true })
      .limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    if (data) setTitles(data as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const markPaid = async (title: Title) => {
    const remaining = title.amount - title.paid_amount;
    if (remaining <= 0) return;

    // Get cash account
    const { data: accounts } = await supabase.from("cash_accounts").select("id").eq("active", true).limit(1);
    const cashId = accounts?.[0]?.id;
    if (!cashId) { toast({ title: "Crie um caixa primeiro", variant: "destructive" }); return; }

    // Get payment method from title
    const pmId = (title as any).payment_method_id;

    // Create receipt
    const { error: e1 } = await supabase.from("receivable_receipts").insert({
      title_id: title.id,
      amount: remaining,
      receipt_date: new Date().toISOString().split("T")[0],
      cash_account_id: cashId,
      owner_user_id: (await supabase.auth.getUser()).data.user?.id,
    });

    // Update title
    const { error: e2 } = await supabase.from("receivable_titles").update({
      status: "paid",
      paid_amount: title.amount,
    }).eq("id", title.id);

    // Create cash movement
    const { error: e3 } = await supabase.from("cash_movements").insert({
      cash_account_id: cashId,
      type: "credit",
      amount: remaining,
      description: `Recebimento: ${title.description}`,
      reference_type: "receipt",
      reference_id: title.id,
      owner_user_id: (await supabase.auth.getUser()).data.user?.id,
    });

    // Update balance
    const { data: acc } = await supabase.from("cash_accounts").select("balance").eq("id", cashId).single();
    if (acc) {
      await supabase.from("cash_accounts").update({ balance: acc.balance + remaining }).eq("id", cashId);
    }

    if (e1 || e2 || e3) {
      toast({ title: "Erro ao registrar recebimento", variant: "destructive" });
    } else {
      toast({ title: "Recebimento registrado!" });
      load();
    }
  };

  const totalPending = titles.filter((t) => t.status === "pending").reduce((s, t) => s + (t.amount - t.paid_amount), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl text-foreground">Contas a Receber</h1>
      </div>

      {/* Summary */}
      <div className="bg-card border rounded-xl p-4 mb-6">
        <p className="font-body text-xs text-muted-foreground">Total pendente</p>
        <p className="font-display text-2xl text-foreground">R$ {totalPending.toFixed(2)}</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {[{ key: "pending", label: "Pendentes" }, { key: "paid", label: "Pagos" }, { key: "all", label: "Todos" }].map((f) => (
          <Button key={f.key} variant={filter === f.key ? "default" : "outline"} size="sm" onClick={() => setFilter(f.key as any)}>
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-card border rounded-lg animate-pulse" />)}</div>
      ) : titles.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground text-center py-12">Nenhum título encontrado.</p>
      ) : (
        <div className="space-y-2">
          {titles.map((t) => {
            const cfg = statusConfig[t.status] || statusConfig.pending;
            const overdue = t.status === "pending" && new Date(t.due_date) < new Date();
            return (
              <div key={t.id} className="bg-card border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-body text-sm font-semibold text-foreground truncate">{t.description}</p>
                    <p className="font-body text-xs text-muted-foreground">{(t.customer as any)?.name || "—"}</p>
                    <p className="font-body text-[10px] text-muted-foreground">
                      Venc: {new Date(t.due_date + "T12:00:00").toLocaleDateString("pt-BR")} · {(t.payment as any)?.name || "—"}
                      {t.total_installments > 1 ? ` · ${t.installment_number}/${t.total_installments}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-body text-sm font-bold text-foreground">R$ {t.amount.toFixed(2)}</p>
                    <Badge className={`text-[10px] ${overdue ? "bg-red-100 text-red-800" : cfg.color}`}>
                      {overdue ? "Vencido" : cfg.label}
                    </Badge>
                  </div>
                </div>
                {t.status === "pending" && (
                  <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => markPaid(t)}>
                    <CheckCircle className="w-4 h-4 mr-1.5" /> Marcar como recebido
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
