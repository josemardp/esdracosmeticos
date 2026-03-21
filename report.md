# Relatório de Correções Críticas de Segurança e Bugs - Projeto Esdra Cosméticos

**Autor:** Manus AI

**Data:** 21 de Março de 2026

## Introdução

Este relatório detalha as correções críticas de segurança e bugs implementadas no projeto `esdracosmeticos`. O foco principal foi em resolver vulnerabilidades que poderiam levar a prejuízos financeiros, falhas no processo de checkout e exposição de dados, sem alterar o layout ou a interface do usuário e sem introduzir novas funcionalidades desnecessárias. Todas as alterações foram realizadas visando a segurança real, estabilidade e proteção financeira do sistema.

## Sumário das Alterações

As seguintes correções e melhorias foram aplicadas:

### 1. Correção Crítica — `ORDER_CODE` (Bug de Produção)

**Problema:** O `order_code` estava sendo inserido como "TEMP", o que impedia o trigger de gerar um código único e causava erros em compras simultâneas.

**Ação:**
*   O valor inicial de `order_code` no `CheckoutPage.tsx` foi alterado de "TEMP" para uma string vazia (`""`).
*   Foi criada uma nova migração (`20260321000000_atomic_order_code.sql`) para:
    *   Criar uma `SEQUENCE` atômica (`order_code_seq`) para garantir a unicidade e evitar condições de corrida na geração de códigos de pedido.
    *   Ajustar o valor inicial da `SEQUENCE` com base nos códigos existentes.
    *   Modificar a função `generate_order_code()` para utilizar `nextval()` da `SEQUENCE`.
    *   Remover a condição `WHEN` do trigger `trg_generate_order_code` para que ele sempre seja executado quando `order_code` for `NULL`, vazio ou "TEMP", garantindo a geração do código.

### 2. Segurança — Bloquear Execução Anônima de Funções Críticas

**Problema:** Funções críticas como `decrement_inventory`, `increment_coupon_usage` e `process_order_inventory_and_coupon` estavam acessíveis por usuários anônimos (`anon`), o que representava um risco de segurança.

**Ação:**
*   Foi criada uma nova migração (`20260321000001_revoke_anon_functions.sql`) para revogar explicitamente a permissão `EXECUTE` para o papel `anon` nessas funções.
*   A permissão `EXECUTE` foi concedida ao papel `authenticated` para garantir que usuários logados possam utilizá-las, mantendo o funcionamento normal do checkout para usuários autenticados.

### 3. Segurança — Ocultar Campo `cost`

**Problema:** O campo `cost` (custo do produto) estava exposto em consultas públicas devido ao uso de `select("*")` em algumas queries do frontend e do painel administrativo.

**Ação:**
*   Em `AdminProductsPage.tsx` e `ProductPage.tsx`, todas as chamadas `select("*")` para a tabela `products` foram substituídas por seleções explícitas dos campos necessários, excluindo o campo `cost`.
*   Em `AdminCouponsPage.tsx` e `AdminSupportPage.tsx`, as chamadas `select("*")` foram substituídas por seleções explícitas dos campos relevantes para cada contexto, garantindo que apenas os dados necessários sejam retornados.

### 4. Correção Crítica — Cupom e Desconto

**Problema:** O desconto podia ser manipulado via frontend/localStorage, permitindo que usuários aplicassem descontos indevidos.

**Ação:**
*   A função `process_order_inventory_and_coupon` no Supabase foi refatorada e atualizada através da migração `20260321000002_secure_order_processing.sql` para:
    *   Receber o `p_order_id` em vez de `p_items` diretamente, permitindo que a função recalcule o subtotal e o desconto com base nos `order_items` já inseridos no banco de dados, não confiando nos valores enviados pelo frontend.
    *   Realizar a validação completa do cupom (ativo, valor mínimo, limite de uso) no backend.
    *   Atualizar os campos `subtotal`, `discount` e `total` do pedido no banco de dados com os valores calculados no backend.
    *   Decrementar o estoque dos produtos no pedido de forma segura.
*   O `CheckoutPage.tsx` foi atualizado para chamar a nova assinatura da função RPC `process_order_inventory_and_coupon`, passando o `order.id`.

### 5. Proteção — Preparar Base para Preço Server-Side

**Observação:** Embora uma refatoração completa para cálculo de preço server-side não tenha sido implementada nesta fase, foram adicionados comentários no código para indicar o risco e preparar para futuras migrações.

