import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { trackAddToCart } from "@/lib/analytics";
import { formatBRL, formatInstallments } from "@/lib/format";
import { getProductImage, getProductImageSrcSet, imagePriority, showPlaceholderOnError } from "@/lib/product-images";
import { cn } from "@/lib/utils";

export interface CardProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  cover_image: string | null;
  inventory_count: number;
  brand?: string | null;
  new_arrival?: boolean;
  bestseller?: boolean;
}

interface ProductCardProps {
  product: CardProduct;
  /** Primeiros cartões visíveis: foto sem lazy e com prioridade alta. */
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** Selo que repetiria o título da seção (ex.: "Mais vendido" dentro de "Mais vendidos"). */
  omitBadge?: string;
  /** Estado passado ao link do produto (o catálogo guarda de onde a cliente veio). */
  linkState?: unknown;
}

// Um selo só por cartão, na ordem do que mais ajuda a decidir.
function badgeFor(p: CardProduct): { label: string; tone: "wine" | "light" } | null {
  if (p.sale_price && p.sale_price < p.price) return { label: `-${Math.round((1 - p.sale_price / p.price) * 100)}%`, tone: "wine" };
  if (p.inventory_count === 1) return { label: "Última unidade", tone: "light" };
  if (p.new_arrival) return { label: "Novo", tone: "light" };
  if (p.bestseller) return { label: "Mais vendido", tone: "light" };
  return null;
}

export function ProductCard({ product: p, priority = false, sizes = "(min-width: 1024px) 20vw, 50vw", className, omitBadge, linkState }: ProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const finalPrice = p.sale_price ?? p.price;
  const onSale = !!p.sale_price && p.sale_price < p.price;
  const soldOut = p.inventory_count <= 0;
  const img = getProductImage(p.slug, p.cover_image);
  const found = soldOut ? null : badgeFor(p);
  const badge = found && found.label !== omitBadge ? found : null;

  const handleAdd = () => {
    if (soldOut) return;
    addItem({
      id: p.id, name: p.name, slug: p.slug, price: p.price,
      sale_price: p.sale_price, cover_image: p.cover_image, inventory_count: p.inventory_count,
    });
    trackAddToCart({ id: p.id, name: p.name, price: finalPrice, quantity: 1 });
    setAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative">
        {/* Sem transform/opacity no pai: senão o branco da foto não se funde no rosa (ver .blend-photo). */}
        <Link to={`/produto/${p.slug}`} state={linkState} className="relative block aspect-square overflow-hidden rounded-lg bg-secondary" aria-label={p.name} tabIndex={-1}>
          <img
            src={img}
            srcSet={getProductImageSrcSet(img)}
            sizes={sizes}
            width={400}
            height={400}
            alt={p.name}
            loading={priority ? "eager" : "lazy"}
            {...imagePriority(priority)}
            decoding="async"
            onError={showPlaceholderOnError}
            className="blend-photo h-full w-full object-contain p-[10%] transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
          />
          {soldOut && (
            <span className="absolute inset-0 flex items-center justify-center bg-background/60">
              <span className="rounded-full bg-foreground px-4 py-1.5 font-body text-xs font-semibold text-background">Esgotado</span>
            </span>
          )}
        </Link>
        {badge && (
          <span
            className={cn(
              "pointer-events-none absolute left-2 top-2 rounded px-2 py-0.5 font-body text-xs font-semibold",
              badge.tone === "wine" ? "bg-primary text-primary-foreground" : "bg-background text-foreground",
            )}
          >
            {badge.label}
          </span>
        )}
        {!soldOut && (
          <button
            type="button"
            onClick={handleAdd}
            aria-label={added ? `${p.name} está na sacola` : `Adicionar ${p.name} à sacola`}
            className={cn(
              "absolute bottom-2 right-2 inline-flex h-11 min-w-11 items-center gap-1.5 rounded-full pl-3 pr-3.5 font-body text-sm font-medium shadow-[0_1px_2px_hsl(var(--foreground)/0.18)] transition-[background-color,color,transform] duration-200 active:scale-95",
              added ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-primary hover:text-primary-foreground",
            )}
          >
            {added ? <Check className="h-[18px] w-[18px]" aria-hidden /> : <ShoppingBag className="h-[18px] w-[18px]" aria-hidden />}
            <span>{added ? "Na sacola" : "Sacola"}</span>
          </button>
        )}
      </div>
      <div className="pt-2.5 font-body">
        {p.brand && <p className="mb-0.5 text-[13px] text-muted-foreground">{p.brand}</p>}
        <Link to={`/produto/${p.slug}`} state={linkState} className="mb-1.5 line-clamp-2 text-[15px] leading-snug text-foreground hover:underline hover:underline-offset-4">
          {p.name}
        </Link>
        <p className="flex flex-wrap items-baseline gap-x-2 tabular-nums">
          {onSale && <s className="text-[13px] text-muted-foreground">{formatBRL(p.price)}</s>}
          <strong className={cn("text-[17px] font-semibold", onSale ? "text-primary" : "text-foreground")}>{formatBRL(finalPrice)}</strong>
        </p>
        <p className="mt-0.5 text-[13px] text-muted-foreground tabular-nums">{formatInstallments(finalPrice)}</p>
      </div>
    </article>
  );
}
