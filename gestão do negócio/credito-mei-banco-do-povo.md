# Crédito MEI — Banco do Povo Paulista (Valparaíso)

> Cópia do dossiê de pesquisa mantido no repositório `skills-pessoais`, pela
> skill `nav-missao`. Fonte viva:
> `C:\projetos\skills-pessoais\nav-missao\sites\desenvolvimentoeconomico-sp-gov-br.md`.
> Se for preciso pesquisar de novo (novos limites, nova linha, confirmar
> disponibilidade de verba em 2026), é lá que a missão deve rodar — este
> arquivo é a cópia de referência dentro do negócio, não a fonte que se
> atualiza sozinha.

---

# Banco do Povo Paulista (página institucional na Secretaria de Desenvolvimento Econômico)

**Domínio:** desenvolvimentoeconomico.sp.gov.br
**Identidade:** `playwright` (público, sem login)
**Primeira missão:** 05/09/2026 (créditos disponíveis para MEI em Valparaíso)
**Última confirmação:** 05/09/2026
**Missões até agora:** 1

## Para que serve

Programa estadual de microcrédito produtivo orientado, do Governo de SP em
parceria com os municípios, para empreendedores formais (MEI, EI, ME, EPP,
produtor rural com CNPJ) e informais, com taxas reduzidas frente ao mercado.

## Entrada

- **URL:** `https://www.desenvolvimentoeconomico.sp.gov.br/DesenvolvimentoEconomico/institucional/Programas/banco_do_povo`
- **Login:** não tem, para a consulta institucional (valores, linhas, unidades)
- **Pré-voo:** título da aba "Banco do Povo"

## Caminho até o que importa

1. O domínio "óbvio" `www.bancodopovo.sp.gov.br` **não resolveu**
   (`ERR_NAME_NOT_RESOLVED`) na consulta de 05/09/2026. Ir direto pela URL da
   Secretaria de Desenvolvimento Econômico acima.
2. A página de pedir crédito de verdade é **outro domínio**:
   `bancodopovodigital.sp.gov.br` (sistema "ServCore - Business"), botão
   "Solicite seu crédito aqui". Não explorado nesta missão — é provável que
   exija cadastro/login, o que já seria ato final fora do escopo de uma
   consulta.
3. Nesta página institucional (Secretaria de Desenvolvimento Econômico) estão:
   as três linhas de crédito, a tabela de limites/taxas, os documentos
   exigidos e a lista de unidades por município.
4. **As tabelas de "Limites e taxas" e de "Prazo/Carência" são imagem**, não
   texto — não aparecem no `browser_snapshot`. É preciso
   `browser_take_screenshot` do elemento (`region` da respectiva seção) para
   ler os valores.
5. **Aceitar o banner de cookies antes de printar** essas tabelas — ele cobre
   a linha do meio da tabela de taxas.
6. A tabela de unidades por município ("CONFIRA TODAS AS NOSSAS UNIDADES!")
   tem ~830 linhas e é **texto puro**, mas o `browser_snapshot` da página
   inteira estoura o limite de tokens e vai para arquivo — usar `grep` no
   arquivo salvo (nome do município em maiúsculas) em vez de tentar ler tudo.

## Linhas de crédito confirmadas em 05/09/2026

Exigem certificado de curso de qualificação empreendedora gratuito
(Qualifica SP `www.qualificasp.sp.gov.br` ou Sebrae SP
`digital.sebraesp.com.br/programa/qualificacaoempreendedora`) antes de
solicitar.

**Empreenda Rápido**

| Cliente | Prazo | Carência |
|---|---|---|
| Informal (pessoa física / produtor rural sem CNPJ) | até 24 meses | até 60 dias |
| Formal (MEI, EI, ME, EPP, produtor rural com CNPJ) | até 30 meses | até 60 dias |

**Empreenda Afro e Empreenda Mulher** (mesma tabela para as duas)

| Cliente | Prazo | Carência |
|---|---|---|
| Informal | até 30 meses | até 90 dias |
| Formal (inclui MEI) | até 36 meses | até 90 dias |

**Limites de crédito e taxas** (vale para as três linhas)

