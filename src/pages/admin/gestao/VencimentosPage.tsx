import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ArrowDownCircle, ArrowUpCircle, CalendarDays, AlertTriangle } from "lucide-react";

interface VencimentoItem {
  id: string;
  description: string;
  amount: number;
  paid_amount: number;
  due_date: string;
  status: string;
  type: "receber" | "pagar";
}

export default function VencimentosPage() {
  const [overdue, setOverdue] = useState<VencimentoItem[]>([]);
  const [upcoming, setUpcoming] = useState<VencimentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"7" | "15" | "30" | "60">("30");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() + parseInt(range));
      const isoLimit = limitDate.toISOString().split("T")[0];

      const [{ data: recFuture }, { data: pagFuture }, { data: recOverdue }, { data: pagOverdue }] = await Promise.all([
        supabase
          .from("receivable_titles")
          .select("id, description, amount, paid_amount, due_date, status")
          .in("status", ["pending", "partial"])
          .gte("due_date", today)
          .lte("due_date", isoLimit)
          .order("due_date")
          .limit(100),
        supabase
          .from("payable_titles")
          .select("id, description, amount, paid_amount, due_date, status")
          .in("status", ["pending", "partial"])
          .gte("due_date", today)
          .lte("due_date", isoLimit)
          .order("due_date")
          .limit(100),
        supabase
          .from("receivable_titles")
          .select("id, description, amount, paid_amount, due_date, status")
          .in("status", ["pending", "partial"])
          .lt("due_date", today)
          .order("due_date")
          .limit(100),
        supabase
          .from("payable_titles")
          .select("id, description, amount, paid_amount, due_date, status")
          .in("status", ["pending", "partial"])
          .lt("due_date", today)
          .order("due_date")
          .limit(100),
      ]);

      const mergedUpcoming: VencimentoItem[] = [
        ...(recFuture || []).map(r => ({ ...r, type: "receber" as const })),
        ...(pagFuture || []).map(p => ({ ...p, type: "pagar" as const })),
      ].sort((a, b) => a.due_date.localeCompare(b.due_date));

      const mergedOverdue: VencimentoItem[] = [
        ...(recOverdue || []).map(r => ({ ...r, type: "receber" as const })),
        ...(pagOverdue || []).map(p => ({ ...p, type: "pagar" as const })),
      ].sort((a, b) => a.due_date.localeCompare(b.due_date));

      setUpcoming(mergedUpcoming);
      setOverdue(mergedOverdue);
      setLoading(false);
    })();
  }, [range]);

  const sum = (items: VencimentoItem[], t: "receber" | "pagar") =>
    items.filter(i => i.type === t).reduce((s, i) => s + (i.amount - i.paid_amount), 0);

  const totalReceberOverdue = sum(overdue, "receber");
  const totalPagarOverdue = sum(overdue, "pagar");
  const totalReceber = sum(upcoming, "receber");
  const totalPagar = sum(upcoming, "pagar");

  const renderItem = (item: VencimentoItem, isOverdue: boolean) => (
    <div
      key={`${item.type}-${item.id}`}
      className={`bg-card border rounded-lg p-3 flex items-center justify-between gap-3 ${
        isOverdue ? "border-destructive/50 bg-destructive/5" : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {item.type === "receber" ? (
          <ArrowDownCircle className={`w-5 h-5 shrink-0 ${isOverdue ? "text-destructive" : "text-success"}`} />
        ) : (
          <ArrowUpCircle className="w-5 h-5 text-destructive shrink-0" />
        )}
        <div className="min-w-0">
          <p className="font-body text-sm text-foreground truncate">{item.description}</p>
          <p className="font-body text-[10px] text-muted-foreground">
            <CalendarDays className="w-3 h-3 inline mr-0.5" />
            {new Date(item.due_date + "T00:00:00").toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`font-body text-sm font-bold ${isOverdue ? "text-destructive" : item.type === "receber" ? "text-success" : "text-destructive"}`}>
          R$ {(item.amount - item.paid_amount).toFixed(2)}
        </span>
        {isOverdue ? (
          <Badge variant="destructive" className="text-[10px]">Vencido</Badge>
        ) : (
          <Badge variant={item.type === "receber" ? "default" : "destructive"} className="text-[10px]">
            {item.type === "receber" ? "Receber" : "Pagar"}
          </Badge>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground mb-4">Vencimentos</h1>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownCircle className="w-4 h-4 text-success" />
            <span className="font-body text-xs text-muted-foreground">A receber</span>
          </div>
          <p className="font-display text-xl text-success">R$ {totalReceber.toFixed(2)}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpCircle className="w-4 h-4 text-destructive" />
            <span className="font-body text-xs text-muted-foreground">A pagar</span>
          </div>
          <p className="font-display text-xl text-destructive">R$ {totalPagar.toFixed(2)}</p>
        </div>
      </div>

      {!loading && overdue.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="font-display text-sm text-destructive font-semibold">
              {overdue.length} vencido{overdue.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {totalReceberOverdue > 0 && (
              <p className="font-body text-xs text-destructive">
                Receber: R$ {totalReceberOverdue.toFixed(2)}
              </p>
            )}
            {totalPagarOverdue > 0 && (
              <p className="font-body text-xs text-destructive">
                Pagar: R$ {totalPagarOverdue.toFixed(2)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            {overdue.map(item => renderItem(item, true))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {(["7", "15", "30", "60"] as const).map(d => (
          <button
            key={d}
            onClick={() => setRange(d)}
            className={`font-body text-xs px-3 py-1.5 rounded-full border transition-colors ${
              range === d ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            {d} dias
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-card border rounded-lg animate-pulse" />)}</div>
      ) : upcoming.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground text-center py-12">Nenhum vencimento no período.</p>
      ) : (
        <div className="space-y-2">
          {upcoming.map(item => renderItem(item, false))}
        </div>
      )}
    </div>
  );
}