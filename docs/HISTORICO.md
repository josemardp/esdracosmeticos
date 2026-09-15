# Histórico de Relatórios e Auditorias Anteriores — Esdra Cosméticos

Este documento consolida e contextualiza os relatórios técnicos, diagnósticos e registros de migração executados na loja virtual antes de setembro de 2026. Os documentos originais foram preservados em [`docs/historico/`](./historico/).

---

## 1. Correções Críticas de Segurança e Bugs (Manus AI — 21/03/2026)
- **Arquivo original:** [`docs/historico/report.md`](./historico/report.md) (anteriormente `report.md` na raiz)
- **Contexto:** Correção de concorrência e integridade transacional na finalização de compras.
- **Principais pontos:**
  - Criação de `SEQUENCE` atômica (`order_code_seq`) para geração de códigos de pedidos (`20260321000000_atomic_order_code.sql`).
  - Revogação de permissão `EXECUTE` para o papel `anon` em RPCs críticas (`decrement_inventory`, `increment_coupon_usage`, `process_order_inventory_and_coupon`) via `20260321000001_revoke_anon_functions.sql`.
  - Ocultação do campo `cost` nas queries explícitas de produtos no frontend.
  - Validação de cupom e recálculo de desconto server-side.

---

## 2. Auditoria Completa da Loja (Março/2026)
- **Arquivo original:** [`docs/historico/auditoria_esdra.md`](./historico/auditoria_esdra.md) (anteriormente `auditoria_esdra.md` na raiz)
- **Contexto:** Avaliação geral de prontidão para tráfego real da loja.
- **Principais pontos:**
  - Avaliação positiva da arquitetura de checkout server-side e rastreamento GA4.
  - Apontamento do cupom promocional `ESDRA10` inválido/ausente no banco de dados.
  - Apontamento do sitemap estático (posteriormente solucionado com a edge function do Supabase).

---

## 3. Diagnóstico e Correção F4-01 (Março/2026)
- **Arquivo original:** [`docs/historico/F4-01-FIX-REPORT.md`](./historico/F4-01-FIX-REPORT.md) (anteriormente `F4-01-FIX-REPORT.md` na raiz)
- **Contexto:** Correção de visibilidade dos registros em `stock_movements` gerados pelo recebimento de Pedidos de Compra (`receive_purchase_order`).
- **Principais pontos:**
  - Ajuste na migração `20260322050000_fix_f4_01_stock_movements.sql` para garantir que `stock_movements` herde `v_po.owner_user_id`, respeitando as políticas RLS.

---

## 4. Catalogação e Carga da Linha De Sírius (Março/2026)
- **Pasta de acervo:** [`docs/historico/de_sirius/`](./historico/de_sirius/)
- **Arquivos preservados:**
  - Relatórios de mapeamento e execução: `de_sirius_final_execution_summary.md`, `de_sirius_final_mapping.md`, `de_sirius_audit_refined_38.md`, `de_sirius_public_urls_table.md`, etc.
  - Tabelas e listas de validação: `de_sirius_execution_report.csv`, `de_sirius_audit_refined_38.csv`, `de_sirius_catalog.txt`.
- **Contexto:** Processo de extração, tratamento de imagens, enriquecimento de catálogo e carga de 38 produtos da marca De Sírius.

---

## 5. Migrações SQL sem Versionamento por Timestamp (Março/Abril 2026)
- **Pasta de acervo:** [`docs/historico/sql/`](./historico/sql/)
- **Arquivos preservados:**
  - `update_de_sirius_final_real.sql`
  - `update_de_sirius_final_v2.sql`
  - `update_de_sirius_images.sql` (arquivado por tentar atualizar coluna inexistente `image_url`)
- **Contexto:** Scripts auxiliares de atualização de imagens da linha De Sírius que estavam na pasta `supabase/migrations/` sem prefixo de timestamp. Foram transferidos para preservação histórica para não causar inconsistências na CLI do Supabase. O estado final de imagens encontra-se coberto pela migração oficial `20260405000000_update_desirius_cover_images.sql`.
