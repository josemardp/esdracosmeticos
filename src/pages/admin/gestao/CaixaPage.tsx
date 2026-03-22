import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownCircle, ArrowUpCircle, Wallet, Tag, Building2 } from "lucide-react";
import { toast } from "sonner";

interface FinCategory { id: string; name: string; }
interface CostCenter { id: string; name: string; }

interface Movement {
  id: string;
  type: string;
  amount: number;
  description: string;
  movement_date: string;
  reference_type: string | null;
  financial_category_id: string | null;
  cost_center_id: string | null;
}

export default function CaixaPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<FinCategory[]>([]);
  const [centers, setCenters] = useState<CostCenter[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [accRes, movRes, catRes, ccRes] = await Promise.all([
        supabase.from("cash_accounts").select("balance").eq("active", true).limit(1).single(),
        supabase
          .from("cash_movements")
          .select("id, type, amount, description, movement_date, reference_type, financial_category_id, cost_center_id")
          .order("movement_date", { ascending: false })
          .limit(200),
        supabase.from("financial_categories").select("id, name").eq("active", true).order("name"),
        supabase.from("cost_centers").select("id, name").eq("active", true).order("name"),
      ]);
      if (accRes.data) setBalance(accRes.data.balance);
      if (movRes.data) setMovements(movRes.data);
      if (catRes.data) setCategories(catRes.data);
      if (ccRes.data) setCenters(ccRes.data);
      setLoading(false);
    })();
  }, []);

  const totalIn = movements.filter((m) => m.type === "credit").reduce((s, m) => s + m.amount, 0);
  const totalOut = movements.filter((m) => m.type === "debit").reduce((s, m) => s + m.amount, 0);

  const updateClassification = async (id: string, field: "financial_category_id" | "cost_center_id", value: string | null) => {
    const { error } = await supabase.from("cash_movements").update({ [field]: value }).eq("id", id);
    if (error) {
      toast.error("Erro ao classificar");
      return;
    }
    setMovements((prev) => prev.map((m) => m.id === id ? { ...m, [field]: value } : m));
    toast.success("Classificação atualizada");
  };

  const getCategoryName = (id: string | null) => categories.find((c) => c.id === id)?.name;
  const getCenterName = (id: string | null) => centers.find((c) => c.id === id)?.name;

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
            <div key={m.id} className="bg-card border rounded-lg p-3">
              <div className="flex items-center justify-between gap-3">
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
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`font-body text-sm font-bold ${m.type === "credit" ? "text-success" : "text-destructive"}`}>
                    {m.type === "credit" ? "+" : "-"}R$ {m.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => setEditingId(editingId === m.id ? null : m.id)}
                    className="p-1 rounded hover:bg-secondary"
                    title="Classificar"
                  >
                    <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Classification tags (always visible if set) */}
              {editingId !== m.id && (m.financial_category_id || m.cost_center_id) && (
                <div className="flex gap-2 mt-2 ml-8 flex-wrap">
                  {m.financial_category_id && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-body bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      <Tag className="w-3 h-3" /> {getCategoryName(m.financial_category_id)}
                    </span>
                  )}
                  {m.cost_center_id && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-body bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                      <Building2 className="w-3 h-3" /> {getCenterName(m.cost_center_id)}
                    </span>
                  )}
                </div>
              )}

              {/* Inline classification editor */}
              {editingId === m.id && (
                <div className="mt-2 ml-8 flex flex-col sm:flex-row gap-2">
                  <select
                    value={m.financial_category_id || ""}
                    onChange={(e) => updateClassification(m.id, "financial_category_id", e.target.value || null)}
                    className="h-8 rounded-md border bg-background px-2 font-body text-xs flex-1"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={m.cost_center_id || ""}
                    onChange={(e) => updateClassification(m.id, "cost_center_id", e.target.value || null)}
                    className="h-8 rounded-md border bg-background px-2 font-body text-xs flex-1"
                  >
                    <option value="">Sem centro de custo</option>
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
