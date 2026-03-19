import aguaMicelar from "@/assets/products/agua-micelar.jpg";
import baseLiquida from "@/assets/products/base-liquida.jpg";
import batomCremoso from "@/assets/products/batom-cremoso.jpg";
import bodySplash from "@/assets/products/body-splash.jpg";
import perfumeFleurNoire from "@/assets/products/perfume-fleur-noire.jpg";
import esfolianteAcai from "@/assets/products/esfoliante-acai.jpg";
import hidratanteAqua from "@/assets/products/hidratante-aqua.jpg";
import kitCabelos from "@/assets/products/kit-cabelos.jpg";
import kitSignature from "@/assets/products/kit-signature.jpg";
import kitSkincare from "@/assets/products/kit-skincare.jpg";
import lipGloss from "@/assets/products/lip-gloss.jpg";
import mascaraCapilar from "@/assets/products/mascara-capilar.jpg";
import mascaraCilios from "@/assets/products/mascara-cilios.jpg";
import mascaraArgila from "@/assets/products/mascara-argila.jpg";
import oleoCapilar from "@/assets/products/oleo-capilar.jpg";
import paletaSombras from "@/assets/products/paleta-sombras.jpg";
import perfumeCapilar from "@/assets/products/perfume-capilar.jpg";
import protetorSolar from "@/assets/products/protetor-solar.jpg";
import serumVitC from "@/assets/products/serum-vitc.jpg";
import shampooReparacao from "@/assets/products/shampoo-reparacao.jpg";

const productImageMap: Record<string, string> = {
  "agua-micelar-gentle-clean": aguaMicelar,
  "base-liquida-velvet-matte": baseLiquida,
  "batom-cremoso-rose-petale": batomCremoso,
  "body-splash-brisa-do-mar": bodySplash,
  "eau-de-parfum-fleur-noire": perfumeFleurNoire,
  "esfoliante-corporal-acai-guarana": esfolianteAcai,
  "hidratante-facial-aqua-boost": hidratanteAqua,
  "kit-cabelos-de-seda": kitCabelos,
  "kit-presente-esdra-signature": kitSignature,
  "kit-skincare-rotina-diaria": kitSkincare,
  "lip-gloss-crystal-shine": lipGloss,
  "mascara-capilar-nutricao-absoluta": mascaraCapilar,
  "mascara-cilios-volume-extreme": mascaraCilios,
  "mascara-detox-argila-verde": mascaraArgila,
  "oleo-capilar-elixir-dourado": oleoCapilar,
  "paleta-sombras-golden-hour": paletaSombras,
  "perfume-capilar-sublime": perfumeCapilar,
  "protetor-solar-facial-fps50": protetorSolar,
  "serum-vitamina-c-radiance": serumVitC,
  "shampoo-reparacao-intensiva": shampooReparacao,
};

export function getProductImage(slug: string, coverImage: string | null): string {
  if (coverImage) return coverImage;
  return productImageMap[slug] || "";
}
