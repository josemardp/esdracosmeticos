import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, ShieldCheck, Truck, RotateCcw, Star, Gift, ShoppingBag, CreditCard, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getProductImage } from "@/lib/product-images";
import { useCart } from "@/contexts/CartContext";
import heroImg from "@/assets/hero-cosmetics.jpg";
import catMaquiagem from "@/assets/cat-maquiagem.jpg";
import catSkincare from "@/assets/cat-skincare.jpg";
import catCabelos from "@/assets/cat-cabelos.jpg";
import catPerfumaria from "@/assets/cat-perfumaria.jpg";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const categoryImages: Record<string, string> = {
  maquiagem: catMaquiagem, skincare: catSkincare, cabelos: catCabelos, perfumaria: catPerfumaria,
};

const benefits = [
  { icon: Truck, title: "Frete Grátis", desc: "Em compras acima de R$ 199 para todo o Brasil" },
  { icon: ShieldCheck, title: "Compra 100% Segura", desc: "Seus dados criptografados e protegidos" },
  { icon: RotateCcw, title: "Troca em até 30 dias", desc: "Devolução simples e sem burocracia" },
  { icon: Gift, title: "Brindes Exclusivos", desc: "Surpresas especiais em pedidos selecionados" },
];

const faqs = [
  { q: "Quanto tempo leva para meu pedido chegar?", a: "O prazo de entrega varia de 3 a 10 dias úteis, dependendo da sua região. Pedidos acima de R$ 199 têm frete grátis." },
  { q: "Posso trocar ou devolver um produto?", a: "Sim! Você tem até 30 dias para solicitar troca ou devolução de produtos não utilizados e na embalagem original." },
  { q: "Quais formas de pagamento vocês aceitam?", a: "Aceitamos PIX, cartão de crédito e boleto bancário. Parcele em até 3x sem juros no cartão." },
  { q: "Os produtos são originais?", a: "Sim, todos os produtos da Esdra Cosméticos são 100% originais, adquiridos diretamente de distribuidores autorizados." },
];

interface Product {
  id: string; name: string; slug: string; price: number; sale_price: number | null;
  cover_image: string | null; inventory_count: number; new_arrival: boolean; bestseller: boolean; featured: boolean;
  short_description: string | null;
}

interface Category { id: string; name: string; slug: string; image_url: string | null; }

