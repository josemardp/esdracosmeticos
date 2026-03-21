import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, CheckCircle2, Loader2 } from "lucide-react";

interface SaleItem {
  name: string;
  qty: number;
  price: number;
  product_id?: string;
}

export default function VendaRapidaPage() {
  const { user } = useAuth();
  const [channels, setChannels] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [methods, setMethods] = useState<{ id: string; name: string; slug: string; allows_installments: boolean }[]>([]);
  const [channel, setChannel] = useState("");
  const [payMethod, setPayMethod] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState<SaleItem[]>([{ name: "", qty: 1, price: 0 }]);
  const [installments, setInstallments] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ sale_code: string; total: number } | null>(null);

  useEffect(() => {
    supabase.from("sales_channels").select("id, name, slug").eq("active", true).then(({ data }) => {
      if (data) setChannels(data);
    });
    supabase.from("payment_methods").select("id, name, slug, allows_installments").eq("active", true).then(({ data }) => {
      if (data) setMethods(data);
    });
  }, []);

  const selectedMethod = methods.find((m) => m.slug === payMethod);
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const total = Math.max(0, subtotal - discount);

  const updateItem = useCallback((idx: number, field: keyof SaleItem, value: string | number) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }, []);

  const addItem = () => setItems((prev) => [...prev, { name: "", qty: 1, price: 0 }]);
  const removeItem = (idx: number) => setItems((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter((i) => i.name.trim() && i.qty > 0 && i.price > 0);
    if (!validItems.length) { toast({ title: "Adicione pelo menos um item válido", variant: "destructive" }); return; }
    if (!channel) { toast({ title: "Selecione o canal de venda", variant: "destructive" }); return; }
    if (!payMethod) { toast({ title: "Selecione a forma de pagamento", variant: "destructive" }); return; }

    setSaving(true);
    const { data, error } = await supabase.rpc("create_sale", {
      p_items: validItems.map((i) => ({ name: i.name, qty: i.qty, price: i.price, product_id: i.product_id || null })),
      p_customer_name: customerName.trim() || "Cliente avulso",
      p_customer_id: null,
      p_channel_slug: channel,
      p_payment_slug: payMethod,
      p_installments: selectedMethod?.allows_installments ? installments : 1,
      p_discount: discount,
      p_notes: notes.trim() || null,
    });
    setSaving(false);

    if (error) {
      toast({ title: "Erro ao registrar venda", description: error.message, variant: "destructive" });
    } else {
      const result = data as any;
      setDone({ sale_code: result.sale_code, total: result.total });
      toast({ title: `Venda ${result.sale_code} registrada!` });
    }
  };

  const reset = () => {
    setDone(null);
    setItems([{ name: "", qty: 1, price: 0 }]);
    setCustomerName("");
    setDiscount(0);
    setNotes("");
    setInstallments(1);
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
        <h2 className="font-display text-2xl text-foreground mb-2">Venda registrada!</h2>
        <p className="font-body text-lg text-primary font-semibold mb-1">{done.sale_code}</p>
        <p className="font-body text-sm text-muted-foreground mb-6">Total: R$ {done.total.toFixed(2)}</p>
        <Button onClick={reset} size="lg" className="w-full">Nova Venda</Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display text-2xl text-foreground mb-6">Venda Rápida</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Canal */}
        <div>
          <Label className="font-body text-sm">Canal de venda *</Label>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger><SelectValue placeholder="Selecione o canal" /></SelectTrigger>
            <SelectContent>
              {channels.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Cliente */}
        <div>
          <Label className="font-body text-sm">Cliente</Label>
          <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nome do cliente (opcional)" />
        </div>

        {/* Itens */}
        <div>
          <Label className="font-body text-sm mb-2 block">Itens *</Label>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <Input className="flex-1 min-w-0" placeholder="Produto" value={item.name} onChange={(e) => updateItem(idx, "name", e.target.value)} />
                <Input className="w-16" type="number" min={1} placeholder="Qtd" value={item.qty || ""} onChange={(e) => updateItem(idx, "qty", Number(e.target.value))} />
                <Input className="w-24" type="number" min={0} step="0.01" placeholder="Preço" value={item.price || ""} onChange={(e) => updateItem(idx, "price", Number(e.target.value))} />
                <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeItem(idx)} disabled={items.length === 1}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addItem}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar item
          </Button>
        </div>

        {/* Pagamento */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="font-body text-sm">Pagamento *</Label>
            <Select value={payMethod} onValueChange={(v) => { setPayMethod(v); setInstallments(1); }}>
              <SelectTrigger><SelectValue placeholder="Forma" /></SelectTrigger>
              <SelectContent>
                {methods.map((m) => <SelectItem key={m.slug} value={m.slug}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {selectedMethod?.allows_installments && (
            <div>
              <Label className="font-body text-sm">Parcelas</Label>
              <Select value={String(installments)} onValueChange={(v) => setInstallments(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Desconto */}
        <div>
          <Label className="font-body text-sm">Desconto (R$)</Label>
          <Input type="number" min={0} step="0.01" value={discount || ""} onChange={(e) => setDiscount(Number(e.target.value))} placeholder="0,00" />
        </div>

        {/* Observações */}
        <div>
          <Label className="font-body text-sm">Observações</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anotações sobre a venda..." />
        </div>

        {/* Resumo */}
        <div className="bg-card border rounded-xl p-4 space-y-1">
          <div className="flex justify-between font-body text-sm"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
          {discount > 0 && <div className="flex justify-between font-body text-sm text-destructive"><span>Desconto</span><span>-R$ {discount.toFixed(2)}</span></div>}
          <div className="flex justify-between font-body text-base font-bold border-t pt-2 mt-2"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
          {selectedMethod?.allows_installments && installments > 1 && (
            <p className="font-body text-xs text-muted-foreground">{installments}x de R$ {(total / installments).toFixed(2)}</p>
          )}
        </div>

        <Button type="submit" className="w-full h-12 text-base" disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registrando...</> : "Confirmar Venda"}
        </Button>
      </form>
    </div>
  );
}
