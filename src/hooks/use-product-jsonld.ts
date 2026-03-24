import { useEffect } from "react";

const SITE_URL = "https://www.esdracosmeticos.com.br";

interface ProductJsonLdInput {
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  salePrice?: number | null;
  sku?: string | null;
  brand?: string | null;
  image?: string | null;
  inStock: boolean;
  ratingValue?: number;
  reviewCount?: number;
}

/**
 * Injects a Product JSON-LD script for Google rich results.
 * Removes on unmount to avoid stale data.
 */
export function useProductJsonLd(product: ProductJsonLdInput | null) {
  useEffect(() => {
    if (!product) return;

    const finalPrice = product.salePrice ?? product.price;
    const jsonLd: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      url: `${SITE_URL}/produto/${product.slug}`,
      description: product.description || `${product.name} na Esdra Cosméticos.`,
      offers: {
        "@type": "Offer",
        url: `${SITE_URL}/produto/${product.slug}`,
        priceCurrency: "BRL",
        price: finalPrice.toFixed(2),
        availability: product.inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        seller: {
          "@type": "Organization",
          name: "Esdra Cosméticos",
        },
      },
    };

    if (product.image) jsonLd.image = product.image;
    if (product.sku) jsonLd.sku = product.sku;
    if (product.brand) {
      jsonLd.brand = { "@type": "Brand", name: product.brand };
    }

    if (product.ratingValue && product.reviewCount && product.reviewCount > 0) {
      jsonLd.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: product.ratingValue.toFixed(1),
        reviewCount: product.reviewCount,
      };
    }

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "product-jsonld";
    script.textContent = JSON.stringify(jsonLd);

    // Remove any previous one
    document.getElementById("product-jsonld")?.remove();
    document.head.appendChild(script);

    return () => {
      document.getElementById("product-jsonld")?.remove();
    };
  }, [product]);
}
