import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, Building2, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Supplier {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  contact_name: string | null;
  notes: string | null;
  active: boolean;
}

const emptyForm = { name: "", document: "", email: "", phone: "", contact_name: "", notes: "" };

export default function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("suppliers")
      .select("id, name, document, email, phone, contact_name, notes, active")
      .order("name")
      .limit(200);
    if (data) setSuppliers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.document && s.document.includes(search))
  );

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name,
      document: s.document || "",
      email: s.email || "",
      phone: s.phone || "",
      contact_name: s.contact_name || "",
      notes: s.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("suppliers").update({
        name: form.name.trim(),
        document: form.document || null,
        email: form.email || null,
        phone: form.phone || null,
        contact_name: form.contact_name || null,
        notes: form.notes || null,
      }).eq("id", editing.id);
      if (error) toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      else toast({ title: "Fornecedor atualizado" });
    } else {
      const { error } = await supabase.from("suppliers").insert({
        name: form.name.trim(),
        document: form.document || null,
        email: form.email || null,
        phone: form.phone || null,
        contact_name: form.contact_name || null,
        notes: form.notes || null,
      });
      if (error) toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
      else toast({ title: "Fornecedor criado" });
    }
    setSaving(false);
    setDialogOpen(false);
    load();
  };

  const toggleActive = async (s: Supplier) => {
    await supabase.from("suppliers").update({ active: !s.active }).eq("id", s.id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="font-display text-2xl text-foreground">Fornecedores</h1>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" />Novo</Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou CNPJ..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-card border rounded-lg animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground text-center py-12">Nenhum fornecedor encontrado.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.id} className="bg-card border rounded-lg p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Building2 className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-body text-sm text-foreground font-medium truncate">{s.name}</p>
                  <p className="font-body text-[10px] text-muted-foreground truncate">
                    {[s.document, s.phone, s.email].filter(Boolean).join(" · ") || "Sem dados adicionais"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={s.active ? "default" : "secondary"} className="text-[10px] cursor-pointer" onClick={() => toggleActive(s)}>
                  {s.active ? "Ativo" : "Inativo"}
                </Badge>
                <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-secondary">
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>CNPJ / CPF</Label><Input value={form.document} onChange={e => setForm({ ...form, document: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>E-mail</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div><Label>Contato</Label><Input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} /></div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
