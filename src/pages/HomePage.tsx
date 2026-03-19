import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, ShieldCheck, Truck, RotateCcw, Star, Sparkles, Crown, Gift, ShoppingBag } from "lucide-react";
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
  { icon: Truck, title: "Frete Grátis", desc: "Em compras acima de R$ 199" },
  { icon: ShieldCheck, title: "Compra Segura", desc: "Seus dados protegidos" },
  { icon: RotateCcw, title: "Troca Fácil", desc: "Até 30 dias para trocar" },
  { icon: Gift, title: "Brindes Exclusivos", desc: "Em pedidos selecionados" },
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

  const ProductCard = ({ p, i }: { p: Product; i: number }) => (
    <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
      <div className="group bg-card border rounded-xl overflow-hidden hover:shadow-elegant transition-all">
        <Link to={`/produto/${p.slug}`}>
          <div className="aspect-square bg-secondary relative overflow-hidden">
            {(() => { const img = getProductImage(p.slug, p.cover_image); return img ? <img src={img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground font-body text-xs">Sem imagem</div>; })()}
            {p.new_arrival && <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-body font-medium px-2 py-0.5 rounded-full">Novo</span>}
            {p.sale_price && <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-body font-medium px-2 py-0.5 rounded-full">Oferta</span>}
            {p.inventory_count <= 0 && <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center"><span className="bg-foreground text-primary-foreground font-body text-xs font-medium px-3 py-1 rounded-full">Esgotado</span></div>}
          </div>
        </Link>
        <div className="p-3 lg:p-4">
          <Link to={`/produto/${p.slug}`}>
            <h3 className="font-body text-sm text-foreground font-medium line-clamp-2 mb-1 group-hover:text-primary transition-colors">{p.name}</h3>
          </Link>
          <div className="flex items-baseline gap-2 mb-2">
            {p.sale_price ? (
              <>
                <span className="font-body text-xs text-muted-foreground line-through">R$ {p.price.toFixed(2)}</span>
                <span className="font-body text-sm font-semibold text-primary">R$ {p.sale_price.toFixed(2)}</span>
              </>
            ) : (
              <span className="font-body text-sm font-semibold text-foreground">R$ {p.price.toFixed(2)}</span>
            )}
          </div>
          {p.inventory_count > 0 && (
            <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => handleQuickAdd(p)}>
              <ShoppingBag className="w-3 h-3 mr-1" /> Adicionar
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );

  const ProductSection = ({ title, subtitle, products, linkTo, linkLabel }: { title: string; subtitle: string; products: Product[]; linkTo: string; linkLabel: string }) => {
    if (products.length === 0) return null;
    return (
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <motion.div className="flex items-end justify-between mb-8" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div>
              <h3 className="font-display text-3xl lg:text-4xl italic text-foreground mb-1">{title}</h3>
              <p className="font-body text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <Link to={linkTo} className="hidden sm:inline-flex items-center gap-1 font-body text-sm text-primary hover:underline">
              {linkLabel} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {products.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
          </div>
          <Link to={linkTo} className="sm:hidden flex items-center justify-center gap-1 font-body text-sm text-primary hover:underline mt-6">
            {linkLabel} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    );
  };

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Coleção Esdra Cosméticos" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
        </div>
        <div className="relative container mx-auto px-4 py-20">
          <motion.div className="max-w-xl" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.12 } } }}>
            <motion.span variants={fadeUp} custom={0} className="inline-block font-body text-xs tracking-[0.3em] uppercase text-primary-foreground/70 mb-4">Nova Coleção 2026</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl italic leading-[1.1] tracking-tight text-primary-foreground mb-6">
              A essência do cuidado, traduzida em <span className="text-gold">sofisticação</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="font-body text-sm sm:text-base text-primary-foreground/70 max-w-md leading-relaxed mb-8">
              Descubra produtos selecionados para realçar sua beleza natural com ingredientes premium e resultados visíveis.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-4">
              <Link to="/loja"><Button size="lg" className="bg-primary text-primary-foreground hover:opacity-90 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] font-body text-sm tracking-wide px-8">Explorar Produtos <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
              <Link to="/loja?categoria=skincare"><Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-body text-sm tracking-wide px-8">Skincare</Button></Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h3 className="font-display text-3xl lg:text-4xl italic text-foreground mb-3">Explore por Categoria</h3>
            <p className="font-body text-sm text-muted-foreground">Encontre exatamente o que sua rotina de beleza precisa</p>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {categories.filter(c => categoryImages[c.slug]).map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}>
                <Link to={`/loja?categoria=${cat.slug}`} className="group relative block aspect-[3/4] rounded-xl overflow-hidden">
                  <img src={cat.image_url || categoryImages[cat.slug]} alt={cat.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                    <h4 className="font-display text-xl lg:text-2xl text-primary-foreground font-semibold">{cat.name}</h4>
                    <span className="font-body text-xs text-primary-foreground/70 group-hover:text-primary-foreground transition-colors">Ver produtos →</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dual Entry */}
      <section className="py-16 lg:py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h3 className="font-display text-3xl lg:text-4xl italic text-foreground mb-3">Como posso ajudar?</h3>
            <p className="font-body text-sm text-muted-foreground">Escolha como deseja acessar a plataforma Esdra Cosméticos</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <Link to="/loja" className="group block bg-card border rounded-xl p-8 lg:p-10 text-center hover:shadow-elegant-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/10 transition-colors"><Sparkles className="w-7 h-7 text-primary" /></div>
                <h4 className="font-display text-2xl font-semibold text-foreground mb-2">Quero Comprar</h4>
                <p className="font-body text-sm text-muted-foreground mb-5 leading-relaxed">Explore nossa coleção exclusiva de cosméticos e encontre os produtos perfeitos para você.</p>
                <span className="font-body text-sm font-medium text-primary group-hover:underline inline-flex items-center gap-1">Acessar Loja <ArrowRight className="w-3.5 h-3.5" /></span>
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <Link to="/admin" className="group block bg-card border rounded-xl p-8 lg:p-10 text-center hover:shadow-elegant-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/10 transition-colors"><Crown className="w-7 h-7 text-primary" /></div>
                <h4 className="font-display text-2xl font-semibold text-foreground mb-2">Sou Gestor</h4>
                <p className="font-body text-sm text-muted-foreground mb-5 leading-relaxed">Acesse o painel administrativo para gerenciar produtos, pedidos, estoque e operação.</p>
                <span className="font-body text-sm font-medium text-primary group-hover:underline inline-flex items-center gap-1">Acessar Painel <ArrowRight className="w-3.5 h-3.5" /></span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <ProductSection title="Destaques" subtitle="Seleção especial da curadoria Esdra" products={featured} linkTo="/loja" linkLabel="Ver todos" />

      {/* New Arrivals */}
      <ProductSection title="Lançamentos" subtitle="Novidades que acabaram de chegar" products={newArrivals} linkTo="/lancamentos" linkLabel="Ver lançamentos" />

      {/* Bestsellers */}
      <div className="bg-secondary">
        <ProductSection title="Mais Vendidos" subtitle="Os favoritos das nossas clientes" products={bestsellers} linkTo="/loja" linkLabel="Ver todos" />
      </div>

      {/* Benefits */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {benefits.map((b, i) => (
              <motion.div key={b.title} className="text-center" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="w-12 h-12 bg-card border rounded-full flex items-center justify-center mx-auto mb-3"><b.icon className="w-5 h-5 text-primary" /></div>
                <h4 className="font-body text-sm font-semibold text-foreground mb-1">{b.title}</h4>
                <p className="font-body text-xs text-muted-foreground">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="py-16 lg:py-20 bg-secondary">
          <div className="container mx-auto px-4">
            <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h3 className="font-display text-3xl lg:text-4xl italic text-foreground mb-3">O que dizem nossas clientes</h3>
              <p className="font-body text-sm text-muted-foreground">Avaliações reais de quem confia na Esdra</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {reviews.map((t, i) => (
                <motion.div key={i} className="bg-card border rounded-xl p-6 lg:p-8" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <div className="flex gap-0.5 mb-4">{Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 fill-gold text-gold" />)}</div>
                  {t.comment && <p className="font-body text-sm text-foreground leading-relaxed mb-4">"{t.comment}"</p>}
                  <p className="font-body text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA WhatsApp */}
      <section className="py-16 lg:py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h3 className="font-display text-3xl lg:text-4xl italic text-primary-foreground mb-3">Precisa de ajuda para escolher?</h3>
            <p className="font-body text-sm text-primary-foreground/70 mb-8 max-w-md mx-auto">Nossa equipe está pronta para te ajudar a encontrar os produtos ideais para sua rotina de beleza.</p>
            <a href="https://wa.me/5518991459429?text=Olá,%20quero%20recomendação%20de%20produtos%20da%20Esdra%20Cosméticos." target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-body text-sm tracking-wide px-8">Falar no WhatsApp</Button>
            </a>
          </motion.div>
        </div>
      </section>
    </>
  );
}
