# Loja virtual Esdra Cosméticos

Site www.esdracosmeticos.com.br (Vite + React + Supabase `pehqvmaeehzfrsxkhlmt`), deploy automático na Vercel a cada push na main. **Repositório público** (conta josemardp).

- Leia `STATUS.md` primeiro. Decisões entre sistemas: `../DECISOES.md` (EC-006, na central-ec, privada).
- Papel: produto, preço, custo, margem, estoque do site (`inventory_count`), pedidos online, cupons. Gestão de balcão, caixa, fiado e estoque físico é do AgendaEC: o ERP `/admin/gestao` foi removido em 25/09/2026, não recriar.
- Nunca versionar valor financeiro do negócio, estratégia de crédito, dossiê ou dado pessoal.
- Tabela `products`: leitura liberada coluna a coluna (custo escondido); mudou RPC ou grant, rode `npm run test:db`.
- Antes de push: `npx tsc --noEmit -p tsconfig.app.json`, `npm test`, `npm run lint`, `npm run build`. Mudança visual: conferir celular e desktop.
- Gerenciador de pacotes: npm.

<!-- GESTAO-PJP:START v1 -->
## Gestão PJP

Este projeto é o `PJP-013` do portfólio e é governado pela Gestão PJP, em `C:\projetos\Gestão PJP`. O Mentor de Projetos foi aposentado em 16/11/2026: não use o comando `mentor` e não escreva em `.project-mentor/`, que ficou só como histórico.

- **Ao começar:** leia `STATUS.md` deste projeto. É ali que está onde paramos.
- **Ao terminar:** atualize `STATUS.md` com o que foi feito e com o que ficou pendente, depois commit e push.
- **Pendência:** uma linha `- [ ] texto` na seção "Pendências". Com prazo: `- [ ] texto (prazo AAAA-MM-DD)`. Feita: `- [x] texto`.
- **Bloqueio:** `- [ ] BLOQUEIO: o que trava e do que depende`.
- **Assunto de outro projeto, risco ou prioridade do portfólio:** acrescente uma linha em `C:\projetos\Gestão PJP\16-BACKLOG-MESTRE\ENTRADA.md`. Não crie controle paralelo.
<!-- GESTAO-PJP:END -->
