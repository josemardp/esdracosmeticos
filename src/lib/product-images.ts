export function getProductImage(slug: string, coverImage: string | null): string {
  if (coverImage) return coverImage;

  switch (slug) {
    case "body-spray-boticollection-portinari-100ml":
      return "https://res.cloudinary.com/beleza-na-web/image/upload/w_1500,f_auto,fl_progressive,q_auto:best/v1/imagens/products/B48779/BOTICOLL_PORTINARI_DES_SPR_100ml_V7-B48779-Conceito.jpg";

    case "siage-nutri-rose-shampoo-400ml":
      return "https://content.syndigo.com/asset/1c5ead6e-4a05-496f-afe1-dce18d8674a0/1080.webp";

    case "mascara-cilios-super-brown-niina-secrets-10g":
      return "https://res.cloudinary.com/beleza-na-web/image/upload/w_1500,f_auto,fl_progressive,q_auto:best/v1/imagens/product/E86603/d11afe81-bffa-4079-b8ed-d5c3b52609ff-e86603-nina-secrets-mascara-neutrals-10g-5.jpg";

    case "locao-hidratante-dr-botica-pocao-das-nuvens-400ml":
      return "https://res.cloudinary.com/beleza-na-web/image/upload/f_auto,c_fit,c_fill,h_650,w_488,q_auto:eco,fl_progressive,q_auto:best/v1/imagens/product/800d43a0-c140-4868-848a-919cc611d8c3-1/95542580-d8ee-4871-a325-d6edb9873363-1788397297828073477730555e36-62b7-499c-9de5-619e4007e63b.jpeg";

    case "mascara-cilios-turbo-dimension-eudora-make-10g":
      return "https://res.cloudinary.com/beleza-na-web/image/upload/w_1500,f_auto,fl_progressive,q_auto:best/v1/imagens/product/E89977/09978d53-37fe-412d-8582-728ce54efc08-e8997-mascara-clios-turbo-dimension-1.jpg";

    case "creme-hidratante-instance-baunilha-400ml":
      return "https://http2.mlstatic.com/D_NQ_NP_693612-MLA88156231488_072025-O.webp";

    default:
      return "/placeholder.svg";
  }
}