-- ============================================================
-- MIGRATION: 20260923220000_move_cover_images_to_store_bucket.sql
-- Objetivo: Trazer para o bucket product-images da loja as 42 capas
-- que ainda estavam no projeto Supabase antigo (khnrwskgpedwerbpohfe).
-- Arquivos copiados ao Storage em 23/09/2026 antes desta migração.
-- Só troca a capa se ela ainda apontar para o projeto antigo.
-- ============================================================

UPDATE public.products p
SET cover_image = v.url
FROM (VALUES
  ('acidificante-capilar-de-sirius-230g', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/acidificante_capilar_230g_official.webp'),
  ('agua-oxigenada-10-vol-de-sirius-900g', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/desirius-agua-oxigenada-10-vol-900g.jpg'),
  ('agua-oxigenada-20-vol-de-sirius-900g', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/desirius-agua-oxigenada-20-vol-900g.jpg'),
  ('agua-oxigenada-30-vol-de-sirius-900g', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/desirius-agua-oxigenada-30-vol-900g.jpg'),
  ('agua-oxigenada-5-vol-de-sirius-900g', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/desirius-agua-oxigenada-5-vol-900g.jpg'),
  ('body-spray-boticollection-portinari-100ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/body-spray-boticollection-portinari-100ml.jpg'),
  ('condicionador-acidificante-de-sirius-250ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/condicionador_acidificante_250ml_official.webp'),
  ('condicionador-iluminador-absoluto-de-sirius-300ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/condicionador_iluminador_absoluto_300ml_official.webp'),
  ('condicionador-nutricao-profunda-de-sirius-300ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/condicionador_nutricao_profunda_300ml_official_v2.webp'),
  ('corative-color-1-0-preto-de-sirius-60g', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/desirius-corative-color-1-0-preto-60g.jpg'),
  ('corative-color-4-0-castanho-medio-de-sirius-60g', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/desirius-corative-color-4-0-castanho-medio-60g.jpg'),
  ('corative-color-5-0-castanho-claro-de-sirius-60g', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/desirius-corative-color-5-0-castanho-claro-60g.jpg'),
  ('corative-color-7-7-louro-medio-marrom-de-sirius-60g', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/desirius-corative-color-7-7-louro-medio-marrom-60g.jpg'),
  ('creme-hidratante-instance-baunilha-400ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/creme-hidratante-instance-baunilha-400ml.jpg'),
  ('creme-loiro-supremo-de-sirius-300g', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/desirius-creme-loiro-supremo-300g.jpg'),
  ('creme-nutricao-profunda-de-sirius-300g', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/creme_nutricao_profunda_300g_official_v3.webp'),
  ('creme-reconstrutor-kerativa-de-sirius-1l', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/creme_reconstrutor_kerativa_1l_official.webp'),
  ('creme-reconstrutor-kerativa-de-sirius-300ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/creme_reconstrutor_kerativa_300ml_official.webp'),
  ('creme-restaurador-intenso-de-sirius-300g', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/creme_restaurador_intenso_300g_official.webp'),
  ('dd-spray-nutricao-profunda-de-sirius-120ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/dd_spray_nutricao_profunda_120ml_official_v2.webp'),
  ('elixir-12-em-1-iluminador-absoluto-de-sirius-120ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/elixir_12_em_1_iluminador_absoluto_120ml_official.webp'),
  ('ella-intensa-hair-body-splash-de-sirius-200ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/ella_intensa_200ml_official.webp'),
  ('ella-leve-hair-body-splash-de-sirius-200ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/ella_leve_200ml_official_v2.webp'),
  ('fiber-reconstructor-de-sirius-100ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/fiber_reconstructor_100ml_official_alt.webp'),
  ('fluido-restaurador-intenso-escova-de-sirius-300ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/desirius-fluido-restaurador-intenso-escova-300ml.jpg'),
  ('k-liss-unik-keratin-de-sirius-1l', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/k_liss_unik_keratin_1l_official.webp'),
  ('kit-acidificante-de-sirius', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/desirius-kit-acidificante.jpg'),
  ('leave-in-reconstrutor-indispensavel-de-sirius-120ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/o_indispensavel_120ml_official.webp'),
  ('locao-hidratante-dr-botica-pocao-das-nuvens-400ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/locao-hidratante-dr-botica-pocao-das-nuvens-400ml.webp'),
  ('mascara-cilios-turbo-dimension-eudora-make-10g', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/mascara-cilios-turbo-dimension-eudora-make-10g.jpg'),
  ('queratina-kerativa-de-sirius-1l', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/desirius-queratina-kerativa-1l.jpg'),
  ('shampoo-acidificante-de-sirius-250ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/shampoo_acidificante_250ml_official.webp'),
  ('shampoo-iluminador-absoluto-de-sirius-300ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/shampoo_iluminador_absoluto_300ml_official.webp'),
  ('shampoo-loiro-supremo-de-sirius-300ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/desirius-shampoo-loiro-supremo-300ml.jpg'),
  ('shampoo-nutricao-profunda-de-sirius-300ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/shampoo_nutricao_profunda_300ml_official_v2.webp'),
  ('shampoo-reconstrutor-kerativa-de-sirius-1l', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/shampoo_reconstrutor_kerativa_1l_official_alt.webp'),
  ('shampoo-reconstrutor-kerativa-de-sirius-300ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/shampoo_reconstrutor_kerativa_300ml_official.webp'),
  ('shampoo-restaurador-intenso-de-sirius-300ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/shampoo_restaurador_intenso_300ml_official.webp'),
  ('siage-nutri-rose-shampoo-400ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/siage-nutri-rose-shampoo-400ml.jpg'),
  ('spray-tonalizante-platinada-de-sirius-200ml', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/desirius-spray-tonalizante-platinada-200ml.jpg'),
  ('tonative-color-3-0-castanho-escuro-de-sirius-60g', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/desirius-tonative-color-3-0-castanho-escuro-60g.jpg'),
  ('tonative-color-4-0-castanho-medio-de-sirius-60g', 'https://pehqvmaeehzfrsxkhlmt.supabase.co/storage/v1/object/public/product-images/desirius-tonative-color-4-0-castanho-medio-60g.jpg')
) AS v(slug, url)
WHERE p.slug = v.slug
  AND p.cover_image LIKE 'https://khnrwskgpedwerbpohfe.supabase.co/%';
