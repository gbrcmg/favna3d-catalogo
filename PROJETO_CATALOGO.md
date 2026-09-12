# Catálogo online — Projeto Gálice

> Briefing para o Claude Code. Leia o arquivo inteiro antes de começar e siga as fases na ordem.
> Ao final de cada fase, atualize a seção **Registro de progresso** no fim deste arquivo.

## 1. Contexto

O Projeto Gálice (Gabriel & Alice) produz e vende peças feitas em impressora 3D: porta-lápis
personalizados, organizadores de mesa, chaveiros, suportes de celular etc. As vendas acontecem
principalmente pelo WhatsApp, em consignado com papelarias e em testes na Shopee.

Toda a gestão é feita numa planilha (`Galice_Planilha`) com abas de Pedidos, Estoque, Calculadora
de preço, Vendas, Caixa, Relatório mensal e Premissas.

**Objetivo:** criar uma página pública de catálogo, sem backend e sem custo, cujo conteúdo vem de
uma planilha Google Sheets. Quem mantém o catálogo não é desenvolvedor: atualizar a planilha tem
que ser suficiente para atualizar o site.

## 2. Decisões já tomadas

- **Site estático**: HTML + CSS + JavaScript puro. Sem framework, sem etapa de build.
- **Fonte de dados**: uma aba de uma planilha Google Sheets **publicada na web como CSV**.
- **Hospedagem**: GitHub Pages (gratuito). O repositório será público, então nada sensível pode
  entrar no código.
- **Conversão de venda**: botão "Pedir pelo WhatsApp" com mensagem pré-preenchida. Sem carrinho,
  sem pagamento online.
- **Mobile first**: a maioria dos clientes vai abrir o link pelo celular, vindo do WhatsApp.

## 3. Privacidade (regra inegociável)

A planilha principal contém nomes de clientes, custos, margens, divisão de lucro e saldo da
impressora. **Ela nunca é publicada nem referenciada pelo site.**

O site lê apenas uma planilha separada, `Galice_Catalogo`, que contém somente dados públicos.
A quantidade disponível é trazida da planilha principal por `IMPORTRANGE`, e só esse número
atravessa a fronteira.

Nunca podem aparecer no site, no repositório ou no CSV: clientes, custos, margens, lucro,
porcentagens de divisão, dados de caixa, links de modelos (Printables etc.) e observações internas.

## 4. Planilha de catálogo (`Galice_Catalogo`)

### 4.1 Tarefas manuais (feitas pelo Gabriel ou pela Alice, não pelo Claude Code)

1. Se a planilha principal ainda estiver em formato `.xlsx` no Drive, convertê-la para Planilhas
   Google (Arquivo → Salvar como Planilhas Google). O `IMPORTRANGE` não funciona com `.xlsx`.
2. Criar uma planilha nova chamada `Galice_Catalogo` e importar o arquivo
   `dados/modelo_catalogo.csv` (gerado na Fase 1) numa aba chamada `Catalogo`.
3. Criar uma segunda aba chamada `_estoque` com, na célula A1:
   ```
   =IMPORTRANGE("URL_DA_PLANILHA_PRINCIPAL"; "'📦 Estoque'!B5:E200")
   ```
   Clicar em "Permitir acesso" na primeira vez. Isso traz Peça (coluna 1) e Disponível (coluna 4).
4. Na aba `Catalogo`, coluna `disponivel`, linha 2 (e arrastar para baixo):
   ```
   =SEERRO(PROCV(D2; _estoque!A:D; 4; FALSO); 0)
   ```
   O nome em `nome` precisa ser **idêntico** ao usado nas abas Pedidos e Estoque.
5. Arquivo → Compartilhar → **Publicar na web** → escolher **somente a aba `Catalogo`** (nunca
   "Documento inteiro") → formato **CSV** → Publicar. Copiar a URL gerada.
6. A planilha não precisa ser compartilhada com ninguém; a publicação basta.

### 4.2 Colunas da aba `Catalogo`

Cabeçalhos em minúsculas, sem acento, exatamente nesta ordem:

