// Busca antecipada da página de produto, iniciada pelo script inline do index.html
// (roda antes do JavaScript da loja baixar). Mantenha estas colunas iguais às de lá.
export const PRODUCT_COLUMNS =
  "id, name, slug, sku, short_description, full_description, price, sale_price, inventory_count, cover_image, gallery, benefits, how_to_use, ingredients, category_id, new_arrival, bestseller, brand, weight_volume, tags";

type Prefetch = { slug: string; promise: Promise<unknown> };

declare global {
  interface Window {
    __esdraProductPrefetch?: Prefetch;
  }
}

// Devolve a resposta antecipada uma única vez, e só para o mesmo slug. null = use a busca normal.
export function takeProductPrefetch<T>(slug: string): Promise<T | null> | null {
  const pre = window.__esdraProductPrefetch;
  if (!pre || pre.slug !== slug) return null;
  window.__esdraProductPrefetch = undefined;
  return pre.promise as Promise<T | null>;
}
