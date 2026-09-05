# Registro de marca "Esdra Cosméticos" no INPI

> Cópia do dossiê de pesquisa mantido no repositório `skills-pessoais`, pela
> skill `nav-missao` (missão em site sem skill própria). Fonte viva:
> `C:\projetos\skills-pessoais\nav-missao\sites\gov-br-inpi.md`. Se for
> preciso pesquisar de novo no INPI (nova busca de anterioridade, nova
> classe, atualização de preço), é lá que a missão deve rodar — este arquivo
> é a cópia de referência dentro do negócio, não a fonte que se atualiza
> sozinha.

---

# INPI — Instituto Nacional da Propriedade Industrial (gov.br)

**Domínio:** gov.br/inpi
**Identidade:** `playwright` (público) para consulta. Peticionar exige login
gov.br (nível prata/ouro), então provavelmente `nav-josemardp` ou conta
própria da titular do CNPJ
**Primeira missão:** 05/09/2026 (legislação, classificação e tabela de preços
para registro de marca)
**Última confirmação:** 05/09/2026
**Missões até agora:** 3

## Para que serve

Registro de marca, patente, desenho industrial e demais direitos de
propriedade industrial no Brasil. Base legal: **Lei nº 9.279/1996** (Lei da
Propriedade Industrial).

## Entrada

- **URL do serviço de marcas:** `https://www.gov.br/inpi/pt-br/servicos/marcas`
- **Login:** só para peticionar (e-Marcas) ou acompanhar processo próprio.
  Consulta de tabela de preços, classificação e busca de processos é pública
- **Pré-voo:** título "Marcas — Instituto Nacional da Propriedade Industrial"

## Caminho até o que importa

A página de marcas é um índice com links diretos, sem precisar navegar menu:

| O que | URL |
|---|---|
| Guia básico do pedido | `/servicos/marcas/guia-basico` |
| Busca de processos (ver se a marca já existe) | `/servicos/marcas/busca` |
| **Preços e pagamento** (link para a tabela em PDF) | `/servicos/marcas/custos` |
| Peticionamento (sistema para pedir de verdade) | `/servicos/marcas/e-marcas` |
| Classificação (classes de produtos/serviços — Classificação de Nice) | `/servicos/marcas/classificacao-marcas` |
| Legislação | `/servicos/marcas/legislacao` |

A tabela de preços real é um **PDF**, linkado a partir de `/servicos/marcas/custos`
(nome do arquivo muda a cada atualização — pegar o link do dia, não fixar URL).
`WebFetch` ou download direto leem o PDF sem problema (é texto, não imagem).

Para busca de anterioridade:

1. Entrar em `https://www.gov.br/inpi/pt-br/servicos/marcas/busca`.
2. Clicar em **Continuar** para usar a pesquisa anonimamente, sem preencher
   login/senha.
3. Na tela com mapa de imagem, a área **Marcas** leva para
   `/pePI/jsp/marcas/Pesquisa_num_processo.jsp`.
4. No menu interno de Marcas, abrir **Marca**:
   `/pePI/jsp/marcas/Pesquisa_classe_basica.jsp`.
5. Pesquisar por marca em modo **Exata** e **Radical**. Para nome composto,
   pesquisar também os elementos separados, porque o próprio INPI avisa que a
   busca é apenas indicativa.

## Valores confirmados em 05/09/2026

Fonte: Tabela de Retribuições dos Serviços do INPI, base Portaria GM/MDIC
nº 110/2025, Portaria INPI/PR nº 10/2025 e apostila de 31/10/2025 (documento
"Atualizado em 19/12/2025").

| Código | Serviço | Valor cheio | **Com desconto de 50%** |
|---|---|---|---|
| 389 | Pedido de registro (especificação **pré-aprovada** da lista do INPI), por classe | R$ 880,00 | **R$ 440,00** |
| 394 | Pedido de registro (especificação de **livre preenchimento**), por classe | R$ 1.720,00 | R$ 860,00 |
| 372 | 1º decênio de vigência do registro (10 anos), prazo ordinário | R$ 0,00 | R$ 0,00 |
| 374 | Prorrogação do registro (a cada 10 anos), prazo ordinário | R$ 1.000,00 | R$ 500,00 |
| 338/382 | Cumprimento de exigência | R$ 180,00 | R$ 90,00 |
| 332 | Oposição de terceiro contra o pedido (por classe) | R$ 520,00 | R$ 260,00 |

**Quem tem direito ao desconto de 50%:** pessoa física sem participação em
empresa do ramo, **microempreendedor individual (MEI)**, microempresa e
empresa de pequeno porte (Lei Complementar 123/2006), entidade sem fins
lucrativos, órgão público. **A Esdra Cosméticos se qualifica por ser MEI.**

## Classificação para Esdra Cosméticos

Confirmado em 05/09/2026 na página oficial de classificação do INPI:

- Classes **1 a 34** são produtos; classes **35 a 45** são serviços.
- A Classe 3 cobre produtos cosméticos e de higiene pessoal não medicinais.
- A Classe 35 cobre serviços de gestão/organização/administração de negócios,
  publicidade e o agrupamento de produtos para que consumidores possam vê-los
  e comprá-los por loja física, catálogo, site ou outro meio.
