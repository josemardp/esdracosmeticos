import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, Trash2, Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchCep } from "@/lib/viacep";

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

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-secondary" />;

  const field = "h-12 rounded-full px-4 text-base";
  const label = "mb-1.5 block text-[15px] font-medium text-foreground";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-[26px] leading-tight text-foreground display-md">Endereços</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-deep">
            <Plus className="h-4 w-4" aria-hidden /> Novo endereço
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-6 rounded-2xl bg-secondary p-5">
          <p className="mb-4 text-sm text-muted-foreground">Campos com * são obrigatórios. Digite o CEP e a rua, o bairro e a cidade aparecem sozinhos.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><Label htmlFor="end-cep" className={label}>CEP *</Label><Input id="end-cep" className={field} inputMode="numeric" autoComplete="postal-code" value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} onBlur={async () => { const r = await fetchCep(form.zip); if (r) setForm(prev => ({ ...prev, street: r.logradouro || prev.street, neighborhood: r.bairro || prev.neighborhood, city: r.localidade || prev.city, state: r.uf || prev.state })); }} placeholder="00000-000" /></div>
            <div className="sm:col-span-2"><Label htmlFor="end-rua" className={label}>Rua *</Label><Input id="end-rua" className={field} value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} /></div>
            <div><Label htmlFor="end-num" className={label}>Número *</Label><Input id="end-num" className={field} inputMode="numeric" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} /></div>
            <div><Label htmlFor="end-comp" className={label}>Complemento</Label><Input id="end-comp" className={field} value={form.complement} onChange={e => setForm({ ...form, complement: e.target.value })} /></div>
            <div><Label htmlFor="end-bairro" className={label}>Bairro *</Label><Input id="end-bairro" className={field} value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} /></div>
            <div><Label htmlFor="end-cidade" className={label}>Cidade *</Label><Input id="end-cidade" className={field} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label htmlFor="end-uf" className={label}>Estado *</Label><Input id="end-uf" className={field} value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="SP" maxLength={2} /></div>
            <div><Label htmlFor="end-ref" className={label}>Referência</Label><Input id="end-ref" className={field} value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} /></div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button onClick={handleSave} className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-deep">Salvar endereço</button>
            <button onClick={() => setShowForm(false)} className="inline-flex h-12 items-center justify-center rounded-full px-7 text-[15px] font-medium text-foreground shadow-[inset_0_0_0_1.5px_hsl(var(--foreground))]">Cancelar</button>
          </div>
        </div>
      )}

      {addresses.length === 0 ? (
        !showForm && (
          <div className="rounded-2xl bg-secondary px-6 py-12 text-center">
            <MapPin className="mx-auto mb-3 h-10 w-10 text-primary" aria-hidden />
            <p className="text-base text-foreground">Nenhum endereço cadastrado.</p>
            <p className="mt-1 text-[15px] text-muted-foreground">Guarde seu endereço para comprar mais rápido.</p>
          </div>
        )
      ) : (
        <ul className="border-t">
          {addresses.map(a => (
            <li key={a.id} className="flex items-start justify-between gap-4 border-b py-4">
              <div className="min-w-0">
                {a.is_primary && <span className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-primary"><Star className="h-3.5 w-3.5 fill-primary" aria-hidden /> Principal</span>}
                <p className="text-[15px] text-foreground">{a.street}, {a.number}{a.complement ? `, ${a.complement}` : ""}</p>
                <p className="text-sm text-muted-foreground">{a.neighborhood}, {a.city}/{a.state}, CEP {a.zip}</p>
                {a.reference && <p className="mt-1 text-sm text-muted-foreground">Referência: {a.reference}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                {!a.is_primary && (
                  <button onClick={() => handleSetPrimary(a.id)} aria-label="Tornar este o endereço principal" title="Tornar principal" className="flex h-11 w-11 items-center justify-center rounded-full text-foreground hover:bg-secondary">
                    <Star className="h-4 w-4" aria-hidden />
                  </button>
                )}
                <button onClick={() => handleDelete(a.id)} aria-label="Remover este endereço" title="Remover" className="flex h-11 w-11 items-center justify-center rounded-full text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
