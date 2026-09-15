# STATUS.md — Loja Esdra Cosméticos

> Estado atual e próximo passo. Histórico vai para docs/HISTORICO.md. Última atualização: 15/09/2026

---

## Onde estamos

A loja virtual da Esdra Cosméticos está em produção no domínio [www.esdracosmeticos.com.br](https://www.esdracosmeticos.com.br/), com catálogo ativo de 128 produtos, PWA com service worker e sitemap dinâmico operacional.

Em 15/09/2026, foram executadas as decisões da auditoria geral:
1. **Higiene do repositório:** 20 relatórios antigos e 3 scripts SQL sem timestamp foram movidos da raiz para `docs/historico/` e `docs/historico/sql/` (commit `74215a6`).
2. **Segurança do catálogo:** Criada a migração versionada `supabase/migrations/20260915120000_restrict_product_cost_anon.sql` revogando a leitura das colunas `cost` e `avg_cost` da tabela `products` para o papel `anon` (commit `9c4bd86`).
3. **Banner e cupons:** Verificado e comprovado via teste automatizado que o banner superior não menciona cupom promocional (anuncia frete grátis e parcelamento); o cupom `ESDRA10` permanece inativo no banco conforme decisão do negócio.
4. **Performance do bundle:** Todas as rotas administrativas (`/admin/*`, `/admin/gestao/*`, `/conta/*`) e tela de login foram convertidas para carregamento sob demanda (`React.lazy`). O bundle inicial JS (`dist/assets/index-*.js`) caiu de **1.601 kB (436 kB gzip)** para **862 kB (253 kB gzip)** — uma redução de **46%** no tráfego de entrada. A pontuação Lighthouse mobile na página de produto subiu de 18 para **30** (+66% de ganho).

---

## Próximo passo

1. **Supabase (Josemar):** Aplicar o script da migração `20260915120000_restrict_product_cost_anon.sql` no SQL Editor do painel do Supabase para efetivar o bloqueio do custo em produção.
2. **Imagens 404 no Supabase Storage:** Corrigir no bucket/banco os 2 produtos com URL de imagem externa quebrada (`body-splash-cuide-se-bem-pessegura-200ml` e `body-splash-instance-baunilha-intensa-200ml`).
3. **Substituição da imagem pesada:** Subir a versão otimizada da imagem da máscara Niina Secrets (reduzida de 617 KB para 161 KB, localizada em `docs/assets/mascara-cilios-super-brown-niina-secrets-10g-otimizada.jpg`) no bucket do Supabase.

---

## Pendências abertas

| Pendência | Impacto | Dono |
|---|---|---|
| Aplicar `REVOKE SELECT (cost, avg_cost)` no SQL Editor do Supabase | Fecha exposição do custo de aquisição na API pública | Josemar |
| Corrigir fotos com 404 externo (`body-splash-cuide-se-bem-pessegura-200ml` e `body-splash-instance-baunilha-intensa-200ml`) | Produto aparece sem imagem no catálogo | Esdra / Josemar |
| Trocar imagem de 617 KB da máscara Niina Secrets pela versão de 161 KB | Melhora LCP da página de produto | Josemar |

---

## Decisões que mudam o trabalho

- **EC-001 (09/09/2026):** Cinco projetos independentes sob `C:\projetos\esdra` com repositórios e publicações próprios. Não criar monorepositório.
- **EC-002 (09/09/2026):** Uma fonte documental por assunto. `central-ec` é a entrada do negócio; `STATUS.md` na raiz de cada projeto orienta a retomada imediata.
- **EC-003 (09/09/2026 / 15/09/2026):** ERP da loja congelado desde julho/2026. As migrações de gestão/estoque (`stock_movements`, `cash_movements`) **não serão aplicadas em produção**. O módulo `/admin/gestao` permanece estritamente como legado e não recebe expansão nem correções de schema.
- **Repositório Público (13/09/2026):** O repositório `josemardp/esdracosmeticos` é público para exibição como portfólio. Proibido commitar segredos (`service_role`, senhas), dados pessoais de clientes ou relatórios internos na raiz.
- **Cupom Promocional (15/09/2026):** Não ativar cupom `ESDRA10` no banco e manter a vitrine focada em frete grátis regional acima de R$ 199.
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

# Resposta esperada pós-aplicação: HTTP 400 ou 403 com erro Postgres:
# "permission denied for column cost of table products"
```

### Verificação em produção
1. **Vitrine e Produtos:** Acessar [https://www.esdracosmeticos.com.br](https://www.esdracosmeticos.com.br), navegar para `/loja`, testar filtros por categoria e carregar a página de um produto individual.
2. **Carrinho e Checkout:** Adicionar produto ao carrinho, prosseguir para `/checkout`, preencher CEP (ex: `16700-000`) e conferir o cálculo automático do frete.
3. **PWA e Sitemap:** Conferir `https://www.esdracosmeticos.com.br/sitemap.xml` (deve retornar XML com produtos ativos) e `manifest.webmanifest`.
