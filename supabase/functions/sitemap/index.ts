import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SITE_URL = "https://www.esdracosmeticos.com.br";

const corsHeaders = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
};

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Fetch active products
  const { data: products } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("active", true)
    .order("updated_at", { ascending: false });

  // Fetch active categories
  const { data: categories } = await supabase
    .from("categories")
    .select("slug")
    .eq("active", true)
    .order("sort_order");

  const today = new Date().toISOString().split("T")[0];

  // Static pages
  const staticPages = [
    { loc: "/", changefreq: "weekly", priority: "1.0" },
    { loc: "/loja", changefreq: "daily", priority: "0.9" },
    { loc: "/lancamentos", changefreq: "weekly", priority: "0.8" },
    { loc: "/promocoes", changefreq: "weekly", priority: "0.8" },
    { loc: "/sobre", changefreq: "monthly", priority: "0.5" },
    { loc: "/suporte", changefreq: "monthly", priority: "0.5" },
    { loc: "/politica-de-privacidade", changefreq: "yearly", priority: "0.3" },
    { loc: "/trocas-e-devolucoes", changefreq: "yearly", priority: "0.3" },
    { loc: "/termos-de-uso", changefreq: "yearly", priority: "0.3" },
  ];

  let urls = staticPages
    .map(
      (p) =>
        `  <url><loc>${SITE_URL}${p.loc}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`,
    )
    .join("\n");

  // Category pages
  if (categories) {
    for (const cat of categories) {
      urls += `\n  <url><loc>${SITE_URL}/loja?categoria=${cat.slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
    }
  }

  // Product pages
  if (products) {
    for (const p of products) {
      const lastmod = p.updated_at ? p.updated_at.split("T")[0] : today;
      urls += `\n  <url><loc>${SITE_URL}/produto/${p.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, { headers: corsHeaders });
});