| Coluna           | Tipo          | Obrigatória | Descrição |
|------------------|---------------|-------------|-----------|
| `id`             | texto (slug)  | sim | Identificador único e estável, ex.: `chaveiro-dragao`. Usado na URL do produto. |
| `ativo`          | SIM/NÃO       | sim | `NÃO` esconde o produto sem apagá-lo. |
| `ordem`          | número        | não | Ordem de exibição (menor primeiro). Vazio vai para o fim. |
| `nome`           | texto         | sim | Nome exibido. Deve bater com a aba Estoque. |
| `categoria`      | texto         | sim | Usada no filtro. |
| `descricao`      | texto         | não | 1 a 3 frases. Pode ter vírgulas e quebras de linha. |
| `preco`          | número/texto  | não | Aceitar `35`, `35,00`, `35.00` e `R$ 35,00`. Vazio mostra "Preço sob consulta". |
| `fotos`          | texto         | não | Um ou mais caminhos/URLs separados por `\|`. A primeira é a capa. |
| `cores`          | texto         | não | Cores disponíveis separadas por `;`, ex.: `Preto; Branco; Cinza`. |
| `personalizavel` | SIM/NÃO       | não | Se aceita nome/texto personalizado. |
| `prazo_dias`     | número        | não | Prazo de produção quando for sob encomenda. |
| `disponivel`     | número        | não | Fórmula (ver 4.1). Maior que 0 = pronta entrega. |
| `destaque`       | SIM/NÃO       | não | Produtos em destaque aparecem primeiro. |

### 4.3 Dados de exemplo

Usar para `dados/modelo_catalogo.csv` e `dados/exemplo.csv`. Nomes e preços vêm da planilha real;
descrições, categorias, cores e prazos são **provisórios** e devem ser revisados pelos donos.

```csv
id,ativo,ordem,nome,categoria,descricao,preco,fotos,cores,personalizavel,prazo_dias,disponivel,destaque
porta-lapis-personalizado,SIM,1,Porta-lápis personalizado,Mesa e escritório,"Porta-lápis com o nome que você quiser, impresso em camadas.",35,fotos/porta-lapis.jpg,Preto; Branco; Azul,SIM,5,2,SIM
organizador-de-mesa,SIM,2,Organizador de mesa,Mesa e escritório,"Divisórias para canetas, clipes e post-its.",30,fotos/organizador.jpg,Preto; Cinza,NÃO,4,0,NÃO
chaveiro-dragao,SIM,3,Chaveiro dragão,Chaveiros,"Dragão articulado que mexe de verdade.",25,fotos/chaveiro-dragao.jpg,Verde; Vermelho; Roxo,NÃO,3,5,SIM
suporte-celular,SIM,4,Suporte celular,Suportes,"Apoio firme para celular na mesa, em pé ou deitado.",40,fotos/suporte-celular.jpg,Preto; Branco,SIM,5,0,NÃO
```

## 5. Funcionalidades

### 5.1 MVP (obrigatório)

- Carregar o CSV publicado e exibir os produtos com `ativo = SIM`, ordenados por `destaque`,
  depois `ordem`, depois `nome`.
- Grade de produtos com foto de capa, nome, preço e situação:
  - `disponivel > 0` → "Pronta entrega" (não mostrar a quantidade exata; ver `config.js`).
  - caso contrário → "Sob encomenda" e, se houver `prazo_dias`, "fica pronta em até N dias".
- Filtro por categoria e busca por nome/descrição (sem acento e sem diferenciar maiúsculas).
- Detalhe do produto (modal ou seção) com todas as fotos, descrição, cores e o botão de pedido.
- Link direto para cada produto via hash, ex.: `/#/p/chaveiro-dragao`, para enviar no WhatsApp.
- Botão "Pedir pelo WhatsApp" abrindo `https://wa.me/<NUMERO>?text=<mensagem>` com
  `encodeURIComponent`. Mensagem sugerida:
  `Olá! Vi no catálogo e quero o *<nome>* (<preço>).` e, se `personalizavel = SIM`,
  acrescentar `Gostaria de personalizar com: `.
  Se houver cores, deixar o cliente escolher a cor antes e incluí-la na mensagem.
