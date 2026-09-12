# Catálogo FAVNA 3D — Especificação

> **Este arquivo é a fonte da verdade.** Nada entra no código sem estar aqui, e todo
> requisito é escrito de forma que dê pra dizer, sem opinião, se está cumprido.
>
> Origem histórica: [`PROJETO_CATALOGO.md`](PROJETO_CATALOGO.md) — briefing do antigo
> Projeto Gálice, de onde este catálogo nasceu. Vale como contexto, não como regra.
>
> Última revisão: 2026-09-12

## Como ler o status

| | Significado |
|---|---|
| ✅ | Cumprido **e** coberto por teste automático (`npm test` não existe aqui — é `node --test`) |
| 🟡 | Cumprido, verificado só à mão — candidato a virar teste |
| ⬜ | Ainda não feito |
| 🔒 | Bloqueado: depende de uma ação dos donos, não de código |

`ID` é citado nos testes (`testes/regras.test.js`) e nas mensagens de commit.

---

## 1. Produto e objetivo

Uma página pública que mostra as peças da FAVNA 3D e converte em conversa no
WhatsApp. Sem carrinho, sem pagamento, sem login, sem painel.

Quem mantém o catálogo **não é desenvolvedor**: editar a planilha tem que bastar.

**Não-objetivos** (decididos, não esquecidos): carrinho multi-item, pagamento
online, login, painel administrativo, integração com Shopee, contagem de visitas.

---

## 2. Privacidade — regra inegociável

A `Favna_Planilha` tem nome de cliente, custo, margem, divisão de lucro e saldo da
impressora. **Ela nunca é publicada nem referenciada pelo site.**

| ID | Requisito | Status |
|---|---|---|
| REQ-10 | Não aparecem no site, no repositório nem no CSV: cliente, custo, margem, lucro, percentual de divisão, dado de caixa, link de modelo (Patreon/Printables) e observação interna | 🟡 |
| REQ-11 | A publicação no Sheets é **só da aba `Catalogo`** — "Documento inteiro" exporia a aba `_estoque` e, por ela, a planilha principal | 🔒 |
| REQ-12 | O repositório público contém **apenas** `catalogo/`. Nada da raiz `favna3d/` pode entrar: lá vivem uma credencial de sessão, a planilha de gestão e 19 GB de acervo pago | ✅ |
| REQ-13 | Toda foto publicada é da FAVNA ou tem uso autorizado. Imagem feita pelo **criador do modelo** não vai ao ar como se fosse nossa | ⬜ |