- Na Lista Auxiliar de Serviços de janeiro/2026 há item pré-aprovado literal:
  **"Comércio [através de qualquer meio] de cosméticos"**, classe 35.
- Para produto próprio na classe 3, a Lista Nice NCL(13) 2026 traz o item
  amplo **"Cosméticos"**, classe 3, nº de base **030065**. Na Lista Auxiliar
  de Produtos de janeiro/2026 não apareceu item genérico "Cosméticos"; ela
  traz itens específicos/mais estreitos, como "Condicionador [cosmético]",
  "Cosmético à base de algas", "Cosméticos à base de copaíba",
  "Cosméticos à base de óleo de coco", "Cremes cosméticos à base de buriti"
  e "Cremes cosméticos à base de copaíba".

Para o CNAE 4772-5/00 da Esdra, que é comércio varejista/revenda, a classe
aderente é **35**, com especificação pré-aprovada. Como Josemar confirmou
em 05/09/2026 que também haverá produto próprio sob a marca, registrar também
a **classe 3** para produtos cosméticos.

## Busca de anterioridade — Esdra Cosméticos

Consulta feita em 05/09/2026, por pesquisa anônima na Base Marcas do INPI.
Resultado é indicativo; o exame oficial do INPI pode encontrar outros
fundamentos.

| Pesquisa | Resultado |
|---|---|
| `ESDRA COSMETICOS`, exata | Nenhum resultado |
| `ESDRA COSMETICOS`, radical | Nenhum resultado |
| `DARES COSMETICOS`, exata | Nenhum resultado |
| `DARES`, exata | 2 resultados, ambos fora do ramo: um extinto e um indeferido, classe 25 |
| `ESDRA`, exata | 7 resultados. Na classe 35, apenas o processo 829622764, **arquivado** |
| `ESDRA`, radical, classe 35 | Achado crítico: processo 936778962, **ESDRAS MERCADO**, registro em vigor |
| `ESDRA COSMETICOS`, exata, classe 3 | Nenhum resultado |
| `ESDRA COSMETICOS`, radical, classe 3 | Nenhum resultado |
| `ESDRA`, exata, classe 3 | Nenhum resultado |
| `ESDRA`, radical, classe 3 | 1 resultado: processo 900666501, **EMOÇÕES D'RACCO**, registro em vigor, classe 3 |

Detalhe do achado crítico:

- Processo **936778962** — marca **ESDRAS MERCADO**, apresentação mista,
  classe **NCL(12) 35**, titular Vitor Hugo da Silva dos Santos.
- Situação: **Registro de marca em vigor**.
- Depósito: 25/10/2024; concessão: 07/07/2026; vigência: 07/07/2036.
- A especificação inclui **Comércio [através de qualquer meio] de cosméticos**
  e **Comércio [através de qualquer meio] de produtos de perfumaria**, além de
  supermercado e muitos itens de varejo.

Leitura prática: não apareceu marca idêntica "Esdra Cosméticos", mas existe
marca parecida viva na mesma classe e com cosméticos/perfumaria na
especificação. Isso não é indeferimento automático, mas é risco real a avaliar
antes de peticionar.

Leitura específica da classe 3: a busca exata por "ESDRA" e por "ESDRA
COSMETICOS" não trouxe resultado. A busca radical por "ESDRA" trouxe apenas
"EMOÇÕES D'RACCO" (processo 900666501), marca mista em vigor na classe 3,
com especificação de cosméticos/perfumes. O sinal não reproduz "Esdra"; foi
tratado como resultado lateral da busca radical, não como conflito direto.
**[VERIFICAR]** por que a busca radical trouxe esse resultado — o nome não
contém "esdra" como substring, então pode ser que a busca "radical" do INPI
use critério fonético ou outro campo, não só substring. Não muda a conclusão
(sem conflito direto), mas vale confirmar antes de citar o número como fato
assentado.

## Campos e formatos

O pedido de registro pede: identificação do requerente (CPF/CNPJ), a marca
(nome/logo), a(s) **classe(s)** de Nice, e a especificação de produtos ou
serviços dentro daquela classe (usar a lista pré-aprovada, código 389, é
mais barato e mais rápido que texto livre, código 394).

## Armadilhas deste site

- **A tabela de preços não está na página, é um PDF linkado**, com nome de
  arquivo que muda a cada atualização (ex.: `NovaTabeladeRetribuiesINPI_MARCAS_Final_20_dez_25.pdf`).
  Sempre pegar o link do dia na página `/servicos/marcas/custos`, nunca supor
  que a URL antiga ainda funciona.
- **O PDF é texto real, não imagem** (differente de muito documento de
  governo) — dá para ler direto, sem OCR.
- **Site gov.br é plataforma única** para dezenas de órgãos: o login "Entrar
  com gov.br" no cabeçalho é do governo federal inteiro, não só do INPI.

## Atos finais aqui

