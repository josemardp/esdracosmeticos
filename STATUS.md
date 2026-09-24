# STATUS.md — Loja Esdra Cosméticos

> Estado atual e próximo passo. Histórico vai para docs/HISTORICO.md. Última atualização: 24/09/2026

---

## Onde estamos

A loja virtual da Esdra Cosméticos está em produção no domínio [www.esdracosmeticos.com.br](https://www.esdracosmeticos.com.br/), com catálogo ativo de 128 produtos, PWA com service worker e sitemap dinâmico operacional.

Em 15/09/2026, foram executadas as decisões da auditoria geral:
1. **Higiene do repositório:** 20 relatórios antigos e 3 scripts SQL sem timestamp foram movidos da raiz para `docs/historico/` e `docs/historico/sql/` (commit `74215a6`).
2. **Segurança do catálogo:** Criada a migração versionada `supabase/migrations/20260915120000_restrict_product_cost_anon.sql` revogando a leitura das colunas `cost` e `avg_cost` da tabela `products` para o papel `anon` (commit `9c4bd86`).
3. **Banner e cupons:** Verificado e comprovado via teste automatizado que o banner superior não menciona cupom promocional (anuncia frete grátis e parcelamento); o cupom `ESDRA10` permanece inativo no banco conforme decisão do negócio.
4. **Performance do bundle:** Todas as rotas administrativas (`/admin/*`, `/admin/gestao/*`, `/conta/*`) e tela de login foram convertidas para carregamento sob demanda (`React.lazy`). O bundle inicial JS (`dist/assets/index-*.js`) caiu de **1.601 kB (436 kB gzip)** para **862 kB (253 kB gzip)** — uma redução de **46%** no tráfego de entrada. A pontuação Lighthouse mobile na página de produto subiu de 18 para **30** (+66% de ganho).

---

## Feito em 23/09/2026

1. **Custo fechado na API pública:** migração `20260915120000_restrict_product_cost_anon.sql` corrigida e aplicada em produção. O REVOKE só das colunas não bastava, porque o `anon` tinha SELECT na tabela inteira. Agora o `anon` perde o SELECT da tabela e recebe de volta coluna a coluna, sem `cost` e `avg_cost`. Verificado: GET público de `cost`/`avg_cost` retorna `permission denied`; home, catálogo (`/loja`, 256 links) e páginas de produto seguem funcionando.
2. **Fotos quebradas:** capas de `body-splash-cuide-se-bem-pessegura-200ml` (foto oficial Boticário) e `body-splash-instance-baunilha-intensa-200ml` (foto oficial Eudora; a origem antiga dava 403) agora estão no bucket `product-images` da loja. Migração `20260923200000_fix_broken_cover_images.sql`.
3. **Imagem pesada:** capa da máscara Niina Secrets trocada pela versão de 165 KB no bucket da loja (antes: 632 KB em outro projeto Supabase).
4. **Brecha na função de NF-e fechada:** `upsert_products_from_nfe` (SECURITY DEFINER, sem checagem de admin) era executável por qualquer visitante e permitia criar/alterar produtos, custo e estoque. Migração `20260923210000_lock_upsert_products_from_nfe.sql` tirou o EXECUTE de `PUBLIC`, `anon` e `authenticated`. Verificado: RPC anônima passou de HTTP 204 para 401 `permission denied`. Nenhuma tela usa a função.
5. **Capas fora do projeto antigo:** as 42 capas restantes no projeto Supabase antigo (`khnrwskgpedwerbpohfe`) foram copiadas para o bucket `product-images` e o banco atualizado (migração `20260923220000_move_cover_images_to_store_bucket.sql`). Nenhuma capa, galeria, categoria ou banner aponta mais para o projeto antigo. Verificado no site: `/loja` carrega as 128 imagens, 0 quebradas.
6. **Capas de sites de terceiros:** as 17 capas restantes (Jequiti, Nuvemshop, Cloudinary, Tray, Loja Integrada) foram copiadas para o bucket; PNGs convertidos para WebP. Migração `20260923230000_move_third_party_cover_images.sql`. Hoje nenhuma capa depende de host externo: as 64 com URL completa estão no bucket da loja e respondem; as demais usam arquivos do próprio site.
7. **Custo escondido também do cliente logado:** migração `20260924000000_restrict_product_cost_authenticated.sql` (mesmo esquema do `anon`) + função `admin_product_costs()`, que só responde a admin. As telas de gestão que mostram custo usam `src/lib/product-costs.ts`. Testado no banco simulando cada papel: cliente e visitante recebem `permission denied`; admin lê o custo pela função, grava custo e cria produto normalmente. Aplicado depois do deploy do front (`b87875d`), sem janela de quebra.
8. **Testes automatizados:** `src/test/shipping.test.ts`, `cart.test.tsx` e `product-costs.test.ts` cobrem regra de frete, subtotal com promoção, limite de estoque, cupom (maiúsculas, inválido, desconto maior que o subtotal, remoção ao alterar carrinho) e o helper de custo. `npm test`: 14 testes passando.
9. **Conferidos sem mudança:** `decrement_inventory` executável pelo `anon` não é brecha (a RLS só deixa admin alterar `products`; testado, o estoque não muda). Os 256 links do `/loja` são 2 por card (foto e nome) para 128 produtos ativos; a contagem do STATUS está certa.
10. **Checkout consertado (24/09/2026):** a RPC `create_order` nunca tinha sido criada em produção (0 pedidos até então). Aplicada a migração `20260924010000_create_order.sql` (base: versão de 20/03, com erro claro para produto inativo/inexistente, quantidade nula recusada, correção do cupom que quebrava todo pedido sem cupom e sem os REVOKEs de funções que não existem). Testada em transações desfeitas (pedido normal, quantidade negativa, produto inativo, estoque insuficiente, cupom inválido e cupom válido com 10%) e depois pelo site de verdade: pedido ESD-00001 de R$ 22,90 via PIX criado, estoque baixou de 18 para 17. O pedido, o cliente de teste e a baixa de estoque foram desfeitos em seguida (0 pedidos, estoque 18). `decrement_inventory` deixou de ser executável pelo `anon`.
11. **Painel conferido logado como admin:** `/admin/gestao/margem` mostra os 136 produtos, 126 com custo (Attract 100ml: custo R$ 55, margem 57,4%); `/admin/gestao/reposicao` lista 88, 80 com custo, sem erro.

Como aplicar SQL neste projeto: a CLI do Supabase da máquina está logada na org dona do projeto. Usar `supabase db query --linked --project-ref pehqvmaeehzfrsxkhlmt -f arquivo.sql`. O conector Supabase do Claude (conta josemardp) não enxerga este projeto.

---

## Próximo passo

1. **Cupom ESDRA10 está ativo no banco** (10%, sem data de fim, uso 0), ao contrário da decisão registrada em 15/09 ("não ativar"). Qualquer cliente que digitar o código ganha 10%. Josemar decidir: desativar ou manter.
2. **Primeiro pedido real pelo site:** acompanhar o primeiro pedido de cliente (painel `/admin` e WhatsApp) para confirmar o fluxo com dados reais.
3. **Estoque zero:** Esdra decidir o que fazer com os 50 produtos ativos sem estoque.

---

## Pendências abertas

| Pendência | Impacto | Dono |
|---|---|---|
| Decidir se o cupom ESDRA10 continua ativo | Cliente pode aplicar 10% de desconto hoje | Josemar |
| Decidir o que fazer com os 50 produtos ativos com estoque zero (desativar ou repor) | Aparecem no catálogo sem poder ser comprados | Esdra |
| Teste automatizado do fluxo de checkout ponta a ponta (a `create_order` já existe; falta automatizar) | Hoje os testes cobrem regra de frete, carrinho e cupom, não a criação do pedido | Código (futuro) |

---

## Decisões que mudam o trabalho

- **EC-001 (09/09/2026):** Cinco projetos independentes sob `C:\projetos\esdra` com repositórios e publicações próprios. Não criar monorepositório.
- **EC-002 (09/09/2026):** Uma fonte documental por assunto. `central-ec` é a entrada do negócio; `STATUS.md` na raiz de cada projeto orienta a retomada imediata.
- **EC-003 (09/09/2026 / 15/09/2026):** ERP da loja congelado desde julho/2026. As migrações de gestão/estoque (`stock_movements`, `cash_movements`) **não serão aplicadas em produção**. O módulo `/admin/gestao` permanece estritamente como legado e não recebe expansão nem correções de schema.
- **Repositório Público (13/09/2026):** O repositório `josemardp/esdracosmeticos` é público para exibição como portfólio. Proibido commitar segredos (`service_role`, senhas), dados pessoais de clientes ou relatórios internos na raiz.
- **Cupom Promocional (15/09/2026):** Não ativar cupom `ESDRA10` no banco (em 24/09 ele foi encontrado **ativo**; ver Próximo passo) e manter a vitrine focada em frete grátis regional acima de R$ 199.
- **Grants em `products` (23/09/2026):** `anon` e `authenticated` têm SELECT só nas colunas listadas nas migrações `20260915120000` e `20260924000000`; custo só via `admin_product_costs()`. Coluna nova exige `GRANT SELECT (coluna) ON public.products TO anon, authenticated`. Consultas públicas com `select=*` em `products` falham.
- **Qualidade e Lint (15/09/2026):** `@typescript-eslint/no-explicit-any` é mantido como warning para não travar o build de produção. Não despender esforço de tipagem nos 116 alertas no momento.

---

## Como rodar e verificar

### Comandos locais
```bash
# Instalar dependências
npm install

# Executar linter (avisos não bloqueiam build)
npm run lint

# Executar testes unitários
npm run test

# Executar build de produção
npm run build

# Iniciar servidor local de desenvolvimento
npm run dev
```

### Variáveis de ambiente (`.env`)
O arquivo `.env` local deve conter as seguintes chaves:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### Verificação do bloqueio de custo (anônimo)
Após executar a migração no Supabase, testar se o papel anônimo consegue ler `cost`:
```bash
# Requisição pública via PostgREST (substituir <VITE_SUPABASE_PUBLISHABLE_KEY>)
curl -i "https://pehqvmaeehzfrsxkhlmt.supabase.co/rest/v1/products?select=id,name,cost&limit=1" \
  -H "apikey: <VITE_SUPABASE_PUBLISHABLE_KEY>"

# Resposta esperada (aplicado em 23/09/2026): HTTP 401 com
# "permission denied for table products"
```

### Verificação em produção
1. **Vitrine e Produtos:** Acessar [https://www.esdracosmeticos.com.br](https://www.esdracosmeticos.com.br), navegar para `/loja`, testar filtros por categoria e carregar a página de um produto individual.
2. **Carrinho e Checkout:** Adicionar produto ao carrinho, prosseguir para `/checkout`, preencher CEP (ex: `16700-000`) e conferir o cálculo automático do frete.
3. **PWA e Sitemap:** Conferir `https://www.esdracosmeticos.com.br/sitemap.xml` (deve retornar XML com produtos ativos) e `manifest.webmanifest`.