export default function HomePage() {
  const { addItem } = useCart();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<{ rating: number; comment: string | null; created_at: string }[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const cols = "id, name, slug, price, sale_price, cover_image, inventory_count, new_arrival, bestseller, featured, short_description";
    Promise.all([
      supabase.from("products").select(cols).eq("active", true).eq("featured", true).limit(4),
      supabase.from("products").select(cols).eq("active", true).eq("new_arrival", true).limit(4),
      supabase.from("products").select(cols).eq("active", true).eq("bestseller", true).limit(4),
      supabase.from("categories").select("id, name, slug, image_url").eq("active", true).order("sort_order").limit(6),
      supabase.from("reviews").select("rating, comment, created_at").eq("approved", true).order("created_at", { ascending: false }).limit(6),
    ]).then(([f, n, b, c, r]) => {
      setFeatured((f.data as Product[]) ?? []);
      setNewArrivals((n.data as Product[]) ?? []);
      setBestsellers((b.data as Product[]) ?? []);
      setCategories((c.data as Category[]) ?? []);
      setReviews((r.data as any) ?? []);
    });
  }, []);

  const handleQuickAdd = (p: Product) => {
    if (p.inventory_count <= 0) return;
    addItem({
      id: p.id, name: p.name, slug: p.slug, price: p.price,
      sale_price: p.sale_price, cover_image: p.cover_image, inventory_count: p.inventory_count,
    });
  };

  const formatInstallment = (price: number) => {
    const installment = price / 3;
    return `3x de R$ ${installment.toFixed(2)} sem juros`;
  };

  const ProductCard = ({ p, i }: { p: Product; i: number }) => {
    const finalPrice = p.sale_price ?? p.price;
    return (
      <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
        <div className="group bg-card border rounded-xl overflow-hidden card-lift">
          <Link to={`/produto/${p.slug}`}>
            <div className="aspect-square bg-secondary relative overflow-hidden">
              {(() => { const img = getProductImage(p.slug, p.cover_image); return img ? <img src={img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground font-body text-xs">Sem imagem</div>; })()}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {p.new_arrival && <span className="bg-primary text-primary-foreground text-[10px] font-body font-semibold px-2.5 py-1 rounded-full">Novo</span>}
                {p.bestseller && <span className="bg-gold text-gold-foreground text-[10px] font-body font-semibold px-2.5 py-1 rounded-full">Mais Vendido</span>}
              </div>
              {p.sale_price && (
                <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-body font-semibold px-2.5 py-1 rounded-full">
                  -{Math.round((1 - p.sale_price / p.price) * 100)}%
                </span>
              )}
              {p.inventory_count <= 0 && <div className="absolute inset-0 bg-foreground/50 backdrop-blur-[2px] flex items-center justify-center"><span className="bg-foreground text-primary-foreground font-body text-xs font-semibold px-4 py-1.5 rounded-full">Esgotado</span></div>}
            </div>
          </Link>
          <div className="p-3.5 lg:p-4">
            <Link to={`/produto/${p.slug}`}>
              <h3 className="font-body text-sm text-foreground font-medium line-clamp-2 mb-1.5 group-hover:text-primary transition-colors leading-snug">{p.name}</h3>
            </Link>
            <div className="flex items-baseline gap-2 mb-1">
              {p.sale_price ? (
                <>
                  <span className="font-body text-xs text-muted-foreground line-through">R$ {p.price.toFixed(2)}</span>
                  <span className="font-body text-base font-bold text-primary">R$ {p.sale_price.toFixed(2)}</span>
                </>
              ) : (
                <span className="font-body text-base font-bold text-foreground">R$ {p.price.toFixed(2)}</span>
              )}
            </div>
            <p className="font-body text-[11px] text-muted-foreground mb-3 flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              {formatInstallment(finalPrice)}
            </p>
            {p.inventory_count > 0 && (
              <Button size="sm" className="w-full text-xs font-medium" onClick={() => handleQuickAdd(p)}>
                <ShoppingBag className="w-3.5 h-3.5 mr-1.5" /> Adicionar
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const ProductSection = ({ title, subtitle, products, linkTo, linkLabel }: { title: string; subtitle: string; products: Product[]; linkTo: string; linkLabel: string }) => {
    if (products.length === 0) return null;
    return (
      <section className="py-14 lg:py-20">
        <div className="container mx-auto px-4">
          <motion.div className="flex items-end justify-between mb-10" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div>
              <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl italic text-foreground mb-1">{title}</h3>
              <p className="font-body text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <Link to={linkTo} className="hidden sm:inline-flex items-center gap-1.5 font-body text-sm text-primary hover:underline font-medium">
              {linkLabel} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {products.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
          </div>
          <Link to={linkTo} className="sm:hidden flex items-center justify-center gap-1 font-body text-sm text-primary hover:underline font-medium mt-8">
            {linkLabel} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    );
  };

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[80vh] lg:min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Coleção Esdra Cosméticos" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/55 to-transparent" />
        </div>
        <div className="relative container mx-auto px-4 py-20">
          <motion.div className="max-w-xl" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.12 } } }}>
            <motion.span variants={fadeUp} custom={0} className="inline-block font-body text-xs tracking-[0.3em] uppercase text-primary-foreground/70 mb-4">Nova Coleção 2026</motion.span>
            <motion.h1 variants={fadeUp} custom={1} className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl italic leading-[1.08] tracking-tight text-primary-foreground mb-6">
              Realce sua beleza com produtos <span className="text-gold">selecionados</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="font-body text-sm sm:text-base text-primary-foreground/75 max-w-md leading-relaxed mb-8">
              Cosméticos premium com curadoria exclusiva. Frete grátis acima de R$ 199 e parcele em até 3x sem juros.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-3 sm:gap-4">
              <Link to="/loja"><Button size="lg" className="bg-primary text-primary-foreground hover:opacity-90 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] font-body text-sm tracking-wide px-8">Explorar Coleção <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
              <Link to="/lancamentos"><Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-body text-sm tracking-wide px-8">Novidades</Button></Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-card border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
            {benefits.map((b) => (
              <div key={b.title} className="flex items-center gap-3 py-4 lg:py-5 px-3 lg:px-6">
                <b.icon className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="font-body text-xs sm:text-sm font-semibold text-foreground leading-tight">{b.title}</p>
                  <p className="font-body text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-14 lg:py-20">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-10 lg:mb-12" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="font-body text-xs tracking-[0.2em] uppercase text-primary mb-2 block">Categorias</span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl italic text-foreground mb-3">Explore por Categoria</h2>
            <p className="font-body text-sm text-muted-foreground max-w-md mx-auto">Encontre exatamente o que sua rotina de beleza precisa</p>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {categories.filter(c => categoryImages[c.slug]).map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}>
                <Link to={`/loja?categoria=${cat.slug}`} className="group relative block aspect-[3/4] rounded-xl overflow-hidden card-lift">
                  <img src={cat.image_url || categoryImages[cat.slug]} alt={cat.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                    <h4 className="font-display text-lg sm:text-xl lg:text-2xl text-primary-foreground font-semibold">{cat.name}</h4>
                    <span className="font-body text-xs text-primary-foreground/80 group-hover:text-primary-foreground transition-colors inline-flex items-center gap-1 mt-1">Ver produtos <ArrowRight className="w-3 h-3" /></span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <ProductSection title="Destaques" subtitle="Seleção especial da curadoria Esdra" products={featured} linkTo="/loja" linkLabel="Ver todos" />

      {/* New Arrivals */}
      <div className="bg-secondary/50">
        <ProductSection title="Lançamentos" subtitle="Novidades que acabaram de chegar" products={newArrivals} linkTo="/lancamentos" linkLabel="Ver lançamentos" />
      </div>

      {/* Bestsellers */}
      <ProductSection title="Mais Vendidos" subtitle="Os favoritos das nossas clientes" products={bestsellers} linkTo="/loja" linkLabel="Ver todos" />

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="py-14 lg:py-20 bg-secondary/50">
          <div className="container mx-auto px-4">
            <motion.div className="text-center mb-10 lg:mb-12" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="font-body text-xs tracking-[0.2em] uppercase text-primary mb-2 block">Depoimentos</span>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl italic text-foreground mb-3">O que dizem nossas clientes</h2>
              <p className="font-body text-sm text-muted-foreground">Avaliações reais de quem confia na Esdra</p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 max-w-5xl mx-auto">
              {reviews.map((t, i) => (
                <motion.div key={i} className="bg-card border rounded-xl p-6 lg:p-8" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <div className="flex gap-0.5 mb-4">{Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 fill-gold text-gold" />)}</div>
                  {t.comment && <p className="font-body text-sm text-foreground leading-relaxed mb-4 italic">"{t.comment}"</p>}
                  <p className="font-body text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-14 lg:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="font-body text-xs tracking-[0.2em] uppercase text-primary mb-2 block">Dúvidas Frequentes</span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl italic text-foreground">Perguntas Frequentes</h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                className="bg-card border rounded-xl overflow-hidden"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-body text-sm font-medium text-foreground pr-4">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-primary shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 -mt-1">
                    <p className="font-body text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA WhatsApp */}
      <section className="py-14 lg:py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl italic text-primary-foreground mb-3">Precisa de ajuda para escolher?</h2>
            <p className="font-body text-sm text-primary-foreground/75 mb-8 max-w-md mx-auto leading-relaxed">
              Nossa equipe está pronta para recomendar os produtos ideais para sua rotina de beleza. Atendimento rápido e personalizado.
            </p>
            <a href="https://wa.me/5518991459429?text=Olá,%20quero%20recomendação%20de%20produtos%20da%20Esdra%20Cosméticos." target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-body text-sm tracking-wide px-8 hover:-translate-y-0.5 transition-all duration-300">Falar no WhatsApp</Button>
            </a>
          </motion.div>
        </div>
      </section>
    </>
  );
}
