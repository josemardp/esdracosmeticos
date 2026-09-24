import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Truck, RotateCcw, Star, CreditCard, ChevronDown, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getProductImage, getProductImageSrcSet, showPlaceholderOnError } from "@/lib/product-images";
import { formatBRL } from "@/lib/format";
import { useSEO } from "@/hooks/use-seo";
import { whatsappUrl } from "@/lib/whatsapp";
import { ProductCard, type CardProduct } from "@/components/store/ProductCard";

const guarantees = [
  { icon: ShieldCheck, title: "100% original", desc: "Distribuidores autorizados" },
  { icon: CreditCard, title: "3x sem juros", desc: "Cartão, PIX ou boleto" },
  { icon: Truck, title: "Frete grátis", desc: "Acima de R$ 199" },
  { icon: RotateCcw, title: "Troca fácil", desc: "Em até 30 dias" },
];

const faqs = [
  { q: "Quanto tempo leva para meu pedido chegar?", a: "O prazo de entrega varia de 3 a 10 dias úteis, dependendo da sua região. Pedidos acima de R$ 199 têm frete grátis." },
  { q: "Posso trocar ou devolver um produto?", a: "Sim. Você tem até 30 dias para pedir troca ou devolução de produtos lacrados e na embalagem original." },
  { q: "Quais formas de pagamento vocês aceitam?", a: "PIX, cartão de crédito e boleto bancário. No cartão, parcele em até 3x sem juros." },
  { q: "Os produtos são originais?", a: "Sim. Todos os produtos da Esdra Cosméticos são originais, comprados de distribuidores autorizados." },
  { q: "Quais marcas vocês trabalham?", a: "Eudora, O Boticário, Jequiti, De Sírius e Naturall Mix, entre outras. Veja todas na loja." },
];

// Marcas com produtos no cadastro; o link abre a loja já filtrada.
const brands = ["Eudora", "O Boticário", "Jequiti", "De Sírius", "Naturall Mix"];

type Product = CardProduct & { featured?: boolean };
interface Category { id: string; name: string; slug: string; }
interface CampaignBanner {
  id: string; title: string; subtitle: string | null; image_url: string | null;
  link_url: string; badge_text: string | null; position: string;
}

const COLS = "id, name, slug, price, sale_price, cover_image, inventory_count, new_arrival, bestseller, featured, brand";

// Tira da lista os produtos que já apareceram numa seção acima.
function fresh(list: Product[], used: Set<string>, n: number) {
  const out = list.filter((p) => !used.has(p.id)).slice(0, n);
  out.forEach((p) => used.add(p.id));
  return out;
}