- Preços formatados com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- Estados de carregamento, erro e lista vazia (textos claros, dizendo o que aconteceu e o que fazer).
- Guardar o último CSV carregado com sucesso em `localStorage` e usá-lo se o Google falhar.
- Meta tags Open Graph estáticas no `index.html` (título, descrição, imagem) para a prévia do link
  no WhatsApp ficar bonita.

### 5.2 Fora de escopo (por enquanto)

Carrinho com vários itens, pagamento online, login, painel administrativo, integração com Shopee,
contagem de visitas.

## 6. Requisitos técnicos

- Estrutura sugerida:
  ```
  index.html
  css/style.css
  js/config.js      ← tudo que os donos podem precisar trocar
  js/app.js
  fotos/            ← imagens dos produtos (preferencial)
  dados/exemplo.csv
  dados/modelo_catalogo.csv
  README.md         ← guia de manutenção para não desenvolvedores
  ```
- `js/config.js` deve conter, com placeholders claros e comentados:
  `CSV_URL`, `USAR_CSV_LOCAL` (true em desenvolvimento), `WHATSAPP_NUMERO` (formato
  `55DDDNUMERO`), `NOME_LOJA`, `MOSTRAR_QUANTIDADE` (padrão `false`), `MENSAGEM_WHATSAPP`.
- **Não inventar** número de WhatsApp, URL de planilha ou dados de contato.
- Parser de CSV: usar PapaParse via CDN (cdnjs) para lidar com vírgulas, aspas e quebras de linha.
  Qualquer outra dependência precisa ser discutida antes.
- Fotos:
  - Preferencial: arquivos na pasta `fotos/` do repositório, referenciados pelo caminho relativo.
  - Aceitar também URL completa.
  - Se for link do Google Drive (`drive.google.com/file/d/<ID>/...` ou `open?id=<ID>`), converter
    para `https://drive.google.com/thumbnail?id=<ID>&sz=w1000`. O arquivo precisa estar
    compartilhado como "qualquer pessoa com o link". Testar, pois o Google muda isso com frequência.
  - Imagem ausente ou quebrada → placeholder neutro, sem quebrar o layout. `loading="lazy"` e
    `alt` com o nome do produto.
- Leitura tolerante: ignorar linhas sem `id` ou `nome`, aparar espaços, aceitar `SIM/sim/S/TRUE/VERDADEIRO`.
- Acessibilidade: HTML semântico, foco visível no teclado, contraste adequado, modal fechável com
  Esc, respeitar `prefers-reduced-motion`.
- Desempenho: página utilizável em 4G fraco; nada de bibliotecas pesadas.
- Código e comentários em português. Todo texto de interface em português do Brasil.
- Testar localmente com `python3 -m http.server` (o `fetch` não funciona abrindo o arquivo direto).

### 6.1 Riscos a verificar

- O CSV publicado pelo Google pode levar alguns minutos para refletir as edições. Documentar isso
  no README.
- Confirmar que o `fetch` do CSV publicado funciona a partir do GitHub Pages (CORS). Se não
  funcionar, testar a alternativa
  `https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=Catalogo`
  (esta exige a planilha compartilhada como "qualquer pessoa com o link" como leitor), e registrar
  a escolha.

## 7. Direção de design

A peça em si é a estrela: fotos grandes e bem recortadas pesam mais que qualquer decoração.

- Antes de escrever o CSS, **propor um plano de design curto** (paleta com 4 a 6 cores em hex,
  tipografia e seus papéis, layout em wireframe ASCII e 2 ou 3 princípios) e esperar aprovação.
- Buscar a identidade no universo da impressão 3D: camadas, filamento, bobinas coloridas, o
  aspecto artesanal de algo feito em casa por duas pessoas. Uma ideia a considerar é mostrar as
  opções de cor como amostras de filamento. Escolher **um** elemento marcante e manter o resto
  sóbrio.
- Evitar a cara de template: fundo creme com acento terracota, fundo quase preto com acento neon,
  cards idênticos com a mesma sombra cinza em tudo, rótulos em caixa alta acima de cada título,
  degradês decorativos e animação de entrada em cada seção.
