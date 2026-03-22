import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";

interface CostCenter {
  id: string;
  name: string;
  active: boolean;
}

export default function CentrosCustoPage() {
  const { user } = useAuth();
  const [centers, setCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("cost_centers")
      .select("id, name, active")
      .order("name");
    if (data) setCenters(data);
    setLoading(false);
  };

  useEffect(() => {
    supabase.rpc("ensure_financial_defaults").then(() => load());
  }, []);

  const handleAdd = async () => {
    if (!newName.trim() || !user) return;
    setAdding(true);
    const { error } = await supabase.from("cost_centers").insert({
      name: newName.trim(),
      owner_user_id: user.id,
    });
    if (error) {
      toast.error(error.message.includes("uq_cost_centers") ? "Centro de custo já existe" : error.message);
    } else {
      toast.success("Centro de custo criado");
      setNewName("");
      await load();
    }
    setAdding(false);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    const { error } = await supabase
      .from("cost_centers")
      .update({ name: editName.trim() })
      .eq("id", id);
    if (error) {
      toast.error(error.message.includes("uq_cost_centers") ? "Nome já existe" : error.message);
    } else {
      toast.success("Atualizado");
      setEditingId(null);
      await load();
    }
  };

  const toggleActive = async (cc: CostCenter) => {
    await supabase.from("cost_centers").update({ active: !cc.active }).eq("id", cc.id);
    await load();
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground mb-6">Centros de Custo</h1>

      <div className="bg-card border rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Nome do centro de custo"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleAdd} disabled={adding || !newName.trim()} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-card border rounded-lg animate-pulse" />
          ))}
        </div>
      ) : centers.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground text-center py-12">Nenhum centro de custo cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {centers.map((cc) => (
            <div key={cc.id} className="bg-card border rounded-lg p-3 flex items-center justify-between gap-3">
              {editingId === cc.id ? (
                <div className="flex-1 flex gap-2">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1" />
                  <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(cc.id)}>
                    <Check className="w-4 h-4 text-primary" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-body text-sm text-foreground truncate">{cc.name}</span>
                    {!cc.active && <Badge variant="secondary" className="text-[10px]">Inativo</Badge>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => { setEditingId(cc.id); setEditName(cc.name); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(cc)}>
                      {cc.active ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
