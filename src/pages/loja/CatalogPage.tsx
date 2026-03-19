import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getProductImage } from "@/lib/product-images";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X, CreditCard, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/contexts/CartContext";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  cover_image: string | null;
  category_id: string | null;
  inventory_count: number;
  featured: boolean;
  new_arrival: boolean;
  bestseller: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("busca") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("categoria") || "");
  const [sortBy, setSortBy] = useState("name");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("id, name, slug").eq("active", true).order("sort_order").then(({ data }) => {
      setCategories((data as Category[]) ?? []);
    });
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      let query = supabase.from("products").select("id, name, slug, price, sale_price, cover_image, category_id, inventory_count, featured, new_arrival, bestseller").eq("active", true);
      
      if (selectedCategory) {
        const cat = categories.find(c => c.slug === selectedCategory);
        if (cat) query = query.eq("category_id", cat.id);
      }
      if (search) {
        query = query.ilike("name", `%${search}%`);
      }
      if (sortBy === "price_asc") query = query.order("price", { ascending: true });
      else if (sortBy === "price_desc") query = query.order("price", { ascending: false });
      else if (sortBy === "newest") query = query.order("created_at", { ascending: false });
      else query = query.order("name");

      const { data } = await query;
      setProducts((data as Product[]) ?? []);
      setLoading(false);
    };
    fetchProducts();
  }, [selectedCategory, search, sortBy, categories]);

  const clearFilters = () => {
    setSelectedCategory("");
    setSearch("");
    setSearchParams({});
  };

  const handleQuickAdd = (p: Product) => {
    if (p.inventory_count <= 0) return;
    addItem({
      id: p.id, name: p.name, slug: p.slug, price: p.price,
      sale_price: p.sale_price, cover_image: p.cover_image, inventory_count: p.inventory_count,
    });
  };

  const formatInstallment = (price: number) => `3x de R$ ${(price / 3).toFixed(2)}`;

  return (
    <div className="py-6 lg:py-10">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl italic text-foreground mb-1">
            {selectedCategory ? categories.find(c => c.slug === selectedCategory)?.name || "Loja" : "Nossa Loja"}
          </h1>
          <p className="font-body text-sm text-muted-foreground">
            {products.length} produto{products.length !== 1 ? "s" : ""} encontrado{products.length !== 1 ? "s" : ""}
          </p>
        </motion.div>

        {/* Search + Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produtos..."
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="lg:hidden" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="w-4 h-4 mr-2" /> Filtros {showFilters && <X className="w-3 h-3 ml-1" />}
          </Button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded-lg px-3 py-2 font-body text-sm bg-background text-foreground"
          >
            <option value="name">Nome A-Z</option>
            <option value="price_asc">Menor preço</option>
            <option value="price_desc">Maior preço</option>
            <option value="newest">Mais recentes</option>
          </select>
        </div>

        <div className="flex gap-6 lg:gap-8">
          {/* Sidebar filters */}
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-48 shrink-0`}>
            <div className="sticky top-24 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-body text-sm font-semibold text-foreground">Categorias</h3>
                {selectedCategory && (
                  <button onClick={clearFilters} className="text-xs text-primary hover:underline font-body flex items-center gap-1">
                    <X className="w-3 h-3" /> Limpar
                  </button>
                )}
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`block w-full text-left px-3 py-2.5 rounded-lg font-body text-sm transition-colors ${!selectedCategory ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-secondary'}`}
                >
                  Todos
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`block w-full text-left px-3 py-2.5 rounded-lg font-body text-sm transition-colors ${selectedCategory === cat.slug ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-secondary'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-card border rounded-xl animate-pulse aspect-[3/4]" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="font-body text-sm text-muted-foreground mb-2">Nenhum produto encontrado.</p>
                <p className="font-body text-xs text-muted-foreground mb-4">Tente outro termo ou limpe os filtros.</p>
                <Button variant="outline" onClick={clearFilters}>Limpar filtros</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {products.map((p, i) => {
                  const finalPrice = p.sale_price ?? p.price;
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div className="group bg-card border rounded-xl overflow-hidden card-lift">
                        <Link to={`/produto/${p.slug}`}>
                          <div className="aspect-square bg-secondary relative overflow-hidden">
                            {(() => { const img = getProductImage(p.slug, p.cover_image); return img ? <img src={img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground font-body text-xs">Sem imagem</div>; })()}
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                              {p.new_arrival && <span className="bg-primary text-primary-foreground text-[10px] font-body font-semibold px-2 py-0.5 rounded-full">Novo</span>}
                              {p.bestseller && <span className="bg-gold text-gold-foreground text-[10px] font-body font-semibold px-2 py-0.5 rounded-full">Mais Vendido</span>}
                            </div>
                            {p.sale_price && (
                              <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-body font-semibold px-2 py-0.5 rounded-full">
                                -{Math.round((1 - p.sale_price / p.price) * 100)}%
                              </span>
                            )}
                            {p.inventory_count <= 0 && (
                              <div className="absolute inset-0 bg-foreground/50 backdrop-blur-[2px] flex items-center justify-center">
                                <span className="bg-foreground text-primary-foreground font-body text-xs font-semibold px-4 py-1.5 rounded-full">Esgotado</span>
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="p-3 lg:p-4">
                          <Link to={`/produto/${p.slug}`}>
                            <h3 className="font-body text-sm text-foreground font-medium line-clamp-2 mb-1.5 group-hover:text-primary transition-colors leading-snug">{p.name}</h3>
                          </Link>
                          <div className="flex items-baseline gap-2 mb-0.5">
                            {p.sale_price ? (
                              <>
                                <span className="font-body text-xs text-muted-foreground line-through">R$ {p.price.toFixed(2)}</span>
                                <span className="font-body text-base font-bold text-primary">R$ {p.sale_price.toFixed(2)}</span>
                              </>
                            ) : (
                              <span className="font-body text-base font-bold text-foreground">R$ {p.price.toFixed(2)}</span>
                            )}
                          </div>
                          <p className="font-body text-[10px] sm:text-[11px] text-muted-foreground mb-3 flex items-center gap-1">
                            <CreditCard className="w-3 h-3 shrink-0" />
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
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
