// Product images are now served from /perfumes/ directory and stored in cover_image field
// This file is kept for backward compatibility but the image map is no longer needed

export function getProductImage(slug: string, coverImage: string | null): string {
  if (coverImage) return coverImage;
  return "";
}