export default function HomePage() {
  useSEO("Esdra Cosméticos | Perfumaria e beleza", "Perfumes, maquiagem, cuidados corporais e cabelos de Eudora, O Boticário, Jequiti e mais. Frete grátis acima de R$ 199. Parcele em até 3x sem juros.");
  const [shelf, setShelf] = useState<Product[] | null>(null);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [onSale, setOnSale] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [reviews, setReviews] = useState<{ rating: number; comment: string | null; created_at: string }[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignBanner[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const inStock = () => supabase.from("products").select(COLS).eq("active", true).gt("inventory_count", 0);
    Promise.all([
      inStock().eq("bestseller", true).limit(10),
      inStock().not("sale_price", "is", null).limit(10),
      inStock().eq("new_arrival", true).limit(10),
      inStock().eq("featured", true).limit(10),
      supabase.from("categories").select("id, name, slug").eq("active", true).order("sort_order").limit(8),
      supabase.from("reviews").select("rating, comment, created_at").eq("approved", true).order("created_at", { ascending: false }).limit(6),
      supabase.from("campaign_banners").select("id, title, subtitle, image_url, link_url, badge_text, position").eq("active", true).order("sort_order"),
    ]).then(([b, s, n, f, c, r, camp]) => {
      const best = (b.data as Product[]) ?? [];
      const sale = ((s.data as Product[]) ?? []).filter((p) => p.sale_price != null && p.sale_price < p.price);
      const news = (n.data as Product[]) ?? [];
      const feat = (f.data as Product[]) ?? [];

      // Vitrine do topo: fotos de fundo branco ficam bonitas sobre o rosa; mais vendidos primeiro.
      const topPool = [...best, ...feat, ...news].filter((p, i, a) => p.cover_image && a.findIndex((x) => x.id === p.id) === i);
      setShelf(topPool.slice(0, 6));

      const used = new Set<string>();
      setBestsellers(fresh(best.length ? best : feat, used, 5));
      setOnSale(fresh(sale, used, 5));
      setNewArrivals(fresh(news, used, 5));
      setCategories((c.data as Category[]) ?? []);
      setReviews((r.data as { rating: number; comment: string | null; created_at: string }[]) ?? []);
      setCampaigns((camp.data as CampaignBanner[]) ?? []);
    });
  }, []);

  const topCampaigns = campaigns.filter((c) => c.position === "home_top");

  return (
    <>
      {/* Topo: título grande e os produtos de verdade, já na primeira tela do celular. */}
      <section className="overflow-hidden bg-rose">
        <div className="shell grid gap-8 pt-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-end lg:gap-12 lg:pt-14">
          <div className="lg:pb-16">
            <h1 className="mb-4 font-display text-[44px] leading-[1.02] tracking-[-0.01em] text-foreground display-lg sm:text-5xl lg:text-[64px]">
              {/* Quebras fixas: a altura do título não muda quando a fonte troca (sem pulo de layout). */}
              <span className="rise-in block whitespace-nowrap">Seu perfume</span>
              <span className="rise-in block whitespace-nowrap">de sempre</span>
              <span className="rise-in block whitespace-nowrap [animation-delay:80ms]">e o próximo</span>
              <span className="rise-in block whitespace-nowrap [animation-delay:80ms]">favorito.</span>
            </h1>
            <p className="mb-6 max-w-[36ch] font-body text-base text-primary-deep lg:text-lg">
              Eudora, O Boticário, Jequiti, De Sírius e mais. Parcele em 3x sem juros e tire dúvidas pelo WhatsApp.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/loja" className="inline-flex h-12 items-center rounded-full bg-primary px-7 font-body text-[15px] font-medium text-primary-foreground transition-[background-color,transform] duration-200 hover:bg-primary-deep active:scale-[0.98]">
                Ver a loja
              </Link>
              <a
                href={whatsappUrl("Olá! Quero ajuda para escolher um produto na Esdra Cosméticos.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full px-6 font-body text-[15px] font-medium text-foreground shadow-[inset_0_0_0_1.5px_hsl(var(--foreground))] transition-colors hover:bg-foreground/5"
              >
                <MessageCircle className="h-[18px] w-[18px]" aria-hidden /> WhatsApp
              </a>
            </div>
          </div>

          <HeroShelf products={shelf} />
        </div>
      </section>

      {/* Categorias em botões de toque */}
      <nav aria-label="Categorias" className="shell pt-5 lg:pt-7">
        <ul className="no-scrollbar -mx-4 flex min-h-11 gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          {(categories ?? []).map((cat) => (
            <li key={cat.id} className="shrink-0">
              <Link to={`/loja?categoria=${cat.slug}`} className="inline-flex h-11 items-center rounded-full border px-[18px] font-body text-[15px] text-foreground transition-colors hover:border-primary hover:text-primary">
                {cat.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {topCampaigns.length > 0 && (
        <section className="shell pt-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {topCampaigns.map((camp) => (
              <Link key={camp.id} to={camp.link_url} className="group relative block overflow-hidden rounded-lg">
                {camp.image_url ? (
                  <div className="relative aspect-[2/1]">
                    <img src={camp.image_url} alt={camp.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-foreground/75 to-transparent" />
                    <div className="absolute inset-0 flex flex-col justify-center p-5 lg:p-8">
                      {camp.badge_text && <span className="mb-1 font-body text-[13px] text-background/85">{camp.badge_text}</span>}
                      <h3 className="mb-1 font-display text-2xl leading-tight text-background display-md lg:text-3xl">{camp.title}</h3>
                      {camp.subtitle && <p className="font-body text-sm text-background/85">{camp.subtitle}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="flex aspect-[2/1] flex-col justify-center bg-rose p-5 lg:p-8">
                    {camp.badge_text && <span className="mb-1 font-body text-[13px] text-primary-deep">{camp.badge_text}</span>}
                    <h3 className="mb-1 font-display text-2xl leading-tight text-foreground display-md lg:text-3xl">{camp.title}</h3>
                    {camp.subtitle && <p className="font-body text-sm text-primary-deep">{camp.subtitle}</p>}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <ProductSection title="Mais vendidos" omitBadge="Mais vendido" products={bestsellers} linkTo="/loja" linkLabel="Ver todos" />
      <ProductSection title="Em promoção" products={onSale} linkTo="/promocoes" linkLabel="Ver promoções" />
      <ProductSection title="Lançamentos" omitBadge="Novo" products={newArrivals} linkTo="/lancamentos" linkLabel="Ver lançamentos" />

      {/* Marcas: nomes grandes, cada um abre a loja filtrada */}
      <section className="mt-12 border-y py-10 lg:mt-16 lg:py-14">
        <div className="shell grid gap-4 lg:grid-cols-[260px_1fr] lg:items-baseline lg:gap-8">
          <h2 className="font-body text-[15px] font-normal text-muted-foreground">Marcas originais, de distribuidores autorizados</h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {brands.map((brand) => (
              <li key={brand}>
                <Link to={`/loja?marca=${encodeURIComponent(brand)}`} className="inline-flex min-h-11 items-center border-b border-transparent font-display text-[26px] text-foreground transition-colors display-md hover:border-primary lg:text-[32px]">
                  {brand}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Garantias */}
      <section aria-label="Garantias" className="shell grid grid-cols-2 gap-x-4 gap-y-5 py-10 lg:grid-cols-4 lg:py-12">
        {guarantees.map((g) => (
          <div key={g.title} className="flex items-start gap-2.5 font-body">
            <g.icon className="mt-0.5 h-[22px] w-[22px] shrink-0 text-primary" strokeWidth={1.6} aria-hidden />
            <p className="leading-snug">
              <span className="block text-[15px] font-medium text-foreground">{g.title}</span>
              <span className="text-sm text-muted-foreground">{g.desc}</span>
            </p>
          </div>
        ))}
      </section>

      {reviews.length > 0 && (
        <section className="bg-secondary py-12 lg:py-16">
          <div className="shell">
            <h2 className="mb-8 font-display text-[30px] leading-tight text-foreground display-md lg:text-[40px]">O que dizem as clientes</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {reviews.map((t, i) => (
                <figure key={i} className="rounded-lg bg-background p-6">
                  <div className="mb-3 flex gap-0.5" aria-label={`${t.rating} de 5 estrelas`}>
                    {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="h-4 w-4 fill-gold text-gold" aria-hidden />)}
                  </div>
                  {t.comment && <blockquote className="mb-3 font-body text-[15px] leading-relaxed text-foreground">“{t.comment}”</blockquote>}
                  <figcaption className="font-body text-[13px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ajuda pelo WhatsApp */}
      <section className="bg-rose py-10 lg:py-14">
        <div className="shell flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="mb-2 font-display text-[30px] leading-[1.08] text-foreground text-balance display-md lg:text-[40px]">Em dúvida entre dois perfumes?</h2>
            <p className="max-w-[42ch] font-body text-base text-primary-deep">Conta o que você gosta de usar e a Esdra indica pelo WhatsApp.</p>
          </div>
          <a
            href={whatsappUrl("Olá! Quero ajuda para escolher um perfume na Esdra Cosméticos.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 shrink-0 items-center gap-2 self-start rounded-full bg-primary px-7 font-body text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-deep lg:self-auto"
          >
            <MessageCircle className="h-[18px] w-[18px]" aria-hidden /> Conversar no WhatsApp
          </a>
        </div>
      </section>

      {/* Perguntas frequentes */}
      <section className="shell py-12 lg:py-16">
        <div className="max-w-[860px]">
        <h2 className="mb-6 font-display text-[30px] leading-tight text-foreground display-md lg:text-[40px]">Perguntas frequentes</h2>
        <div className="border-t">
          {faqs.map((faq, i) => {
            const open = openFaq === i;
            return (
              <div key={i} className="border-b">
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                  aria-controls={`faq-${i}`}
                  className="flex min-h-14 w-full items-center justify-between gap-4 py-3 text-left font-body text-base font-medium text-foreground"
                >
                  {faq.q}
                  <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`} aria-hidden />
                </button>
                {open && <p id={`faq-${i}`} className="pb-5 font-body text-[15px] leading-relaxed text-muted-foreground">{faq.a}</p>}
              </div>
            );
          })}
        </div>
        </div>
      </section>
    </>
  );
}

function ProductSection({ title, products, linkTo, linkLabel, omitBadge }: { title: string; products: Product[]; linkTo: string; linkLabel: string; omitBadge?: string }) {
  if (products.length === 0) return null;
  return (
    <section className="shell pt-10 lg:pt-14">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[30px] leading-tight text-foreground display-md lg:text-[40px]">{title}</h2>
        <Link to={linkTo} className="inline-flex min-h-11 items-center font-body text-[15px] font-medium text-primary underline decoration-1 underline-offset-4">
          {linkLabel}
        </Link>
      </div>
      {/* 4 no celular (2 linhas cheias), 5 no computador */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 lg:grid-cols-5 lg:gap-x-5 lg:gap-y-9">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} omitBadge={omitBadge} className={i >= 4 ? "hidden lg:flex" : undefined} />
        ))}
      </div>
    </section>
  );
}

// Produtos "em pé" sobre o rosa. Enquanto carrega, reserva o mesmo espaço (sem pulo de layout).
function HeroShelf({ products }: { products: Product[] | null }) {
  const slots = products ?? Array.from({ length: 3 }, () => null);
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3.5 overflow-x-auto px-4 lg:mx-0 lg:justify-end lg:gap-8 lg:overflow-visible lg:px-0" aria-label="Mais vendidos">
      {slots.map((p, i) => (
        <div key={p?.id ?? i} className={`w-[132px] shrink-0 snap-start lg:w-auto lg:max-w-[250px] lg:flex-1 ${i >= 3 ? "lg:hidden" : ""}`}>
          {p ? (
            <Link to={`/produto/${p.slug}`} className="group block text-foreground">
              <div className="relative flex h-[150px] items-end justify-center lg:h-[340px]">
                <span aria-hidden className="absolute inset-x-[12%] -bottom-1 h-2.5 rounded-[50%] bg-[radial-gradient(closest-side,hsl(var(--primary-deep)/0.28),transparent)]" />
                {(() => {
                  const img = getProductImage(p.slug, p.cover_image);
                  return (
                    <img
                      src={img}
                      srcSet={getProductImageSrcSet(img)}
                      sizes="(min-width: 1024px) 250px, 132px"
                      width={400}
                      height={400}
                      alt={p.name}
                      decoding="async"
                      onError={showPlaceholderOnError}
                      className="rise-in blend-photo relative max-h-full w-auto max-w-full object-contain transition-transform duration-500 group-hover:-translate-y-1"
                      style={{ animationDelay: `${120 + i * 60}ms` }}
                    />
                  );
                })()}
              </div>
              <span className="mt-1.5 block border-t-[1.5px] border-foreground/55 px-0.5 pb-5 pt-2 font-body text-[13px] leading-snug lg:pb-8 lg:text-[15px]">
                <span className="line-clamp-1">{p.name}</span>
                <b className="mt-0.5 block text-sm font-semibold tabular-nums lg:text-[17px]">{formatBRL(p.sale_price ?? p.price)}</b>
              </span>
            </Link>
          ) : (
            <div aria-hidden>
              <div className="h-[150px] lg:h-[340px]" />
              <div className="mt-1.5 h-[62px] border-t-[1.5px] border-foreground/20 lg:h-[78px]" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
