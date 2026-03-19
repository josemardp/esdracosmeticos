import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Ticket, X } from "lucide-react";

interface Coupon { id: string; code: string; type: string; value: number; min_order: number; active: boolean; starts_at: string | null; ends_at: string | null; usage_limit: number | null; usage_count: number; }

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Partial<Coupon>>({});

  const fetchCoupons = async () => { setLoading(true); const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false }); setCoupons((data as Coupon[]) ?? []); setLoading(false); };
  useEffect(() => { fetchCoupons(); }, []);

  const openNew = () => { setIsNew(true); setForm({ code: "", type: "percentage", value: 10, min_order: 0, active: true, usage_limit: null }); setEditing({} as Coupon); };
  const openEdit = (c: Coupon) => { setIsNew(false); setForm({ ...c }); setEditing(c); };
  const closeForm = () => setEditing(null);

  const handleSave = async () => {
    if (!form.code) { toast({ title: "Código obrigatório", variant: "destructive" }); return; }
    const payload = { ...form, code: form.code!.toUpperCase(), value: Number(form.value), min_order: Number(form.min_order) || 0, usage_limit: form.usage_limit ? Number(form.usage_limit) : null };
    if (isNew) {
      const { error } = await supabase.from("coupons").insert(payload as any);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Cupom criado!" });
    } else {
      const { error } = await supabase.from("coupons").update(payload as any).eq("id", editing!.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Cupom atualizado!" });
    }
    closeForm(); fetchCoupons();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl lg:text-3xl text-foreground">Cupons</h1>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Novo Cupom</Button>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
          <div className="bg-card border rounded-xl p-6 w-full max-w-md mx-4 animate-fade-in-scale">
            <div className="flex justify-between mb-4"><h2 className="font-display text-xl">{isNew ? "Novo Cupom" : "Editar"}</h2><button onClick={closeForm}><X className="w-5 h-5 text-muted-foreground" /></button></div>
            <div className="space-y-3">
              <div><Label className="font-body text-xs">Código *</Label><Input value={form.code || ""} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="ESDRA10" /></div>
              <div>
                <Label className="font-body text-xs">Tipo</Label>
                <select value={form.type || "percentage"} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border rounded-lg px-3 py-2 font-body text-sm bg-background text-foreground">
                  <option value="percentage">Percentual (%)</option>
                  <option value="fixed">Valor fixo (R$)</option>
                </select>
              </div>
              <div><Label className="font-body text-xs">Valor</Label><Input type="number" step="0.01" value={form.value ?? 0} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) })} /></div>
              <div><Label className="font-body text-xs">Pedido mínimo (R$)</Label><Input type="number" step="0.01" value={form.min_order ?? 0} onChange={e => setForm({ ...form, min_order: parseFloat(e.target.value) })} /></div>
              <div><Label className="font-body text-xs">Limite de uso</Label><Input type="number" value={form.usage_limit ?? ""} onChange={e => setForm({ ...form, usage_limit: e.target.value ? parseInt(e.target.value) : null })} placeholder="Ilimitado" /></div>
              <label className="flex items-center gap-2 font-body text-sm"><input type="checkbox" checked={!!form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="accent-primary" />Ativo</label>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t"><Button variant="outline" onClick={closeForm}>Cancelar</Button><Button onClick={handleSave}>{isNew ? "Criar" : "Salvar"}</Button></div>
          </div>
        </div>
      )}

      {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-card border rounded-xl animate-pulse" />)}</div> : coupons.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Ticket className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground mb-4">Nenhum cupom.</p>
          <Button onClick={openNew}>Criar primeiro cupom</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {coupons.map(c => (
            <div key={c.id} className="bg-card border rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-body text-sm font-semibold text-foreground">{c.code} {!c.active && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded ml-1">Inativo</span>}</h3>
                <p className="font-body text-xs text-muted-foreground">{c.type === "percentage" ? `${c.value}%` : `R$ ${c.value.toFixed(2)}`} · Mín: R$ {c.min_order.toFixed(2)} · Usos: {c.usage_count}{c.usage_limit ? `/${c.usage_limit}` : ""}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={async () => { await supabase.from("coupons").delete().eq("id", c.id); fetchCoupons(); }} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
