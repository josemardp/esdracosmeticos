
-- Update 3 products with confirmed official Cloudinary CDN images
UPDATE products SET cover_image = 'https://res.cloudinary.com/beleza-na-web/image/upload/w_800,f_auto,fl_progressive,q_auto:best/v1/imagens/products/E93063/LA-PIEL-LOC-DES-HID-CPO-TAMARAS-EGIPCIAS_E93063_.jpg'
WHERE sku = '93063';

UPDATE products SET cover_image = 'https://res.cloudinary.com/beleza-na-web/image/upload/w_800,f_auto,fl_progressive,q_auto:best/v1/imagens/product/E86538/e8eabfa9-4062-44af-af9a-4c1cf4fca114-e86538-make-mascara-de-cilios-turbo-volumaco-10g-1.jpg'
WHERE sku = '86538';

UPDATE products SET cover_image = 'https://res.cloudinary.com/beleza-na-web/image/upload/w_800,f_auto,fl_progressive,q_auto:best/v1/imagens/product/E54191/9dabeab3-c0c8-461e-9fbb-c1250af0684b-e54191-eudora-pulse-boost-desodorante-colonia-100ml-frontal.jpg'
WHERE sku = '87340';
