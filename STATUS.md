# STATUS.md — Loja Esdra Cosméticos

> Estado atual e próximo passo. Histórico vai para docs/HISTORICO.md. Última atualização: 24/09/2026 (act-012 e act-016)

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
12. **Teste do checkout no banco:** `npm run test:db` roda `supabase/tests/checkout_test.sql` contra produção dentro de uma transação desfeita: pedido de convidado com cupom (preço do banco, 10% de desconto, estoque -2, uso do cupom, item gravado), recusa de quantidade negativa, produto inativo, estoque insuficiente e cupom inexistente, e bloqueio do `anon` em `decrement_inventory` e na leitura de custo. Passa com `checkout ok`; falha com `FALHOU: ...` e saída 1 (conferido estragando o teste de propósito). Banco sem rastro depois.
13. **Migrações nunca aplicadas fora de `supabase/migrations`:** 18 arquivos cujos objetos não existem em produção (ERP congelado pela EC-003: vendas, caixa, compras, estoque; newsletter/carrinho abandonado; sequência de código de pedido; as duas versões antigas da `create_order`) foram movidos com `git mv` para `docs/historico/migrations-nao-aplicadas/`. Em `supabase/migrations` ficaram só as 24 que batem com produção.
14. **Tipagem:** `tsc` sem erros (eram 3: import sem uso em `CrediarioPage` e payload de insert sem tipo nas importações de CSV/NF-e).

## Feito em 24/09/2026: desempenho mobile (act-011)

Lighthouse mobile em produção, mediana de 3 rodadas (antes: 2 rodadas, LCP e TBT pela média delas; produto medido na máscara Niina Secrets):

| Página | Antes | Depois | LCP | TBT | CLS |
|---|---|---|---|---|---|
| Home | 41 / 44 | **58** (52/58/60) | 7,2 → 5,4 s | 1.120 → 373 ms | 0,01 → 0 |
| /loja | 42 / 30 | **51** (61/47/51) | 7,2 → 5,5 s | 1.790 → 814 ms | 0 |
| Produto | 22 / 43 | **68** (68/68/63) | 7,6 → 5,1 s | 675 → 214 ms | até 0,87 → 0 |

1. **Capas otimizadas:** cada capa ganhou versões WebP de 400 e 800 px em `product-images/opt/` (132 capas: 4,6 MB → 1,4 MB na versão de 800). Migração `20260924020000_optimized_cover_images.sql` aplicada (132 de 132). O site monta o `srcset` pelo nome (`getProductImageSrcSet` em `src/lib/product-images.ts`). Originais seguem no bucket e em `public/perfumes`. **Capa nova enviada pelo admin não ganha versões menores sozinha** (aparece como enviada).
2. **Home:** foto do topo em `public/img/` (recorte em retrato no celular) com pré-carga pelo `index.html`; categorias em WebP de 480 px; logo de 1920 para 256 px.
3. **Página de produto:** aparece sem esperar avaliações e relacionados; esqueleto no mesmo formato da página (fim do pulo de layout); o `index.html` já pede o produto ao Supabase e a foto em paralelo com o JavaScript (`src/lib/product-prefetch.ts`, colunas iguais nos dois lugares).
4. **JavaScript inicial:** 862 kB (253 gzip) → 678 kB (204 gzip). framer-motion via `LazyMotion` (páginas usam `<m.div>`), carrinho/checkout/login/suporte/sobre/institucionais/busca sob demanda, cartões do catálogo com fade em CSS.
5. **Fontes e Analytics:** Google Fonts por `<link>` sem bloquear a pintura. **Google Analytics carrega na primeira interação (rolar, tocar, clicar, tecla) ou após 15 s**: quem sai em menos de 15 s sem tocar não conta como visita. Reverter é só voltar o `<script async>` no `index.html`.
6. **Conferido:** prints antes/depois de home, /loja e produto em celular e desktop, claro e escuro (a loja não tem tema escuro; sai igual), 0 imagens quebradas; busca, Ctrl+K, 10 rotas sob demanda, filtro e carrinho ok. `npm test` 14/14, `npm run test:db` checkout ok, build ok.

## Feito em 24/09/2026: redesenho visual da loja (act-014)

Mockup aprovado pelo Josemar antes de aplicar (artefato "Esdra Nova Vitrine"). Aplicado em 4 etapas: base e home, catálogo, produto, sacola e checkout. Nenhuma regra de negócio mudou (preço, cupom, frete, estoque, `create_order`).