| Ação | Onde | Reversível? |
|---|---|---|
| Peticionar pedido de registro (e-Marcas) | `/servicos/marcas/e-marcas`, exige login gov.br | **Não.** Gera cobrança (GRU) e abre processo público |
| Pagar a GRU (Guia de Recolhimento da União) | `https://meu.inpi.gov.br/pag/` | Não. É pagamento |

## Paredes

Peticionar exige conta gov.br (login federal, fora do controle deste
ecossistema de perfis `nav-*`). Provavelmente vai precisar do login da
titular do CNPJ (CPF dela cadastrado no gov.br), não do Josemar.

## Decisão do Josemar (05/09/2026)

Nome a registrar: **"Esdra Cosméticos"** (não "Dares Cosméticos", que é o nome
fantasia oficial da Receita — os dois registros são independentes e ele optou
conscientemente pelo nome comercial). Domínio confirmado como já dele:
`esdracosmeticos.com.br`, então a missão de domínio vira só "confirmar
titularidade e vencimento", não registrar.

## Decisão do Josemar sobre escopo (05/09/2026)

Perguntado se a Esdra só revende ou também tem produto próprio: **as duas
coisas**. Vai ter revenda de terceiros e produto próprio sob a marca Esdra
Cosméticos. Isso muda a proteção necessária de 1 classe para 2:

- **Classe 35** — comércio/revenda (CNAE principal 4772-5/00). Item
  pré-aprovado confirmado: "Comércio [através de qualquer meio] de
  cosméticos".
- **Classe 3** — produto cosmético próprio fabricado/vendido sob a marca.
  A classe cobre produtos cosméticos e de higiene pessoal não medicinais.
  Item amplo encontrado na Lista Nice NCL(13) 2026: **"Cosméticos"**,
  classe 3, nº de base **030065**. A Lista Auxiliar de Produtos traz itens
  específicos próximos, mas não o item genérico; para o pedido, a indicação
  mais simples é usar "Cosméticos" se ele estiver disponível no seletor de
  itens pré-aprovados do e-Marcas.

## Custo revisado (2 classes)

Como há item pré-aprovado para classe 35 e item amplo na Lista Nice para
classe 3, a estimativa principal passa a ser **código 389 nas duas classes**:

- Classe 35, item "Comércio [através de qualquer meio] de cosméticos":
  **R$ 440,00** com desconto de MEI.
- Classe 3, item "Cosméticos" (base 030065): **R$ 440,00** com desconto de
  MEI, se disponível no seletor de especificação pré-aprovada do e-Marcas.

Total estimado para peticionar as duas classes: **R$ 880,00**.

Plano B, se no e-Marcas o item da classe 3 não estiver disponível como
pré-aprovado e for preciso texto livre: R$ 440,00 (classe 35, código 389) +
R$ 860,00 (classe 3, código 394) = **R$ 1.300,00**. Pelo material oficial
consultado, o caminho mais provável é **R$ 880,00**.

## Busca de anterioridade classe 3

Consulta feita em 05/09/2026 na Base Marcas do INPI, pesquisa anônima, filtro
classe **3**:

| Pesquisa | Resultado |
|---|---|
| `ESDRA COSMETICOS`, exata | Nenhum resultado |
| `ESDRA COSMETICOS`, radical | Nenhum resultado |
| `ESDRA`, exata | Nenhum resultado |
| `ESDRA`, radical | 1 resultado: processo 900666501, **EMOÇÕES D'RACCO**, registro em vigor |

Conclusão operacional: não apareceu conflito direto para "Esdra Cosméticos"
na classe 3. O risco crítico segue sendo o achado da classe 35, **ESDRAS
MERCADO**, porque também protege comércio de cosméticos/perfumaria.

## O que falta decidir antes de peticionar

- Aceitar o risco do conflito com "ESDRAS MERCADO" (classe 35) ou buscar
  orientação especializada (advogado/agente de propriedade industrial) antes
  de pagar a GRU e abrir o processo.
- Confirmar no próprio e-Marcas (só na hora de peticionar) se o item
  "Cosméticos" (classe 3) está mesmo disponível como especificação
  pré-aprovada, para saber se o custo real é R$ 880 ou R$ 1.300.
- Peticionar exige login gov.br da titular do CNPJ — combinar com a Esdra
  Aline antes.

## Histórico

| Data | Missão | Resultado |
|---|---|---|
| 05/09/2026 | Levantar legislação, fluxo e tabela de preços para registro de marca | Concluído. Valores confirmados via PDF oficial. Peticionamento em si não foi tentado (exige login e é ato final) |
| 05/09/2026 | Busca de anterioridade e classe para "Esdra Cosméticos" | Sem marca idêntica encontrada. Achado crítico: "ESDRAS MERCADO" em vigor na classe 35 com comércio de cosméticos/perfumaria na especificação. Classe recomendada segue 35 para revenda |
| 05/09/2026 | Completar escopo 35+3 para revenda e produto próprio | Classe 3 confirmada para produto próprio. Item amplo da Lista Nice: "Cosméticos" (030065); Lista Auxiliar de Produtos tem apenas itens cosméticos específicos. Busca classe 3 sem conflito direto; custo principal revisado para R$ 880,00 nas duas classes com código 389 |
