# STATUS.md — Loja Esdra Cosméticos

> Estado atual e próximo passo. Histórico vai para docs/HISTORICO.md. Última atualização: 23/09/2026

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

Como aplicar SQL neste projeto: a CLI do Supabase da máquina está logada na org dona do projeto. Usar `supabase db query --linked --project-ref pehqvmaeehzfrsxkhlmt -f arquivo.sql`. O conector Supabase do Claude (conta josemardp) não enxerga este projeto.

---

## Próximo passo

1. **Capas em sites de terceiros:** 17 capas ainda dependem de lojas externas (jequiti.vtexassets.com 6, res.cloudinary.com 3, mitiendanube 4, images.tcdn.com.br 2, cdn.awsli.com.br 2). Podem sumir como a da Baunilha. Copiar para o bucket `product-images` seguindo o mesmo processo das migrações de 23/09.
2. **Estoque zero:** Esdra decidir o que fazer com os 50 produtos ativos sem estoque.

---

## Pendências abertas

| Pendência | Impacto | Dono |
|---|---|---|
| Copiar as 17 capas de sites de terceiros para o bucket da loja | Foto some quando o site de terceiro bloqueia | Josemar |
| Decidir o que fazer com os 50 produtos ativos com estoque zero (desativar ou repor) | Aparecem no catálogo sem poder ser comprados | Esdra |
| Custo (`cost`/`avg_cost`) continua legível para cliente logado (papel `authenticated`) | Brecha menor; solução futura é view pública ou RPC de admin | Código (futuro) |
| Testes automatizados de checkout, frete e cupom | Hoje só existe 1 teste de exemplo; regressão passa despercebida | Código (futuro) |

---

## Decisões que mudam o trabalho

- **EC-001 (09/09/2026):** Cinco projetos independentes sob `C:\projetos\esdra` com repositórios e publicações próprios. Não criar monorepositório.
- **EC-002 (09/09/2026):** Uma fonte documental por assunto. `central-ec` é a entrada do negócio; `STATUS.md` na raiz de cada projeto orienta a retomada imediata.
- **EC-003 (09/09/2026 / 15/09/2026):** ERP da loja congelado desde julho/2026. As migrações de gestão/estoque (`stock_movements`, `cash_movements`) **não serão aplicadas em produção**. O módulo `/admin/gestao` permanece estritamente como legado e não recebe expansão nem correções de schema.
- **Repositório Público (13/09/2026):** O repositório `josemardp/esdracosmeticos` é público para exibição como portfólio. Proibido commitar segredos (`service_role`, senhas), dados pessoais de clientes ou relatórios internos na raiz.
- **Cupom Promocional (15/09/2026):** Não ativar cupom `ESDRA10` no banco e manter a vitrine focada em frete grátis regional acima de R$ 199.
- **Grants do `anon` em `products` (23/09/2026):** o `anon` tem SELECT só nas colunas listadas na migração `20260915120000`. Coluna nova que a vitrine precise ler exige `GRANT SELECT (coluna) ON public.products TO anon`. Consultas públicas com `select=*` em `products` falham.
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
