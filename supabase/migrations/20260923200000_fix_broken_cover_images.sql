-- ============================================================
-- MIGRATION: 20260923200000_fix_broken_cover_images.sql
-- Objetivo: Trazer para o bucket product-images da loja as capas que
-- dependiam de hosts externos (403/instáveis) ou pesadas demais.
-- Arquivos enviados ao Storage em 23/09/2026 antes desta migração.
-- ============================================================

UPDATE public.products
SET cover_image = 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/body-splash-cuide-se-bem-pessegura-200ml.jpg'
WHERE slug = 'body-splash-cuide-se-bem-pessegura-200ml';

UPDATE public.products
SET cover_image = 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/body-splash-instance-baunilha-intensa-200ml.jpg'
WHERE slug = 'body-splash-instance-baunilha-intensa-200ml';

-- Versão otimizada (165 KB) no lugar da original de 632 KB.
UPDATE public.products
SET cover_image = 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/mascara-cilios-super-brown-niina-secrets-10g.jpg'
WHERE slug = 'mascara-cilios-super-brown-niina-secrets-10g';
