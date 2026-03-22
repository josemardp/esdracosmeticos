import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Segment { id: string; name: string; description: string | null; rules: any; created_at: string; }

export default function SegmentosPage() {
  const { user } = useAuth();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [minOrders, setMinOrders] = useState("");
  const [minSpent, setMinSpent] = useState("");
  const [inactiveDays, setInactiveDays] = useState("");
  const [saving, setSaving] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("customer_segments" as any).select("*").order("created_at", { ascending: false });
    setSegments((data as any[]) || []);

    // Count matching customers for each segment
    const { data: customers } = await supabase.from("customers").select("id, order_count, total_spent, last_order_at");
    const allCustomers = (customers || []) as any[];
    const newCounts: Record<string, number> = {};
    for (const seg of ((data as any[]) || [])) {
      const r = seg.rules || {};
      newCounts[seg.id] = allCustomers.filter(c => {
        if (r.min_orders && (c.order_count || 0) < r.min_orders) return false;
        if (r.min_spent && (c.total_spent || 0) < r.min_spent) return false;
        if (r.inactive_days && c.last_order_at) {
          const days = Math.floor((Date.now() - new Date(c.last_order_at).getTime()) / 86400000);
          if (days < r.inactive_days) return false;
        }
        return true;
      }).length;
    }
    setCounts(newCounts);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!name.trim() || !user) return;
    setSaving(true);
    const rules: any = {};
    if (minOrders) rules.min_orders = parseInt(minOrders);
    if (minSpent) rules.min_spent = parseFloat(minSpent);
    if (inactiveDays) rules.inactive_days = parseInt(inactiveDays);

    const { error } = await (supabase.from("customer_segments" as any) as any).insert({
      name: name.trim(), description: desc.trim() || null, rules, owner_user_id: user.id,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Segmento criado ✓" });
      setShowForm(false);
      setName(""); setDesc(""); setMinOrders(""); setMinSpent(""); setInactiveDays("");
      load();
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    await (supabase.from("customer_segments" as any) as any).delete().eq("id", id);
    toast({ title: "Segmento removido" });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="font-display text-2xl lg:text-3xl text-foreground">Segmentos de Clientes</h1>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> Novo Segmento</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-card border rounded-xl animate-pulse" />)}</div>
      ) : segments.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">Nenhum segmento criado ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {segments.map(s => (
            <div key={s.id} className="bg-card border rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-body text-sm font-medium text-foreground">{s.name}</h3>
                <p className="font-body text-xs text-muted-foreground">
                  {s.description || "Sem descrição"} · {counts[s.id] || 0} cliente(s)
                </p>
                <p className="font-body text-[10px] text-muted-foreground mt-1">
                  {s.rules?.min_orders && `Mín. pedidos: ${s.rules.min_orders} `}
                  {s.rules?.min_spent && `Mín. gasto: R$ ${s.rules.min_spent} `}
                  {s.rules?.inactive_days && `Inativo há ${s.rules.inactive_days}+ dias`}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => remove(s.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Segmento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome do segmento" value={name} onChange={e => setName(e.target.value)} />
            <Textarea placeholder="Descrição (opcional)" value={desc} onChange={e => setDesc(e.target.value)} rows={2} />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-body text-xs text-muted-foreground">Mín. pedidos</label>
                <Input type="number" placeholder="0" value={minOrders} onChange={e => setMinOrders(e.target.value)} />
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground">Mín. gasto (R$)</label>
                <Input type="number" placeholder="0" value={minSpent} onChange={e => setMinSpent(e.target.value)} />
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground">Inativo (dias)</label>
                <Input type="number" placeholder="0" value={inactiveDays} onChange={e => setInactiveDays(e.target.value)} />
              </div>
            </div>
            <Button onClick={save} disabled={saving || !name.trim()} className="w-full">
              {saving ? "Salvando..." : "Criar Segmento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
