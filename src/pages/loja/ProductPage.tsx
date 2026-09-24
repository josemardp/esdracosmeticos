import { useEffect, useRef, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getProductImage, getProductImageSrcSet, imagePriority, showPlaceholderOnError } from "@/lib/product-images";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingBag, Heart, MessageCircle, ChevronLeft, ChevronDown, Star, Minus, Plus, ShieldCheck, Truck, RotateCcw, CreditCard, Check, Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { trackViewItem, trackAddToCart, trackWhatsAppClick } from "@/lib/analytics";
import { useSEO } from "@/hooks/use-seo";
import { PRODUCT_COLUMNS, takeProductPrefetch } from "@/lib/product-prefetch";
import { useProductJsonLd } from "@/hooks/use-product-jsonld";
import { WHATSAPP_PHONE } from "@/lib/whatsapp";
import { formatBRL, formatInstallments } from "@/lib/format";
import { ProductCard, type CardProduct } from "@/components/store/ProductCard";

interface Product {
  id: string; name: string; slug: string; sku: string | null;
  short_description: string | null; full_description: string | null;
  price: number; sale_price: number | null; inventory_count: number;
  cover_image: string | null; gallery: string[]; benefits: string | null;
  how_to_use: string | null; ingredients: string | null;
  category_id: string | null; new_arrival: boolean; bestseller: boolean;
  brand: string | null; weight_volume: string | null; tags: string[] | null;
}

interface Review { id: string; rating: number; comment: string | null; created_at: string; }

