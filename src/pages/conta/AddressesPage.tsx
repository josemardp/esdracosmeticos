import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, Trash2, Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Address {
  id: string; street: string; number: string; complement: string | null;
  neighborhood: string; city: string; state: string; zip: string;
  reference: string | null; is_primary: boolean;
}

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [form, setForm] = useState({ street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zip: "", reference: "" });

  const fetchAddresses = async () => {
    if (!user) return;
    const { data: customer } = await supabase.from("customers").select("id").eq("user_id", user.id).maybeSingle();
    if (!customer) { setLoading(false); return; }
    setCustomerId(customer.id);
    const { data } = await supabase.from("addresses").select("*").eq("customer_id", customer.id).order("is_primary", { ascending: false });
    setAddresses((data as Address[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAddresses(); }, [user]);

  const handleSave = async () => {
    if (!customerId) return;
    if (!form.street || !form.number || !form.neighborhood || !form.city || !form.state || !form.zip) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("addresses").insert({
      customer_id: customerId, street: form.street, number: form.number,
      complement: form.complement || null, neighborhood: form.neighborhood,
      city: form.city, state: form.state, zip: form.zip,
      reference: form.reference || null, is_primary: addresses.length === 0,
    });
    if (error) { toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Endereço salvo!" });
    setForm({ street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zip: "", reference: "" });
    setShowForm(false);
    fetchAddresses();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    toast({ title: "Endereço removido" });
    fetchAddresses();
  };

  const handleSetPrimary = async (id: string) => {
    if (!customerId) return;
    await supabase.from("addresses").update({ is_primary: false }).eq("customer_id", customerId);
    await supabase.from("addresses").update({ is_primary: true }).eq("id", id);
    toast({ title: "Endereço principal atualizado" });
    fetchAddresses();
  };

  if (loading) return <div className="animate-pulse h-40 bg-secondary rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl text-foreground">Meus Endereços</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" /> Novo Endereço</Button>
      </div>

      {showForm && (
        <div className="bg-card border rounded-xl p-5 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label className="font-body text-xs">CEP *</Label><Input value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} placeholder="00000-000" /></div>
            <div className="sm:col-span-2"><Label className="font-body text-xs">Rua *</Label><Input value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} /></div>
            <div><Label className="font-body text-xs">Número *</Label><Input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} /></div>
            <div><Label className="font-body text-xs">Complemento</Label><Input value={form.complement} onChange={e => setForm({ ...form, complement: e.target.value })} /></div>
            <div><Label className="font-body text-xs">Bairro *</Label><Input value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} /></div>
            <div><Label className="font-body text-xs">Cidade *</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label className="font-body text-xs">Estado *</Label><Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="SP" maxLength={2} /></div>
            <div><Label className="font-body text-xs">Referência</Label><Input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>Salvar</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">Nenhum endereço cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map(a => (
            <div key={a.id} className="bg-card border rounded-xl p-5 flex items-start justify-between">
              <div>
                {a.is_primary && <span className="inline-flex items-center gap-1 text-primary font-body text-xs font-medium mb-1"><Star className="w-3 h-3 fill-primary" /> Principal</span>}
                <p className="font-body text-sm text-foreground">{a.street}, {a.number}{a.complement ? ` - ${a.complement}` : ""}</p>
                <p className="font-body text-xs text-muted-foreground">{a.neighborhood} · {a.city}/{a.state} · CEP {a.zip}</p>
                {a.reference && <p className="font-body text-xs text-muted-foreground mt-1">Ref: {a.reference}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                {!a.is_primary && <Button variant="ghost" size="sm" onClick={() => handleSetPrimary(a.id)} title="Definir como principal"><Star className="w-3.5 h-3.5" /></Button>}
                <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
