# Catálogo FAVNA 3D — Especificação

> **Este arquivo é a fonte da verdade.** Nada entra no código sem estar aqui, e todo
> requisito é escrito de forma que dê pra dizer, sem opinião, se está cumprido.
>
> Origem histórica: [`PROJETO_CATALOGO.md`](PROJETO_CATALOGO.md) — briefing do antigo
> Projeto Gálice, de onde este catálogo nasceu. Vale como contexto, não como regra.
>
> **No ar:** https://favna3d.com.br/ (domínio próprio; o endereço antigo do GitHub Pages redireciona)
> Repositório: `gbrcmg/favna3d-catalogo` · Última revisão: 2026-09-22

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
online, login, painel administrativo, integração com Shopee.

> ~~contagem de visitas~~ — revisto em 22/09/2026 por pedido do dono: entrou
> Google Analytics (seção 10, REQ-80 a REQ-82). Ver [Decisão 14](#decisões).

---

## 2. Privacidade — regra inegociável

A `Favna_Planilha` tem nome de cliente, custo, margem, divisão de lucro e saldo da
impressora. **Ela nunca é publicada nem referenciada pelo site.**

| ID | Requisito | Status |
|---|---|---|
| REQ-10 | Não aparecem no site, no repositório nem no CSV: cliente, custo, margem, lucro, percentual de divisão, dado de caixa, link de modelo (Patreon/Printables) e observação interna | 🟡 |
| REQ-11 | A publicação no Sheets é **só da aba `Catalogo`** — "Documento inteiro" exporia a aba `_estoque` e, por ela, a planilha principal | ✅ |
| REQ-12 | O repositório público contém **apenas** `catalogo/`. Nada da raiz `favna3d/` pode entrar: lá vivem uma credencial de sessão, a planilha de gestão e 19 GB de acervo pago | ✅ |
| REQ-13 | **Revisto em 19/09/2026 por decisão do dono.** O portão da foto deixou de ser *de quem é* e passou a ser *está pronta para publicar*. Toda imagem que chega em `<peça>/fotos/` é considerada liberada pelo dono — ou já vem pronta, ou é gerada antes. A liberação é responsabilidade dele, não do funil, e o funil não trava mais por autoria | ✅ |
| REQ-14 | Foto de catálogo do **fornecedor de filamento** também não vai ao ar. A cor dela é extraída como dado; a foto fica em `assets/cores/`, fora deste repositório | ✅ |
| REQ-21b | Foto publicada tem no máximo 1400 px no maior lado e 300 KB. `scripts/preparar-foto.py` garante — uma foto crua de celular tem 3,8 MB e inutilizaria a página em 4G fraco (REQ-56) | ✅ |

> REQ-12 existe porque `git init` na raiz do projeto versionaria uma credencial
> viva. Ver [Decisão 7](#decisões). Cumprido pelo `.gitignore` e auditado com
> `git diff --cached --name-only` antes do primeiro commit.
>
> **REQ-13 não bloqueia mais** (decisão do dono, 19/09/2026). Parte das fotos vem
> do acervo do criador **deltaprints** (Patreon), e isso deixou de ser impedimento:
> ou a foto já vem pronta para publicação, ou é gerada antes de ir ao ar. Quem
> libera é o dono. Ver [pendência 9](#pendências-com-os-donos), encerrada.

---

## 3. Dados

O site lê uma aba publicada como CSV. Colunas e semântica no
[README](README.md#as-colunas-uma-por-uma).

| ID | Requisito | Status |
|---|---|---|
| REQ-01 | Trocar preço, foto, descrição ou esconder peça na planilha muda o site sem tocar em código | ✅ |
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
| REQ-22 | Caso contrário mostra "Sob encomenda" e, havendo prazo, "fica pronta em até N dias" | ✅ |
| REQ-22b | O prazo de produção é **configuração do site** (`PRAZO_PRODUCAO_DIAS`), não dado por peça: quase tudo é sob encomenda com o mesmo prazo, e repetir o número em cada linha da planilha só cria chance de divergência. A coluna `prazo_dias` continua existindo e **vence o padrão**, para a peça excepcional | ✅ |
| REQ-23 | A categoria organiza a página, montada a partir dos próprios dados — categoria nova na planilha aparece sozinha. Desde 18/09/2026 as cápsulas do topo são **links para a página da categoria**, não botões de filtro: clicar no nome de uma categoria leva ao mesmo lugar vindo da cápsula, da rubrica da seção ou do "Ver tudo", e o endereço abre em outra aba e volta pelo botão do navegador | 🟡 |
| REQ-24 | Busca por nome e descrição, ignorando acento e caixa ("cachepo" acha "Cachepô") | ✅ |
| REQ-25 | Detalhe da peça com todas as fotos, descrição, cores, ficha técnica e botão de pedido | 🟡 |
| REQ-26 | `fotos` aceita caminho relativo, URL completa e link do Google Drive — este convertido para `thumbnail?id=<ID>&sz=w1000` | ✅ |
| REQ-27b | As fotos moram em `fotos/<slug>/NN.jpg` — uma pasta por peça. A pasta carrega a identidade, o arquivo carrega só a ordem, e dá para guardar alternativas junto da peça sem poluir o que vai ao ar | ✅ |
| REQ-27c | Toda foto de `fotos/` tem **cópia idêntica** num bucket privado do Cloudflare R2, com o mesmo layout: `catalogo/<slug>/NN.jpg`. O site **não lê** do R2 — continua servindo do repositório (REQ-27b). A cópia é armazenamento-mestre e backup, e a base de um futuro app server (Decisão 13). Conferência: `r2 sync fotos catalogo`, sem `--yes`, termina em `0 novo(s), 0 alterado(s)` | 🟡 |
| REQ-27 | Foto ausente ou quebrada vira placeholder neutro, sem quebrar o layout. Toda imagem tem `loading="lazy"` e `alt` com o nome da peça | 🟡 |
| REQ-28 | A **ficha técnica** (`specs`) aparece em mono/Cinza Titânio sobre a foto — é o elemento marcante do design. Desde 14/09/2026 traz **só a dimensão** (`120 × 112 × 98 mm`): material, altura de camada e peso saíram, por decisão do dono. Desde 17/09/2026 ela é permanente no celular e surge no hover onde existe ponteiro fino, para não competir com a foto na grade | 🟡 |
| REQ-29 | Preço formatado com `Intl.NumberFormat('pt-BR', BRL)` | ✅ |
| REQ-15 | Cor do catálogo mostra uma **amostra de filamento** — disco com as linhas de camada, desenhado em CSS a partir do hex, sem imagem. O nome escrito na planilha casa com a amostra pelo slug, sem tabela de tradução | ✅ |
| REQ-16 | Cor **sem** amostra cadastrada continua vendável: o botão vira só o rótulo de texto. Catálogo de cores incompleto é estado normal, não erro | ✅ |
| REQ-17 | Há uma **faixa só de cores**, **antes da lista de peças**, mostrando todo o catálogo com amostra, nome e acabamento. Agrupada por acabamento e, dentro do grupo, do mais claro ao mais escuro. Se o catálogo de cores estiver vazio, a faixa não existe | ✅ |
| REQ-20 | O rótulo da faixa é montado dos dados ("11 cores · fosco, acetinado, mesclado e translúcido"), nunca escrito à mão — cadastrar cor atualiza a contagem e pode acrescentar um acabamento | ✅ |
| REQ-19 | As cores vivem num **carrossel horizontal** que desliza com o dedo. Como o formato esconde o que está fora da tela, três coisas compensam: a próxima cor sempre aparece cortada na borda, há barra de posição, e no desktop aparecem setas. Cabendo tudo na tela, setas e barra não aparecem | ✅ |
| REQ-18 | A seção tem link direto `#cores`, para mandar no WhatsApp quando o cliente pergunta que cores existem. Funciona mesmo se o catálogo de peças falhar: a vitrine não depende do CSV | ✅ |
| REQ-36 | A home mostra **uma prateleira por categoria** (até `PECAS_POR_CATEGORIA`, hoje 6), cada uma com rubrica numerada e endereço próprio `#/c/<slug>`. Passando do limite aparece o "Ver as N", que leva à **página da categoria** — a grade inteira, na mesma página, por rota de hash. O slug é derivado do nome, sem cadastro; slug que não casa com categoria nenhuma cai na home em vez de mostrar página vazia | ✅ |
| REQ-37 | A prateleira usa a **mesma mecânica do carrossel de cores** (REQ-19), no mesmo trecho de código: corte na borda, barra de posição e setas no desktop. Cabendo tudo na tela — o caso de toda categoria hoje, com 1 a 4 peças — setas e barra não aparecem e ela vira uma fileira comum. O recurso nasce dormindo e liga sozinho quando o catálogo crescer, sem commit | ✅ |
| REQ-38 | A casa abre com uma seção **Em destaque**, montada das peças com `destaque = SIM` na planilha, em **grade** e não em prateleira: na grade o destaque vira a lâmina partida (foto inteira + painel de texto), e o contraste com as fileiras uniformes abaixo dá o ritmo da página. A peça em destaque **continua** na prateleira da própria categoria — tirá-la de lá deixaria a categoria incompleta para quem entra por ela. Sem nenhum `destaque = SIM`, a seção não existe | ✅ |

---

## 5. Pedido pelo WhatsApp

| ID | Requisito | Status |
|---|---|---|
| REQ-30 | O botão abre `https://wa.me/<numero>?text=…` com a mensagem escapada por `encodeURIComponent` | ✅ |
| REQ-31 | A mensagem leva nome da peça, preço, cor escolhida e o link direto da peça | ✅ |
| REQ-32 | `personalizavel` verdadeiro acrescenta o pedido de personalização à mensagem | ✅ |
| REQ-33 | Número não configurado mostra um aviso **no lugar** do botão — nunca um botão que abre conversa inexistente | ✅ |
| REQ-34 | Havendo cores, o cliente escolhe antes de pedir e a escolha entra na mensagem | 🟡 |
| REQ-35 | Há **atalhos flutuantes** de WhatsApp e Instagram, fixos embaixo à direita, que entram depois que a capa sai da tela e somem com o detalhe aberto. Os endereços saem do `config.js` (`WHATSAPP_NUMERO` + `MENSAGEM_WHATSAPP_GERAL`, `INSTAGRAM_USUARIO`); o que não estiver configurado não aparece, pela mesma razão do REQ-33. A pele é a da casa — Carvão em repouso, Oliva Queimado e Terracota no hover —, não a cor das redes: o verde da marca do WhatsApp brigaria com a paleta inteira (REQ-73) | ✅ |

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
| REQ-50 | Cada peça tem link direto `#/p/<id>`, que abre a página já no detalhe — é o link que vai no WhatsApp | ✅ |
| REQ-51 | Usável em celular de tela pequena; a página **nunca** rola na horizontal | 🟡 |
| REQ-52 | O detalhe fecha com `Esc`, prende o `Tab` enquanto aberto e devolve o foco de onde veio | 🟡 |
| REQ-53 | HTML semântico, foco visível no teclado, contraste adequado e link "pular para as peças" | 🟡 |
| REQ-54 | `prefers-reduced-motion` respeitado | 🟡 |
| REQ-55 | Meta tags Open Graph para a prévia do link ficar apresentável no WhatsApp | ✅ |
| REQ-56 | Página utilizável em 4G fraco; nenhuma biblioteca pesada | 🟡 |

---

## 8. Publicação

| ID | Requisito | Status |
|---|---|---|
| REQ-60 | `catalogo/` é repositório git próprio, com `.gitignore`, publicado no GitHub Pages | ✅ |
| REQ-61 | `og:image` é uma imagem dedicada de 1200×630, não o recorte de uma foto de produto | ✅ |
| REQ-64 | `og:url` e `og:image` são absolutas — o WhatsApp não resolve caminho relativo na prévia | ✅ |
| REQ-62 | O README permite adicionar uma peça nova sem ajuda de desenvolvedor | 🟡 |
| REQ-63 | Confirmado que o `fetch` do CSV publicado funciona a partir do GitHub Pages (CORS) | ✅ |

---

### REQ-63 — resolvido em 2026-09-12

Vale a forma **1**: a URL do "Publicar na web" (`/pub?gid=0&single=true&output=csv`).
Medido com `curl -H "Origin: https://gbrcmg.github.io"`:

```
307 → access-control-allow-origin: https://gbrcmg.github.io
200 → access-control-allow-origin: *
      content-type: text/csv; charset=utf-8
      cache-control: private, max-age=300
```

O navegador aceita a leitura de outro domínio. **Não precisamos** do `gviz/tq`
(que exigiria a planilha aberta a qualquer pessoa com o link) nem da GitHub Action
que commitaria o CSV. A decisão 1 — sem etapa de build — sobrevive intacta.

O `max-age=300` transforma os "alguns minutos" em número: o Google autoriza cinco
minutos de cache no navegador. Nosso `fetch` usa `cache: 'no-store'` e passa por
cima disso, então o atraso que sobra é só o da republicação do lado do Google.

---

## 9. Manutenção

| ID | Requisito | Status |
|---|---|---|
| REQ-70 | Sem framework, sem etapa de build, sem `npm install`. Única dependência de runtime: PapaParse via cdnjs | ✅ |
| REQ-71 | As regras de negócio puras vivem em `js/regras.js`, isoladas do DOM, e têm teste automático em `testes/` | ✅ |
| REQ-72 | Código, comentário e texto de interface em português do Brasil | 🟡 |
| REQ-73 | A paleta e a tipografia vêm do `FAVNA_3D_Manual_de_Identidade_Visual_v2.md`, que tem prioridade sobre qualquer sugestão de design deste documento | ✅ |

---

## 10. Medição

| ID | Requisito | Status |
|---|---|---|
| REQ-80 | Google Analytics (GA4) só carrega se `GA_MEASUREMENT_ID` estiver preenchido em `config.js` — mesma regra do WhatsApp e do Instagram (REQ-33): nada de terceiro sobe sem essa linha | ✅ |
| REQ-81 | Além do pageview automático do GA4, três eventos próprios do funil: `view_item` (abre o detalhe de uma peça), `pedir_whatsapp` (clica no botão de pedido) e `clique_flutuante` (clica no WhatsApp/Instagram flutuante, parâmetro `canal`) | ✅ |
| REQ-82 | `medeEvento()` não quebra a página se o `gtag` não tiver carregado (sem ID configurado, ou script bloqueado por adblock) | ✅ |

Não há política de privacidade publicada mencionando o Analytics — pendência
12 (ver abaixo).

---

## Catálogo de cores (REQ-14 a REQ-16)

As fotos em `favna3d/assets/cores/` são material de divulgação do **fabricante do
filamento**, com a marca dele visível. Não entram neste repositório. Dois motivos,
e o segundo é de projeto, não jurídico:

1. Republicar foto comercial de terceiro é o mesmo problema da pendência 9.
2. **Elas não funcionam como amostra.** No tamanho que uma amostra ocupa na tela, o
   que aparece é o carretel preto com o adesivo do fabricante — as dez ficariam
   quase idênticas. E pesam ~900 KB cada, contra ~0 KB da amostra em CSS.

Então `scripts/extrair-cores.py` lê as fotos, amostra a cor da **peça impressa**
(terço direito da imagem, descartando fundo branco, carretel preto e o verde da
etiqueta) e gera `js/cores.js` com nome, hex e acabamento. O disco é desenhado em
CSS, com as linhas de camada da marca em dois tons para aparecer tanto no Bege
quanto no Preto Matte.

**Como acrescentar uma cor:** pôr a foto em `assets/cores/` com o nome em
minúsculas e hífens (`verde-oliva.png`) e rodar o script. O nome escrito na
planilha casa pelo mesmo slug — `Verde Oliva` acha `verde-oliva`, ignorando acento,
caixa e espaço extra. Sem tabela de tradução para alguém esquecer de atualizar.

O acabamento sai do nome do arquivo: `silk` ganha reflexo diagonal, `marmorizado`
ganha mescla, `transparente` ganha o xadrez por baixo. O resto é fosco.

---

### Por que a faixa fica antes das peças

Movida em 2026-09-12, do fim da página para logo depois dos filtros. No fim,
quase ninguém chegava: eram 8 peças de rolagem antes dela, e seção que não é
vista vale zero.

O custo é real e foi dosado. Cor é decisão **secundária** — escolhe-se a peça e
depois a cor — então pôr a cor primeiro inverte o funil e empurra a primeira
peça para baixo. Por isso a faixa subiu **enxuta**: saiu o título "As cores" e o
parágrafo de abertura, ficou um rótulo de uma linha em tipografia mono. São
~250px em vez de ~400, e a primeira peça segue ao alcance de uma rolagem curta.

O link `#cores` continua valendo e não depende da posição: é o que se manda no
WhatsApp quando o cliente pergunta que cores existem.

### Por que carrossel, e o que ele custa

Decisão do dono, contra a minha recomendação, e vale registrar o porquê das
duas posições. Escolher cor é tarefa de **comparação**: a grade mostrava as 11
de uma vez, o carrossel mostra 3 ou 4. Minha proposta era grade + visor
imersivo ao toque; a escolha foi o carrossel, pela economia de altura no
celular e pelo gesto familiar.

As três mitigações do ponto fraco estão no CSS e no JS, e não são enfeite:

- **Corte na borda.** O trilho sangra 1rem além do container e tem 2,5rem de
  respiro à direita, então a cor seguinte aparece pela metade. É o sinal de que
  a fileira continua.
- **Barra de posição.** Um tento de 28% percorre a barra conforme a rolagem.
  Escolhida em vez de bolinhas porque funciona para 4 ou para 40 cores.
- **Setas só no desktop**, atrás de `(hover: hover) and (pointer: fine)`. No
  celular o gesto basta e seta em tela pequena rouba espaço da cor.

`progressoCarrossel` trata o caso degenerate: se tudo couber na tela, `rola` é
falso e os controles desaparecem — carrossel que não rola com seta que não faz
nada é pior que grade.

---

## POC ponta a ponta — passou em 2026-09-12

Planilha `Favna_Catalogo` (`1n89xfRLpx7DhACQo8QVUoRh4JuPzJ_kTpgJHUaFWcHE`), aba
`Catalogo` publicada em CSV, lida pelo site em
https://gbrcmg.github.io/favna3d-catalogo/

**O critério, cumprido:** o preço do Cachepô Curva foi alterado na planilha e
apareceu na página publicada **sem deploy, sem commit e sem tocar no GitHub** — o
último commit continuou sendo o anterior à mudança. O valor de teste foi apagado
em seguida: preço inventado não fica em página pública (decisão 6).

De quebra, o teste exercitou em produção o caminho mais perigoso do projeto
(REQ-06): a planilha guardou `149,9` com vírgula, e a página renderizou
`R$ 149,90`.

**Medições reais**, que substituem as estimativas:

| O que | Medido |
|---|---|
| Escrita na planilha → CSV publicado | ~1 min (duas medições) |
| Cache que o Google autoriza no CSV | `max-age=300` |
| Build do Pages após push | ~1 min |
| Cache do Pages no HTML | `max-age=600` |

**O que o CSV do Google entrega, verificado:** 14 linhas, sem BOM, quebra de linha
CRLF, acentuação intacta, e a coluna `ativo` com `NÃO` acentuado sendo lida
corretamente pelo `ehSim`.

**Ainda não provado:** a chegada do pedido no WhatsApp (falta o número, pendência
1) e o comportamento com o Google fora do ar (REQ-41 a REQ-43), que só dá para
testar derrubando a rede de propósito.

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
10. **A Decisão 5 foi revista em 17/09/2026, a pedido do dono** ("versão moderna
   do frontend, com paralaxe"). O que continua valendo dela é a paleta e a
   tipografia do Manual (REQ-73). O que caiu é a regra de abstinência —
   "nenhum degradê, nenhuma animação de entrada" —, trocada por um critério de
   motivo único: **todo efeito tem que ser a camada da impressão**. A capa se
   constrói em camadas, o fio da barra é a barra de progresso de um fatiamento,
   a peça se revela ao entrar na tela, e o paralaxe move planos em velocidades
   diferentes (fundo, luz, texto, foto dentro da moldura). Efeito que não
   consegue justificar essa origem não entra. Duas amarras impedem que isso vire
   template: `prefers-reduced-motion` desliga o movimento inteiro (REQ-54), e a
   revelação tem rede de segurança por tempo — catálogo em branco por causa de
   um efeito é falha de venda, não de estilo.

11. **Categoria organiza, não filtra** (REQ-23, REQ-36). A dúvida em 18/09/2026 era
   trocar a grade única por uma grade de categorias como porta de entrada. Os
   números diziam não: 15 peças em 6 categorias, mediana de 2,5 — "Brindes"
   viraria uma página de uma peça, e nenhuma foto apareceria antes do primeiro
   clique, que é onde a venda acontece. Ficou o meio-termo: a home mostra todas
   as categorias com até 6 peças cada, e a página da categoria existe como
   destino de quem quer mais, não como pedágio. O dono avisou que sobe 40–50
   peças em seguida — nessa densidade, 6 a 8 por categoria, a prateleira passa a
   ser o formato certo, e o "Ver tudo" liga sozinho.
12. **Página de categoria é rota de hash, não arquivo HTML.** Arquivo separado
   duplicaria cabeçalho, Open Graph, o fetch do CSV e o catálogo de cores — e
   cada peça publicada custaria manutenção em dois lugares (REQ-70, REQ-56).
13. **As fotos ganharam cópia num bucket privado do R2 (19/09/2026), mas o site
   continua servindo do repositório** (REQ-27c). O dono pretende ter um app
   server próprio que busque as imagens; o R2 é a base dele. O bucket é
   **privado** de propósito, por três motivos:
   - `r2.dev`, o endereço público grátis, é limitado em taxa e a Cloudflare o
     desaconselha em produção — pesa contra o REQ-56;
   - domínio próprio no R2 exige o DNS de `favna3d.com.br` na Cloudflare, e hoje
     ele está na Hostinger: mover é risco para o site no ar;
   - bucket privado não publica as fotos do criador (REQ-13, pendência 9).

   O custo dessa escolha: o navegador não consegue ler o R2, então o frontend não
   usa esses objetos ainda (pendência 10). Quando o app server existir, ele lê do
   R2 com credencial própria (só leitura) e **a Decisão 1 — site estático, sem
   servidor — terá de ser revista.** A ferramenta de envio (`r2`) e a credencial
   ficam fora deste repositório (REQ-12).

14. **Não-objetivo "contagem de visitas" revisto em 22/09/2026, a pedido do
   dono.** Entrou Google Analytics (GA4), condicionado a `GA_MEASUREMENT_ID`
   em `config.js` — o mesmo interruptor que já existia para WhatsApp e
   Instagram (REQ-33): sem ID preenchido, nenhum script de terceiro sobe e
   nenhum dado sai do navegador. Junto vieram três eventos de funil (REQ-81),
   não só pageview — é a métrica que separa "viu a peça" de "clicou pra
   pedir", que sem evento nenhum contador de visita bruto não mostra. Ficou
   pendente a política de privacidade mencionando o Analytics (pendência 12).

---

## Pendências com os donos

Nada aqui é código — são decisões e conteúdo que só vocês têm.

| # | Pendência | Trava o quê |
|---|---|---|
| ~~1~~ | ~~Número de WhatsApp~~ — resolvido em 14/09/2026: `(19) 99982-7588` | ✅ |
| 2 | Converter `Favna_Planilha.xlsx` para Planilhas Google, criar a `Favna_Catalogo` e publicar a aba em CSV | REQ-11, REQ-63 e a Fase 2 inteira |
| 3 | Preço das outras 11 peças (a aba 🧮 Calculadora resolve) | REQ-06 na prática: hoje quase tudo é "sob consulta" |
| ~~4~~ | ~~Prazo de produção~~ — resolvido em 14/09/2026: **3 dias** em todas as peças | ✅ |
| 5 | Cores disponíveis além da cor da foto | REQ-34 |
| 6 | Foto real do Cachepô Curva — a atual é recorte de post, 432×541 | REQ-20 |
| 7 | **Consignado conta como pronta entrega?** A aba 📦 Estoque soma as peças que estão nas lojas parceiras | REQ-21: pode prometer pronta entrega do que está na loja de outro |
| 8 | `specs` das outras 9 peças | REQ-28: o elemento de design aparece em 5 de 14 |
| 9 | ~~Direito de imagem das fotos do criador~~ — **decidido em 19/09/2026**: não trava mais | REQ-13 revisto |
| 10 | **Ligar o site às fotos do R2** — exige URL pública, e as três saídas custam algo: bucket público separado em `r2.dev` (limitado em taxa, sem cache), domínio próprio (mover o DNS para a Cloudflare) ou um Worker na frente do bucket privado (uma peça a mais para manter). Enquanto o repositório servir bem, não há ganho visível | REQ-01 para foto (trocar foto sem commit) e o app server |
| 11 | **Duas fotos no ar passam de 300 KB**: `porta-escovas-canelado/01.jpg` (463 KB) e `porta-capsulas-onda/01.jpg` (316 KB). Reprocessar pelo `preparar-foto.py` e reenviar ao R2 | REQ-21b |
| 12 | **Política de privacidade mencionando o Google Analytics** (LGPD) — o site não tem página nenhuma sobre isso ainda | Nenhum REQ trava por causa disso; é diligência, não bloqueio técnico |

### Pendência 9 — encerrada em 19/09/2026

> **Decisão do dono:** parar de tratar a autoria da foto como portão. As fotos que
> entram no funil já vêm prontas para publicação, ou são geradas antes. O registro
> abaixo fica como histórico do que motivou a discussão.

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
| 2 | POC ponta a ponta: planilha real, CSV publicado | ✅ passou |
| 3 | Publicação: repo próprio, GitHub Pages, og:image | ✅ no ar |
| 4 | Só se pedido: QR code para as parceiras, pedido multi-item, domínio próprio | ⬜ |
| 5 | App server próprio lendo as fotos do R2 (Decisão 13, pendência 10). Sem prazo; obriga a rever a Decisão 1 | ⬜ |