type RelatedProduct = CardProduct;

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const backUrl = (location.state as { from?: string })?.from || "/loja";
  const { addItem } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setSelectedImage(0);
    setQty(1);
    setJustAdded(false);
    const fetchData = async () => {
      setLoading(true);
      // Na primeira abertura, aproveita a busca que o index.html já começou.
      let data = await takeProductPrefetch<Product>(slug);
      if (!data) {
        const res = await supabase.from("products").select(PRODUCT_COLUMNS).eq("slug", slug).eq("active", true).maybeSingle();
        data = res.data as Product | null;
      }
      setProduct(data as Product | null);
      // Mostra o produto já; avaliações e relacionados chegam depois, mais abaixo na página.
      setReviews([]);
      setRelated([]);
      setLoading(false);
      if (data) {
        trackViewItem({ id: data.id, name: data.name, price: data.sale_price ?? data.price });
        const [revs, rel] = await Promise.all([
          supabase.from("reviews").select("id, rating, comment, created_at").eq("product_id", data.id).eq("approved", true).order("created_at", { ascending: false }).limit(10),
          data.category_id
            ? supabase.from("products").select("id, name, slug, price, sale_price, cover_image, inventory_count, brand, new_arrival, bestseller").eq("active", true).eq("category_id", data.category_id).neq("id", data.id).gt("inventory_count", 0).limit(4)
            : supabase.from("products").select("id, name, slug, price, sale_price, cover_image, inventory_count, brand, new_arrival, bestseller").eq("active", true).neq("id", data.id).gt("inventory_count", 0).limit(4),
        ]);
        setReviews((revs.data as Review[]) ?? []);
        setRelated((rel.data as RelatedProduct[]) ?? []);
      }
    };
    fetchData();
  }, [slug]);

  // SEO — rich meta + JSON-LD
  const seoDesc = product
    ? product.short_description || `Compre ${product.name} na Esdra Cosméticos. Entrega para todo o Brasil, parcele em até 3x sem juros.`
    : "Produto de beleza premium na Esdra Cosméticos.";
  useSEO({
    title: product ? `${product.name} | Esdra Cosméticos` : "Produto | Esdra Cosméticos",
    description: seoDesc,
    ogImage: product ? getProductImage(product.slug, product.cover_image) || undefined : undefined,
    ogType: "product",
  });

  const avgRatingForSeo = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  useProductJsonLd(product ? {
    name: product.name,
    slug: product.slug,
    description: seoDesc,
    price: product.price,
    salePrice: product.sale_price,
    sku: product.sku,
    brand: product.brand,
    image: getProductImage(product.slug, product.cover_image),
    inStock: product.inventory_count > 0,
    ratingValue: avgRatingForSeo,
    reviewCount: reviews.length,
  } : null);

  // Barra de compra fixa no celular: aparece quando o botão principal sai da tela.
  const buyRef = useRef<HTMLDivElement>(null);
  const [buyVisible, setBuyVisible] = useState(true);
  useEffect(() => {
    const el = buyRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setBuyVisible(e.isIntersecting), { rootMargin: "0px 0px -40px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [product?.id]);
  useEffect(() => {
    document.body.classList.add("has-buy-bar");
    return () => document.body.classList.remove("has-buy-bar");
  }, []);

  const handleAddToCart = () => {
    if (!product) return;
    trackAddToCart({ id: product.id, name: product.name, price: product.sale_price ?? product.price, quantity: qty });
    addItem({
      id: product.id, name: product.name, slug: product.slug,
      price: product.price, sale_price: product.sale_price,
      cover_image: product.cover_image, inventory_count: product.inventory_count,
    }, qty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2500);
  };

  const handleFavorite = async () => {
    if (!user || !product) {
      toast({ title: "Faça login para favoritar", variant: "destructive" });
      return;
    }
    const { data: customer } = await supabase.from("customers").select("id").eq("user_id", user.id).maybeSingle();
    if (!customer) { toast({ title: "Complete seu cadastro primeiro", variant: "destructive" }); return; }
    const { data: existing } = await supabase.from("favorites").select("id").eq("customer_id", customer.id).eq("product_id", product.id).maybeSingle();
    if (existing) {
      await supabase.from("favorites").delete().eq("id", existing.id);
      toast({ title: "Removido dos favoritos" });
    } else {
      await supabase.from("favorites").insert({ customer_id: customer.id, product_id: product.id });
      toast({ title: "Adicionado aos favoritos ♡" });
    }
  };

  // Mesmo esqueleto da página pronta (link "Voltar", foto quadrada, título e preço), para nada pular quando o produto chega.
  if (loading) return (
    <div className="pb-12 pt-3 lg:pb-20 lg:pt-8" aria-busy="true">
      <div className="shell">
        <div className="mb-3 h-11 w-32" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-14">
          <div className="-mx-4 aspect-square animate-pulse bg-secondary sm:mx-0 sm:rounded-lg" />
          <div className="space-y-4">
            <div className="h-4 w-24 rounded bg-secondary" />
            <div className="h-10 w-4/5 rounded bg-secondary" />
            <div className="h-9 w-1/3 rounded bg-secondary" />
            <div className="h-24 rounded bg-secondary" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="shell py-20 text-center font-body">
      <h1 className="mb-3 font-display text-3xl text-foreground display-md">Produto não encontrado</h1>
      <p className="mb-6 text-[15px] text-muted-foreground">Ele pode ter saído do catálogo. Veja os outros produtos da loja.</p>
      <Link to={backUrl} className="inline-flex h-12 items-center rounded-full bg-primary px-7 text-[15px] font-medium text-primary-foreground">Voltar à loja</Link>
    </div>
  );

  const fallbackImg = getProductImage(product.slug, product.cover_image);
  const images = [product.cover_image || fallbackImg, ...(product.gallery || [])].filter(Boolean) as string[];
  const outOfStock = product.inventory_count <= 0;
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const whatsappMsg = encodeURIComponent(`Olá, tenho interesse no produto "${product.name}" da Esdra Cosméticos.`);
  const finalPrice = product.sale_price ?? product.price;
  const discountPct = product.sale_price ? Math.round((1 - product.sale_price / product.price) * 100) : 0;
  const savings = product.sale_price ? (product.price - product.sale_price) : 0;

  const details = [
    { key: "desc", title: "Sobre o produto", text: product.full_description || product.short_description },
    { key: "use", title: "Modo de uso", text: product.how_to_use },
    { key: "ingredients", title: "Ingredientes", text: product.ingredients },
    { key: "shipping", title: "Entrega e trocas", text: "Frete grátis nas compras acima de R$ 199. Abaixo disso, o valor do frete é informado pelo WhatsApp antes do pagamento.\n\nVocê tem até 30 dias para trocar produtos lacrados, na embalagem original." },
  ].filter((d) => d.text);
  const whatsappHref = `https://wa.me/${WHATSAPP_PHONE}?text=${whatsappMsg}`;
  const lowStock = !outOfStock && product.inventory_count <= 3;

  return (
    <div className="pb-12 pt-3 lg:pb-20 lg:pt-8">
      <div className="shell">
        <Link to={backUrl} className="mb-3 inline-flex min-h-11 items-center gap-1 font-body text-[15px] text-muted-foreground transition-colors hover:text-foreground">
          <ChevronLeft className="h-4 w-4" aria-hidden /> Voltar à loja
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-14">
          {/* Fotos. Sem animação de entrada: a foto é o maior elemento da tela e precisa aparecer já. */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative -mx-4 aspect-square overflow-hidden bg-secondary sm:mx-0 sm:rounded-lg">
              {images.length > 0 ? (
                <img
                  key={images[selectedImage]}
                  src={images[selectedImage]}
                  srcSet={getProductImageSrcSet(images[selectedImage])}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  width={800}
                  height={800}
                  {...imagePriority(selectedImage === 0)}
                  alt={product.name}
                  className="blend-photo h-full w-full object-contain p-[8%]"
                  onError={showPlaceholderOnError}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-body text-muted-foreground">Sem foto</div>
              )}
              {discountPct > 0 && (
                <span className="absolute left-4 top-4 rounded bg-primary px-2.5 py-1 font-body text-sm font-semibold text-primary-foreground">-{discountPct}%</span>
              )}
              {outOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <span className="rounded-full bg-foreground px-5 py-2 font-body text-sm font-semibold text-background">Esgotado</span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Fotos do produto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    aria-label={`Ver foto ${i + 1} de ${images.length}`}
                    aria-pressed={i === selectedImage}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary transition-shadow ${i === selectedImage ? "ring-2 ring-foreground ring-offset-2" : "opacity-80 hover:opacity-100"}`}
                  >
                    <img src={img} srcSet={getProductImageSrcSet(img)} sizes="64px" alt="" className="blend-photo h-full w-full object-contain p-1" loading="lazy" decoding="async" onError={showPlaceholderOnError} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informações */}
          <div className="font-body">
            {product.brand && <p className="mb-1 text-[15px] text-muted-foreground">{product.brand}</p>}
            <h1 className="mb-2 font-display text-[30px] leading-[1.1] text-foreground text-balance display-md lg:text-[40px]">{product.name}</h1>
            {(product.weight_volume || product.new_arrival || product.bestseller) && (
              <p className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[15px] text-muted-foreground">
                {product.weight_volume && <span>{product.weight_volume}</span>}
                {product.new_arrival && <span className="text-primary">Lançamento</span>}
                {product.bestseller && <span className="text-primary">Mais vendido</span>}
              </p>
            )}

            {reviews.length > 0 && (
              <div className="mb-4 flex items-center gap-2">
                <div className="flex gap-0.5" aria-label={`Nota ${avgRating.toFixed(1)} de 5`}>
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? "fill-gold text-gold" : "text-border"}`} aria-hidden />)}
                </div>
                <a href="#avaliacoes" className="text-sm text-muted-foreground underline underline-offset-4">{reviews.length} avaliaç{reviews.length !== 1 ? "ões" : "ão"}</a>
              </div>
            )}

            {/* Preço */}
            <div className="mb-5 mt-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums">
                <span className={`text-[32px] font-semibold leading-none tracking-[-0.01em] ${discountPct > 0 ? "text-primary" : "text-foreground"}`}>{formatBRL(finalPrice)}</span>
                {discountPct > 0 && <s className="text-base text-muted-foreground">{formatBRL(product.price)}</s>}
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[15px] text-foreground tabular-nums">
                <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden /> ou {formatInstallments(finalPrice)}
              </p>
              {savings > 0 && <p className="mt-1 text-[15px] font-medium text-success tabular-nums">Você economiza {formatBRL(savings)}</p>}
            </div>

            {product.short_description && <p className="mb-6 max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground text-pretty">{product.short_description}</p>}

            {outOfStock ? (
              <div className="mb-6 rounded-lg bg-secondary p-5" ref={buyRef}>
                <p className="mb-1 text-base font-medium text-foreground">Esgotado no momento</p>
                <p className="mb-4 text-[15px] text-muted-foreground">Chame a Esdra no WhatsApp para saber quando volta.</p>
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsAppClick("product_out_of_stock")} className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-[15px] font-medium text-primary-foreground">
                  <MessageCircle className="h-[18px] w-[18px]" aria-hidden /> Avisar quando voltar
                </a>
              </div>
            ) : (
              <div className="mb-6 space-y-3" ref={buyRef}>
                <div className="flex items-center gap-4">
                  <div className="inline-flex items-center rounded-full border border-input">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-11 w-11 items-center justify-center rounded-full text-foreground disabled:opacity-40" disabled={qty <= 1} aria-label="Diminuir quantidade"><Minus className="h-4 w-4" /></button>
                    <span className="min-w-8 text-center text-base font-medium tabular-nums" aria-live="polite">{qty}</span>
                    <button onClick={() => setQty(Math.min(product.inventory_count, qty + 1))} className="flex h-11 w-11 items-center justify-center rounded-full text-foreground disabled:opacity-40" disabled={qty >= product.inventory_count} aria-label="Aumentar quantidade"><Plus className="h-4 w-4" /></button>
                  </div>
                  {lowStock ? (
                    <span className="flex items-center gap-2 text-[15px] font-medium text-primary"><span className="h-2 w-2 rounded-full bg-primary" aria-hidden />Restam {product.inventory_count} unidade{product.inventory_count !== 1 ? "s" : ""}</span>
                  ) : (
                    <span className="text-[15px] text-muted-foreground">Em estoque</span>
                  )}
                </div>
                <AddButton justAdded={justAdded} onClick={handleAddToCart} />
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsAppClick("product_page")} className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-medium text-foreground shadow-[inset_0_0_0_1.5px_hsl(var(--foreground))] transition-colors hover:bg-foreground/5">
                  <MessageCircle className="h-[18px] w-[18px]" aria-hidden /> Comprar pelo WhatsApp
                </a>
                <button onClick={handleFavorite} className="flex min-h-11 w-full items-center justify-center gap-2 text-[15px] text-muted-foreground transition-colors hover:text-primary">
                  <Heart className="h-[18px] w-[18px]" aria-hidden /> Salvar nos favoritos
                </button>
              </div>
            )}

            {/* Garantias */}
            <ul className="mb-6 grid grid-cols-2 gap-x-4 gap-y-3 border-y py-5">
              {[
                { icon: Truck, text: "Frete grátis acima de R$ 199" },
                { icon: ShieldCheck, text: "Compra segura" },
                { icon: RotateCcw, text: "Troca em até 30 dias" },
                { icon: Package, text: "Produto original" },
              ].map((t) => (
                <li key={t.text} className="flex items-center gap-2.5 text-sm text-foreground">
                  <t.icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.6} aria-hidden />{t.text}
                </li>
              ))}
            </ul>

            {/* Informações que abrem e fecham */}
            <div className="border-t">
              {details.map((d, i) => (
                <details key={d.key} className="group border-b" open={i === 0}>
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-foreground [&::-webkit-details-marker]:hidden">
                    {d.title}
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="whitespace-pre-wrap pb-5 text-[15px] leading-relaxed text-muted-foreground">{d.text}</div>
                </details>
              ))}
            </div>
            {product.sku && <p className="mt-4 text-[13px] text-muted-foreground">Código {product.sku}</p>}
          </div>
        </div>

        {reviews.length > 0 && (
          <section id="avaliacoes" className="mt-14 scroll-mt-24 lg:mt-20">
            <h2 className="mb-6 font-display text-[28px] text-foreground display-md lg:text-[36px]">Avaliações ({reviews.length})</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <figure key={r.id} className="rounded-lg bg-secondary p-5 font-body">
                  <div className="mb-3 flex gap-0.5" aria-label={`${r.rating} de 5 estrelas`}>
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`h-4 w-4 ${s <= r.rating ? "fill-gold text-gold" : "text-border"}`} aria-hidden />)}
                  </div>
                  {r.comment && <blockquote className="mb-3 text-[15px] leading-relaxed text-foreground">“{r.comment}”</blockquote>}
                  <figcaption className="text-[13px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-14 lg:mt-20">
            <h2 className="mb-6 font-display text-[28px] text-foreground display-md lg:text-[36px]">Você também pode gostar</h2>
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 lg:grid-cols-4 lg:gap-x-5">
              {related.map((p) => <ProductCard key={p.id} product={p} sizes="(min-width: 1024px) 25vw, 50vw" />)}
            </div>
          </section>
        )}
      </div>

      {/* Celular: preço e botão de compra sempre à mão */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3 backdrop-blur-md transition-transform duration-300 ease-out lg:hidden ${buyVisible ? "translate-y-full" : "translate-y-0"}`}
        aria-hidden={buyVisible}
      >
        <div className="flex items-center gap-3 font-body">
          <div className="min-w-0 leading-tight">
            <p className="text-lg font-semibold text-foreground tabular-nums">{formatBRL(finalPrice)}</p>
            <p className="truncate text-xs text-muted-foreground tabular-nums">{outOfStock ? "Esgotado" : formatInstallments(finalPrice)}</p>
          </div>
          {outOfStock ? (
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" tabIndex={buyVisible ? -1 : 0} onClick={() => trackWhatsAppClick("product_out_of_stock")} className="ml-auto inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 text-[15px] font-medium text-primary-foreground">
              Avisar quando voltar
            </a>
          ) : (
            <AddButton justAdded={justAdded} onClick={handleAddToCart} compact tabIndex={buyVisible ? -1 : 0} />
          )}
        </div>
      </div>
    </div>
  );
}

function AddButton({ justAdded, onClick, compact = false, tabIndex }: { justAdded: boolean; onClick: () => void; compact?: boolean; tabIndex?: number }) {
  return (
    <button
      onClick={onClick}
      tabIndex={tabIndex}
      className={`flex h-12 items-center justify-center gap-2 rounded-full px-5 font-body text-[15px] font-medium transition-[background-color,transform] duration-200 active:scale-[0.98] ${compact ? "ml-auto flex-1 whitespace-nowrap" : "w-full"} ${
        justAdded ? "bg-foreground text-background" : "bg-primary text-primary-foreground hover:bg-primary-deep"
      }`}
    >
      {justAdded ? (
        <><Check className="h-[18px] w-[18px]" aria-hidden /> Na sacola</>
      ) : (
        <><ShoppingBag className="h-[18px] w-[18px]" aria-hidden /> Adicionar à sacola</>
      )}
    </button>
  );
}
