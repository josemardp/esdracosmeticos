import { useEffect, useState, useMemo, useCallback, useRef, memo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getProductImage } from "@/lib/product-images";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Search, SlidersHorizontal, X, ShoppingBag, CreditCard, PackageX, AlertCircle, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";

/* ─── types ─── */
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

/* ─── helpers ─── */
const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtInstallment = (v: number) =>
  `3x de ${(v / 3).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/* ─── SEO head ─── */
function useSEO(title: string, desc: string) {
  useEffect(() => {
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
  }, [title, desc]);
}

/* ─── sort options ─── */
const SORT_OPTIONS = [
  { value: "relevance", label: "Relevância" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
  { value: "name", label: "Nome A-Z" },
  { value: "newest", label: "Novidades" },
] as const;

/* ─── main ─── */
export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCart();

  /* raw data */
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /* filter state from URL */
  const urlQ = searchParams.get("q") || "";
  const urlCat = searchParams.get("categoria") || "";
  const urlSort = searchParams.get("ordem") || "relevance";
  const urlInStock = searchParams.get("estoque") === "1";
  const urlOnSale = searchParams.get("promocao") === "1";
  const urlNew = searchParams.get("novidades") === "1";
  const urlMinPrice = searchParams.get("preco_min") ? Number(searchParams.get("preco_min")) : 0;
  const urlMaxPrice = searchParams.get("preco_max") ? Number(searchParams.get("preco_max")) : 0;

  /* local input state */
  const [searchInput, setSearchInput] = useState(urlQ);
  const [priceRange, setPriceRange] = useState<[number, number]>([urlMinPrice, urlMaxPrice]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 350);
  const debouncedPrice = useDebounce(priceRange, 400);

  /* added-to-cart animation */
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  /* price bounds */
  const priceBounds = useMemo(() => {
    if (allProducts.length === 0) return { min: 0, max: 500 };
    const prices = allProducts.map((p) => p.sale_price ?? p.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [allProducts]);

  /* sync search input -> URL */
  useEffect(() => {
    updateURL({ q: debouncedSearch || undefined });
  }, [debouncedSearch]);

  /* sync price range -> URL */
  useEffect(() => {
    if (debouncedPrice[0] === 0 && debouncedPrice[1] === 0) return;
    if (debouncedPrice[0] <= priceBounds.min && debouncedPrice[1] >= priceBounds.max) {
      updateURL({ preco_min: undefined, preco_max: undefined });
    } else {
      updateURL({
        preco_min: debouncedPrice[0] > priceBounds.min ? String(debouncedPrice[0]) : undefined,
        preco_max: debouncedPrice[1] < priceBounds.max ? String(debouncedPrice[1]) : undefined,
      });
    }
  }, [debouncedPrice, priceBounds]);

  /* init price range from bounds */
  useEffect(() => {
    if (allProducts.length > 0 && priceRange[0] === 0 && priceRange[1] === 0) {
      setPriceRange([urlMinPrice || priceBounds.min, urlMaxPrice || priceBounds.max]);
    }
  }, [allProducts.length, priceBounds]);

  const updateURL = useCallback(
    (updates: Record<string, string | undefined>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([k, v]) => {
          if (v) next.set(k, v);
          else next.delete(k);
        });
        return next;
      }, { replace: true });
    },
    [setSearchParams]
  );

  const setFilter = useCallback(
    (key: string, value: string | undefined) => updateURL({ [key]: value }),
    [updateURL]
  );

  /* fetch data */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from("categories").select("id, name, slug").eq("active", true).order("sort_order"),
        supabase
          .from("products")
          .select("id, name, slug, price, sale_price, cover_image, category_id, inventory_count, featured, new_arrival, bestseller")
          .eq("active", true),
      ]);
      setCategories((cats as Category[]) ?? []);
      setAllProducts((prods as Product[]) ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* filter + sort (client-side for instant UX) */
  const filtered = useMemo(() => {
    let result = [...allProducts];

    // search
    if (urlQ) {
      const q = urlQ.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    // category
    if (urlCat) {
      const cat = categories.find((c) => c.slug === urlCat);
      if (cat) result = result.filter((p) => p.category_id === cat.id);
    }

    // in stock
    if (urlInStock) result = result.filter((p) => p.inventory_count > 0);

    // on sale
    if (urlOnSale) result = result.filter((p) => p.sale_price !== null);

    // new arrivals
    if (urlNew) result = result.filter((p) => p.new_arrival);

    // price range
    const effMin = urlMinPrice || priceBounds.min;
    const effMax = urlMaxPrice || priceBounds.max;
    if (urlMinPrice || urlMaxPrice) {
      result = result.filter((p) => {
        const price = p.sale_price ?? p.price;
        return price >= effMin && price <= effMax;
      });
    }

    // sort
    const sortFn = (a: Product, b: Product) => {
      const pa = a.sale_price ?? a.price;
      const pb = b.sale_price ?? b.price;
      switch (urlSort) {
        case "price_asc": return pa - pb;
        case "price_desc": return pb - pa;
        case "name": return a.name.localeCompare(b.name, "pt-BR");
        case "newest": return (b.new_arrival ? 1 : 0) - (a.new_arrival ? 1 : 0);
        default: // relevance: featured > bestseller > rest
          const sa = (a.featured ? 4 : 0) + (a.bestseller ? 2 : 0) + (a.new_arrival ? 1 : 0);
          const sb = (b.featured ? 4 : 0) + (b.bestseller ? 2 : 0) + (b.new_arrival ? 1 : 0);
          return sb - sa;
      }
    };

    // out-of-stock to end
    const inStock = result.filter((p) => p.inventory_count > 0).sort(sortFn);
    const outStock = result.filter((p) => p.inventory_count <= 0).sort(sortFn);
    return [...inStock, ...outStock];
  }, [allProducts, urlQ, urlCat, urlInStock, urlOnSale, urlNew, urlMinPrice, urlMaxPrice, urlSort, categories, priceBounds]);

  /* active filters for chips */
  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (urlQ) chips.push({ key: "q", label: `"${urlQ}"`, clear: () => { setSearchInput(""); setFilter("q", undefined); } });
    if (urlCat) {
      const cat = categories.find((c) => c.slug === urlCat);
      chips.push({ key: "cat", label: cat?.name || urlCat, clear: () => setFilter("categoria", undefined) });
    }
    if (urlInStock) chips.push({ key: "stock", label: "Em estoque", clear: () => setFilter("estoque", undefined) });
    if (urlOnSale) chips.push({ key: "sale", label: "Promoção", clear: () => setFilter("promocao", undefined) });
    if (urlNew) chips.push({ key: "new", label: "Lançamentos", clear: () => setFilter("novidades", undefined) });
    if (urlMinPrice || urlMaxPrice) {
      chips.push({
        key: "price",
        label: `${fmt(urlMinPrice || priceBounds.min)} – ${fmt(urlMaxPrice || priceBounds.max)}`,
        clear: () => {
          setPriceRange([priceBounds.min, priceBounds.max]);
          updateURL({ preco_min: undefined, preco_max: undefined });
        },
      });
    }
    return chips;
  }, [urlQ, urlCat, urlInStock, urlOnSale, urlNew, urlMinPrice, urlMaxPrice, categories, priceBounds]);

  const clearAll = useCallback(() => {
    setSearchInput("");
    setPriceRange([priceBounds.min, priceBounds.max]);
    setSearchParams({}, { replace: true });
  }, [priceBounds, setSearchParams]);

  /* quick add */
  const handleQuickAdd = useCallback(
    (p: Product) => {
      if (p.inventory_count <= 0) return;
      addItem({
        id: p.id, name: p.name, slug: p.slug, price: p.price,
        sale_price: p.sale_price, cover_image: p.cover_image, inventory_count: p.inventory_count,
      });
      setAddedIds((prev) => new Set(prev).add(p.id));
      setTimeout(() => setAddedIds((prev) => { const n = new Set(prev); n.delete(p.id); return n; }), 1200);
    },
    [addItem]
  );

  /* SEO */
  const catName = urlCat ? categories.find((c) => c.slug === urlCat)?.name : null;
  const seoTitle = catName
    ? `${catName} | Esdra Cosméticos`
    : "Loja | Esdra Cosméticos – Cosméticos Premium";
  const seoDesc = catName
    ? `Encontre os melhores produtos de ${catName} na Esdra Cosméticos. Qualidade premium com entrega para todo o Brasil.`
    : "Explore nossa coleção completa de cosméticos premium. Maquiagem, Skincare, Cabelos, Perfumaria e muito mais.";
  useSEO(seoTitle, seoDesc);

  /* ─── filter sidebar content (shared desktop/mobile) ─── */
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Categorias</h3>
        <div className="space-y-0.5">
          <button
            onClick={() => { setFilter("categoria", undefined); setMobileOpen(false); }}
            className={`block w-full text-left px-3 py-2 rounded-lg font-body text-sm transition-colors ${!urlCat ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-secondary"}`}
          >
            Todos os produtos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setFilter("categoria", cat.slug); setMobileOpen(false); }}
              className={`block w-full text-left px-3 py-2 rounded-lg font-body text-sm transition-colors ${urlCat === cat.slug ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-secondary"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Faixa de preço</h3>
        <Slider
          min={priceBounds.min}
          max={priceBounds.max}
          step={5}
          value={priceRange}
          onValueChange={(v) => setPriceRange(v as [number, number])}
          className="mb-3"
        />
        <div className="flex items-center justify-between font-body text-xs text-muted-foreground tabular-nums">
          <span>{fmt(priceRange[0])}</span>
          <span>{fmt(priceRange[1])}</span>
        </div>
      </div>

      {/* Toggles */}
      <div>
        <h3 className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Filtrar por</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <Checkbox
              checked={urlInStock}
              onCheckedChange={(c) => setFilter("estoque", c ? "1" : undefined)}
            />
            <span className="font-body text-sm text-foreground">Em estoque</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <Checkbox
              checked={urlOnSale}
              onCheckedChange={(c) => setFilter("promocao", c ? "1" : undefined)}
            />
            <span className="font-body text-sm text-foreground">Em promoção</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <Checkbox
              checked={urlNew}
              onCheckedChange={(c) => setFilter("novidades", c ? "1" : undefined)}
            />
            <span className="font-body text-sm text-foreground">Lançamentos</span>
          </label>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={clearAll}>
          Limpar todos os filtros
        </Button>
      )}
    </div>
  );

  return (
    <div className="py-6 lg:py-10">
      <div className="container mx-auto px-4">
        {/* ─── Header ─── */}
        <div className="mb-6">
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl italic text-foreground mb-1">
            {catName || "Nossa Loja"}
          </h1>
          {urlQ && (
            <p className="font-body text-sm text-muted-foreground">
              Resultados para: <span className="font-medium text-foreground">"{urlQ}"</span>
            </p>
          )}
        </div>

        {/* ─── Top bar: search + sort + mobile filter btn ─── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar produto..."
              className="pl-10 font-body"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {/* Mobile filter trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden shrink-0">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filtrar
                  {activeFilters.length > 0 && (
                    <span className="ml-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {activeFilters.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[340px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="font-display text-xl italic">Filtros</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>

            <select
              value={urlSort}
              onChange={(e) => setFilter("ordem", e.target.value === "relevance" ? undefined : e.target.value)}
              className="border border-input rounded-lg px-3 py-2 font-body text-sm bg-background text-foreground min-w-[140px]"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ─── Active filter chips + count ─── */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="font-body text-sm text-muted-foreground shrink-0">
            {loading ? "Carregando..." : `Exibindo ${filtered.length} produto${filtered.length !== 1 ? "s" : ""}`}
          </span>

          {activeFilters.length > 0 && (
            <>
              <span className="text-border">|</span>
              {activeFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={f.clear}
                  className="inline-flex items-center gap-1 bg-secondary text-foreground font-body text-xs px-2.5 py-1 rounded-full hover:bg-secondary/80 transition-colors"
                >
                  {f.label}
                  <X className="w-3 h-3" />
                </button>
              ))}
              <button
                onClick={clearAll}
                className="font-body text-xs text-primary hover:underline"
              >
                Limpar todos
              </button>
            </>
          )}
        </div>

        {/* ─── Layout: sidebar + grid ─── */}
        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24">
              <FilterContent />
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-card border rounded-xl overflow-hidden animate-pulse">
                    <div className="aspect-square bg-muted" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                      <div className="h-9 bg-muted rounded mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <AlertCircle className="w-12 h-12 text-destructive/60 mx-auto mb-4" />
                <p className="font-body text-sm text-foreground font-medium mb-1">Erro ao carregar produtos</p>
                <p className="font-body text-xs text-muted-foreground mb-4">
                  Verifique sua conexão e tente novamente.
                </p>
                <Button variant="outline" onClick={fetchData}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Tentar novamente
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <PackageX className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="font-body text-sm text-foreground font-medium mb-1">Nenhum produto encontrado</p>
                <p className="font-body text-xs text-muted-foreground mb-4">
                  Tente ajustar os filtros ou buscar por outro termo.
                </p>
                <Button variant="outline" onClick={clearAll}>Limpar filtros</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                <AnimatePresence mode="popLayout">
                  {filtered.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onQuickAdd={handleQuickAdd}
                      justAdded={addedIds.has(p.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Product Card (memoized) ─── */
const ProductCard = memo(function ProductCard({
  product: p,
  onQuickAdd,
  justAdded,
}: {
  product: Product;
  onQuickAdd: (p: Product) => void;
  justAdded: boolean;
}) {
  const finalPrice = p.sale_price ?? p.price;
  const img = getProductImage(p.slug, p.cover_image);
  const outOfStock = p.inventory_count <= 0;
  const discount = p.sale_price ? Math.round((1 - p.sale_price / p.price) * 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`group bg-card border rounded-xl overflow-hidden card-lift ${outOfStock ? "opacity-70" : ""}`}>
        <Link to={`/produto/${p.slug}`} className="block">
          <div className="aspect-square bg-secondary relative overflow-hidden">
            {img ? (
              <img
                src={img}
                alt={p.name}
                width={400}
                height={400}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
              </div>
            )}

            {/* Badges top-left */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {p.new_arrival && (
                <span className="bg-primary text-primary-foreground text-[10px] font-body font-semibold px-2 py-0.5 rounded-full">
                  Novo
                </span>
              )}
              {p.bestseller && (
                <span className="bg-gold text-gold-foreground text-[10px] font-body font-semibold px-2 py-0.5 rounded-full">
                  Mais Vendido
                </span>
              )}
            </div>

            {/* Discount badge top-right */}
            {discount > 0 && (
              <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-body font-semibold px-2 py-0.5 rounded-full">
                -{discount}%
              </span>
            )}

            {/* Out of stock overlay */}
            {outOfStock && (
              <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px] flex items-center justify-center">
                <span className="bg-foreground text-background font-body text-xs font-semibold px-4 py-1.5 rounded-full">
                  Esgotado
                </span>
              </div>
            )}
          </div>
        </Link>

        <div className="p-3 lg:p-4">
          <Link to={`/produto/${p.slug}`}>
            <h3 className="font-body text-sm text-foreground font-medium line-clamp-2 mb-1.5 group-hover:text-primary transition-colors leading-snug min-h-[2.5em]">
              {p.name}
            </h3>
          </Link>

          <div className="flex items-baseline gap-2 mb-0.5">
            {p.sale_price ? (
              <>
                <span className="font-body text-xs text-muted-foreground line-through tabular-nums">
                  {fmt(p.price)}
                </span>
                <span className="font-body text-base font-bold text-primary tabular-nums">
                  {fmt(p.sale_price)}
                </span>
              </>
            ) : (
              <span className="font-body text-base font-bold text-foreground tabular-nums">
                {fmt(p.price)}
              </span>
            )}
          </div>

          <p className="font-body text-[10px] sm:text-[11px] text-muted-foreground mb-3 flex items-center gap-1">
            <CreditCard className="w-3 h-3 shrink-0" />
            {fmtInstallment(finalPrice)}
          </p>

          {outOfStock ? (
            <Button size="sm" variant="outline" className="w-full text-xs" disabled>
              Esgotado
            </Button>
          ) : (
            <Button
              size="sm"
              className={`w-full text-xs font-medium transition-all ${justAdded ? "bg-success hover:bg-success" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                onQuickAdd(p);
              }}
            >
              {justAdded ? (
                <>✓ Adicionado</>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5 mr-1.5" /> Adicionar
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
});