| Cliente | Escalonamento | Limite de crédito | Taxa |
|---|---|---|---|
| Informal | 1º crédito | R$ 200,00 a R$ 8.000,00 | 0,8% a.m. + 1% TSF ato |
| Informal | 2º crédito em diante | R$ 200,00 a R$ 15.000,00 | 0,8% a.m. + 1% TSF ato |
| Formal (MEI, EI, ME, EPP), CNPJ com menos de 1 ano | 1º crédito | R$ 200,00 a R$ 12.000,00 | 0,35% a 0,55% a.m. + 1% TSF ato |
| Formal (MEI, EI, ME, EPP), CNPJ com mais de 1 ano | 1º crédito | R$ 200,00 a R$ 21.000,00 | 0,35% a 0,55% a.m. + 1% TSF ato + FDA |
| Formal (MEI, EI, ME, EPP) | 2º crédito em diante | R$ 200,00 a R$ 21.000,00 | 0,35% a 0,55% a.m. + 1% TSF ato + FDA |

`TSF` e `FDA` aparecem na tabela sem legenda na página. **[VERIFICAR]** o
significado exato (provável "Taxa de Serviços Financeiros" para TSF; FDA não
identificado) antes de repassar como fato fechado.

## Documentos exigidos (base geral — a unidade local pode pedir mais)

- Documento oficial com foto do(s) empreendedor(es)/sócios/avalista/cônjuge
- Certidão de casamento/união estável, se houver
- Comprovante de endereço e de renda
- Plano de negócio
- Certificado do curso de qualificação empreendedora
- Orçamento do bem a financiar
- Para formais (inclui MEI): inscrição CNPJ, Inscrição Estadual/Municipal se
  houver, CRF emitida pela Caixa Econômica Federal, CND (Certidão Negativa de
  Débitos)

A própria página avisa: "Procure a unidade do Banco do Povo no seu município
para obter a lista completa de documentação e curso."

## Unidade em Valparaíso (SP) — confirmada em 05/09/2026

| Campo | Valor |
|---|---|
| Endereço | Praça Benedito de Mello, 280A |
| CEP | 16880-000 |
| Telefone | (18) 3401-3838 |
| E-mail | valparaiso@bancodopovo.sp.gov.br |

Valparaíso **tem unidade própria**. Na tabela de ~830 municípios, a maioria
aparece como "MUNICÍPIO SEM UNIDADE DO BANCO DO POVO" — Valparaíso não é um
desses.

## Resposta à pergunta original

Sim, há crédito disponível para MEI em Valparaíso. Não é edital anual com
prazo de inscrição, é programa permanente do Governo do Estado, com unidade
física no município. Caminho prático: fazer o curso de qualificação gratuito
primeiro (Qualifica SP ou Sebrae), depois procurar a unidade de Valparaíso
com a documentação. Faixa de crédito para MEI: R$ 200 a R$ 21.000, taxa
0,35% a 0,55% a.m. mais encargos.

**[VERIFICAR]** se em 2026 há alguma limitação orçamentária ou fila de
espera na unidade de Valparaíso especificamente — a página não menciona
nada disso, e isso normalmente só se sabe ligando ou indo lá.

## Armadilhas deste site

- **`www.bancodopovo.sp.gov.br` não resolveu** (`ERR_NAME_NOT_RESOLVED`) na
  consulta de 05/09/2026. Ir direto pela página institucional da Secretaria
  de Desenvolvimento Econômico.
- **Tabelas de valores são imagem**, não texto — precisa
  `browser_take_screenshot` do elemento, `browser_snapshot` não pega.
- **Banner de cookies cobre parte da tabela de taxas** — aceitar antes de
  printar.
- **Tabela de unidades é gigante** (~830 linhas) — snapshot da página
  estoura token e vai para arquivo; usar grep no arquivo salvo.
- **O domínio de pedir crédito é outro** (`bancodopovodigital.sp.gov.br`,
  sistema "ServCore"), diferente do domínio institucional com a informação.

## Atos finais aqui

| Ação | Onde | Reversível? |
|---|---|---|
| Solicitar crédito ("Solicite seu crédito aqui") | `bancodopovodigital.sp.gov.br` | Não explorado nesta missão — provavelmente exige cadastro/login e abre processo de crédito |

## Paredes

Não identificada trava nesta missão (só consulta pública). O pedido de
crédito em si (`bancodopovodigital.sp.gov.br`) não foi explorado — pode ter
login/cadastro próprio, não verificado.

## Histórico

| Data | Missão | Resultado |
|---|---|---|
| 05/09/2026 | Investigar créditos disponíveis para MEI em Valparaíso (SP) | Confirmado: programa contínuo (sem edital com prazo visível), Valparaíso tem unidade própria, MEI se enquadra como "empreendedor formal", crédito de R$ 200 a R$ 21.000 a 0,35%-0,55% a.m. mais encargos |
