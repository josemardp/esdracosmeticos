# Auditoria Completa: Esdra Cosméticos

## 1. Resumo Executivo

O site da Esdra Cosméticos encontra-se em um estado de maturidade avançado, pronto para operar e receber tráfego real. A base tecnológica (React, Vite, Supabase) está sólida, e as integrações essenciais para o funcionamento de um e-commerce (carrinho, checkout, cálculo de frete, analytics) estão implementadas e funcionais.

**Estado geral:** Pronto para operar.
**Nível de maturidade:** Alto. A loja superou a fase de MVP frágil e possui uma arquitetura de dados robusta, especialmente no processamento de pedidos (server-side).
**Principais forças:**
*   **Segurança no Checkout:** A migração para o processamento de pedidos 100% server-side (`create_order` no Supabase) é um acerto crítico. O frontend não dita preços, garantindo integridade financeira.
*   **Performance e UX:** A navegação SPA é fluida, a busca é responsiva e a interface é limpa, alinhada ao posicionamento premium da marca.
*   **Analytics:** O GA4 está bem integrado nos pontos cruciais da jornada de compra (`view_item`, `add_to_cart`, `begin_checkout`, `purchase`).

**Principais riscos:**
*   Inconsistência na comunicação de promoções (cupom inválido).
*   Lacunas no SEO técnico (sitemap estático).

---

## 2. O que está aprovado e deve ser preservado

*   **Arquitetura de Pedidos (Server-side):** A função `create_order` no Supabase é o coração da operação. Ela busca preços diretamente do banco, valida estoque atomicamente e aplica cupons de forma segura. Isso elimina o risco de manipulação de preços pelo cliente.
*   **Fluxo de Checkout:** A página de checkout é clara, o preenchimento automático de endereço via ViaCEP funciona perfeitamente e a clareza sobre o pagamento (que ocorre via WhatsApp após o registro do pedido) está bem comunicada.
*   **Gestão de Estado do Carrinho:** O `CartContext` gerencia bem os itens, quantidades e persistência local, comunicando-se corretamente com o backend na hora do checkout.
*   **Design e Identidade Visual:** A hierarquia visual, o uso de tipografia (Cormorant Garamond para títulos) e a paleta de cores transmitem a elegância e o acolhimento propostos.
*   **Rastreamento (Analytics):** A implementação em `src/lib/analytics.ts` cobre os eventos essenciais do e-commerce de forma padronizada para o GA4.

---

## 3. Problemas reais encontrados

### Problema 1: Cupom Promocional "ESDRA10" Inválido
*   **Gravidade:** Alta
*   **Impacto real no negócio:** Quebra de confiança imediata. O cliente vê a promessa de 10% de desconto no topo de todas as páginas, mas ao tentar usar no carrinho, recebe um erro. Isso gera frustração e abandono de carrinho.
*   **Evidência concreta:** O banner no `Header.tsx` exibe o texto hardcoded "Use ESDRA10 e ganhe 10% off". No entanto, ao testar o cupom no carrinho, o sistema retorna "Cupom inválido". A busca no banco de dados (migrations) não encontrou a criação deste cupom.
*   **Onde está:** `src/components/layout/Header.tsx` (texto) e Banco de Dados (falta do registro).
*   **Por que é problema de verdade:** Promessa comercial não cumprida.
*   **Solução mínima recomendada:** Criar o cupom `ESDRA10` no banco de dados (Supabase) com 10% de desconto, ou remover a menção a ele no `Header.tsx` até que a campanha seja ativada.
*   **Risco de regressão:** Baixo. É uma inserção de dados ou ajuste de texto simples.

### Problema 2: Sitemap Estático Incompleto
*   **Gravidade:** Média
*   **Impacto real no negócio:** Prejudica a indexação orgânica (SEO) de produtos específicos. O Google terá dificuldade em descobrir novos produtos ou atualizações de estoque/preço rapidamente.
*   **Evidência concreta:** O arquivo `public/sitemap.xml` contém apenas URLs institucionais e de categorias principais (`/`, `/loja`, `/sobre`, etc.). Não há URLs dinâmicas de produtos (`/produto/:slug`).
*   **Onde está:** `public/sitemap.xml`.
*   **Por que é problema de verdade:** Limita o tráfego orgânico de cauda longa (buscas por nomes específicos de perfumes ou cosméticos).
*   **Solução mínima recomendada:** Implementar a geração dinâmica do sitemap (ex: via Edge Function no Supabase ou rota de API no Vercel) que consulte a tabela de produtos ativos e gere o XML completo.
*   **Risco de regressão:** Baixo, se implementado como uma rota separada.

---

## 4. Melhorias relevantes, mas não urgentes

*   **Feedback Visual de Busca Vazia:** No modal de busca (`SearchDialog.tsx`), quando não há resultados, a mensagem é simples. Poderia sugerir categorias populares ou produtos mais vendidos para manter o usuário engajado.
*   **Otimização de Imagens:** Garantir que todas as imagens de produtos cadastradas no Supabase estejam otimizadas (WebP, dimensões adequadas) para não impactar o tempo de carregamento em conexões móveis mais lentas.

---

## 5. O que NÃO vale mexer agora

*   **Refatoração do Checkout:** O fluxo atual (registro no site -> pagamento no WhatsApp) está funcional e seguro. Automatizar o pagamento (ex: integração direta com gateway) adicionaria complexidade desnecessária nesta fase inicial.
*   **Redesign da Home:** A estrutura atual atende bem ao propósito de apresentar a marca e os produtos.
*   **Mudança de Stack:** A combinação React + Vite + Supabase está entregando performance e segurança adequadas.

---

## 6. Ordem recomendada de prioridade

1.  **Corrigir o cupom ESDRA10:** (Criar no banco ou remover do banner). É o único atrito real na conversão.
2.  **Implementar Sitemap Dinâmico:** Para garantir a indexação correta do catálogo a médio/longo prazo.
3.  **Manter a operação:** Focar em marketing, atendimento via WhatsApp e cadastro de novos produtos.

---

## 7. Prompt cirúrgico para execução

Para corrigir o problema mais crítico (Cupom ESDRA10), utilize o seguinte prompt no Lovable ou execute diretamente no SQL Editor do Supabase:

```sql
-- Criar o cupom ESDRA10 prometido no banner do site
INSERT INTO public.coupons (code, type, value, min_order, active, usage_limit)
VALUES ('ESDRA10', 'percentage', 10.00, 0, true, null)
ON CONFLICT (code) DO UPDATE SET active = true;
```

*(Nota: Ajuste o `min_order` se houver uma regra de valor mínimo para este cupom específico).*
