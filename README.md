# Esdra Cosméticos — Loja virtual

E-commerce completo da Esdra Cosméticos (MEI): catálogo, carrinho, checkout, contas de cliente, crediário e painel administrativo. PWA instalável.

## O que tem

### Loja (cliente)
- Catálogo de produtos com busca
- Página de produto, carrinho e checkout
- Conta do cliente: perfil, endereços, pedidos, detalhe de pedido, favoritos
- Autenticação de cliente
- Páginas institucionais e de suporte

### Administração
- Dashboard
- Produtos, categorias e estoque
- Pedidos e clientes
- Cupons e campanhas
- **Crediário** (com calculadora própria)
- Importação por **CSV** e por **NF-e**
- Configurações, conteúdo e integrações
- Suporte

## Stack

React + TypeScript + Vite, Tailwind + shadcn/ui, Supabase (dados e autenticação), PWA com service worker próprio (`src/sw.ts`, `src/pwa-register.ts`), Vitest para testes.

## Rodar

```bash
npm install
cp .env.example .env   # preencher as variáveis do Supabase
npm run dev
```

## Comandos

```bash
npm run dev      # desenvolvimento
npm run build    # build de produção
npm run lint     # lint
npm test         # testes (Vitest)
```

## Estrutura

```
src/
├── pages/
│   ├── loja/          # catálogo, produto, carrinho, checkout
│   ├── admin/         # painel administrativo completo
│   ├── conta/         # área do cliente
│   ├── auth/          # login e cadastro
│   ├── institucional/ # páginas institucionais
│   └── suporte/
├── components/
│   ├── crediario/     # calculadora de crediário
│   ├── auth/, layout/, pwa/, search/
│   └── ui/            # componentes shadcn/ui
├── integrations/supabase/
├── contexts/, hooks/, lib/, utils/
└── sw.ts, pwa-register.ts
```

## Relação com os outros projetos da Esdra

Este repositório é a **loja virtual**. Não confundir com:

- **`catalago-esdracosmeticos`** — catálogo estático em HTML, usado para divulgação de fotos de produto (fluxo da skill `foto-catalogo`).
- **`agendaEC`** — gestão operacional do dia a dia da loja (vendas, entregas, agendamentos, fechamento de caixa).
- **`financeiroje`** — finanças pessoais e do MEI, escopo `business`.

## Variáveis de ambiente

Ver `.env.example`. As chaves `VITE_*` do Supabase são publicáveis (anon) por desenho do Vite — a proteção real dos dados é feita por RLS no banco, não por esconder a chave.
