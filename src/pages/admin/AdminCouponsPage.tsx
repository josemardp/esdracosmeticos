import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Ticket, X, Search, Copy } from "lucide-react";

interface Coupon { id: string; code: string; type: string; value: number; min_order: number; active: boolean; starts_at: string | null; ends_at: string | null; usage_limit: number | null; usage_count: number; }

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Partial<Coupon>>({});
  const [search, setSearch] = useState("");

  const fetchCoupons = async () => { 
    setLoading(true); 
    const { data, error } = await supabase.from("coupons").select("id, code, type, value, min_order, usage_limit, usage_count, active, starts_at, ends_at").order("created_at", { ascending: false }); 
    if (error) toast({ title: "Erro ao carregar cupons", description: error.message, variant: "destructive" });
    setCoupons((data as Coupon[]) ?? []); 
    setLoading(false); 
  };
  useEffect(() => { fetchCoupons(); }, []);

  const openNew = () => { setIsNew(true); setForm({ code: "", type: "percentage", value: 10, min_order: 0, active: true, usage_limit: null, starts_at: null, ends_at: null }); setEditing({} as Coupon); };
  const openEdit = (c: Coupon) => { setIsNew(false); setForm({ ...c }); setEditing(c); };
  const closeForm = () => setEditing(null);

  const handleSave = async () => {
    if (!form.code) { toast({ title: "Código obrigatório", variant: "destructive" }); return; }
    if (!form.value || Number(form.value) <= 0) { toast({ title: "Valor deve ser maior que zero", variant: "destructive" }); return; }
    const payload = { ...form, code: form.code!.toUpperCase(), value: Number(form.value), min_order: Number(form.min_order) || 0, usage_limit: form.usage_limit ? Number(form.usage_limit) : null };
    if (isNew) {
      const { error } = await supabase.from("coupons").insert(payload as any);
      if (error) { toast({ title: "Erro ao criar", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Cupom criado com sucesso! ✓" });
    } else {
      const { error } = await supabase.from("coupons").update(payload as any).eq("id", editing!.id);
      if (error) { toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Cupom atualizado ✓" });
    }
    closeForm(); fetchCoupons();
  };

  const deleteCoupon = async (c: Coupon) => {
    if (!confirm(`Excluir o cupom "${c.code}"? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("coupons").delete().eq("id", c.id);
    if (error) { toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Cupom excluído" });
    fetchCoupons();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: `"${code}" copiado!` });
  };

  const filtered = coupons.filter(c => {
    if (!search) return true;
    return c.code.toLowerCase().includes(search.toLowerCase());
  });

  const isExpired = (c: Coupon) => c.ends_at && new Date(c.ends_at) < new Date();
  const isExhausted = (c: Coupon) => c.usage_limit !== null && c.usage_count >= c.usage_limit;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl lg:text-3xl text-foreground">Cupons</h1>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Novo Cupom</Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por código..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
          <div className="bg-card border rounded-xl p-6 w-full max-w-md mx-4 animate-fade-in-scale">
            <div className="flex justify-between mb-4"><h2 className="font-display text-xl">{isNew ? "Novo Cupom" : "Editar Cupom"}</h2><button onClick={closeForm}><X className="w-5 h-5 text-muted-foreground" /></button></div>
            <div className="space-y-3">
              <div><Label className="font-body text-xs">Código *</Label><Input value={form.code || ""} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="ESDRA10" /></div>
              <div>
                <Label className="font-body text-xs">Tipo</Label>
                <select value={form.type || "percentage"} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border rounded-lg px-3 py-2 font-body text-sm bg-background text-foreground">
                  <option value="percentage">Percentual (%)</option>
                  <option value="fixed">Valor fixo (R$)</option>
                </select>
              </div>
              <div><Label className="font-body text-xs">Valor *</Label><Input type="number" step="0.01" value={form.value ?? 0} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) })} /></div>
              <div><Label className="font-body text-xs">Pedido mínimo (R$)</Label><Input type="number" step="0.01" value={form.min_order ?? 0} onChange={e => setForm({ ...form, min_order: parseFloat(e.target.value) })} /></div>
              <div><Label className="font-body text-xs">Limite de uso</Label><Input type="number" value={form.usage_limit ?? ""} onChange={e => setForm({ ...form, usage_limit: e.target.value ? parseInt(e.target.value) : null })} placeholder="Ilimitado" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="font-body text-xs">Início</Label><Input type="date" value={form.starts_at?.split("T")[0] || ""} onChange={e => setForm({ ...form, starts_at: e.target.value || null })} /></div>
                <div><Label className="font-body text-xs">Término</Label><Input type="date" value={form.ends_at?.split("T")[0] || ""} onChange={e => setForm({ ...form, ends_at: e.target.value || null })} /></div>
              </div>
              <label className="flex items-center gap-2 font-body text-sm"><input type="checkbox" checked={!!form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="accent-[hsl(var(--primary))]" />Ativo</label>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t"><Button variant="outline" onClick={closeForm}>Cancelar</Button><Button onClick={handleSave}>{isNew ? "Criar Cupom" : "Salvar"}</Button></div>
          </div>
        </div>
      )}

      {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-card border rounded-xl animate-pulse" />)}</div> : filtered.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Ticket className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground mb-4">{search ? "Nenhum cupom encontrado." : "Nenhum cupom cadastrado."}</p>
          {!search && <Button onClick={openNew}>Criar primeiro cupom</Button>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.id} className={`bg-card border rounded-xl p-4 flex items-center justify-between ${isExpired(c) ? 'opacity-60' : ''} ${isExhausted(c) ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3">
                <button onClick={() => copyCode(c.code)} className="hover:scale-105 transition-transform" title="Copiar código">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Copy className="w-4 h-4 text-primary" />
                  </div>
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-body text-sm font-semibold text-foreground">{c.code}</h3>
                    {!c.active && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">Inativo</span>}
                    {isExpired(c) && <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">Expirado</span>}
                    {isExhausted(c) && <span className="text-[10px] bg-warning/10 text-warning px-1.5 py-0.5 rounded">Esgotado</span>}
                  </div>
                  <p className="font-body text-xs text-muted-foreground">
                    {c.type === "percentage" ? `${c.value}%` : `R$ ${c.value.toFixed(2)}`} · Mín: R$ {c.min_order.toFixed(2)} · Usos: {c.usage_count}{c.usage_limit ? `/${c.usage_limit}` : ""}
                    {c.ends_at && ` · Até ${new Date(c.ends_at).toLocaleDateString("pt-BR")}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => deleteCoupon(c)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
