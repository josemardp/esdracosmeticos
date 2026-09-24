import { supabase } from "@/integrations/supabase/client";

// Capa enviada pelo admin: o navegador gera as versões WebP de 800 e 400 px e envia para
// product-images/opt/<nome>-800.webp e -400.webp, o mesmo padrão das capas otimizadas,
// assim a loja monta o srcset sozinha (getProductImageSrcSet). Se o navegador não conseguir
// ler a foto ou gerar WebP (ex.: HEIC fora do Safari), envia o arquivo original como antes.
const BUCKET = "product-images";
const WIDTHS = [800, 400] as const;
const QUALITY = 0.82;
const CACHE = "2592000"; // 30 dias, igual às capas otimizadas

async function loadImage(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  if ("createImageBitmap" in window) return createImageBitmap(file);
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toWebp(img: CanvasImageSource & { width: number; height: number }, width: number): Promise<Blob | null> {
  const w = Math.min(width, img.width); // nunca amplia foto pequena
  const h = Math.round((img.height * w) / img.width);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  // Navegador sem WebP devolve PNG: tratamos como falha e caímos no original.
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b?.type === "image/webp" ? b : null), "image/webp", QUALITY),
  );
}

async function makeVersions(file: File): Promise<Blob[] | null> {
  try {
    const img = await loadImage(file);
    const blobs = await Promise.all(WIDTHS.map((w) => toWebp(img, w)));
    if ("close" in img && typeof img.close === "function") img.close();
    return blobs.every(Boolean) ? (blobs as Blob[]) : null;
  } catch {
    return null;
  }
}

function publicUrl(path: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Envia a capa e devolve a URL que vai para cover_image. Lança erro se o envio falhar. */
export async function uploadProductCover(file: File): Promise<string> {
  const base = `product-${Date.now()}`;
  const versions = await makeVersions(file);

  if (versions) {
    const paths = WIDTHS.map((w) => `opt/${base}-${w}.webp`);
    const results = await Promise.all(
      paths.map((path, i) =>
        supabase.storage.from(BUCKET).upload(path, versions[i], { contentType: "image/webp", cacheControl: CACHE }),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      // Não deixa uma versão sozinha no bucket.
      await supabase.storage.from(BUCKET).remove(paths);
      throw failed.error;
    }
    return publicUrl(paths[0]);
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${base}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined, cacheControl: CACHE });
  if (error) throw error;
  return publicUrl(path);
}
