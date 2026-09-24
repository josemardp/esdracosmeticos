import { useState, useCallback, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Loader2, Lock, CreditCard, Clock, ChevronDown, ShieldCheck } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { fetchCep } from "@/lib/viacep";
import { getProductImage, getProductImageSrcSet, showPlaceholderOnError } from "@/lib/product-images";
import { trackBeginCheckout, trackPurchase } from "@/lib/analytics";
import { WHATSAPP_PHONE, whatsappUrl } from "@/lib/whatsapp";
import { getShippingLabel, qualifiesForFreeShipping } from "@/lib/shipping";
import { formatBRL } from "@/lib/format";

export default function CheckoutPage() {
  const { items, subtotal, discount, total, coupon, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    zip: "", street: "", number: "", complement: "",
    neighborhood: "", city: "", state: "",
  });
  const [payment, setPayment] = useState(() => {
    try {
      return sessionStorage.getItem("esdra_order_payment") || "";
    } catch { return ""; }
  });
  const [submitting, setSubmitting] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  // Dados confirmados pelo servidor após criação do pedido
  const [orderResult, setOrderResult] = useState<{
    order_code: string;
    subtotal: number;
    discount: number;
    total: number;
  } | null>(() => {
    try {
      const raw = sessionStorage.getItem("esdra_order_result");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  // Barra fixa com total e botão no celular (ver .has-buy-bar no index.css).
  useEffect(() => {
    if (orderResult || items.length === 0) return;
    document.body.classList.add("has-buy-bar");
    return () => document.body.classList.remove("has-buy-bar");
  }, [orderResult, items.length]);

  // GA4: begin_checkout ao entrar na página (uma vez)
  const beginCheckoutFired = useRef(false);
  useEffect(() => {
    if (items.length > 0 && !beginCheckoutFired.current) {
      beginCheckoutFired.current = true;
      trackBeginCheckout(total, items.map(i => ({ id: i.id, name: i.name, price: i.sale_price ?? i.price, quantity: i.qty })));
    }
  }, [items, total]);

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

      // ─────────────────────────────────────────────────────────
      // SEGURANÇA: uma única chamada RPC server-side.
      // O servidor busca os preços do banco — o frontend envia
      // apenas product_id + qty. Cupom enviado como CODE (string).
      // Nenhum valor financeiro do frontend é confiado.
      // ─────────────────────────────────────────────────────────
      const { data, error } = await (supabase.rpc as any)("create_order", {
        p_items:           items.map(i => ({ product_id: i.id, qty: i.qty })),
        p_customer_name:   form.name.trim(),
        p_customer_email:  form.email.trim().toLowerCase(),
        p_customer_phone:  form.phone.trim(),
        p_address: {
          street:       form.street,
          number:       form.number,
          complement:   form.complement,
          neighborhood: form.neighborhood,
          city:         form.city,
          state:        form.state.toUpperCase(),
          zip:          form.zip.replace(/\D/g, ""),
        },
        p_payment_method: payment,
        p_coupon_code:    coupon?.code ?? null,
        p_user_id:        user?.id ?? null,
      });

      if (error) throw new Error(error.message);

      const result = data as unknown as {
        order_code: string; order_id: string;
        subtotal: number; discount: number; total: number;
      };

      // Rastrear com valores reais confirmados pelo servidor
      trackPurchase(result.order_code, result.total,
        items.map(i => ({ id: i.id, name: i.name, price: i.sale_price ?? i.price, quantity: i.qty }))
      );

      setOrderResult(result);
      try {
        sessionStorage.setItem("esdra_order_result", JSON.stringify(result));
        sessionStorage.setItem("esdra_order_payment", payment);
      } catch {
        // sessionStorage pode estar desabilitado em modo anônimo
      }
      clearCart();
      toast({ title: "Pedido criado com sucesso!", description: `Código: ${result.order_code}` });

    } catch (err: any) {
      // Mensagens de erro vêm do PostgreSQL em português
      toast({ title: "Erro ao criar pedido", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const clearOrderMemory = () => {
    try {
      sessionStorage.removeItem("esdra_order_result");
      sessionStorage.removeItem("esdra_order_payment");
    } catch {
      // sessionStorage indisponível
    }
  };

  // ── Tela de confirmação ──────────────────────────────────────
  if (orderResult) {
    const free = qualifiesForFreeShipping(orderResult.subtotal);
    return (
      <div className="shell py-12 font-body lg:py-20">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose">
            <Clock className="h-8 w-8 text-primary-deep" strokeWidth={1.6} aria-hidden />
          </div>
          <h1 className="mb-2 font-display text-[34px] leading-tight text-foreground display-md lg:text-[44px]">Pedido registrado</h1>
          <p className="text-[15px] text-muted-foreground">O pagamento ainda não foi feito. Falta só combinar pelo WhatsApp.</p>
          <p className="mt-4 text-lg font-semibold text-primary">Código {orderResult.order_code}</p>
        </div>

        <div className="mx-auto mt-8 max-w-lg space-y-4 text-left">
          <dl className="grid grid-cols-[1fr_auto] gap-y-2 rounded-lg bg-secondary p-5 text-[15px] tabular-nums">
            <dt className="text-muted-foreground">Subtotal</dt><dd className="pl-4 text-right">{formatBRL(orderResult.subtotal)}</dd>
            {orderResult.discount > 0 && <><dt className="text-primary">Desconto</dt><dd className="pl-4 text-right text-primary">- {formatBRL(orderResult.discount)}</dd></>}
            <dt className="text-muted-foreground">Frete</dt><dd className={`pl-4 text-right ${free ? "font-medium text-success" : ""}`}>{free ? "Grátis" : "A combinar"}</dd>
            <dt className="mt-1 border-t pt-2 font-semibold text-foreground">{free ? "Total" : "Total sem frete"}</dt>
            <dd className="mt-1 border-t pt-2 pl-4 text-right font-semibold text-foreground">{formatBRL(orderResult.total)}</dd>
          </dl>

          <div className="rounded-lg border p-5">
            {payment === "PIX" && (
              <>
                <p className="mb-1 text-base font-medium text-foreground">Como pagar com PIX</p>
                <p className="text-[15px] text-muted-foreground">Toque em "Combinar pelo WhatsApp" e mande o código do pedido. A Esdra responde com a chave PIX e o QR Code.</p>
              </>
            )}
            {payment === "Cartão de Crédito" && (
              <>
                <p className="mb-1 text-base font-medium text-foreground">Pagamento no cartão</p>
                <p className="text-[15px] text-muted-foreground">A Esdra manda um link de pagamento seguro pelo WhatsApp (até 3x sem juros).</p>
              </>
            )}
            {payment === "Boleto Bancário" && (
              <>
                <p className="mb-1 text-base font-medium text-foreground">Boleto bancário</p>
                <p className="text-[15px] text-muted-foreground">Enviaremos o boleto pelo WhatsApp em até 30 minutos. Vencimento em 3 dias úteis.</p>
              </>
            )}
          </div>

          <div className="rounded-lg border p-5">
            <p className="mb-3 text-base font-medium text-foreground">Próximos passos</p>
            <ol className="space-y-3 text-[15px] text-muted-foreground">
              {[
                <><strong className="font-medium text-foreground">Combine o pagamento pelo WhatsApp.</strong> Sem isso o pedido não segue.</>,
                <>Com o pagamento confirmado, a Esdra separa seu pedido.</>,
                <>Você recebe o código de rastreamento do envio.</>,
              ].map((step, n) => (
                <li key={n} className="flex items-start gap-3">
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${n === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>{n + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-lg flex-col gap-3">
          <a
            href={whatsappUrl(`Olá, acabei de fazer o pedido *${orderResult.order_code}* na Esdra Cosméticos. Total: ${formatBRL(orderResult.total)}. Forma de pagamento: ${payment}`)}
            target="_blank" rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-success text-[15px] font-medium text-success-foreground transition-[filter] hover:brightness-95"
          >
            <MessageCircle className="h-[18px] w-[18px]" aria-hidden /> Combinar pelo WhatsApp
          </a>
          {user && (
            <Link to="/conta/pedidos" onClick={clearOrderMemory} className="flex h-12 items-center justify-center rounded-full text-[15px] font-medium text-foreground shadow-[inset_0_0_0_1.5px_hsl(var(--foreground))]">
              Ver meus pedidos
            </Link>
          )}
          <Link to="/loja" onClick={clearOrderMemory} className="flex min-h-11 items-center justify-center text-[15px] font-medium text-primary underline underline-offset-4">
            Continuar comprando
          </Link>
        </div>
      </div>
    );
  }

  // ── Formulário ───────────────────────────────────────────────
  const free = qualifiesForFreeShipping(subtotal);
  const field = "h-12 w-full rounded-md border border-input bg-background px-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";
  const label = "mb-1.5 block text-[15px] font-medium text-foreground";
  const sectionTitle = "mb-4 flex items-center gap-3 font-display text-2xl text-foreground display-md";
  const stepNum = "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground font-body text-sm font-semibold text-background";

  const summaryItems = (
    <ul className="space-y-3">
      {items.map(item => {
        const img = getProductImage(item.slug, item.cover_image);
        const unit = item.sale_price ?? item.price;
        return (
          <li key={item.id} className="flex items-center gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-background">
              {img && <img src={img} alt="" className="blend-photo h-full w-full object-contain p-1" srcSet={getProductImageSrcSet(img)} sizes="64px" loading="lazy" decoding="async" onError={showPlaceholderOnError} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm leading-snug text-foreground">{item.name}</p>
              <p className="text-[13px] text-muted-foreground tabular-nums">{item.qty} x {formatBRL(unit)}</p>
            </div>
            <p className="shrink-0 text-sm font-medium text-foreground tabular-nums">{formatBRL(unit * item.qty)}</p>
          </li>
        );
      })}
    </ul>
  );

  const totals = (
    <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-[15px] tabular-nums">
      <dt className="text-muted-foreground">Subtotal</dt><dd className="pl-4 text-right">{formatBRL(subtotal)}</dd>
      {discount > 0 && <><dt className="text-primary">Desconto{coupon?.code ? ` (${coupon.code})` : ""}</dt><dd className="pl-4 text-right text-primary">- {formatBRL(discount)}</dd></>}
      <dt className="text-muted-foreground">Frete</dt><dd className={`pl-4 text-right ${free ? "font-medium text-success" : ""}`}>{getShippingLabel(subtotal)}</dd>
      <dt className="mt-1 border-t pt-3 text-lg font-semibold text-foreground">{free ? "Total" : "Total sem frete"}</dt>
      <dd className="mt-1 border-t pt-3 pl-4 text-right text-lg font-semibold text-foreground">{formatBRL(total)}</dd>
    </dl>
  );

  const submitLabel = submitting ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Registrando...</> : <><Lock className="h-4 w-4" aria-hidden /> Registrar pedido</>;

  return (
    <div className="shell pb-12 pt-6 font-body lg:pb-20 lg:pt-10">
      <h1 className="mb-2 font-display text-[34px] leading-tight text-foreground display-md lg:text-[44px]">Finalizar pedido</h1>
      <p className="mb-6 flex items-center gap-2 text-[15px] text-muted-foreground lg:mb-8"><Lock className="h-4 w-4 text-primary" aria-hidden />Seus dados ficam só com a Esdra.</p>

      {items.length === 0 ? (
        <div className="rounded-lg bg-secondary p-8 text-center">
          <p className="mb-4 text-[15px] text-muted-foreground">Sua sacola está vazia.</p>
          <Link to="/loja" className="inline-flex h-12 items-center rounded-full bg-primary px-6 text-[15px] font-medium text-primary-foreground">Ver a loja</Link>
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px] lg:gap-12">
        <div>
          {/* Celular: resumo recolhido no topo */}
          <details className="group mb-8 rounded-lg bg-secondary lg:hidden">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 text-[15px] [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2 text-foreground">Resumo do pedido ({items.length} {items.length === 1 ? "item" : "itens"})<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden /></span>
              <strong className="font-semibold tabular-nums">{formatBRL(total)}</strong>
            </summary>
            <div className="space-y-4 px-4 pb-4">{summaryItems}{totals}</div>
          </details>

          <form className="space-y-10" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} noValidate>
            <section aria-labelledby="passo-dados">
              <h2 id="passo-dados" className={sectionTitle}><span className={stepNum} aria-hidden>1</span>Seus dados</h2>
              {!user && (
                <p className="mb-4 text-[15px] text-muted-foreground">
                  Já comprou aqui? <Link to="/login" className="font-medium text-primary underline underline-offset-4">Entrar na conta</Link>
                </p>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><label htmlFor="ck-name" className={label}>Nome completo</label><input id="ck-name" className={field} autoComplete="name" value={form.name} onChange={e => set("name", e.target.value)} required /></div>
                <div>
                  <label htmlFor="ck-phone" className={label}>WhatsApp</label>
                  <input id="ck-phone" className={field} type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(18) 99999-9999" required />
                  <p className="mt-1.5 text-[13px] text-muted-foreground">É por aqui que a Esdra confirma o pedido e o pagamento.</p>
                </div>
                <div><label htmlFor="ck-email" className={label}>E-mail</label><input id="ck-email" className={field} type="email" inputMode="email" autoComplete="email" value={form.email} onChange={e => set("email", e.target.value)} required /></div>
              </div>
            </section>

            <section aria-labelledby="passo-entrega">
              <h2 id="passo-entrega" className={sectionTitle}><span className={stepNum} aria-hidden>2</span>Entrega</h2>
              <div className="grid grid-cols-6 gap-4">
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="ck-zip" className={label}>CEP</label>
                  <input id="ck-zip" className={field} inputMode="numeric" autoComplete="postal-code" value={form.zip} onChange={e => set("zip", e.target.value)} onBlur={handleCepBlur} placeholder="00000-000" required />
                  <p className="mt-1.5 min-h-5 text-[13px] text-muted-foreground" aria-live="polite">{loadingCep ? "Buscando o endereço..." : "Preenchemos a rua e a cidade para você."}</p>
                </div>
                <div className="col-span-6"><label htmlFor="ck-street" className={label}>Rua</label><input id="ck-street" className={field} autoComplete="address-line1" value={form.street} onChange={e => set("street", e.target.value)} required /></div>
                <div className="col-span-2"><label htmlFor="ck-number" className={label}>Número</label><input id="ck-number" className={field} inputMode="numeric" value={form.number} onChange={e => set("number", e.target.value)} required /></div>
                <div className="col-span-4"><label htmlFor="ck-comp" className={label}>Complemento <span className="font-normal text-muted-foreground">(opcional)</span></label><input id="ck-comp" className={field} autoComplete="address-line2" value={form.complement} onChange={e => set("complement", e.target.value)} /></div>
                <div className="col-span-6 sm:col-span-3"><label htmlFor="ck-bairro" className={label}>Bairro</label><input id="ck-bairro" className={field} value={form.neighborhood} onChange={e => set("neighborhood", e.target.value)} required /></div>
                <div className="col-span-4 sm:col-span-2"><label htmlFor="ck-city" className={label}>Cidade</label><input id="ck-city" className={field} autoComplete="address-level2" value={form.city} onChange={e => set("city", e.target.value)} required /></div>
                <div className="col-span-2 sm:col-span-1"><label htmlFor="ck-uf" className={label}>UF</label><input id="ck-uf" className={field} autoComplete="address-level1" value={form.state} onChange={e => set("state", e.target.value)} placeholder="SP" maxLength={2} required /></div>
              </div>
            </section>

            <section aria-labelledby="passo-pagamento">
              <h2 id="passo-pagamento" className={sectionTitle}><span className={stepNum} aria-hidden>3</span>Pagamento</h2>
              <fieldset>
                <legend className="sr-only">Forma de pagamento</legend>
                <div className="space-y-3">
                  {[
                    { value: "PIX", label: "PIX", desc: "Aprovação na hora" },
                    { value: "Cartão de Crédito", label: "Cartão de crédito", desc: "Até 3x sem juros, por link seguro" },
                    { value: "Boleto Bancário", label: "Boleto bancário", desc: "Vencimento em 3 dias úteis" },
                  ].map(opt => (
                    <label key={opt.value} className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${payment === opt.value ? "border-primary bg-secondary ring-1 ring-primary" : "hover:bg-secondary"}`}>
                      <input type="radio" name="payment" checked={payment === opt.value} onChange={() => setPayment(opt.value)} className="h-5 w-5 accent-[hsl(var(--primary))]" />
                      <span>
                        <span className="block text-[15px] font-medium text-foreground">{opt.label}</span>
                        <span className="text-sm text-muted-foreground">{opt.desc}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="mt-4 flex gap-3 rounded-lg bg-secondary p-4 text-[15px] text-foreground">
                <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <p>Você não paga nada agora. Depois de registrar, a Esdra chama no WhatsApp para confirmar o frete e o pagamento.</p>
              </div>
            </section>
          </form>
        </div>

        {/* Computador: resumo fixo ao lado */}
        <aside aria-label="Resumo do pedido" className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <div className="rounded-lg bg-secondary p-6">
            <h2 className="mb-4 font-display text-2xl text-foreground display-md">Resumo</h2>
            <div className="mb-5 max-h-72 overflow-y-auto border-b pb-5">{summaryItems}</div>
            {totals}
            {!free && <p className="mt-2 text-sm text-muted-foreground">O frete é informado pelo WhatsApp antes do pagamento.</p>}
            <button onClick={handleSubmit} disabled={submitting} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-60">
              {submitLabel}
            </button>
            <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" aria-hidden />Originais</li>
              <li className="flex items-center gap-1.5"><CreditCard className="h-4 w-4 text-primary" aria-hidden />3x sem juros</li>
            </ul>
          </div>
          <a href={whatsappUrl("Olá, quero ajuda para finalizar minha compra na Esdra Cosméticos.")} target="_blank" rel="noopener noreferrer" className="mt-3 flex min-h-11 items-center justify-center gap-2 text-[15px] text-muted-foreground hover:text-foreground">
            <MessageCircle className="h-4 w-4" aria-hidden /> Precisa de ajuda? Fale com a Esdra
          </a>
        </aside>
      </div>
      )}

      {/* Celular: total e botão sempre à mão */}
      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-3">
            <div className="leading-tight">
              <p className="text-lg font-semibold text-foreground tabular-nums">{formatBRL(total)}</p>
              <p className="text-xs text-muted-foreground">{free ? "frete grátis" : "sem frete"}</p>
            </div>
            <button onClick={handleSubmit} disabled={submitting} className="ml-auto inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 text-[15px] font-medium text-primary-foreground disabled:opacity-60">
              {submitLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
