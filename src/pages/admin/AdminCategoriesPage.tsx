import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, FolderTree, X } from "lucide-react";

interface Category { id: string; name: string; slug: string; description: string | null; image_url: string | null; sort_order: number; active: boolean; }

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Partial<Category>>({});

  const fetchCats = async () => {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCats((data as Category[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCats(); }, []);

  const genSlug = (n: string) => n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openNew = () => { setIsNew(true); setForm({ name: "", slug: "", description: "", image_url: "", sort_order: 0, active: true }); setEditing({} as Category); };
  const openEdit = (c: Category) => { setIsNew(false); setForm({ ...c }); setEditing(c); };
  const closeForm = () => { setEditing(null); };

  const handleSave = async () => {
    if (!form.name) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    const slug = form.slug || genSlug(form.name);
    const payload = { ...form, slug };
    if (isNew) {
      const { error } = await supabase.from("categories").insert(payload as any);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Categoria criada!" });
    } else {
      const { error } = await supabase.from("categories").update(payload as any).eq("id", editing!.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Categoria atualizada!" });
    }
    closeForm(); fetchCats();
  };

  const deleteCat = async (id: string) => {
    if (!confirm("Excluir categoria?")) return;
    await supabase.from("categories").delete().eq("id", id);
    toast({ title: "Excluída" }); fetchCats();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl lg:text-3xl text-foreground">Categorias</h1>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Nova Categoria</Button>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
          <div className="bg-card border rounded-xl p-6 w-full max-w-md mx-4 animate-fade-in-scale">
            <div className="flex justify-between mb-4"><h2 className="font-display text-xl">{isNew ? "Nova Categoria" : "Editar"}</h2><button onClick={closeForm}><X className="w-5 h-5 text-muted-foreground" /></button></div>
            <div className="space-y-3">
              <div><Label className="font-body text-xs">Nome *</Label><Input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value, slug: genSlug(e.target.value) })} /></div>
              <div><Label className="font-body text-xs">Slug</Label><Input value={form.slug || ""} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
              <div><Label className="font-body text-xs">Descrição</Label><Input value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label className="font-body text-xs">URL da imagem</Label><Input value={form.image_url || ""} onChange={e => setForm({ ...form, image_url: e.target.value })} /></div>
              <div><Label className="font-body text-xs">Ordem</Label><Input type="number" value={form.sort_order ?? 0} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) })} /></div>
              <label className="flex items-center gap-2 font-body text-sm"><input type="checkbox" checked={!!form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="accent-primary" />Ativa</label>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
              <Button variant="outline" onClick={closeForm}>Cancelar</Button>
              <Button onClick={handleSave}>{isNew ? "Criar" : "Salvar"}</Button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-card border rounded-xl animate-pulse" />)}</div> : cats.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <FolderTree className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground mb-4">Nenhuma categoria.</p>
          <Button onClick={openNew}>Criar primeira categoria</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {cats.map(c => (
            <div key={c.id} className="bg-card border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-body text-xs text-muted-foreground w-6">{c.sort_order}</span>
                <div>
                  <h3 className="font-body text-sm font-medium text-foreground">{c.name} {!c.active && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded ml-1">Inativa</span>}</h3>
                  <p className="font-body text-xs text-muted-foreground">/{c.slug}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => deleteCat(c.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
