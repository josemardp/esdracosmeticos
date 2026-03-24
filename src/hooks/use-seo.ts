import { useEffect } from "react";

const SITE_URL = "https://www.esdracosmeticos.com.br";
const SITE_NAME = "Esdra Cosméticos";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-esdra-cosmeticos.png`;

interface SEOOptions {
  title: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
}

function setMeta(selector: string, attr: string, value: string, createTag?: string) {
  let el = document.querySelector(selector);
  if (!el && createTag) {
    el = document.createElement("meta");
    // parse selector like 'meta[property="og:title"]' to set the attribute
    const propMatch = selector.match(/\[(\w+)="([^"]+)"\]/);
    if (propMatch) el.setAttribute(propMatch[1], propMatch[2]);
    document.head.appendChild(el);
  }
  if (el) el.setAttribute(attr, value);
}

/**
 * Lightweight SEO hook — updates title, meta description, canonical,
 * Open Graph and robots per-page.
 */
export function useSEO(titleOrOpts: string | SEOOptions, description?: string) {
  const opts: SEOOptions = typeof titleOrOpts === "string"
    ? { title: titleOrOpts, description }
    : titleOrOpts;

  useEffect(() => {
    const suffix = ` | ${SITE_NAME}`;
    document.title = opts.title.includes("Esdra") ? opts.title : opts.title + suffix;
    const fullTitle = document.title;
    const canonicalUrl = SITE_URL + window.location.pathname;

    // Meta description
    if (opts.description) {
      setMeta('meta[name="description"]', "content", opts.description, "meta");
    }

    // Canonical
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", canonicalUrl);

    // Open Graph
    setMeta('meta[property="og:title"]', "content", fullTitle, "meta");
    setMeta('meta[property="og:url"]', "content", canonicalUrl, "meta");
    if (opts.description) {
      setMeta('meta[property="og:description"]', "content", opts.description, "meta");
    }
    setMeta('meta[property="og:image"]', "content", opts.ogImage || DEFAULT_OG_IMAGE, "meta");
    if (opts.ogType) {
      setMeta('meta[property="og:type"]', "content", opts.ogType, "meta");
    }

    // Twitter
    setMeta('meta[name="twitter:title"]', "content", fullTitle, "meta");
    if (opts.description) {
      setMeta('meta[name="twitter:description"]', "content", opts.description, "meta");
    }

    // Robots
    if (opts.noindex) {
      setMeta('meta[name="robots"]', "content", "noindex, nofollow", "meta");
    } else {
      const robots = document.querySelector('meta[name="robots"]');
      if (robots) robots.remove();
    }
  }, [opts.title, opts.description, opts.ogImage, opts.ogType, opts.noindex]);
}
