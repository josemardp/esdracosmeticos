-- Atualiza imagens dos produtos DeSirius para o storage do projeto atual
UPDATE products
SET cover_image = 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/desirius-condicionador-restaurador-intenso-300ml.jpg',
    updated_at = NOW()
WHERE slug = 'condicionador-restaurador-intenso-de-sirius-300ml';

UPDATE products
SET cover_image = 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/desirius-creme-iluminador-absoluto-300g.jpg',
    updated_at = NOW()
WHERE slug = 'creme-iluminador-absoluto-de-sirius-300g';