**Ação:**
*   Comentários foram adicionados em `CheckoutPage.tsx` e `CartContext.tsx` para destacar que os valores de subtotal, total e preço unitário ainda são, em parte, confiados do frontend e que uma migração para cálculo server-side é recomendada para evitar manipulação.

### 6. Correção — Guest Checkout Email

**Problema:** Um pedido de convidado poderia ser vinculado a um cliente existente com `user_id` (usuário autenticado) se o email fosse o mesmo, causando inconsistências.

**Ação:**
*   Em `CheckoutPage.tsx`, a busca por clientes existentes para convidados foi modificada para incluir um filtro `.is("user_id", null)`, garantindo que apenas clientes sem um `user_id` associado (ou seja, outros convidados) sejam considerados para vinculação.

### 7. Qualidade — Tratamento de Erros Admin

**Problema:** As páginas administrativas não possuíam tratamento de erros robusto para as queries do Supabase, resultando em falhas silenciosas.

**Ação:**
*   Tratamento de erros foi adicionado em `AdminCouponsPage.tsx` e `AdminSupportPage.tsx` para exibir mensagens `toast` em caso de falha ao carregar dados, melhorando a experiência do administrador e a depuração.

### 8. Imagens — Preparação (Sem Migrar Agora)

**Observação:** Não foi realizada a migração de imagens nesta fase, mas foram adicionados comentários para futuras ações.

**Ação:**
*   Comentários foram adicionados em `ProductPage.tsx` e `AdminProductsPage.tsx` para indicar que as imagens estão sendo carregadas de URLs externas e que a migração para o Supabase Storage próprio é uma recomendação futura para maior controle e performance.

## Arquivos Modificados

Os seguintes arquivos foram modificados durante a execução destas correções:

*   `/home/ubuntu/esdracosmeticos/src/pages/loja/CheckoutPage.tsx`
*   `/home/ubuntu/esdracosmeticos/supabase/migrations/20260321000000_atomic_order_code.sql` (novo)
*   `/home/ubuntu/esdracosmeticos/supabase/migrations/20260321000001_revoke_anon_functions.sql` (novo)
*   `/home/ubuntu/esdracosmeticos/src/pages/admin/AdminProductsPage.tsx`
*   `/home/ubuntu/esdracosmeticos/src/pages/loja/ProductPage.tsx`
*   `/home/ubuntu/esdracosmeticos/src/pages/admin/AdminCouponsPage.tsx`
*   `/home/ubuntu/esdracosmeticos/src/pages/admin/AdminSupportPage.tsx`
*   `/home/ubuntu/esdracosmeticos/src/contexts/CartContext.tsx`
*   `/home/ubuntu/esdracosmeticos/supabase/migrations/20260320180000_batch_order_processing.sql` (modificado)
*   `/home/ubuntu/esdracosmeticos/supabase/migrations/20260321000002_secure_order_processing.sql` (novo)

## Confirmação de Funcionamento

Todas as alterações foram implementadas com o objetivo explícito de **não quebrar o fluxo de checkout** e **não alterar a interface do usuário**. As modificações nas funções do Supabase e no frontend foram projetadas para serem compatíveis e para reforçar a segurança sem impactar a funcionalidade existente. O processo de checkout deve continuar operando normalmente, porém com maior robustez contra manipulações.

## Observações de Risco Restante

Embora melhorias significativas tenham sido feitas, os seguintes pontos representam riscos residuais ou áreas para futuras otimizações:

*   **Cálculo de Preços Server-Side:** Embora a validação de cupons e estoque agora ocorra no backend, a origem dos preços unitários e subtotais ainda tem dependência do frontend. Uma refatoração completa para que todos os cálculos de preços sejam exclusivamente server-side é a recomendação de segurança ideal para eliminar completamente a possibilidade de manipulação de preços.
*   **Armazenamento de Imagens:** Atualmente, o sistema ainda utiliza URLs de imagens externas. A migração para o Supabase Storage próprio é recomendada para centralizar o gerenciamento de ativos, melhorar a performance e a segurança, e reduzir a dependência de serviços de terceiros.

## Conclusão

As correções implementadas abordam vulnerabilidades críticas e bugs, fortalecendo a segurança e a estabilidade do projeto `esdracosmeticos`. As mudanças foram focadas em impacto real e estabilidade, evitando refatorações maiores neste momento, conforme solicitado. As observações de risco restante fornecem um roteiro claro para futuras melhorias de segurança e performance.