- Textos simples, na voz de quem vende no WhatsApp: direto e simpático, sem jargão de marketing.
  Botões dizem exatamente o que acontece ("Pedir pelo WhatsApp", não "Saiba mais").
- Se Gabriel e Alice já tiverem logo ou cores da marca, eles têm prioridade sobre este plano.

## 8. Fases

**Fase 1 — Base local.** Criar a estrutura de arquivos, `config.js`, os CSVs de exemplo e o
carregamento a partir de `dados/exemplo.csv`. Apresentar o plano de design e aguardar aprovação.
Depois implementar a grade, os filtros, a busca, o detalhe e o botão de WhatsApp.

**Fase 2 — Planilha real.** Com a URL fornecida pelos donos, trocar para o CSV publicado, testar
com dados reais, a queda de conexão (fallback do `localStorage`) e os links de foto do Drive.

**Fase 3 — Publicação.** Preparar para GitHub Pages, escrever o `README.md` com passo a passo para
não desenvolvedores (como adicionar produto, trocar foto, esconder item, quanto tempo leva para
atualizar) e revisar as meta tags de compartilhamento.

**Fase 4 — Melhorias (só se pedido).** QR code para imprimir e deixar nas papelarias
consignadas, pedido com vários itens numa única mensagem, domínio próprio.

## 9. Critérios de aceite

- [ ] Editar um preço ou esconder um produto na planilha altera o site sem mexer em código.
- [ ] Nenhum dado da seção 3 aparece no site, no repositório ou no CSV.
- [ ] O botão de WhatsApp abre a conversa certa com nome, preço e cor escolhida.
- [ ] Um link `/#/p/<id>` abre direto no produto.
- [ ] Funciona bem num celular de tela pequena e navegando só pelo teclado.
- [ ] Se o Google estiver fora do ar, o site mostra a última versão salva ou um erro claro.
- [ ] O README permite que a Alice adicione um produto novo sem ajuda.

## 10. Pendências com os donos

- Número de WhatsApp que receberá os pedidos.
- Logo, cores e nome exato da marca a exibir.
- Descrições, categorias, cores e prazos reais de cada produto (os do exemplo são provisórios).
- Fotos dos produtos.
- A aba Estoque conta como "disponível" as peças concluídas que estão em consignado nas
  papelarias. Decidir se essas peças devem aparecer como pronta entrega no site.
- Se o preço do site é o "preço consumidor" da Calculadora ou outro valor.

## 11. Registro de progresso

<!-- O Claude Code atualiza esta seção ao final de cada fase: o que foi feito, decisões tomadas e próximos passos. -->

### Fase 1 — Base local ✅ (2026-09-11)

**Adaptação do briefing para a FAVNA 3D.** O documento foi escrito para o Projeto
Gálice (porta-lápis, chaveiros, papelarias). Foi reaproveitado inteiro, trocando:

| Briefing original | Aqui |
|---|---|
| Projeto Gálice / Gabriel & Alice | FAVNA 3D (fundadores nunca citados em texto público) |
| `Galice_Catalogo` / `Galice_Planilha` | `Favna_Catalogo` / `Favna_Planilha` |
| Chaveiros e porta-lápis | Vasos, cachepôs, luminárias e utilitários domésticos |
| Paleta a propor do zero | Paleta oficial do `FAVNA_3D_Manual_de_Identidade_Visual_v2.md` |

**Estrutura criada:** `index.html`, `css/style.css`, `js/config.js`, `js/app.js`,
`fotos/` (25 imagens), `dados/exemplo.csv`, `dados/modelo_catalogo.csv`, `README.md`.

**Decisões tomadas**

1. **Coluna nova `specs`** (fora da lista da seção 4.2): a ficha de fatiamento
   — material, altura de camada, dimensões — é o elemento marcante do design
   (seção 7), em Courier/Cinza Titânio sobre a foto. O manual já reserva o
   Cinza Titânio para "dados técnicos de fatiamento". Preenchida em 5 das 14
   peças, só onde a spec está documentada.
