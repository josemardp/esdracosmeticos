import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useSEO } from "@/hooks/use-seo";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Search, SlidersHorizontal, X, PackageX, AlertCircle, RefreshCw } from "lucide-react";
import { ProductCard } from "@/components/store/ProductCard";
import { formatBRL } from "@/lib/format";

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
  brand: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

/* ─── helpers ─── */
const fmt = formatBRL;

/* Quantos cartões aparecem por vez (desenhar os 128 de uma vez pesava no celular). */
const PAGE_SIZE = 24;

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/* (useSEO imported from @/hooks/use-seo) */

/* ─── sort options ─── */
const SORT_OPTIONS = [
  { value: "relevance", label: "Relevância" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
  { value: "name", label: "Nome A-Z" },
  { value: "newest", label: "Novidades" },
] as const;

/* ─── Filter sidebar (extracted to avoid remount) ─── */
const FilterSidebar = memo(function FilterSidebar({
  categories,
  urlCat,
  brands,
  urlBrand,
  priceBounds,
  priceRange,
  urlInStock,
  urlOnSale,
  urlNew,
  activeFilterCount,
  onCategoryChange,
  onBrandChange,
  onPriceChange,
  onToggleFilter,
  onClearAll,
}: {
  categories: Category[];
  urlCat: string;
  brands: { name: string; count: number }[];
  urlBrand: string;
  priceBounds: { min: number; max: number };
  priceRange: [number, number];
  urlInStock: boolean;
  urlOnSale: boolean;
  urlNew: boolean;
  activeFilterCount: number;
  onCategoryChange: (slug: string | undefined) => void;
  onBrandChange: (brand: string | undefined) => void;
  onPriceChange: (range: [number, number]) => void;
  onToggleFilter: (key: string, value: string | undefined) => void;
  onClearAll: () => void;
}) {
  const item = (active: boolean) =>
    `flex min-h-10 w-full items-center justify-between rounded-md px-3 text-left font-body text-[15px] transition-colors ${
      active ? "bg-secondary font-medium text-primary" : "text-foreground hover:bg-secondary"
    }`;
  const heading = "mb-2 font-body text-[15px] font-medium text-foreground";
  return (
    <div className="space-y-7">
      <div>
        <h3 className={heading}>Categorias</h3>
        <div className="space-y-0.5">
          <button onClick={() => onCategoryChange(undefined)} className={item(!urlCat)} aria-pressed={!urlCat}>
            Todos os produtos
          </button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => onCategoryChange(cat.slug)} className={item(urlCat === cat.slug)} aria-pressed={urlCat === cat.slug}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {brands.length > 0 && (
        <div>
          <h3 className={heading}>Marca</h3>
          <div className="space-y-0.5">
            <button onClick={() => onBrandChange(undefined)} className={item(!urlBrand)} aria-pressed={!urlBrand}>
              Todas as marcas
            </button>
            {brands.map((b) => (
              <button key={b.name} onClick={() => onBrandChange(b.name)} className={item(urlBrand === b.name)} aria-pressed={urlBrand === b.name}>
                <span>{b.name}</span>
                <span className="text-[13px] font-normal text-muted-foreground tabular-nums">{b.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className={heading}>Faixa de preço</h3>
        <Slider
          min={priceBounds.min}
          max={priceBounds.max}
          step={5}
          value={priceRange}
          onValueChange={(v) => onPriceChange(v as [number, number])}
          className="mb-3 mt-4"
          aria-label="Faixa de preço"
        />
        <div className="flex items-center justify-between font-body text-sm text-muted-foreground tabular-nums">
          <span>{fmt(priceRange[0])}</span>
          <span>{fmt(priceRange[1])}</span>
        </div>
      </div>

      <div>
        <h3 className={heading}>Mostrar só</h3>
        <div className="space-y-1">
          {[
            { key: "estoque", label: "Em estoque", checked: urlInStock },
            { key: "promocao", label: "Em promoção", checked: urlOnSale },
            { key: "novidades", label: "Lançamentos", checked: urlNew },
          ].map((f) => (
            <label key={f.key} className="flex min-h-10 cursor-pointer items-center gap-3 px-1">
              <Checkbox checked={f.checked} onCheckedChange={(c) => onToggleFilter(f.key, c ? "1" : undefined)} />
              <span className="font-body text-[15px] text-foreground">{f.label}</span>
            </label>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <button onClick={onClearAll} className="inline-flex min-h-11 items-center font-body text-[15px] font-medium text-primary underline underline-offset-4">
          Limpar todos os filtros
        </button>
      )}
    </div>
  );
});

/* ─── route presets ─── */
const ROUTE_PRESETS: Record<string, { filter: string; filterValue: string; title: string; seoTitle: string; seoDesc: string }> = {
  "/lancamentos": {
    filter: "novidades", filterValue: "1",
    title: "Lançamentos",
    seoTitle: "Lançamentos | Esdra Cosméticos",
    seoDesc: "Confira os lançamentos da Esdra Cosméticos. Novidades em perfumes, maquiagem e skincare com frete grátis acima de R$ 199.",
  },
  "/promocoes": {
    filter: "promocao", filterValue: "1",
    title: "Promoções",
    seoTitle: "Promoções | Esdra Cosméticos",
    seoDesc: "Aproveite as promoções da Esdra Cosméticos. Descontos em perfumes, maquiagem e skincare com frete grátis acima de R$ 199.",
  },
};

/* ─── main ─── */
export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const routePreset = ROUTE_PRESETS[location.pathname] || null;

  /* raw data */
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [priceInited, setPriceInited] = useState(false);

  /* filter state from URL */
  const [catalogBanner, setCatalogBanner] = useState<Tables<"campaign_banners"> | null>(null);

  const urlQ = searchParams.get("q") || searchParams.get("busca") || "";
  const urlCat = searchParams.get("categoria") || "";
  const urlBrand = searchParams.get("marca") || "";
  const urlSort = searchParams.get("ordem") || "relevance";
  const urlInStock = searchParams.get("estoque") === "1";
  const urlOnSale = searchParams.get("promocao") === "1" || routePreset?.filter === "promocao";
  const urlNew = searchParams.get("novidades") === "1" || routePreset?.filter === "novidades";
  const urlMinPrice = searchParams.get("preco_min") ? Number(searchParams.get("preco_min")) : 0;
  const urlMaxPrice = searchParams.get("preco_max") ? Number(searchParams.get("preco_max")) : 0;

  /* local input state */
  const [searchInput, setSearchInput] = useState(urlQ);
  const [priceRange, setPriceRange] = useState<[number, number]>([urlMinPrice, urlMaxPrice]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 350);
  const debouncedPrice = useDebounce(priceRange, 400);

  /* quantos cartões estão visíveis (volta para o início quando o filtro muda) */
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  /* price bounds */
  const priceBounds = useMemo(() => {
    if (allProducts.length === 0) return { min: 0, max: 500 };
    const prices = allProducts.map((p) => p.sale_price ?? p.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [allProducts]);

  /* available brands (with counts) */
  const brands = useMemo(() => {
    const map = new Map<string, number>();
    allProducts.forEach((p) => {
      if (p.brand) map.set(p.brand, (map.get(p.brand) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [allProducts]);

  /* stable updateURL */
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

  /* sync search input -> URL */
  useEffect(() => {
    updateURL({ q: debouncedSearch || undefined });
  }, [debouncedSearch, updateURL]);

  /* sync price range -> URL */
  useEffect(() => {
    if (!priceInited) return;
    if (debouncedPrice[0] <= priceBounds.min && debouncedPrice[1] >= priceBounds.max) {
      updateURL({ preco_min: undefined, preco_max: undefined });
    } else {
      updateURL({
        preco_min: debouncedPrice[0] > priceBounds.min ? String(debouncedPrice[0]) : undefined,
        preco_max: debouncedPrice[1] < priceBounds.max ? String(debouncedPrice[1]) : undefined,
      });
    }
  }, [debouncedPrice, priceBounds, priceInited, updateURL]);

  /* init price range from bounds (once) */
  useEffect(() => {
    if (allProducts.length > 0 && !priceInited) {
      setPriceRange([urlMinPrice || priceBounds.min, urlMaxPrice || priceBounds.max]);
      setPriceInited(true);
    }
  }, [allProducts.length, priceBounds, priceInited, urlMinPrice, urlMaxPrice]);

  /* fetch data */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [{ data: cats }, { data: prods }, { data: banners }] = await Promise.all([
        supabase.from("categories").select("id, name, slug").eq("active", true).order("sort_order"),
        supabase
          .from("products")
          .select("id, name, slug, price, sale_price, cover_image, category_id, inventory_count, featured, new_arrival, bestseller, brand")
          .eq("active", true),
        supabase
          .from("campaign_banners")
          .select("*")
          .eq("active", true)
          .eq("position", "catalog_top")
          .order("sort_order")
          .limit(1),
      ]);
      setCategories((cats as Category[]) ?? []);
      setAllProducts((prods as Product[]) ?? []);
      if (banners && banners.length > 0) setCatalogBanner(banners[0]);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* filter + sort */
  const filtered = useMemo(() => {
    let result = [...allProducts];

    if (urlQ) {
      const q = urlQ.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    if (urlCat) {
      const cat = categories.find((c) => c.slug === urlCat);
      if (cat) result = result.filter((p) => p.category_id === cat.id);
    }

    if (urlBrand) {
      result = result.filter((p) => p.brand === urlBrand);
    }

    if (urlInStock) result = result.filter((p) => p.inventory_count > 0);
    if (urlOnSale) result = result.filter((p) => p.sale_price !== null);
    if (urlNew) result = result.filter((p) => p.new_arrival);

    if (urlMinPrice || urlMaxPrice) {
      const effMin = urlMinPrice || priceBounds.min;
      const effMax = urlMaxPrice || priceBounds.max;
      result = result.filter((p) => {
        const price = p.sale_price ?? p.price;
        return price >= effMin && price <= effMax;
      });
    }

    const sortFn = (a: Product, b: Product) => {
      const pa = a.sale_price ?? a.price;
      const pb = b.sale_price ?? b.price;
      switch (urlSort) {
        case "price_asc": return pa - pb;
        case "price_desc": return pb - pa;
        case "name": return a.name.localeCompare(b.name, "pt-BR");
        case "newest": return (b.new_arrival ? 1 : 0) - (a.new_arrival ? 1 : 0);
        default: {
          const sa = (a.featured ? 4 : 0) + (a.bestseller ? 2 : 0) + (a.new_arrival ? 1 : 0);
          const sb = (b.featured ? 4 : 0) + (b.bestseller ? 2 : 0) + (b.new_arrival ? 1 : 0);
          return sb - sa;
        }
      }
    };

    const inStock = result.filter((p) => p.inventory_count > 0).sort(sortFn);
    const outStock = result.filter((p) => p.inventory_count <= 0).sort(sortFn);
    return [...inStock, ...outStock];
  }, [allProducts, urlQ, urlCat, urlBrand, urlInStock, urlOnSale, urlNew, urlMinPrice, urlMaxPrice, urlSort, categories, priceBounds]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [urlQ, urlCat, urlBrand, urlInStock, urlOnSale, urlNew, urlMinPrice, urlMaxPrice, urlSort]);

  /* active filters for chips */
  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (urlQ) chips.push({ key: "q", label: `"${urlQ}"`, clear: () => { setSearchInput(""); setFilter("q", undefined); } });
    if (urlCat) {
      const cat = categories.find((c) => c.slug === urlCat);
      chips.push({ key: "cat", label: cat?.name || urlCat, clear: () => setFilter("categoria", undefined) });
    }
    if (urlBrand) chips.push({ key: "brand", label: `Marca: ${urlBrand}`, clear: () => setFilter("marca", undefined) });
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
  }, [urlQ, urlCat, urlBrand, urlInStock, urlOnSale, urlNew, urlMinPrice, urlMaxPrice, categories, priceBounds, setFilter, updateURL]);

  const clearAll = useCallback(() => {
    setSearchInput("");
    setPriceRange([priceBounds.min, priceBounds.max]);
    setSearchParams({}, { replace: true });
  }, [priceBounds, setSearchParams]);

  /* callbacks for FilterSidebar */
  const handleCategoryChange = useCallback(
    (slug: string | undefined) => {
      setFilter("categoria", slug);
      setMobileOpen(false);
    },
    [setFilter]
  );

  const handleBrandChange = useCallback(
    (brand: string | undefined) => {
      setFilter("marca", brand);
      setMobileOpen(false);
    },
    [setFilter]
  );

  const handleToggleFilter = useCallback(
    (key: string, value: string | undefined) => setFilter(key, value),
    [setFilter]
  );

  /* SEO */
  const catName = urlCat ? categories.find((c) => c.slug === urlCat)?.name : null;
  const brandName = urlBrand || null;
  const seoTitle = routePreset?.seoTitle
    ?? (catName
      ? `${catName}${brandName ? ` ${brandName}` : ""} | Esdra Cosméticos`
      : brandName
      ? `Produtos ${brandName} | Esdra Cosméticos`
      : "Loja | Esdra Cosméticos – Cosméticos Premium");
  const seoDesc = routePreset?.seoDesc
    ?? (catName
      ? `Compre ${catName}${brandName ? ` ${brandName}` : ""} na Esdra Cosméticos. Frete grátis acima de R$ 199. Entrega para todo o Brasil.`
      : brandName
      ? `Encontre todos os produtos ${brandName} na Esdra Cosméticos. Qualidade premium com parcela em até 3x sem juros.`
      : "Explore nossa coleção completa de cosméticos premium. Maquiagem, Skincare, Cabelos, Perfumaria e muito mais.");
  /* Canonical: include categoria/marca when indexable, strip noise */
  const isNoindex = !!(urlQ || urlMinPrice || urlMaxPrice);
  const catalogCanonical = useMemo(() => {
    if (routePreset) return location.pathname;
    const params = new URLSearchParams();
    if (urlCat) params.set("categoria", urlCat);
    if (urlBrand) params.set("marca", urlBrand);
    const qs = params.toString();
    return qs ? `/loja?${qs}` : "/loja";
  }, [urlCat, urlBrand, routePreset, location.pathname]);

  useSEO({
    title: seoTitle,
    description: seoDesc,
    canonical: catalogCanonical,
    noindex: isNoindex,
  });

  const title = routePreset?.title || catName || (brandName ? brandName : "Loja");
  const visible = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visible.length;
  const fromUrl = location.pathname + location.search;
  const sidebarProps = {
    categories, urlCat, brands, urlBrand, priceBounds, priceRange, urlInStock, urlOnSale, urlNew,
    activeFilterCount: activeFilters.length,
    onCategoryChange: handleCategoryChange, onBrandChange: handleBrandChange, onPriceChange: setPriceRange,
    onToggleFilter: handleToggleFilter, onClearAll: clearAll,
  };

  return (
    <div className="pb-14 pt-6 lg:pb-20 lg:pt-10">
      <div className="shell">
        {catalogBanner && (
          <Link
            to={catalogBanner.link_url}
            className="relative mb-6 block overflow-hidden rounded-lg"
            style={{
              backgroundColor: catalogBanner.bg_color || "hsl(var(--brand-rose))",
              color: catalogBanner.text_color || "hsl(var(--foreground))",
            }}
          >
            {catalogBanner.image_url ? (
              <img src={catalogBanner.image_url} alt={catalogBanner.title} className="h-32 w-full object-cover sm:h-40 lg:h-48" loading="eager" />
            ) : (
              <div className="px-6 py-6 text-center sm:py-8">
                {catalogBanner.badge_text && <span className="mb-1 inline-block font-body text-[13px] opacity-85">{catalogBanner.badge_text}</span>}
                <h2 className="font-display text-2xl display-md lg:text-3xl">{catalogBanner.title}</h2>
                {catalogBanner.subtitle && <p className="mt-1 font-body text-sm opacity-85">{catalogBanner.subtitle}</p>}
              </div>
            )}
          </Link>
        )}

        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="font-display text-[34px] leading-tight text-foreground display-md lg:text-[44px]">{title}</h1>
          <p className="font-body text-[15px] text-muted-foreground" aria-live="polite">
            {loading ? "Carregando produtos" : `${filtered.length} produto${filtered.length !== 1 ? "s" : ""}`}
            {urlQ && !loading && <> para <span className="font-medium text-foreground">“{urlQ}”</span></>}
          </p>
        </div>

        {/* Busca, filtro (celular) e ordenação */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <label htmlFor="catalog-search" className="sr-only">Buscar produto</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="catalog-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar produto ou marca"
              className="h-12 rounded-full pl-11 pr-11 font-body text-base"
            />
            {searchInput && (
              <button onClick={() => setSearchInput("")} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground" aria-label="Limpar busca">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full border border-input px-5 font-body text-[15px] text-foreground lg:hidden">
                  <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden />
                  Filtrar
                  {activeFilters.length > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">{activeFilters.length}</span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] overflow-y-auto sm:w-[360px]">
                <SheetHeader>
                  <SheetTitle className="font-display text-2xl font-normal display-md">Filtrar produtos</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterSidebar {...sidebarProps} />
                </div>
              </SheetContent>
            </Sheet>

            <label htmlFor="catalog-sort" className="sr-only">Ordenar por</label>
            <select
              id="catalog-sort"
              value={urlSort}
              onChange={(e) => setFilter("ordem", e.target.value === "relevance" ? undefined : e.target.value)}
              className="h-12 min-w-0 flex-1 rounded-full border border-input bg-background px-4 font-body text-[15px] text-foreground sm:flex-none sm:min-w-[170px]"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Categorias em botões de toque (celular); no computador ficam na lateral */}
        {categories.length > 0 && (
          <nav aria-label="Categorias" className="lg:hidden">
            <ul className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
              {[{ id: "todas", name: "Todos", slug: "" }, ...categories].map((cat) => {
                const active = (urlCat || "") === cat.slug;
                return (
                  <li key={cat.id} className="shrink-0">
                    <button
                      onClick={() => handleCategoryChange(cat.slug || undefined)}
                      aria-pressed={active}
                      className={`inline-flex h-11 items-center rounded-full border px-[18px] font-body text-[15px] transition-colors ${
                        active ? "border-foreground bg-foreground text-background" : "text-foreground hover:border-primary"
                      }`}
                    >
                      {cat.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {activeFilters.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {activeFilters.map((f) => (
              <button
                key={f.key}
                onClick={f.clear}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-secondary px-3.5 font-body text-sm text-foreground transition-colors hover:bg-accent"
                aria-label={`Tirar filtro ${f.label}`}
              >
                {f.label}
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            ))}
            <button onClick={clearAll} className="inline-flex h-9 items-center px-1 font-body text-sm font-medium text-primary underline underline-offset-4">
              Limpar todos
            </button>
          </div>
        )}

        <div className="flex gap-10">
          <aside className="hidden w-60 shrink-0 lg:block" aria-label="Filtros">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-4 pr-1">
              <FilterSidebar {...sidebarProps} />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {loading ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-9" aria-hidden>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i}>
                    <div className="aspect-square animate-pulse rounded-lg bg-secondary" />
                    <div className="space-y-2 pt-3">
                      <div className="h-3 w-1/3 rounded bg-secondary" />
                      <div className="h-4 w-4/5 rounded bg-secondary" />
                      <div className="h-4 w-1/2 rounded bg-secondary" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="py-20 text-center font-body">
                <AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive" aria-hidden />
                <p className="mb-1 text-base font-medium text-foreground">Não foi possível carregar os produtos</p>
                <p className="mb-5 text-[15px] text-muted-foreground">Confira sua internet e tente de novo.</p>
                <button onClick={fetchData} className="inline-flex h-12 items-center gap-2 rounded-full border border-foreground px-6 text-[15px] font-medium text-foreground">
                  <RefreshCw className="h-4 w-4" aria-hidden /> Tentar de novo
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center font-body">
                <PackageX className="mx-auto mb-4 h-10 w-10 text-muted-foreground" aria-hidden />
                <p className="mb-1 text-base font-medium text-foreground">Nenhum produto com esses filtros</p>
                <p className="mb-5 text-[15px] text-muted-foreground">Tire algum filtro ou busque por outro nome.</p>
                <button onClick={clearAll} className="inline-flex h-12 items-center rounded-full bg-primary px-6 text-[15px] font-medium text-primary-foreground">
                  Limpar filtros
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-9">
                  {visible.map((p, i) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      priority={i < 4}
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
                      linkState={{ from: fromUrl }}
                    />
                  ))}
                </div>
                {remaining > 0 && (
                  <div className="mt-10 flex flex-col items-center gap-3 font-body">
                    <p className="text-sm text-muted-foreground tabular-nums">Mostrando {visible.length} de {filtered.length}</p>
                    <button
                      onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                      className="inline-flex h-12 items-center rounded-full border-[1.5px] border-foreground px-7 text-[15px] font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
                    >
                      Mostrar mais produtos
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
