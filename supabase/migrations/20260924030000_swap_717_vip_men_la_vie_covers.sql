-- As capas de "717 VIP Men 100ml" e "La Vie 100ml" estavam trocadas: o arquivo opt/717-vip-men-100ml-*.webp
-- tem a foto do La Vie e o opt/la-vie-100ml-*.webp tem a do 717 VIP Men (a troca veio dos originais em public/perfumes).
-- Troca só o endereço da capa entre os dois produtos; as versões 400/800 acompanham pelo nome.
BEGIN;

UPDATE public.products
SET cover_image = 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/opt/la-vie-100ml-800.webp'
WHERE slug = '717-vip-men-perfume-100ml'
  AND cover_image = 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/opt/717-vip-men-100ml-800.webp';

UPDATE public.products
SET cover_image = 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/opt/717-vip-men-100ml-800.webp'
WHERE slug = 'la-vie-perfume-100ml'
  AND cover_image = 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/opt/la-vie-100ml-800.webp';

COMMIT;
