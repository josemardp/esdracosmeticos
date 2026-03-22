import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  type: string;
  active: boolean;
}

const typeLabels: Record<string, string> = {
  income: "Receita",
  expense: "Despesa",
  both: "Ambos",
};

export default function CategoriasFinanceirasPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("expense");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("financial_categories")
      .select("id, name, type, active")
      .order("name");
    if (data) setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    supabase.rpc("ensure_financial_defaults").then(() => load());
  }, []);

  const handleAdd = async () => {
    if (!newName.trim() || !user) return;
    setAdding(true);
    const { error } = await supabase.from("financial_categories").insert({
      name: newName.trim(),
      type: newType,
      owner_user_id: user.id,
    });
    if (error) {
      toast.error(error.message.includes("uq_financial_categories") ? "Categoria já existe" : error.message);
    } else {
      toast.success("Categoria criada");
      setNewName("");
      await load();
    }
    setAdding(false);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    const { error } = await supabase
      .from("financial_categories")
      .update({ name: editName.trim(), type: editType })
      .eq("id", id);
    if (error) {
      toast.error(error.message.includes("uq_financial_categories") ? "Nome já existe" : error.message);
    } else {
      toast.success("Atualizado");
      setEditingId(null);
      await load();
    }
  };

  const toggleActive = async (cat: Category) => {
    await supabase.from("financial_categories").update({ active: !cat.active }).eq("id", cat.id);
    await load();
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground mb-6">Categorias Financeiras</h1>

      {/* Add form */}
      <div className="bg-card border rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Nome da categoria"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1"
        />
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          className="h-10 rounded-md border bg-background px-3 font-body text-sm"
        >
          <option value="income">Receita</option>
          <option value="expense">Despesa</option>
          <option value="both">Ambos</option>
        </select>
        <Button onClick={handleAdd} disabled={adding || !newName.trim()} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-card border rounded-lg animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground text-center py-12">Nenhuma categoria cadastrada.</p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-card border rounded-lg p-3 flex items-center justify-between gap-3">
              {editingId === cat.id ? (
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1" />
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="h-10 rounded-md border bg-background px-3 font-body text-sm"
                  >
                    <option value="income">Receita</option>
                    <option value="expense">Despesa</option>
                    <option value="both">Ambos</option>
                  </select>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(cat.id)}>
                      <Check className="w-4 h-4 text-primary" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-body text-sm text-foreground truncate">{cat.name}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {typeLabels[cat.type] || cat.type}
                    </Badge>
                    {!cat.active && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">Inativa</Badge>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => { setEditingId(cat.id); setEditName(cat.name); setEditType(cat.type); }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(cat)}>
                      {cat.active ? "Desativar" : "Ativar"}
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
