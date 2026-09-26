> **Retrato de 15/09/2026.** Parte do que está aqui foi corrigido entre 23 e 25/09/2026 (grants de `products`, `decrement_inventory`, remoção do ERP e da newsletter). O estado atual está no `STATUS.md`.

# Relatório de Auditoria Completa — Esdra Cosméticos (Setembro/2026)

**Data:** 15 de Setembro de 2026  
**Repositório:** `josemardp/esdracosmeticos` (Público / Portfólio)  
**Ambiente de Produção:** [https://www.esdracosmeticos.com.br](https://www.esdracosmeticos.com.br)  
**Projeto Supabase:** `pehqvmaeehzfrsxkhlmt` (sa-east-1)  

---

## 1. Linha de Base Inicial

| Comando | Resultado | Detalhes |
|---|---|---|
| `git pull --ff-only` | Aprovado | Sincronizado com `origin/main` |
| `npm run lint` | **Falha (116 problemas)** | 100 erros (predominância de `@typescript-eslint/no-explicit-any` em páginas `/admin/gestao/*`, `no-empty` em CheckoutPage, `no-require-imports` em `tailwind.config.ts`) e 16 warnings de dependências de hooks |
| `npm run build` | Aprovado | Vite v5.4.19 gerou bundle (`dist/index.html` e assets), service worker PWA (`dist/sw.js`) injetado com sucesso. Alerta de chunk grande (`index-*.js` ~1.6MB minificado / 436KB gzipped) |
| `npm run test` | Aprovado | 1 teste de exemplo passou (Vitest v3.2.4) |
| Variáveis `.env` | Aprovado | Presentes e ignoradas pelo git (`git check-ignore .env` confirmou). Variáveis utilizadas no código: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` |

---

## 2. Auditoria do Repositório

### 2.1. Arquivos na Raiz
Foram identificados 21 arquivos fora da estrutura padrão na raiz do projeto:
- **Relatórios Históricos (a mover para `docs/historico/`):**
  - `report.md` (Manus AI, 21/03/2026)
  - `auditoria_esdra.md` (Auditoria, março/2026)
  - `F4-01-FIX-REPORT.md` (Diagnóstico RPC compras, março/2026)
  - 17 arquivos da carga da linha De Sírius (`de_sirius_*`: csv, md, txt)
- **Casos Especiais:**
  - `admin.html`: Criado em 23/03/2026 para tentativa de PWA separado para o admin com rota no `vercel.json`, porém o `vite.config.ts` não foi configurado para multi-page build. Como resultado, `dist/admin.html` não é gerado e o admin em produção funciona através do fallback da SPA (`index.html`).
  - `.env.example`: Ausente no repositório, embora referenciado no README (`cp .env.example .env`).

### 2.2. Migrações Supabase
- **Total de migrações locais:** 38 arquivos em `supabase/migrations/`.
- **Migrações fora do padrão (sem timestamp numérico):**
  - `update_de_sirius_final_real.sql`
  - `update_de_sirius_final_v2.sql`
  - `update_de_sirius_images.sql` (contém erro de sintaxe funcional: tenta atualizar a coluna inexistente `image_url` na tabela `products`, o que comprova que nunca foi aplicada com sucesso).
- **Pendência F4-01:**
  - `20260322050000_fix_f4_01_stock_movements.sql` depende da criação das tabelas `stock_movements` e `purchase_orders`. A verificação em produção indicou que a tabela `stock_movements` não existe no schema do banco em produção (HTTP 404 no PostgREST), indicando que a migração da Fase 4 não está aplicada em produção.

### 2.3. Varredura de Segurança e Dados Pessoais no Histórico Git
Varredura completa executada em todos os commits e referências (`git log -p --all`):
- **Segredos e Tokens (`service_role`, `sk-`, `eyJ`, senhas):**
  - Nenhuma `service_role` ou token JWT (`eyJ...`) encontrado em arquivos de código ou texto.
  - A menção a `SUPABASE_SERVICE_ROLE_KEY` ocorre exclusivamente via leitura de ambiente Deno (`Deno.env.get(...)`) na edge function `sitemap`.
  - Substring `sk-` encontrada apenas no nome do pacote legítimo `queue-microtask-1.2.3.tgz` no lockfile.
- **Dados Pessoais de Clientes Terceiros:**
  - Nenhum CPF real, telefone particular ou dado pessoal de clientes reais que compraram na loja foi encontrado no histórico.
  - As ocorrências de CPF no histórico eram a máscara padrão de formulário (`000.000.000-00`) em `CheckoutPage.tsx`.
  - As menções de contato corporativo pertencem aos canais oficiais da loja (`lojadares@gmail.com` e WhatsApp `(18) 99145-9429`).

### 2.4. Dependências (`npm audit`)
- `npm audit` identificou 32 vulnerabilidades (3 baixas, 8 moderadas, 20 altas, 1 crítica), todas concentradas em ferramentas de desenvolvimento/build (`vite`, `rollup`, `postcss`, `workbox-build`, `esbuild`, `ws`). Nenhuma vulnerabilidade exposta em runtime do cliente que justifique alterações de quebra de build.

### 2.5. Testes Automatizados
- Apenas 1 teste de exemplo (`src/test/example.test.ts`).
- **Pendências de teste identificadas:**
  - Checkout (validação de payloads, cálculo de totais, guest checkout vs usuário logado).
  - Cálculo de frete (`src/lib/shipping.ts`: faixas regionais e frete grátis acima de R$ 250).
  - Validação de cupons e descontos.

### 2.6. Integridade do README
- Links para screenshots (`docs/screenshots/*`) conferidos e válidos.
- Inconsistência identificada: menção ao comando `cp .env.example .env` na seção de instalação, sendo que `.env.example` não existe no repositório.

---

## 3. Auditoria do Site em Produção (Visão da Cliente)

Testado com Google Chrome headless via automação Playwright em larguras Desktop (1280x800) e Mobile (400x800).

### 3.1. Navegação e Páginas Públicas
Todas as rotas públicas responderam com status **200 OK** e com títulos e meta tags Open Graph devidamente configurados:
- `/` (Home)
- `/loja` (Catálogo)
- `/lancamentos`
- `/promocoes`
- `/sobre`
- `/contato` e `/suporte`
- `/politica-de-privacidade`
- `/trocas-e-devolucoes`
- `/termos-de-uso`
- `/login`, `/cadastro`, `/recuperar-senha`
- `/carrinho` e `/produto/:slug`

### 3.2. Fluxo de Compra (Jornada Ponta a Ponta)
1. **Adição ao Carrinho:** Funciona sem fricção a partir da vitrine e da página de produto (`/produto/mr-million-perfume-100ml`).
2. **Cupom de Desconto:**
   - **Falha crítica identificada:** O banner principal no topo da loja promove o cupom `ESDRA10` ("Use ESDRA10 e ganhe 10% off"). Ao digitar `ESDRA10` no carrinho e clicar em "Aplicar", o sistema retorna o erro `"Cupom inválido"` (HTTP 400 da RPC `validate_coupon`). A tabela `coupons` no Supabase está vazia (0 registros).
3. **Checkout e Frete:**
   - Carregamento da tela de checkout fluido em desktop e mobile.
   - Consulta de CEP via ViaCEP preenche automaticamente logradouro, bairro e cidade.
   - Opções de frete (Retirada, PAC, SEDEX) e frete grátis calculadas corretamente.
   - Proteção de rotas da conta: acessos a `/conta/*` sem login redirecionam imediatamente para `/login`.

### 3.3. PWA e SEO
- `manifest.webmanifest`: Responde 200 OK com `Content-Type: application/manifest+json`.
- `sw.js`: Service worker registrado e ativo, respondendo 200 OK.
- `robots.txt`: Válido, aponta para o sitemap e bloqueia `/admin`, `/conta`, `/checkout`.
- `/sitemap.xml`: Responde 200 OK dinamicamente via Edge Function do Supabase, contendo 156 URLs (sendo 128 produtos ativos).

### 3.4. Auditoria Lighthouse (Mobile)
Testado com emulação mobile oficial do Lighthouse 13.4:

| Página | Performance | Acessibilidade | Boas Práticas | SEO | Maior Ofensor |
|---|---|---|---|---|---|
| **Home (`/`)** | **41** | 95 | 100 | 100 | Reduce unused JavaScript (~1660ms) |
| **Catálogo (`/loja`)** | **32** | 90 | 77 | 100 | Reduce unused JavaScript (~1790ms) |
| **Produto (`/produto/:slug`)** | **18** | 91 | 100 | 100 | Reduce unused JavaScript (~2260ms) |

**Diagnóstico de Performance:** O gargalo primário que reduz a nota de Performance mobile é a ausência de *code-splitting* em `App.tsx`. As 30 páginas de ERP de `/admin/gestao/*` são importadas de forma síncrona na raiz do aplicativo, inflando o bundle inicial para ~1.6 MB de JavaScript não utilizado pelo visitante da loja.

### 3.5. Auditoria de Imagens dos Produtos (128 Produtos)
- **Produtos ativos sem foto:** 0 (todos os 128 possuem URL de imagem cadastrada).
- **Imagens pesadas (> 300 KB):** 1 produto (`mascara-cilios-super-brown-niina-secrets-10g` com imagem de 617 KB).
- **Imagens com falha HTTP:**
  1. `body-splash-cuide-se-bem-pessegura-200ml`: URL externa (`oboticariobyludiane.com`) com falha de conexão/DNS.
  2. `body-splash-instance-baunilha-intensa-200ml`: URL externa (`mitiendanube.com`) retornando HTTP 403 Forbidden.
- As 68 imagens locais de perfumes em `/perfumes/*.jpg` respondem 200 OK perfeitamente pela Vercel.

---

## 4. Auditoria do Admin e Banco de Dados

### 4.1. Catálogo e Produtos
- **Total no banco:** 128 produtos.
- **Ativos:** 128 produtos.
- **Ativos sem estoque:** 50 produtos.
- **Ativos sem foto:** 0.
- **Ativos sem preço:** 0.
- **Ativos sem categoria:** 0.
- **Ativos sem descrição:** 0.
- **Slugs duplicados:** Nenhum.

### 4.2. Cupons Promocionais
- **Total no banco:** 0 registros na tabela `coupons`.
- O cupom `ESDRA10` divulgado no banner institucional não existe cadastrado no banco de dados.

### 4.3. Módulo de Gestão / F4-01
- As tabelas da expansão do ERP (`stock_movements`, `purchase_orders`, `customer_notes`, `audit_log`) não estão presentes no schema público do banco em produção.
- O teste do checklist F4-01 em `/admin/gestao/recebimento-compras` e `/admin/gestao/movimentos-estoque` confirma que o módulo de movimentação de estoque depende da aplicação prévia da migração das tabelas no banco de produção.

---

## 5. Auditoria de Segurança do Supabase

### 5.1. RLS (Row Level Security) e Isolamento de Dados
- **Tabelas sensíveis:** `orders`, `order_items`, `customers`, `addresses`, `profiles`.
  - Todas possuem RLS habilitada.
  - Testes com papel anônimo (`anon`) retornaram 0 registros (isolamento efetivo contra vazamento não autenticado).
- **Tabelas públicas:** `categories` e `products` permitem leitura pelo papel `anon`, conforme esperado para uma vitrine virtual.

### 5.2. Vulnerabilidade Crítica Identificada: Exposição de Custo dos Produtos
- **Achado:** Ao realizar `GET /rest/v1/products?select=id,name,cost,avg_cost` com a chave anônima pública (`anon key`), o banco de dados retorna os valores reais de custo (`cost` e `avg_cost`) de todos os produtos cadastrados (ex.: *Attract Homme Sport: cost 55*, *Máscara Super Brown: cost 24.43*).
- **Causa Raiz:** A política de RLS para `products` concede SELECT irrestrito para `anon`. A omissão de `cost` no código React é insuficiente, pois a API REST do Supabase é pública e aceita parâmetros `select` arbitrários.
- **Recomendação:** Implementar restrição de acesso à coluna `cost`/`avg_cost` (ex.: view pública sem colunas de custo ou coluna restrita a usuários com perfil de administrador).

### 5.3. Permissões de Funções RPC
- Funções críticas de alteração direta (`decrement_inventory`, `increment_coupon_usage`, `process_order_inventory_and_coupon`, `receive_purchase_order`, `adjust_stock`) estão com permissão `EXECUTE` bloqueada para o papel `anon` (retornam 404 no PostgREST por estarem fora do schema cache de anon), conforme a migração `20260321000001_revoke_anon_functions.sql`.
- A função pública `validate_coupon(p_code, p_order_total)` está acessível para consulta no carrinho, retornando validação de regras de negócio.

---

## 6. Resumo Quantitativo de Achados

| Severidade | Quantidade | Principais Itens |
|---|---|---|
| **Crítico (impede venda ou expõe dados)** | 2 | 1) Exposição do campo `cost` de produtos para usuários anônimos via API pública REST.<br>2) Cupom `ESDRA10` anunciado no cabeçalho falha no carrinho (tabela de cupons vazia). |
| **Importante (confunde cliente ou afeta performance)** | 4 | 1) Duas imagens de produtos quebradas por links externos fora do ar.<br>2) Uma imagem pesada (617 KB).<br>3) Bundle monolítico de 1.6 MB prejudicando nota de Performance mobile (Lighthouse 18 a 41).<br>4) Migrações de estoque/F4-01 pendentes de aplicação no banco de produção. |
| **Higiene (código, lint, arquivos)** | 4 | 1) 116 problemas de lint (erros de any em admin/gestao).<br>2) 21 arquivos fora da pasta de documentação na raiz do repo.<br>3) Três migrações SQL sem timestamp de versionamento.<br>4) Ausência de `.env.example` referenciado no README. |