1. **Direção de arte tirada da logo:** Bodoni Moda (títulos, mesmo traço da logo) + Jost (texto e preço), no lugar de Cormorant + Inter. Paleta: rosa da logo `#E6B3BA` nas áreas de destaque, vinho rosado `#8A3552` nos botões (7,7 de contraste com branco), tinta `#2A1820` no texto, rosa pó `#F7EDEF` atrás das fotos. Todas as combinações de texto passam no AA. Fontes reserva com as medidas da Bodoni/Jost no `index.css` (sem pulo de layout quando a fonte chega).
2. **Admin intocado:** a loja usa as variáveis novas no `:root`; o admin recebe as antigas pela classe `.admin-ui` (posta no `<html>` pelo `index.html` e pelo `ManifestSwitcher` do `App.tsx`, que também carrega as fontes antigas só no admin). Login do admin comparado com produção: idêntico pixel a pixel.
3. **Peças novas:** `src/components/store/ProductCard.tsx` (cartão único da home, catálogo e relacionados; foto com `srcset` e `showPlaceholderOnError`; o branco da foto some no fundo rosa com `.blend-photo`, que não pode ter pai com transform/opacity animado), `src/lib/format.ts` (preço com vírgula em todo o site), `src/assets/logo-esdra-wordmark.webp` (logo recortada, 8 kB).
4. **Home:** topo com título e 3 produtos reais sobre o rosa (a foto de banco de imagens com marcas falsas saiu, e a pré-carga dela saiu do `index.html`); categorias em botões; Mais vendidos, Em promoção e Lançamentos sem repetir produto; marcas reais do cadastro (Eudora, O Boticário, Jequiti, De Sírius, Naturall Mix) com link para `/loja?marca=`.
5. **Catálogo:** mostra 24 produtos e botão "Mostrar mais" (era 128 de uma vez); categorias em botões no celular; filtros ativos como etiquetas.
6. **Produto:** foto inteira (antes cortava o frasco), preço grande, "Restam N unidades" quando estoque ≤ 3, informações em abas, barra fixa de compra no celular (aparece quando o botão principal sai da tela).
7. **Sacola e checkout:** barra de quanto falta para o frete grátis, passos numerados, campos com teclado certo, total e botão fixos no celular, aviso "Você não paga nada agora". Avisos do carrinho passam a dizer "sacola".
8. **Capa trocada corrigida:** "717 VIP Men 100ml" mostrava o La Vie e "La Vie 100ml" mostrava o 717 VIP Men (os arquivos vieram trocados de `public/perfumes`). Migração `20260924030000_swap_717_vip_men_la_vie_covers.sql` aplicada em produção; originais renomeados com `git mv`.

Lighthouse mobile, as duas versões compiladas e medidas no mesmo computador, mediana de 3 rodadas (a máquina oscila entre levas; comparar sempre dentro da mesma leva):

| Página | Leva etapa 1 | Leva etapa 3 | Leva final |
|---|---|---|---|
| Home | 62 → 75 | 67 → 68 | 56 → 65 |
| /loja | 50 → 60 | 46 → 71 | 42 → 59 |
| Produto | 73 → 74 | 67 → 76 | 64 → 71 |

`npm test` 14/14, `npm run test:db` checkout ok, build ok. Prints de home, /loja, produto, sacola e checkout em 390 e 1366 px: 0 imagens quebradas, sem rolagem lateral.

**Em produção depois do deploy `527480a`** (mediana de 3 rodadas; antes = sessão act-011): home 58 → **59** (56/62/59), /loja 51 → **65** (64/65/82), produto 68 → **69** (70/66/69). CLS 0 a 0,04. Admin conferido no ar: login idêntico ao de antes.

## Feito em 24/09/2026: capa do admin e páginas restantes (act-012, act-016)

