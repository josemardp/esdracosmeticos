# STATUS.md — Loja Esdra Cosméticos

> Estado atual e próximo passo. Histórico vai para docs/HISTORICO.md. Última atualização: 15/09/2026

---

## Onde estamos

A loja virtual da Esdra Cosméticos está em produção no domínio [www.esdracosmeticos.com.br](https://www.esdracosmeticos.com.br/), com catálogo ativo de 128 produtos, PWA com service worker e sitemap dinâmico operacional. Foi realizada auditoria completa de ponta a ponta cobrindo repositório, site público, painel administrativo e segurança do Supabase.

A vitrine, navegação por categorias, filtros, cálculo de frete regional (ViaCEP) e telas institucionais funcionam perfeitamente em desktop e mobile. No entanto, foram detectadas duas pendências críticas de funcionamento/segurança: o cupom promocional `ESDRA10` anunciado na barra superior falha por ausência de registros na tabela `coupons`, e a API pública do Supabase expõe o campo de custo (`cost`) de produtos para requisições anônimas. Além disso, os relatórios antigos na raiz necessitam de organização para `docs/historico/`.

---

## Próximo passo

1. Apresentar os achados da auditoria e obter a confirmação do Josemar para a limpeza/movimentação dos arquivos da raiz para `docs/historico/`.
2. Obter aprovação para a inserção do cupom `ESDRA10` no banco e/ou ajuste de visibilidade da coluna `cost` de produtos via política/view no Supabase.
3. Resolver os erros de lint em `CheckoutPage.tsx` e `tailwind.config.ts`.
4. Atualizar o `README.md` apontando para este documento e para a auditoria.

---

## Pendências abertas

| Pendência | Impacto | Dono |
|---|---|---|
| Inserir cupom `ESDRA10` com 10% de desconto na tabela `coupons` do Supabase ou ocultar menção no banner | Cliente recebe "Cupom inválido" ao tentar usar o cupom prometido na vitrine | Josemar / Código |
| Restringir visibilidade da coluna `cost`/`avg_cost` de `products` para o papel `anon` no Supabase | Custo real de compra dos produtos visível para qualquer visitante via PostgREST | Josemar |
| Aprovação para mover arquivos legados da raiz (`report.md`, `auditoria_esdra.md`, `F4-01-FIX-REPORT.md`, `de_sirius_*`) para `docs/historico/` | Higiene do repositório | Josemar |
| Decisão sobre aplicação das migrações de gestão/estoque (Fase 4 / F4-01: `stock_movements`) em produção | ERP de gestão congelado (EC-003); movimentações de estoque em `/admin/gestao/movimentos-estoque` aguardam tabelas | Josemar |
| Substituição das 2 fotos com falha externa (`body-splash-cuide-se-bem-pessegura-200ml` e `body-splash-instance-baunilha-intensa-200ml`) e otimização da imagem de 617 KB | Imagens não carregam na vitrine | Esdra / Josemar |
| Correção dos 116 problemas de lint (`npm run lint`), eliminando `no-empty` e tipagens genéricas | Qualidade de código e confiabilidade do build | Código |

---

## Decisões que mudam o trabalho

- **EC-001 (09/09/2026):** Cinco projetos independentes sob `C:\projetos\esdra` com repositórios e publicações próprios. Não criar monorepositório.
- **EC-002 (09/09/2026):** Uma fonte documental por assunto. `central-ec` é a entrada do negócio; `STATUS.md` na raiz de cada projeto orienta a retomada imediata.
- **EC-003 (09/09/2026):** ERP da loja congelado desde julho/2026. O módulo `/admin/gestao` não recebe expansão de novas funcionalidades. Correções em checkout, catálogo de produtos, pedidos, cupons e estoque do canal loja virtual são permitidas e priorizadas.
- **Repositório Público (13/09/2026):** O repositório `josemardp/esdracosmeticos` é público para exibição como portfólio. É proibido commitar segredos (`service_role`, senhas), dados pessoais de clientes (nome, telefone, CPF, endereços) ou documentos administrativos internos da empresa.

---

## Como rodar e verificar

### Comandos locais
```bash
# Instalar dependências
npm install

# Executar linter
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

### Verificação em produção
1. **Vitrine e Produtos:** Acessar [https://www.esdracosmeticos.com.br](https://www.esdracosmeticos.com.br), navegar para `/loja`, testar filtros por categoria e carregar a página de um produto individual.
2. **Carrinho e Checkout:** Adicionar produto ao carrinho, testar aplicação do cupom em `/carrinho`, prosseguir para `/checkout`, preencher CEP (ex: `16700-000`) e conferir o cálculo automático do frete.
3. **PWA e Sitemap:** Conferir `https://www.esdracosmeticos.com.br/sitemap.xml` (deve retornar XML com produtos ativos) e `manifest.webmanifest`.
