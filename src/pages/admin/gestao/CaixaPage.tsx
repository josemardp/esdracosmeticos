import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";

interface Movement {
  id: string;
  type: string;
  amount: number;
  description: string;
  movement_date: string;
  reference_type: string | null;
}

export default function CaixaPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: acc } = await supabase.from("cash_accounts").select("balance").eq("active", true).limit(1).single();
      if (acc) setBalance(acc.balance);

      const { data } = await supabase
        .from("cash_movements")
        .select("id, type, amount, description, movement_date, reference_type")
        .order("movement_date", { ascending: false })
        .limit(200);
      if (data) setMovements(data);
      setLoading(false);
    })();
  }, []);

  const totalIn = movements.filter((m) => m.type === "credit").reduce((s, m) => s + m.amount, 0);
  const totalOut = movements.filter((m) => m.type === "debit").reduce((s, m) => s + m.amount, 0);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground mb-6">Caixa</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="font-body text-xs text-muted-foreground">Saldo atual</span>
          </div>
          <p className="font-display text-2xl text-foreground">R$ {balance.toFixed(2)}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownCircle className="w-4 h-4 text-success" />
            <span className="font-body text-xs text-muted-foreground">Entradas</span>
          </div>
          <p className="font-display text-xl text-success">R$ {totalIn.toFixed(2)}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpCircle className="w-4 h-4 text-destructive" />
            <span className="font-body text-xs text-muted-foreground">Saídas</span>
          </div>
          <p className="font-display text-xl text-destructive">R$ {totalOut.toFixed(2)}</p>
        </div>
      </div>

      {/* Movements */}
      <h2 className="font-body text-sm font-semibold text-foreground mb-3">Extrato</h2>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-card border rounded-lg animate-pulse" />)}</div>
      ) : movements.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground text-center py-12">Nenhuma movimentação registrada.</p>
      ) : (
        <div className="space-y-2">
          {movements.map((m) => (
            <div key={m.id} className="bg-card border rounded-lg p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {m.type === "credit" ? (
                  <ArrowDownCircle className="w-5 h-5 text-success shrink-0" />
                ) : (
                  <ArrowUpCircle className="w-5 h-5 text-destructive shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-body text-sm text-foreground truncate">{m.description}</p>
                  <p className="font-body text-[10px] text-muted-foreground">
                    {new Date(m.movement_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
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
