-- ============================================================
-- MIGRATION: 20260923230000_move_third_party_cover_images.sql
-- Objetivo: Trazer para o bucket product-images da loja as 17 capas
-- que dependiam de sites de terceiros (Jequiti, Nuvemshop, Cloudinary,
-- Tray, Loja Integrada), que podem bloquear ou apagar a imagem a qualquer
-- momento. PNGs convertidos para WebP. Arquivos enviados em 23/09/2026.
-- Só troca a capa se ela ainda apontar para fora do bucket da loja.
-- ============================================================

UPDATE public.products p
SET cover_image = v.url
FROM (VALUES
  ('barbie-sunshine-desodorante-colonia-feminina-25ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/barbie-sunshine-desodorante-colonia-feminina-25ml.webp'),
  ('batom-lipbalm-candy-land-pipoca-doce-4g', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/batom-lipbalm-candy-land-pipoca-doce-4g.webp'),
  ('candy-land-pipoca-doce-desodorante-colonia-25ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/candy-land-pipoca-doce-desodorante-colonia-25ml.webp'),
  ('cebolinha-desodorante-colonia-jequiti-25ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/cebolinha-desodorante-colonia-jequiti-25ml.webp'),
  ('creme-maos-instance-baunilha-nuit-30g', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/creme-maos-instance-baunilha-nuit-30g.webp'),
  ('egeo-dolce-desodorante-colonia-90ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/egeo-dolce-desodorante-colonia-90ml.webp'),
  ('espelho-pocket-led-niina-secrets', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/espelho-pocket-led-niina-secrets.webp'),
  ('espuma-banho-dr-botica-nuvem-de-ideias-150ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/espuma-banho-dr-botica-nuvem-de-ideias-150ml.webp'),
  ('estojo-monica-colonia-sabonete-turma-da-monica', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/estojo-monica-colonia-sabonete-turma-da-monica.webp'),
  ('eudora-magnific-pink-peonia-colonia-75ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/eudora-magnific-pink-peonia-colonia-75ml.webp'),
  ('hidratante-la-piel-tamaras-egipcias-400ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/hidratante-la-piel-tamaras-egipcias-400ml.webp'),
  ('lip-blush-roxo-animado-ellas-brilham-4ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/lip-blush-roxo-animado-ellas-brilham-4ml.webp'),
  ('locao-hidratante-her-code-200ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/locao-hidratante-her-code-200ml.webp'),
  ('locao-hidratante-her-code-climax-200ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/locao-hidratante-her-code-climax-200ml.webp'),
  ('mascara-cilios-bomb-volumaco-eudora-make-10g', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/mascara-cilios-bomb-volumaco-eudora-make-10g.webp'),
  ('pulse-boost-desodorante-colonia-100ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/pulse-boost-desodorante-colonia-100ml.webp'),
  ('sabonete-liquido-instance-baunilha-intensa-200ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/sabonete-liquido-instance-baunilha-intensa-200ml.webp')
) AS v(slug, url)
WHERE p.slug = v.slug
  AND p.cover_image NOT LIKE 'https://pehqvmaeehzfrsxkhlmt.supabase.co/%';
