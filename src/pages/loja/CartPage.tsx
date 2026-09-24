import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingBag, MessageCircle, Tag, ShieldCheck, CreditCard, Lock, X } from "lucide-react";
import { whatsappUrl } from "@/lib/whatsapp";
import { useCart } from "@/contexts/CartContext";
import { getProductImage, getProductImageSrcSet, showPlaceholderOnError } from "@/lib/product-images";
import { getShippingLabel, qualifiesForFreeShipping, FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import { formatBRL } from "@/lib/format";

export default function CartPage() {
  const { items, itemCount, subtotal, discount, total, coupon, removeItem, updateQty, applyCoupon, removeCoupon } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Barra fixa com total e botão no celular (ver .has-buy-bar no index.css).
  useEffect(() => {
    if (items.length === 0) return;
    document.body.classList.add("has-buy-bar");
    return () => document.body.classList.remove("has-buy-bar");
  }, [items.length]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    await applyCoupon(couponCode.trim());
    setApplyingCoupon(false);
  };

  if (items.length === 0) {
    return (
      <div className="shell py-16 text-center font-body lg:py-24">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <ShoppingBag className="h-8 w-8 text-primary" strokeWidth={1.6} aria-hidden />
        </div>
        <h1 className="mb-2 font-display text-[32px] text-foreground display-md lg:text-[40px]">Sua sacola está vazia</h1>
        <p className="mx-auto mb-8 max-w-sm text-[15px] text-muted-foreground">Veja os perfumes e cuidados da loja, ou peça uma indicação para a Esdra.</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/loja" className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-deep">Ver a loja</Link>
          <a href={whatsappUrl("Olá, quero ajuda para escolher produtos da Esdra Cosméticos.")} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium text-foreground shadow-[inset_0_0_0_1.5px_hsl(var(--foreground))]">
            <MessageCircle className="h-[18px] w-[18px]" aria-hidden /> Pedir indicação
          </a>
        </div>
      </div>
    );
  }

  const freeShipping = qualifiesForFreeShipping(subtotal);
  const missing = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="shell pb-12 pt-6 font-body lg:pb-20 lg:pt-10">
      <div className="mb-5 flex items-baseline gap-3 lg:mb-8">
        <h1 className="font-display text-[34px] leading-tight text-foreground display-md lg:text-[44px]">Sua sacola</h1>
        <span className="text-[15px] text-muted-foreground">{itemCount} {itemCount === 1 ? "item" : "itens"}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
        <div>
          {/* Quanto falta para o frete grátis */}
          <div className="mb-2 rounded-lg bg-secondary px-4 py-3.5 text-[15px] text-foreground" role="status">
            {freeShipping ? (
              <p className="font-medium">Seu pedido tem frete grátis.</p>
            ) : (
              <p>Faltam <strong className="font-semibold tabular-nums">{formatBRL(missing)}</strong> para o frete grátis</p>
            )}
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-background" role="progressbar" aria-label="Caminho até o frete grátis" aria-valuemin={0} aria-valuemax={FREE_SHIPPING_THRESHOLD} aria-valuenow={Math.min(subtotal, FREE_SHIPPING_THRESHOLD)}>
              <div className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <ul>
            {items.map((item) => {
              const unitPrice = item.sale_price ?? item.price;
              const img = getProductImage(item.slug, item.cover_image);
              return (
                <li key={item.id} className="grid grid-cols-[88px_1fr] gap-4 border-b py-5 sm:grid-cols-[112px_1fr]">
                  <Link to={`/produto/${item.slug}`} className="aspect-square self-start overflow-hidden rounded-lg bg-secondary" tabIndex={-1} aria-hidden>
                    {img && <img src={img} alt="" className="blend-photo h-full w-full object-contain p-[10%]" srcSet={getProductImageSrcSet(img)} sizes="112px" loading="lazy" decoding="async" onError={showPlaceholderOnError} />}
                  </Link>
                  <div className="min-w-0">
                    <Link to={`/produto/${item.slug}`} className="line-clamp-2 text-[15px] leading-snug text-foreground hover:underline hover:underline-offset-4">{item.name}</Link>
                    <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm tabular-nums">
                      {item.sale_price && <s className="text-muted-foreground">{formatBRL(item.price)}</s>}
                      <span className={item.sale_price ? "text-primary" : "text-muted-foreground"}>{formatBRL(unitPrice)} cada</span>
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center rounded-full border border-input">
                        <button onClick={() => updateQty(item.id, item.qty - 1)} className="flex h-10 w-10 items-center justify-center rounded-full text-foreground" aria-label={item.qty === 1 ? `Tirar ${item.name} da sacola` : `Diminuir quantidade de ${item.name}`}><Minus className="h-4 w-4" /></button>
                        <span className="min-w-6 text-center text-[15px] font-medium tabular-nums" aria-live="polite">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.qty + 1)} disabled={item.qty >= item.inventory_count} className="flex h-10 w-10 items-center justify-center rounded-full text-foreground disabled:opacity-40" aria-label={`Aumentar quantidade de ${item.name}`}><Plus className="h-4 w-4" /></button>
                      </div>
                      <span className="text-base font-semibold text-foreground tabular-nums">{formatBRL(unitPrice * item.qty)}</span>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="mt-1 inline-flex min-h-10 items-center text-sm text-muted-foreground underline underline-offset-4 hover:text-destructive">Remover</button>
                  </div>
                </li>
              );
            })}
          </ul>
          <Link to="/loja" className="mt-4 inline-flex min-h-11 items-center text-[15px] font-medium text-primary underline underline-offset-4">Continuar comprando</Link>
        </div>

        {/* Resumo */}
        <aside aria-label="Resumo do pedido" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg bg-secondary p-5 lg:p-6">
            <h2 className="mb-4 font-display text-2xl text-foreground display-md">Resumo</h2>

            {coupon ? (
              <div className="mb-4 flex items-center justify-between rounded-md bg-background px-3 py-2">
                <span className="flex items-center gap-2 text-[15px] font-medium text-primary"><Tag className="h-4 w-4" aria-hidden />{coupon.code}</span>
                <button onClick={removeCoupon} className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:text-destructive" aria-label={`Tirar o cupom ${coupon.code}`}><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <div className="mb-5 flex gap-2">
                <label htmlFor="coupon" className="sr-only">Cupom de desconto</label>
                <input
                  id="coupon"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                  placeholder="Cupom de desconto"
                  autoCapitalize="characters"
                  className="h-12 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button onClick={handleApplyCoupon} disabled={applyingCoupon || !couponCode.trim()} className="h-12 shrink-0 rounded-full border-[1.5px] border-foreground px-5 text-[15px] font-medium text-foreground disabled:opacity-50">
                  {applyingCoupon ? "Aplicando..." : "Aplicar"}
                </button>
              </div>
            )}

            <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-[15px] tabular-nums">
              <dt className="text-muted-foreground">Subtotal</dt><dd className="pl-4 text-right text-foreground">{formatBRL(subtotal)}</dd>
              {discount > 0 && <><dt className="text-primary">Desconto</dt><dd className="pl-4 text-right text-primary">- {formatBRL(discount)}</dd></>}
              <dt className="text-muted-foreground">Frete</dt><dd className={`pl-4 text-right ${freeShipping ? "font-medium text-success" : "text-foreground"}`}>{getShippingLabel(subtotal)}</dd>
              <dt className="mt-2 border-t pt-3 text-lg font-semibold text-foreground">{freeShipping ? "Total" : "Total sem frete"}</dt>
              <dd className="mt-2 border-t pt-3 pl-4 text-right text-lg font-semibold text-foreground">{formatBRL(total)}</dd>
            </dl>
            {!freeShipping && <p className="mt-2 text-sm text-muted-foreground">O frete é informado pelo WhatsApp antes do pagamento.</p>}

            <Link to="/checkout" className="mt-5 hidden h-12 w-full items-center justify-center rounded-full bg-primary text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-deep lg:flex">
              Finalizar pedido
            </Link>

            <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-primary" aria-hidden />Compra segura</li>
              <li className="flex items-center gap-1.5"><CreditCard className="h-4 w-4 text-primary" aria-hidden />3x sem juros</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" aria-hidden />Originais</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Celular: total e botão sempre à mão */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <div className="leading-tight">
            <p className="text-lg font-semibold text-foreground tabular-nums">{formatBRL(total)}</p>
            <p className="text-xs text-muted-foreground">{freeShipping ? "frete grátis" : "sem frete"}</p>
          </div>
          <Link to="/checkout" className="ml-auto inline-flex h-12 flex-1 items-center justify-center rounded-full bg-primary px-5 text-[15px] font-medium text-primary-foreground">
            Finalizar pedido
          </Link>
        </div>
      </div>
    </div>
  );
}