> REQ-12 existe porque `git init` na raiz do projeto versionaria uma credencial
> viva. Ver [Decisão 7](#decisões). Cumprido pelo `.gitignore` e auditado com
> `git diff --cached --name-only` antes do primeiro commit.
>
> **REQ-13 bloqueia a publicação.** Hoje 11 das 25 fotos vêm do acervo do criador
> **deltaprints** (Patreon) — são as fotos *dele* dos modelos, não peças nossas
> fotografadas. Ver [pendência 9](#pendências-com-os-donos).

---

## 3. Dados

O site lê uma aba publicada como CSV. Colunas e semântica no
[README](README.md#as-colunas-uma-por-uma).

| ID | Requisito | Status |
|---|---|---|
| REQ-01 | Trocar preço, foto, descrição ou esconder peça na planilha muda o site sem tocar em código | 🟡 |
| REQ-02 | Só linhas com `ativo` verdadeiro aparecem | ✅ |
| REQ-03 | Ordem de exibição: `destaque` primeiro, depois `ordem` crescente, depois `nome` em pt-BR. `ordem` vazia vai para o fim | ✅ |
| REQ-04 | Linha sem `id` ou sem `nome` é ignorada; o resto do catálogo carrega normalmente | ✅ |
| REQ-05 | Campos SIM/NÃO aceitam `SIM`, `sim`, `S`, `TRUE`, `VERDADEIRO`, `1` | ✅ |
| REQ-06 | `preco` aceita `35`, `35,00`, `35.00`, `R$ 35,00` e `R$ 1.250,00`. Vazio ou ilegível vira "Preço sob consulta" | ✅ |
| REQ-07 | Espaço em volta de qualquer valor é aparado antes do uso | ✅ |
| REQ-08 | `fotos` separa por `\|` (a primeira é a capa) e `cores` por `;` | ✅ |

> **REQ-06 é o requisito mais perigoso do projeto.** A conta Google desta casa usa
> vírgula decimal: `35.90` com ponto é lido como data pelo Sheets e corrompe a
> célula em silêncio. Já aconteceu na planilha de custeio. O teste existe pra
> garantir que as duas formas cheguem ao mesmo número.

---

## 4. Vitrine

| ID | Requisito | Status |
|---|---|---|
| REQ-20 | Grade com foto de capa, nome, preço e situação de cada peça | 🟡 |
| REQ-21 | `disponivel > 0` mostra "Pronta entrega". A quantidade exata aparece **só** se `MOSTRAR_QUANTIDADE` for `true` (padrão: `false`) | ✅ |
| REQ-22 | Caso contrário mostra "Sob encomenda" e, havendo `prazo_dias`, "fica pronta em até N dias" | ✅ |
| REQ-23 | Filtro por categoria, montado a partir dos próprios dados — categoria nova na planilha cria botão sozinha | 🟡 |
| REQ-24 | Busca por nome e descrição, ignorando acento e caixa ("cachepo" acha "Cachepô") | ✅ |
| REQ-25 | Detalhe da peça com todas as fotos, descrição, cores, ficha técnica e botão de pedido | 🟡 |
| REQ-26 | `fotos` aceita caminho relativo, URL completa e link do Google Drive — este convertido para `thumbnail?id=<ID>&sz=w1000` | ✅ |
| REQ-27 | Foto ausente ou quebrada vira placeholder neutro, sem quebrar o layout. Toda imagem tem `loading="lazy"` e `alt` com o nome da peça | 🟡 |
| REQ-28 | A **ficha de fatiamento** (`specs`) aparece em mono/Cinza Titânio sobre a foto — é o elemento marcante do design | 🟡 |
| REQ-29 | Preço formatado com `Intl.NumberFormat('pt-BR', BRL)` | ✅ |

---

## 5. Pedido pelo WhatsApp

| ID | Requisito | Status |
|---|---|---|
| REQ-30 | O botão abre `https://wa.me/<numero>?text=…` com a mensagem escapada por `encodeURIComponent` | ✅ |
| REQ-31 | A mensagem leva nome da peça, preço, cor escolhida e o link direto da peça | ✅ |
| REQ-32 | `personalizavel` verdadeiro acrescenta o pedido de personalização à mensagem | ✅ |
| REQ-33 | Número não configurado mostra um aviso **no lugar** do botão — nunca um botão que abre conversa inexistente | ✅ |
| REQ-34 | Havendo cores, o cliente escolhe antes de pedir e a escolha entra na mensagem | 🟡 |

---

## 6. Resiliência e estados

| ID | Requisito | Status |
|---|---|---|
| REQ-40 | O último CSV carregado com sucesso fica guardado em `localStorage` | 🟡 |
| REQ-41 | Google fora do ar + cache disponível: mostra a última versão salva, com aviso de que é ela | 🟡 |
| REQ-42 | Google fora do ar sem cache: recado claro dizendo o que aconteceu e o que fazer | 🟡 |
| REQ-43 | `localStorage` bloqueado (aba privada, site data desativado) não quebra a página | 🟡 |
| REQ-44 | Há estado visível para: carregando, catálogo vazio, categoria vazia e busca sem resultado | 🟡 |
| REQ-45 | O CSV publicado pelo Google leva alguns minutos para refletir edições — documentado no README | ✅ |

---

## 7. Uso, acesso e navegação

| ID | Requisito | Status |
|---|---|---|
| REQ-50 | Cada peça tem link direto `#/p/<id>`, que abre a página já no detalhe — é o link que vai no WhatsApp | 🟡 |
| REQ-51 | Usável em celular de tela pequena; a página **nunca** rola na horizontal | 🟡 |
| REQ-52 | O detalhe fecha com `Esc`, prende o `Tab` enquanto aberto e devolve o foco de onde veio | 🟡 |
| REQ-53 | HTML semântico, foco visível no teclado, contraste adequado e link "pular para as peças" | 🟡 |
| REQ-54 | `prefers-reduced-motion` respeitado | 🟡 |
| REQ-55 | Meta tags Open Graph para a prévia do link ficar apresentável no WhatsApp | 🟡 |
| REQ-56 | Página utilizável em 4G fraco; nenhuma biblioteca pesada | 🟡 |

---

## 8. Publicação

| ID | Requisito | Status |
|---|---|---|
| REQ-60 | `catalogo/` é repositório git próprio, com `.gitignore`, publicado no GitHub Pages | ⬜ |
| REQ-61 | `og:image` é uma imagem dedicada de 1200×630, não o recorte de uma foto de produto | ⬜ |
| REQ-62 | O README permite adicionar uma peça nova sem ajuda de desenvolvedor | 🟡 |
| REQ-63 | Confirmado que o `fetch` do CSV publicado funciona a partir do GitHub Pages (CORS). Não funcionando, usar `gviz/tq?tqx=out:csv&sheet=Catalogo` e registrar a escolha aqui | 🔒 |

---

## 9. Manutenção

| ID | Requisito | Status |
|---|---|---|
| REQ-70 | Sem framework, sem etapa de build, sem `npm install`. Única dependência de runtime: PapaParse via cdnjs | ✅ |
| REQ-71 | As regras de negócio puras vivem em `js/regras.js`, isoladas do DOM, e têm teste automático em `testes/` | ✅ |
| REQ-72 | Código, comentário e texto de interface em português do Brasil | 🟡 |
| REQ-73 | A paleta e a tipografia vêm do `FAVNA_3D_Manual_de_Identidade_Visual_v2.md`, que tem prioridade sobre qualquer sugestão de design deste documento | ✅ |

---

## Decisões

1. **Site estático puro.** HTML + CSS + JS, sem build. Quem mantém não é
   desenvolvedor; um `npm install` quebrado seria o fim da manutenção.
2. **A planilha é a fonte dos dados, não o repositório.** O conteúdo muda muito
   mais que o código.
3. **Duas planilhas, não uma.** `Favna_Catalogo` só tem dado público; a quantidade
   disponível atravessa a fronteira por `IMPORTRANGE`, e só ela.
4. **Coluna `specs` foi acrescentada** ao esquema do briefing original. A ficha de
   fatiamento é o elemento marcante do design, e o manual de identidade já reserva
   o Cinza Titânio para "dados técnicos de fatiamento" (REQ-28).
5. **A paleta oficial venceu a seção 7 do briefing**, que mandava evitar "fundo
   creme com acento terracota" por ser cara de template — mas essa é a paleta da
   FAVNA. A fuga do template veio pela execução: nenhuma sombra em card, nenhum
   rótulo em caixa-alta sobre título, nenhum degradê, nenhuma animação de entrada.
6. **Sem preço inventado.** Só as três peças com preço vindo da planilha de custeio
   têm número; as outras mostram "Preço sob consulta". Preço errado em catálogo
   público é pior que preço ausente.
7. **`catalogo/` é repositório próprio, nunca a raiz `favna3d/`.** A raiz tem
   `patreon_cookie.txt`, a planilha de gestão e o acervo do Patreon. Publicar dali
   violaria REQ-10 e vazaria uma credencial (REQ-12).
8. **Protótipo entra na planilha com `ativo = NÃO`.** O Porta-Vinho Reserva não
   existe fisicamente. Serve de exemplo vivo do mecanismo de esconder peça.
9. **Regras puras separadas do DOM** (REQ-71). Não é gosto por arquitetura: é o que
   permite ter teste sem navegador, sem build e sem dependência.

---

## Pendências com os donos

Nada aqui é código — são decisões e conteúdo que só vocês têm.

| # | Pendência | Trava o quê |
|---|---|---|
| 1 | **Número de WhatsApp** (`js/config.js`, hoje `55DDDNUMERO`) | REQ-33: o site não tem botão de pedido até isso |
| 2 | Converter `Favna_Planilha.xlsx` para Planilhas Google, criar a `Favna_Catalogo` e publicar a aba em CSV | REQ-11, REQ-63 e a Fase 2 inteira |
| 3 | Preço das outras 11 peças (a aba 🧮 Calculadora resolve) | REQ-06 na prática: hoje quase tudo é "sob consulta" |
| 4 | Prazo de produção por peça | REQ-22: nenhuma peça mostra prazo |
| 5 | Cores disponíveis além da cor da foto | REQ-34 |
| 6 | Foto real do Cachepô Curva — a atual é recorte de post, 432×541 | REQ-20 |
| 7 | **Consignado conta como pronta entrega?** A aba 📦 Estoque soma as peças que estão nas lojas parceiras | REQ-21: pode prometer pronta entrega do que está na loja de outro |
| 8 | `specs` das outras 9 peças | REQ-28: o elemento de design aparece em 5 de 14 |
| 9 | **🚩 Direito de imagem das fotos do criador** — decidir antes de publicar | REQ-13: trava a Fase 3 |

### Pendência 9 em detalhe

Cinco peças estão no catálogo com as fotos **do criador do modelo** (deltaprints,
Patreon), não com fotos nossas:

| Peça | Fotos | Origem |
|---|---|---|
| Organizador de Mesa | 3 | post 137167350 |
| Porta-Cápsulas Onda | 2 | post 129841500 |
| Porta-Escovas Canelado | 2 | post 114962237 |
| Porta-Joias Lua | 2 | post 164516568 |
| Porta-Pincéis Geo | 2 | post 160521526 |

Servem bem como rascunho interno — o `copy.md` do Porta-Joias Lua já registrava a
ressalva. Num catálogo **público e comercial** é outra coisa: são fotos de estúdio
de outra pessoa, apresentadas como se fossem peças nossas. A assinatura do Patreon
dá direito de *imprimir e vender as peças*, o que não é o mesmo que direito de usar
o material de divulgação dele.

Três saídas, em ordem de preferência:

1. **Fotografar as peças impressas.** Resolve de vez e é o que o catálogo pede de
   qualquer jeito: as fotos dele mostram a cor e o acabamento *dele*, não os nossos.
2. **Verificar a licença do criador** e, se permitir, creditar de forma visível.
3. **Tirar as 5 peças do ar** (`ativo = NÃO`) até haver foto própria. O catálogo
   fica com 9 peças e nenhum risco.

Enquanto isso não for decidido, o repositório pode existir e receber commits
locais, mas **não deve ir para o GitHub Pages**.

> As premissas da planilha (R$ 8 de filamento, R$ 35 por peça) foram calibradas para
> o catálogo antigo de chaveiros. O catálogo atual é de decoração, com peças
> maiores. Os três preços que existem vieram da planilha de custeio da A1, não
> dessas premissas.

---

## Fases

| Fase | Escopo | Estado |
|---|---|---|
| 1 | Base local: estrutura, config, CSVs, grade, filtro, busca, detalhe, WhatsApp | ✅ concluída |
| 1.5 | **Spec como fonte da verdade + critérios executáveis** (REQ-71) | 🚧 em curso |
| 2 | Planilha real: CSV publicado, dados de verdade, queda de conexão, fotos do Drive | 🔒 pendência 2 |
| 3 | **Publicação: repo próprio, GitHub Pages, og:image** (REQ-60, REQ-61) | 🚧 em curso |
| 4 | Só se pedido: QR code para as parceiras, pedido multi-item, domínio próprio | ⬜ |
