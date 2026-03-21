-- Corrige imagens faltantes no catálogo

UPDATE public.products
SET cover_image = 'https://res.cloudinary.com/beleza-na-web/image/upload/w_1500,f_auto,fl_progressive,q_auto:best/v1/imagens/products/B48779/BOTICOLL_PORTINARI_DES_SPR_100ml_V7-B48779-Conceito.jpg',
    updated_at = now()
WHERE lower(name) LIKE '%portinari%' AND lower(name) LIKE '%body spray%';

UPDATE public.products
SET cover_image = 'https://res.cloudinary.com/beleza-na-web/image/upload/w_1500,f_auto,fl_progressive,q_auto:best/v1/imagens/product/E86603/d11afe81-bffa-4079-b8ed-d5c3b52609ff-e86603-nina-secrets-mascara-neutrals-10g-5.jpg',
    updated_at = now()
WHERE lower(name) LIKE '%super brown%' AND lower(name) LIKE '%niina%';

UPDATE public.products
SET cover_image = 'https://res.cloudinary.com/beleza-na-web/image/upload/f_auto,c_fit,c_fill,h_650,w_488,q_auto:eco,fl_progressive,q_auto:best/v1/imagens/product/800d43a0-c140-4868-848a-919cc611d8c3-1/95542580-d8ee-4871-a325-d6edb9873363-1788397297828073477730555e36-62b7-499c-9de5-619e4007e63b.jpeg',
    updated_at = now()
WHERE lower(name) LIKE '%dr. botica%';

UPDATE public.products
SET cover_image = 'https://res.cloudinary.com/beleza-na-web/image/upload/w_1500,f_auto,fl_progressive,q_auto:best/v1/imagens/product/E89977/09978d53-37fe-412d-8582-728ce54efc08-e8997-mascara-clios-turbo-dimension-1.jpg',
    updated_at = now()
WHERE lower(name) LIKE '%turbo dimension%';

UPDATE public.products
SET cover_image = 'https://http2.mlstatic.com/D_NQ_NP_693612-MLA88156231488_072025-O.webp',
    updated_at = now()
WHERE lower(name) LIKE '%baunilha%' AND lower(name) LIKE '%instance%';