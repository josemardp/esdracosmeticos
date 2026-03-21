import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, MessageCircle, CheckCircle2, Loader2, Lock, Truck, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { fetchCep } from "@/lib/viacep";
import { getProductImage } from "@/lib/product-images";
import { trackBeginCheckout, trackPurchase } from "@/lib/analytics";

export default function CheckoutPage() {
  const { items, subtotal, discount, total, coupon, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "", email: "", phone: "", cpf: "",
    zip: "", street: "", number: "", complement: "",
    neighborhood: "", city: "", state: "",
  });
  const [payment, setPayment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [orderCode, setOrderCode] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleCepBlur = useCallback(async () => {
    const clean = form.zip.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setLoadingCep(true);
    const result = await fetchCep(clean);
    if (result) {
      setForm(prev => ({
        ...prev,
        street: result.logradouro || prev.street,
        neighborhood: result.bairro || prev.neighborhood,
        city: result.localidade || prev.city,
        state: result.uf || prev.state,
      }));
    }
    setLoadingCep(false);
  }, [form.zip]);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone) {
      toast({ title: "Preencha os dados de contato", variant: "destructive" }); return;
    }
    if (!form.zip || !form.street || !form.number || !form.neighborhood || !form.city || !form.state) {
      toast({ title: "Preencha o endereço completo", variant: "destructive" }); return;
    }
    if (!payment) {
      toast({ title: "Selecione a forma de pagamento", variant: "destructive" }); return;
    }
    if (items.length === 0) {
      toast({ title: "Carrinho vazio", variant: "destructive" }); return;
    }

    setSubmitting(true);
    try {
      let customerId: string;
      if (user) {
        const { data: existing } = await supabase.from("customers").select("id").eq("user_id", user.id).maybeSingle();
        if (existing) {
          customerId = existing.id;
          await supabase.from("customers").update({ name: form.name, email: form.email, phone: form.phone }).eq("id", customerId);
        } else {
          const { data: created, error } = await supabase.from("customers").insert({ user_id: user.id, name: form.name, email: form.email, phone: form.phone }).select("id").single();
          if (error) throw error;
          customerId = created.id;
        }
      } else {
        // Garantir que não vinculamos o pedido de um convidado a um cliente que já possui user_id
        const { data: existing } = await supabase.from("customers").select("id").eq("email", form.email).is("user_id", null).maybeSingle();
        if (existing) {
          customerId = existing.id;
        } else {
          const { data: created, error } = await supabase.from("customers").insert({ name: form.name, email: form.email, phone: form.phone }).select("id").single();
          if (error) throw error;
          customerId = created.id;
        }
      }

      const addressSnapshot = {
        street: form.street, number: form.number, complement: form.complement,
        neighborhood: form.neighborhood, city: form.city, state: form.state, zip: form.zip,
      };

      const { data: order, error: orderError } = await supabase.from("orders").insert({
        customer_id: customerId,
        order_code: "",
        // TODO: Migrar para cálculo server-side para evitar manipulação de preços no frontend
        subtotal, discount, shipping: 0, total,
        payment_method: payment, payment_status: "pending", status: "pending",
        channel_origin: "website", shipping_address_snapshot: addressSnapshot,
      }).select("id, order_code").single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id, product_id: item.id, name_snapshot: item.name,
        // RISCO: Preço unitário vindo do frontend. Validado posteriormente no RPC process_order_inventory_and_coupon.
        unit_price: item.sale_price ?? item.price, quantity: item.qty,
        subtotal: (item.sale_price ?? item.price) * item.qty,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      const { error: batchError } = await supabase.rpc("process_order_inventory_and_coupon", {
        p_order_id: order.id,
        p_coupon_id: coupon?.coupon_id || null,
      });

      if (batchError) {
        toast({ title: "Erro no estoque", description: batchError.message, variant: "destructive" });
        throw batchError;
      }

      trackPurchase(order.order_code, total, items.map(i => ({ id: i.id, name: i.name, price: i.sale_price ?? i.price, quantity: i.qty })));
      setOrderCode(order.order_code);
      clearCart();
      toast({ title: "Pedido criado com sucesso!", description: `Código: ${order.order_code}` });

    } catch (err: any) {
      toast({ title: "Erro ao criar pedido", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (orderCode) {
    return (
      <div className="container mx-auto px-4 py-16 lg:py-24 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-3xl text-foreground mb-2">Pedido Confirmado!</h1>
          <p className="font-body text-sm text-muted-foreground mb-1">Seu pedido foi registrado com sucesso.</p>
          <p className="font-body text-lg font-bold text-primary mb-8">Código: {orderCode}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user && <Link to="/conta/pedidos"><Button size="lg">Ver Meus Pedidos</Button></Link>}
            <Link to="/loja"><Button size="lg" variant="outline">Continuar Comprando</Button></Link>
            <a href={`https://wa.me/5518991459429?text=Olá,%20acabei%20de%20fazer%20o%20pedido%20${orderCode}%20na%20Esdra%20Cosméticos.`} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline"><MessageCircle className="w-4 h-4 mr-2" /> Falar no WhatsApp</Button>
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 lg:py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-6 lg:mb-8">
          <Lock className="w-4 h-4 text-primary" />
          <h1 className="font-display text-2xl lg:text-3xl text-foreground">Checkout Seguro</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8">
          <div className="space-y-5">
            {/* Contact */}
            <div className="bg-card border rounded-xl p-5 lg:p-6">
              <h2 className="font-body text-sm font-semibold text-foreground mb-4">1. Dados de Contato</h2>
              {!user && <p className="font-body text-xs text-muted-foreground mb-3">Já tem conta? <Link to="/login" className="text-primary hover:underline font-medium">Faça login</Link> para um checkout mais rápido.</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label className="font-body text-xs mb-1.5 block">Nome completo *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} /></div>
                <div><Label className="font-body text-xs mb-1.5 block">E-mail *</Label><Input type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
                <div><Label className="font-body text-xs mb-1.5 block">Telefone *</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(18) 99999-9999" /></div>
                <div><Label className="font-body text-xs mb-1.5 block">CPF</Label><Input value={form.cpf} onChange={e => set("cpf", e.target.value)} placeholder="000.000.000-00" /></div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-card border rounded-xl p-5 lg:p-6">
              <h2 className="font-body text-sm font-semibold text-foreground mb-4">2. Endereço de Entrega</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label className="font-body text-xs mb-1.5 block">CEP *</Label><Input value={form.zip} onChange={e => set("zip", e.target.value)} onBlur={handleCepBlur} placeholder="00000-000" />{loadingCep && <span className="font-body text-xs text-primary mt-1 block">Buscando endereço...</span>}</div>
                <div className="sm:col-span-2"><Label className="font-body text-xs mb-1.5 block">Rua *</Label><Input value={form.street} onChange={e => set("street", e.target.value)} /></div>
                <div><Label className="font-body text-xs mb-1.5 block">Número *</Label><Input value={form.number} onChange={e => set("number", e.target.value)} /></div>
                <div><Label className="font-body text-xs mb-1.5 block">Complemento</Label><Input value={form.complement} onChange={e => set("complement", e.target.value)} /></div>
                <div><Label className="font-body text-xs mb-1.5 block">Bairro *</Label><Input value={form.neighborhood} onChange={e => set("neighborhood", e.target.value)} /></div>
                <div><Label className="font-body text-xs mb-1.5 block">Cidade *</Label><Input value={form.city} onChange={e => set("city", e.target.value)} /></div>
                <div><Label className="font-body text-xs mb-1.5 block">Estado *</Label><Input value={form.state} onChange={e => set("state", e.target.value)} placeholder="SP" maxLength={2} /></div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-card border rounded-xl p-5 lg:p-6">
              <h2 className="font-body text-sm font-semibold text-foreground mb-4">3. Forma de Pagamento</h2>
              <div className="space-y-2.5">
                {[
                  { value: "PIX", label: "PIX", desc: "Aprovação instantânea" },
                  { value: "Cartão de Crédito", label: "Cartão de Crédito", desc: "Até 3x sem juros" },
                  { value: "Boleto Bancário", label: "Boleto Bancário", desc: "Vencimento em 3 dias" },
                ].map(m => (
                  <label key={m.value} className={`flex items-center gap-3 border rounded-xl p-4 cursor-pointer transition-all ${payment === m.value ? 'border-primary bg-primary/5 shadow-sm' : 'hover:bg-secondary'}`}>
                    <input type="radio" name="payment" checked={payment === m.value} onChange={() => setPayment(m.value)} className="accent-[hsl(var(--primary))]" />
                    <div>
                      <span className="font-body text-sm font-medium text-foreground">{m.label}</span>
                      <p className="font-body text-[11px] text-muted-foreground">{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="font-body text-xs">Pagamento 100% seguro e criptografado</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="bg-card border rounded-xl p-5 lg:p-6 sticky top-24">
              <h3 className="font-body text-sm font-semibold text-foreground mb-4">Resumo do Pedido</h3>
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="font-body text-sm text-muted-foreground">Seu carrinho está vazio</p>
                  <Link to="/loja"><Button variant="outline" size="sm" className="mt-3">Ir à loja</Button></Link>
                </div>
              ) : (
                <>
                  <div className="space-y-3 border-b pb-4 mb-4 max-h-64 overflow-y-auto">
                    {items.map(item => (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-12 h-12 bg-secondary rounded-lg shrink-0 overflow-hidden">
                          {(() => { const img = getProductImage(item.slug, item.cover_image); return img ? <img src={img} alt="" className="w-full h-full object-cover" /> : null; })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-xs text-foreground line-clamp-1 font-medium">{item.name}</p>
                          <p className="font-body text-[11px] text-muted-foreground">{item.qty}x R$ {(item.sale_price ?? item.price).toFixed(2)}</p>
                        </div>
                        <p className="font-body text-xs font-semibold text-foreground shrink-0">R$ {((item.sale_price ?? item.price) * item.qty).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 font-body text-sm border-b pb-4 mb-4">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span className="text-xs text-success font-medium">Grátis</span></div>
                    {discount > 0 && <div className="flex justify-between text-primary"><span>Desconto</span><span>- R$ {discount.toFixed(2)}</span></div>}
                  </div>
                  <div className="flex justify-between font-body font-bold text-foreground text-lg border-b pb-4 mb-4">
                    <span>Total</span><span>R$ {total.toFixed(2)}</span>
                  </div>
                  <Button className="w-full h-12 font-semibold" size="lg" disabled={submitting || items.length === 0} onClick={handleSubmit}>
                    {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</> : <>Confirmar Pedido</>}
                  </Button>

                  {/* Trust */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t">
                    {[
                      { icon: ShieldCheck, label: "Seguro" },
                      { icon: Truck, label: "Frete Grátis" },
                      { icon: CreditCard, label: "3x s/ juros" },
                    ].map(t => (
                      <div key={t.label} className="text-center">
                        <t.icon className="w-3.5 h-3.5 text-primary mx-auto mb-0.5" />
                        <p className="font-body text-[10px] text-muted-foreground">{t.label}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <a href="https://wa.me/5518991459429?text=Olá,%20quero%20ajuda%20para%20finalizar%20minha%20compra%20na%20Esdra%20Cosméticos." target="_blank" rel="noopener noreferrer" className="block">
              <Button variant="outline" className="w-full" size="sm">
                <MessageCircle className="w-4 h-4 mr-2" /> Precisa de ajuda?
              </Button>
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
