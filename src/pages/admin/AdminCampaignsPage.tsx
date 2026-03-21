import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Megaphone, X, Eye, EyeOff, Calendar } from "lucide-react";

interface Campaign {
  id: string; title: string; subtitle: string | null; image_url: string | null;
  link_url: string; badge_text: string | null; position: string;
  sort_order: number; active: boolean; starts_at: string | null; ends_at: string | null;
  created_at: string;
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Partial<Campaign>>({});

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("campaign_banners").select("*").order("sort_order");
    setCampaigns((data as Campaign[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const openNew = () => {
    setIsNew(true);
    setForm({ title: "", subtitle: "", image_url: "", link_url: "/loja", badge_text: "", position: "home_top", sort_order: 0, active: true, starts_at: null, ends_at: null });
    setEditing({} as Campaign);
  };

  const openEdit = (c: Campaign) => {
    setIsNew(false);
    setForm({ ...c });
    setEditing(c);
  };

  const closeForm = () => { setEditing(null); setForm({}); };

  const handleSave = async () => {
    if (!form.title) { toast({ title: "Título é obrigatório", variant: "destructive" }); return; }
    const payload = { ...form };
    delete (payload as any).id;
    delete (payload as any).created_at;

    if (isNew) {
      const { error } = await supabase.from("campaign_banners").insert(payload as any);
      if (error) { toast({ title: "Erro ao criar", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Campanha criada ✓" });
    } else {
      const { error } = await supabase.from("campaign_banners").update(payload as any).eq("id", editing!.id);
      if (error) { toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Campanha atualizada ✓" });
    }
    closeForm();
    fetch();
  };

  const toggleActive = async (c: Campaign) => {
    await supabase.from("campaign_banners").update({ active: !c.active }).eq("id", c.id);
    toast({ title: c.active ? "Campanha desativada" : "Campanha ativada ✓" });
    fetch();
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Excluir esta campanha?")) return;
    await supabase.from("campaign_banners").delete().eq("id", id);
    toast({ title: "Campanha excluída" });
    fetch();
  };

  const isExpired = (c: Campaign) => c.ends_at && new Date(c.ends_at) < new Date();
  const isScheduled = (c: Campaign) => c.starts_at && new Date(c.starts_at) > new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-foreground">Campanhas</h1>
          <p className="font-body text-sm text-muted-foreground">Banners promocionais e campanhas sazonais</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Nova Campanha</Button>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-foreground/40 overflow-y-auto">
          <div className="bg-card border rounded-xl p-6 w-full max-w-lg mx-4 mb-10 animate-fade-in-scale">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-foreground">{isNew ? "Nova Campanha" : "Editar Campanha"}</h2>
              <button onClick={closeForm}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div><Label className="font-body text-xs">Título *</Label><Input value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label className="font-body text-xs">Subtítulo</Label><Textarea value={form.subtitle || ""} onChange={e => setForm({ ...form, subtitle: e.target.value })} rows={2} /></div>
              <div><Label className="font-body text-xs">URL da Imagem</Label><Input value={form.image_url || ""} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
              <div><Label className="font-body text-xs">Link (destino do clique)</Label><Input value={form.link_url || ""} onChange={e => setForm({ ...form, link_url: e.target.value })} /></div>
              <div><Label className="font-body text-xs">Badge (ex: "Dia das Mães")</Label><Input value={form.badge_text || ""} onChange={e => setForm({ ...form, badge_text: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="font-body text-xs">Posição</Label>
                  <select value={form.position || "home_top"} onChange={e => setForm({ ...form, position: e.target.value })} className="w-full border rounded-lg px-3 py-2 font-body text-sm bg-background text-foreground">
                    <option value="home_top">Home (topo)</option>
                    <option value="home_middle">Home (meio)</option>
                    <option value="catalog_top">Catálogo (topo)</option>
                  </select>
                </div>
                <div><Label className="font-body text-xs">Ordem</Label><Input type="number" value={form.sort_order ?? 0} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="font-body text-xs">Início (opcional)</Label><Input type="datetime-local" value={form.starts_at?.slice(0, 16) || ""} onChange={e => setForm({ ...form, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div>
                <div><Label className="font-body text-xs">Fim (opcional)</Label><Input type="datetime-local" value={form.ends_at?.slice(0, 16) || ""} onChange={e => setForm({ ...form, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div>
              </div>
              <label className="flex items-center gap-2 font-body text-sm">
                <input type="checkbox" checked={!!form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="accent-[hsl(var(--primary))]" /> Ativa
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
              <Button variant="outline" onClick={closeForm}>Cancelar</Button>
              <Button onClick={handleSave}>{isNew ? "Criar" : "Salvar"}</Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-card border rounded-xl animate-pulse" />)}</div>
      ) : campaigns.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground mb-4">Nenhuma campanha criada.</p>
          <Button onClick={openNew}>Criar primeira campanha</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map(c => (
            <div key={c.id} className={`bg-card border rounded-xl p-4 flex items-center gap-4 ${isExpired(c) ? 'opacity-50' : ''}`}>
              {c.image_url && <img src={c.image_url} alt="" className="w-16 h-10 object-cover rounded-lg border shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-body text-sm font-medium text-foreground truncate">{c.title}</h3>
                  {c.badge_text && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-body font-semibold">{c.badge_text}</span>}
                  {isExpired(c) && <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-body">Expirada</span>}
                  {isScheduled(c) && <span className="text-[10px] bg-info/10 text-info px-2 py-0.5 rounded-full font-body flex items-center gap-0.5"><Calendar className="w-3 h-3" /> Agendada</span>}
                </div>
                <p className="font-body text-xs text-muted-foreground">{c.position === "home_top" ? "Home (topo)" : c.position === "home_middle" ? "Home (meio)" : "Catálogo"} · {c.link_url}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => toggleActive(c)}>{c.active ? <Eye className="w-4 h-4 text-success" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}</Button>
                <Button variant="ghost" size="icon" onClick={() => deleteCampaign(c.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