1. **Capa nova pelo admin ganha versões 400/800 sozinha:** o navegador do admin redimensiona a foto (canvas, WebP qualidade 0,82, cache de 30 dias) e envia para `product-images/opt/product-<timestamp>-800.webp` e `-400.webp`; `cover_image` recebe a de 800 e a loja monta o `srcset` pelo nome. Se o navegador não gerar WebP (ex.: HEIC fora do Safari), envia o original para `product-images/`. Código em `src/lib/product-cover-upload.ts` (só carrega com o admin). **O upload antigo estava quebrado:** mandava para o bucket `products`, que não existe. Sem política nova: o admin já tinha INSERT em `product-images`. Testado com envio real (830 KB virou 11,7 KB e 5,3 KB); arquivos de teste apagados, nenhum produto criado.
2. **Páginas redesenhadas no sistema da loja** (aprovadas pelo Josemar por prints): institucionais com moldura comum (`src/components/store/InfoPage.tsx`, classe `.info-prose` no `index.css`, texto jurídico intacto); Sobre sem cartões e sem animação lateral (a página rolava para o lado no celular); Suporte com WhatsApp em destaque e perguntas que abrem e fecham; login, cadastro e senha com moldura própria (`src/components/store/AuthShell.tsx`), erros do Supabase em português e aviso "Link vencido" no redefinir senha depois de 6 s sem link válido; área da cliente com abas no celular, item ativo marcado, preços com `formatBRL` e favoritos no `ProductCard` (mostra preço promocional); 404 dentro do layout da loja.
3. **Textos conferidos pelo Josemar:** troca em **7 dias** depois do recebimento (antes 30) na política, home, produto, suporte e `index.html`; entrega escrita como "envio rápido para todo o Brasil" (saiu "3 a 10 dias úteis"); frete grátis só "acima de R$ 199" (saiu "para todo o Brasil" do suporte e dos termos); pagamento só PIX, cartão e boleto (saiu "transferência bancária"). Linha do tempo da Sobre (2016 a 2026) confirmada.
4. **Conferido:** `npm test` 14/14, `npm run test:db` checkout ok, build e `tsc` ok; login do admin idêntico ao de produção pixel a pixel (390 e 1366 px), antes e depois do deploy `8aac8c1`; prints de produção das 11 rotas sem rolagem lateral e sem travessão; 0 imagens quebradas na `/loja`.

Lighthouse mobile. Local, versão no ar contra nova na mesma leva: home 64 → 70, /loja 68 → 67 (mediana de 5), produto 72 → 70 (mediana de 8, LCP igual em 4,6 s; o FCP alterna entre 2,0 e 3,6 s nas duas versões conforme a fonte chega). **Em produção depois do deploy** (mediana de 3): home 59 → **83** (71/89/83), /loja 65 → **66** (66/61/90), produto 69 → **69** (69/66/71).

Como aplicar SQL neste projeto: a CLI do Supabase da máquina está logada na org dona do projeto. Usar `supabase db query --linked --project-ref pehqvmaeehzfrsxkhlmt -f arquivo.sql`. O conector Supabase do Claude (conta josemardp) não enxerga este projeto.

---

## Próximo passo

1. **Esdra conferir o redesenho no celular** (home, loja, um produto, sacola, login e Minha conta) e dizer o que ajustar.
2. **Primeiro pedido real pelo site:** acompanhar o primeiro pedido de cliente (painel `/admin` e WhatsApp) para confirmar o fluxo com dados reais.
3. **Estoque zero:** Esdra decidir o que fazer com os 50 produtos ativos sem estoque.

---

## Pendências abertas

| Pendência | Impacto | Dono |
|---|---|---|
| Decidir o que fazer com os 50 produtos ativos com estoque zero (desativar ou repor) | Aparecem no catálogo sem poder ser comprados | Esdra |
| Lighthouse mobile oscila muito entre rodadas (home 71 a 89 no mesmo dia). Maior peso restante: JS do Supabase (~580 kB sem compressão) | SEO e conversão no celular | Código |
| Em Minha conta, "Novo endereço" não salva nada para quem ainda não tem registro em `customers` (só é criado na primeira compra); a tela não avisa | Cliente nova acha que salvou e não salvou | Código |

---

## Decisões que mudam o trabalho

- **EC-001 (09/09/2026):** Cinco projetos independentes sob `C:\projetos\esdra` com repositórios e publicações próprios. Não criar monorepositório.
- **EC-002 (09/09/2026):** Uma fonte documental por assunto. `central-ec` é a entrada do negócio; `STATUS.md` na raiz de cada projeto orienta a retomada imediata.
- **EC-003 (09/09/2026 / 15/09/2026):** ERP da loja congelado desde julho/2026. As migrações de gestão/estoque (`stock_movements`, `cash_movements`) **não serão aplicadas em produção**. O módulo `/admin/gestao` permanece estritamente como legado e não recebe expansão nem correções de schema.
- **Repositório Público (13/09/2026):** O repositório `josemardp/esdracosmeticos` é público para exibição como portfólio. Proibido commitar segredos (`service_role`, senhas), dados pessoais de clientes ou relatórios internos na raiz.
- **Cupom Promocional (15/09/2026):** Não ativar cupom `ESDRA10` no banco (em 24/09 foi encontrado ativo e desativado a pedido do Josemar; `validate_coupon` público responde "Cupom inválido") e manter a vitrine focada em frete grátis regional acima de R$ 199.
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

# Testar o checkout no banco de produção (transação desfeita; CLI Supabase logada)
npm run test:db

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
