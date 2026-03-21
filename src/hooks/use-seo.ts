import { useEffect } from "react";

export function useSEO(title: string, description?: string) {
  useEffect(() => {
    const suffix = " | Esdra Cosméticos";
    document.title = title.includes("Esdra") ? title : title + suffix;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }

    // Update canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href", "https://esdracosmeticos.com.br" + window.location.pathname);
    }
  }, [title, description]);
}
