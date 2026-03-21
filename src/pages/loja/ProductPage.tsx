import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getProductImage } from "@/lib/product-images";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Heart, MessageCircle, ChevronLeft, Star, Minus, Plus, ShieldCheck, Truck, RotateCcw, CreditCard } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { trackViewItem, trackAddToCart, trackWhatsAppClick } from "@/lib/analytics";

interface Product {
  id: string; name: string; slug: string; sku: string | null;
  short_description: string | null; full_description: string | null;
  price: number; sale_price: number | null; inventory_count: number;
  cover_image: string | null; gallery: string[]; benefits: string | null;
  how_to_use: string | null; ingredients: string | null;
  category_id: string | null; new_arrival: boolean; bestseller: boolean;
}

interface Review { id: string; rating: number; comment: string | null; created_at: string; }

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const backUrl = (location.state as { from?: string })?.from || "/loja";
  const { addItem } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "use" | "ingredients">("desc");

  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
      const { data } = await supabase.from("products").select("id, name, slug, sku, short_description, full_description, price, sale_price, inventory_count, cover_image, gallery, benefits, how_to_use, ingredients, category_id, new_arrival, bestseller").eq("slug", slug).eq("active", true).maybeSingle();
      setProduct(data as Product | null);
      if (data) {
        trackViewItem({ id: data.id, name: data.name, price: data.sale_price ?? data.price });
        const { data: revs } = await supabase.from("reviews").select("id, rating, comment, created_at").eq("product_id", data.id).eq("approved", true).order("created_at", { ascending: false }).limit(10);
        setReviews((revs as Review[]) ?? []);
      }
      setLoading(false);
    };
    fetchData();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    trackAddToCart({ id: product.id, name: product.name, price: product.sale_price ?? product.price, quantity: qty });
    addItem({
      id: product.id, name: product.name, slug: product.slug,
      price: product.price, sale_price: product.sale_price,
      cover_image: product.cover_image, inventory_count: product.inventory_count,
    }, qty);
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

  if (loading) return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="aspect-square bg-secondary rounded-xl animate-pulse" />
        <div className="space-y-4"><div className="h-8 bg-secondary rounded animate-pulse w-3/4" /><div className="h-6 bg-secondary rounded animate-pulse w-1/4" /><div className="h-20 bg-secondary rounded animate-pulse" /></div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h2 className="font-display text-2xl text-foreground mb-3">Produto não encontrado</h2>
      <p className="font-body text-sm text-muted-foreground mb-6">O produto que você está buscando pode ter sido removido ou não está disponível.</p>
      <Link to={backUrl}><Button>Voltar à loja</Button></Link>
    </div>
  );

  const fallbackImg = getProductImage(product.slug, product.cover_image);
  // NOTA: Atualmente usando URLs de imagens externas. 
  // Recomendação futura: Migrar para Supabase Storage próprio para maior controle e performance.
  const images = [product.cover_image || fallbackImg, ...(product.gallery || [])].filter(Boolean) as string[];
  const outOfStock = product.inventory_count <= 0;
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const whatsappMsg = encodeURIComponent(`Olá, tenho interesse no produto "${product.name}" da Esdra Cosméticos.`);
  const finalPrice = product.sale_price ?? product.price;
  const discountPct = product.sale_price ? Math.round((1 - product.sale_price / product.price) * 100) : 0;

  return (
    <div className="py-4 lg:py-10">
      <div className="container mx-auto px-4">
        <Link to={backUrl} className="inline-flex items-center gap-1 font-body text-sm text-muted-foreground hover:text-primary mb-5 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Voltar à loja
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Images */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="aspect-square bg-secondary rounded-xl overflow-hidden mb-3 relative">
              {images.length > 0 ? <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground font-body">Sem imagem</div>}
              {product.sale_price && (
                <span className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-xs font-body font-bold px-3 py-1 rounded-full">-{discountPct}%</span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${i === selectedImage ? 'border-primary ring-1 ring-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-2">
              {product.new_arrival && <span className="bg-primary/10 text-primary font-body text-[11px] font-semibold px-2.5 py-0.5 rounded-full">Lançamento</span>}
              {product.bestseller && <span className="bg-gold/10 text-gold font-body text-[11px] font-semibold px-2.5 py-0.5 rounded-full">Mais Vendido</span>}
            </div>
            <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-1">{product.name}</h1>
            {product.sku && <p className="font-body text-xs text-muted-foreground mb-3">SKU: {product.sku}</p>}

            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= avgRating ? 'fill-gold text-gold' : 'text-muted'}`} />)}</div>
                <span className="font-body text-xs text-muted-foreground">({reviews.length} avaliação{reviews.length !== 1 ? "ões" : ""})</span>
              </div>
            )}

            <div className="flex items-baseline gap-3 mb-1">
              {product.sale_price ? (
                <>
                  <span className="font-body text-lg text-muted-foreground line-through">R$ {product.price.toFixed(2)}</span>
                  <span className="font-display text-3xl font-bold text-primary">R$ {product.sale_price.toFixed(2)}</span>
                </>
              ) : (
                <span className="font-display text-3xl font-bold text-foreground">R$ {product.price.toFixed(2)}</span>
              )}
            </div>
            <p className="font-body text-xs text-muted-foreground mb-5 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              ou 3x de R$ {(finalPrice / 3).toFixed(2)} sem juros
            </p>

            {product.short_description && <p className="font-body text-sm text-muted-foreground leading-relaxed mb-6">{product.short_description}</p>}

            {outOfStock ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-5 mb-5">
                <p className="font-body text-sm text-destructive font-semibold mb-1">Produto indisponível</p>
                <p className="font-body text-xs text-muted-foreground">Este produto está temporariamente esgotado. Entre em contato pelo WhatsApp para ser avisada quando voltar.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-lg">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2.5 text-muted-foreground hover:text-foreground transition-colors"><Minus className="w-4 h-4" /></button>
                    <span className="px-4 font-body text-sm font-semibold min-w-[2rem] text-center">{qty}</span>
                    <button onClick={() => setQty(Math.min(product.inventory_count, qty + 1))} className="px-3 py-2.5 text-muted-foreground hover:text-foreground transition-colors"><Plus className="w-4 h-4" /></button>
                  </div>
                  <span className="font-body text-xs text-muted-foreground">{product.inventory_count} em estoque</span>
                </div>
                <Button className="w-full h-12 text-sm font-semibold" size="lg" onClick={handleAddToCart}>
                  <ShoppingBag className="w-4 h-4 mr-2" /> Adicionar ao Carrinho — R$ {(finalPrice * qty).toFixed(2)}
                </Button>
              </div>
            )}

            <div className="flex gap-3 mb-6">
              <Button variant="outline" size="sm" onClick={handleFavorite} className="flex-1 sm:flex-none">
                <Heart className="w-4 h-4 mr-1.5" /> Favoritar
              </Button>
              <a href={`https://wa.me/5518991459429?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsAppClick("product_page")} className="flex-1 sm:flex-none">
                <Button variant="outline" size="sm" className="w-full"><MessageCircle className="w-4 h-4 mr-1.5" /> WhatsApp</Button>
              </a>
            </div>

            {/* Trust */}
            <div className="grid grid-cols-3 gap-3 border-t pt-5 mb-6">
              {[
                { icon: Truck, text: "Frete grátis acima de R$ 199" },
                { icon: ShieldCheck, text: "Compra 100% segura" },
                { icon: RotateCcw, text: "Troca em até 30 dias" },
              ].map(t => (
                <div key={t.text} className="text-center">
                  <t.icon className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="font-body text-[10px] text-muted-foreground leading-tight">{t.text}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="border-t pt-6">
              <div className="flex gap-1 border-b mb-4">
                {[{ key: "desc", label: "Descrição" }, { key: "use", label: "Modo de Uso" }, { key: "ingredients", label: "Ingredientes" }].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`font-body text-sm pb-3 px-3 border-b-2 transition-colors ${activeTab === tab.key ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{tab.label}</button>
                ))}
              </div>
              <div className="font-body text-sm text-foreground leading-relaxed whitespace-pre-wrap min-h-[80px]">
                {activeTab === "desc" && (product.full_description || product.short_description || "Sem descrição disponível.")}
                {activeTab === "use" && (product.how_to_use || "Informação não disponível.")}
                {activeTab === "ingredients" && (product.ingredients || "Informação não disponível.")}
              </div>
            </div>
          </motion.div>
        </div>

        {reviews.length > 0 && (
          <div className="mt-14 lg:mt-20">
            <h2 className="font-display text-2xl text-foreground mb-6">Avaliações ({reviews.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map(r => (
                <div key={r.id} className="bg-card border rounded-xl p-5">
                  <div className="flex gap-0.5 mb-3">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-gold text-gold' : 'text-muted'}`} />)}</div>
                  {r.comment && <p className="font-body text-sm text-foreground mb-3 italic leading-relaxed">"{r.comment}"</p>}
                  <p className="font-body text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
