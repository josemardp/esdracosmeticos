import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, MessageCircle, CheckCircle2, Loader2 } from "lucide-react";
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
    // Validations
    if (!form.name || !form.email || !form.phone) {
      toast({ title: "Preencha os dados de contato", variant: "destructive" }); return;
    }
    if (!form.zip || !form.street || !form.number || !form.neighborhood || !form.city || !form.state) {
      toast({ title: "Preencha o endereço completo", variant: "destructive" }); return;
    }
    if (!payment) {
      toast({ title: "Selecione o método de pagamento", variant: "destructive" }); return;
    }
    if (items.length === 0) {
      toast({ title: "Carrinho vazio", variant: "destructive" }); return;
    }

    setSubmitting(true);
    try {
      // 1. Get or create customer
      let customerId: string;
      if (user) {
        const { data: existing } = await supabase.from("customers").select("id").eq("user_id", user.id).maybeSingle();
        if (existing) {
          customerId = existing.id;
          // Update info
          await supabase.from("customers").update({ name: form.name, email: form.email, phone: form.phone }).eq("id", customerId);
        } else {
          const { data: created, error } = await supabase.from("customers").insert({ user_id: user.id, name: form.name, email: form.email, phone: form.phone }).select("id").single();
          if (error) throw error;
          customerId = created.id;
        }
      } else {
        // Guest checkout - find by email or create
        const { data: existing } = await supabase.from("customers").select("id").eq("email", form.email).maybeSingle();
        if (existing) {
          customerId = existing.id;
        } else {
          const { data: created, error } = await supabase.from("customers").insert({ name: form.name, email: form.email, phone: form.phone }).select("id").single();
          if (error) throw error;
          customerId = created.id;
        }
      }

      // 2. Create order
      const addressSnapshot = {
        street: form.street, number: form.number, complement: form.complement,
        neighborhood: form.neighborhood, city: form.city, state: form.state, zip: form.zip,
      };

      const { data: order, error: orderError } = await supabase.from("orders").insert({
        customer_id: customerId,
        order_code: "TEMP", // trigger will generate
        subtotal,
        discount,
        shipping: 0,
        total,
        payment_method: payment,
        payment_status: "pending",
        status: "pending",
        channel_origin: "website",
        shipping_address_snapshot: addressSnapshot,
      }).select("id, order_code").single();

      if (orderError) throw orderError;

      // 3. Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        name_snapshot: item.name,
        unit_price: item.sale_price ?? item.price,
        quantity: item.qty,
        subtotal: (item.sale_price ?? item.price) * item.qty,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      // 4. Decrement inventory for each item
      for (const item of items) {
        const { error: stockError } = await supabase.rpc("decrement_inventory", {
          p_product_id: item.id,
          p_qty: item.qty,
        });
        if (stockError) {
          toast({ title: `Estoque insuficiente: ${item.name}`, description: stockError.message, variant: "destructive" });
          // Don't throw - order was already created, admin will handle
        }
      }

      // 5. Increment coupon usage if used
      if (coupon) {
        try { await supabase.rpc("increment_coupon_usage" as any, { p_coupon_id: coupon.coupon_id }); } catch {}
      }

      // 6. Success
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

  // Success screen
  if (orderCode) {
    return (
      <div className="container mx-auto px-4 py-16 lg:py-24 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <CheckCircle2 className="w-20 h-20 text-primary mx-auto mb-6" />
          <h1 className="font-display text-3xl text-foreground mb-3">Pedido Confirmado!</h1>
          <p className="font-body text-sm text-muted-foreground mb-2">Seu pedido foi registrado com sucesso.</p>
          <p className="font-body text-lg font-semibold text-primary mb-8">Código: {orderCode}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user && <Link to="/conta/pedidos"><Button size="lg">Ver Meus Pedidos</Button></Link>}
            <Link to="/loja"><Button size="lg" variant="outline">Continuar Comprando</Button></Link>
            <a href={`https://wa.me/5518991459429?text=Olá,%20acabei%20de%20fazer%20o%20pedido%20${orderCode}%20na%20Esdra%20Cosméticos.`} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline"><MessageCircle className="w-4 h-4 mr-2" /> WhatsApp</Button>
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-6">
            {/* Contact */}
            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-body text-sm font-semibold text-foreground mb-4">Dados de Contato</h2>
              {!user && <p className="font-body text-xs text-muted-foreground mb-3">Já tem conta? <Link to="/login" className="text-primary hover:underline">Faça login</Link> para um checkout mais rápido.</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label className="font-body text-xs">Nome completo *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} /></div>
                <div><Label className="font-body text-xs">E-mail *</Label><Input type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
                <div><Label className="font-body text-xs">Telefone *</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(18) 99999-9999" /></div>
                <div><Label className="font-body text-xs">CPF</Label><Input value={form.cpf} onChange={e => set("cpf", e.target.value)} placeholder="000.000.000-00" /></div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-body text-sm font-semibold text-foreground mb-4">Endereço de Entrega</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label className="font-body text-xs">CEP *</Label><Input value={form.zip} onChange={e => set("zip", e.target.value)} onBlur={handleCepBlur} placeholder="00000-000" />{loadingCep && <span className="font-body text-xs text-muted-foreground">Buscando...</span>}</div>
                <div className="sm:col-span-2"><Label className="font-body text-xs">Rua *</Label><Input value={form.street} onChange={e => set("street", e.target.value)} /></div>
                <div><Label className="font-body text-xs">Número *</Label><Input value={form.number} onChange={e => set("number", e.target.value)} /></div>
                <div><Label className="font-body text-xs">Complemento</Label><Input value={form.complement} onChange={e => set("complement", e.target.value)} /></div>
                <div><Label className="font-body text-xs">Bairro *</Label><Input value={form.neighborhood} onChange={e => set("neighborhood", e.target.value)} /></div>
                <div><Label className="font-body text-xs">Cidade *</Label><Input value={form.city} onChange={e => set("city", e.target.value)} /></div>
                <div><Label className="font-body text-xs">Estado *</Label><Input value={form.state} onChange={e => set("state", e.target.value)} placeholder="SP" maxLength={2} /></div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-body text-sm font-semibold text-foreground mb-4">Pagamento</h2>
              <div className="space-y-3">
                {["PIX", "Cartão de Crédito", "Boleto Bancário"].map(m => (
                  <label key={m} className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${payment === m ? 'border-primary bg-primary/5' : 'hover:bg-secondary'}`}>
                    <input type="radio" name="payment" checked={payment === m} onChange={() => setPayment(m)} className="accent-primary" />
                    <span className="font-body text-sm text-foreground">{m}</span>
                  </label>
                ))}
              </div>
              <p className="font-body text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Pagamento 100% seguro
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-card border rounded-xl p-6 h-fit sticky top-24">
            <h3 className="font-body text-sm font-semibold text-foreground mb-4">Resumo do Pedido</h3>
            {items.length === 0 ? (
              <div className="text-center py-8">
                <p className="font-body text-sm text-muted-foreground">Seu carrinho está vazio</p>
                <Link to="/loja"><Button variant="outline" size="sm" className="mt-3">Ir à loja</Button></Link>
              </div>
            ) : (
              <>
                <div className="space-y-3 border-b pb-4 mb-4">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-12 h-12 bg-secondary rounded-lg shrink-0 overflow-hidden">
                        {(() => { const img = getProductImage(item.slug, item.cover_image); return img ? <img src={img} alt="" className="w-full h-full object-cover" /> : null; })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-xs text-foreground truncate">{item.name}</p>
                        <p className="font-body text-xs text-muted-foreground">{item.qty}x R$ {(item.sale_price ?? item.price).toFixed(2)}</p>
                      </div>
                      <p className="font-body text-xs font-medium text-foreground shrink-0">R$ {((item.sale_price ?? item.price) * item.qty).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 font-body text-sm border-b pb-4 mb-4">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>R$ 0,00</span></div>
                  {discount > 0 && <div className="flex justify-between text-primary"><span>Desconto</span><span>- R$ {discount.toFixed(2)}</span></div>}
                </div>
                <div className="flex justify-between font-body font-semibold text-foreground border-b pb-3 mb-3">
                  <span>Total</span><span>R$ {total.toFixed(2)}</span>
                </div>
                <Button className="w-full" size="lg" disabled={submitting || items.length === 0} onClick={handleSubmit}>
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</> : "Confirmar Pedido"}
                </Button>
              </>
            )}
            <a href="https://wa.me/5518991459429?text=Olá,%20quero%20ajuda%20para%20finalizar%20minha%20compra%20na%20Esdra%20Cosméticos." target="_blank" rel="noopener noreferrer" className="block mt-3">
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