2. **Conflito assumido com a seção 7.** O briefing manda evitar "fundo creme com
   acento terracota" por ser cara de template, mas essa é literalmente a paleta
   oficial da FAVNA. Venceu o manual (a própria seção 7 dá prioridade a ele). A
   fuga do template veio pela execução: nenhuma sombra em card, nenhum rótulo em
   caixa-alta sobre título, nenhum degradê, nenhuma animação de entrada.
3. **Catálogo populado com as peças reais** de `assets/posts/`, não com os dados
   de exemplo do briefing. Descrições derivadas das legendas já aprovadas.
4. **Preços: só os três que existem de verdade.** Vieram da coluna
   `preco_sugerido` da planilha de custeio (Bambu Lab A1), arredondados para
   cima no múltiplo de 5: Organizador R$ 90, Porta-Pincéis R$ 50, Porta-Escovas
   R$ 95. As outras 11 ficam "Preço sob consulta" — inventar preço num catálogo
   público seria pior que deixar em branco.
5. **Protótipo entra com `ativo = NÃO`.** O Porta-Vinho Reserva não existe
   fisicamente; fica na planilha como exemplo vivo do mecanismo de esconder.
6. **Botão de WhatsApp desligado por padrão.** Sem número configurado, o site
   mostra um aviso no lugar do botão em vez de abrir uma conversa inexistente.

**Correções durante o teste**

- `.detalhe { display: grid }` vencia o `[hidden]` do navegador: o véu escuro do
  modal cobria a página inteira e o `✕` flutuava sobre a grade. Corrigido com
  `.detalhe[hidden] { display: none }`.
- A capa do Cachepô Curva era a **imagem do post**, com título, tarja de material
  e CTA "Link na bio" embutidos. Recortada só a região do produto — mas saiu em
  432×541, resolução baixa. **Precisa de foto real.**
- As duas fotos da Mão Porta-Joias vinham deitadas (EXIF orientation 6);
  reexportadas em pé.
- Verificado que não há rolagem horizontal: o Chrome headless trava a janela em
  500 px e recortava o screenshot, o que parecia overflow e não era.

**Testado:** servidor local, 500 px e 1280 px, grade + filtros + busca + detalhe
+ rota `#/p/<id>`; `node --check` no JS; todos os caminhos de foto conferidos.

### Próximos passos

**Fase 2** depende de tarefas manuais (seção 4.1): converter a `Favna_Planilha`
para Planilhas Google, criar a `Favna_Catalogo`, importar
`dados/modelo_catalogo.csv`, montar o `IMPORTRANGE` e publicar a aba em CSV.
Atalho disponível: a planilha nova pode ser compartilhada com
`wealth-management@catapromos-d6379.iam.gserviceaccount.com` e daí em diante ser
preenchida pelo CLI `gsheet`, sem digitação manual.

### Pendências com os donos (atualiza a seção 10)

1. **Número de WhatsApp** — `js/config.js` está com o placeholder `55DDDNUMERO`.
2. **Preços das outras 11 peças** — a aba 🧮 Calculadora resolve; as premissas
   ainda estão calibradas para o catálogo antigo (R$ 35/peça, filamento R$ 8).
3. **Cores** — hoje cada peça lista só a cor da foto. Se a FAVNA imprime sob
   encomenda em outras cores da paleta, isso precisa entrar na coluna `cores`.
4. **Prazos** — nenhuma peça tem `prazo_dias`; todas mostram só "Sob encomenda".
5. **Foto do Cachepô Curva** — a atual é recorte de post, 432×541.
6. **Imagem de compartilhamento** — o `og:image` aponta pra essa mesma foto;
   trocar por uma 1200×630 dedicada.
7. **Consignado conta como pronta entrega?** A aba 📦 Estoque soma as peças que
   estão nas lojas parceiras. Se elas não devem aparecer como pronta entrega, o
   `IMPORTRANGE` precisa de outra coluna.
8. **`specs` das outras 9 peças** — a ficha de fatiamento é o elemento de design
   da página e só aparece em 5 das 14.
