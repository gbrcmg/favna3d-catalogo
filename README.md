# Catálogo FAVNA 3D

**No ar: https://favna3d.com.br/** (também responde em https://gbrcmg.github.io/favna3d-catalogo/, que redireciona)

Uma página pública que mostra as peças e leva o cliente pro WhatsApp.
O conteúdo vem de uma planilha do Google — **mexer na planilha é suficiente
para mudar o site**, sem tocar em código.

Briefing original e histórico de decisões: [`PROJETO_CATALOGO.md`](PROJETO_CATALOGO.md).

---

## Para quem só quer mexer no catálogo

Tudo acontece na planilha **`Favna_Catalogo`**, aba **`Catalogo`**.
Cada linha é uma peça. As mudanças aparecem no site em **até 5 minutos**
(o Google demora um pouco para republicar o CSV) — se não aparecer, recarregue
a página segurando Shift.

### Adicionar uma peça nova

1. Abra a aba `Catalogo` e escreva numa linha em branco no fim.
2. Preencha pelo menos **`id`**, **`ativo`**, **`nome`** e **`categoria`**.
   Os outros campos são opcionais.
3. O `id` é o apelido da peça na internet (`vaso-ritmo-01`): só letras minúsculas,
   números e hífen, **sem acento e sem espaço**. Ele nunca deve mudar depois de
   criado — é o que faz o link direto funcionar.
4. Na coluna `disponivel`, copie a fórmula da linha de cima (ela puxa o estoque
   da planilha principal sozinha).

### Esconder uma peça sem apagar

Escreva `NÃO` na coluna `ativo`. A linha continua guardada; a peça some do site.
É assim que fica o **Porta-Vinho Reserva**, que ainda é protótipo.

### Trocar a foto

Cada peça tem **sua própria pasta** dentro de `fotos/`, com os arquivos numerados:

```
fotos/
  cachepo-lua/
    01.jpg    ← a capa
    02.jpg
    03.jpg
```

Na coluna `fotos` da planilha, separe com barra vertical `|`. **A primeira é a capa:**

```
fotos/cachepo-lua/01.jpg|fotos/cachepo-lua/02.jpg|fotos/cachepo-lua/03.jpg
```

O jeito mais fácil é rodar `scripts/preparar-foto.py`, que cria a pasta, numera,
comprime e imprime a linha pronta para colar.

Também funciona um link do Google Drive — mas o arquivo precisa estar
compartilhado como "qualquer pessoa com o link". O site converte o endereço
sozinho. Foto do repositório é mais confiável e carrega mais rápido.

**Cópia de segurança no R2.** Depois de pôr a foto em `fotos/`, envie a cópia para o
bucket privado do Cloudflare R2 (REQ-27c):

```
r2 sync catalogo/fotos catalogo          # só mostra o que enviaria
r2 sync catalogo/fotos catalogo --yes    # envia
```

Ele compara o conteúdo e só manda o que está novo ou mudou. O site **não lê** do R2:
as fotos continuam saindo do repositório, e a cópia serve de backup e de base para um
futuro servidor próprio. A ferramenta `r2` e a credencial ficam na máquina do dono,
**fora deste repositório**.

### A seção de cores

A página tem uma faixa de cores **antes da lista de peças**, com todo o catálogo
em um carrossel que desliza com o dedo: amostra, nome e acabamento. Ela se monta
sozinha a partir de `js/cores.js` — cadastrar uma cor nova já a faz aparecer lá,
o rótulo ("11 cores · fosco, acetinado…") se recalcula, e o carrossel se ajusta à
quantidade (com poucas cores, ele nem rola).

O endereço direto é útil no dia a dia: quando alguém pergunta que cores existem,
mande

```
https://favna3d.com.br/#cores
```

que abre a página já na seção.

### Acrescentar uma cor

Na planilha, a coluna `cores` é só texto, separado por ponto-e-vírgula:
`Terracota; Verde Oliva`. Se a cor já estiver cadastrada, ela aparece no site
com a **amostra do filamento** do lado do nome. Se não estiver, aparece só o
nome — a peça continua vendável, não é erro.

Para cadastrar uma cor nova (isso é tarefa de desenvolvedor, uma vez por cor):

1. Pôr a foto do filamento em `favna3d/assets/cores/`, nome em minúsculas e
   hífens: `verde-oliva.png`. Se o nome tiver `silk`, `marmorizado` ou
   `transparente`, a amostra já sai com o acabamento certo.
2. Rodar `python3 scripts/extrair-cores.py` — ele extrai a cor da peça impressa
   na foto e atualiza `js/cores.js`.
3. Commitar o `js/cores.js`.

A foto do fornecedor **não** vai para o repositório: só a cor dela, como dado.

Para conferir o que está cadastrado hoje:

```bash
python3 scripts/extrair-cores.py --conferir
```

Escrever `Verde Oliva`, `verde oliva` ou `VERDE-OLIVA` na planilha dá no mesmo.

### Como a página se organiza por categoria

A página inicial mostra **uma fileira por categoria**, na ordem em que as
categorias aparecem na planilha (que segue `destaque` e `ordem`). Cada fileira
desliza com o dedo e mostra até **6 peças**.

Passando de 6, a fileira ganha um **"Ver as N"** que leva à **página daquela
categoria**, com a grade inteira. Abaixo de 6 o botão não aparece — seria um
clique que não muda nada.

Cada categoria tem endereço próprio, feito a partir do nome, e é ele que você
manda no WhatsApp quando alguém pergunta só dos vasos:

```
https://favna3d.com.br/#/c/vasos-e-cachepos
```

O apelido sai do nome sozinho: `Vasos e cachepôs` vira `vasos-e-cachepos`
(sem acento, minúsculo, hífen no lugar de espaço). **Renomear a categoria na
planilha muda o endereço** — links antigos param de casar e caem na página
inicial, sem erro, mas caem.

As cápsulas no topo levam para essas mesmas páginas, e a busca continua
procurando no catálogo inteiro, atravessando categoria.

Para mudar quantas peças cabem em cada fileira, em `js/config.js`:

```js
PECAS_POR_CATEGORIA: 6,
```

> Mudar este número é mudança de **código**, não de planilha — precisa de
> commit. Seis preenche linha cheia em telas de 2, 3 e 4 colunas.

### Mudar o prazo de produção

O prazo vale para **todas** as peças e fica em um lugar só, em `js/config.js`:

```js
PRAZO_PRODUCAO_DIAS: 3,
```

Ele vira a linha "Sob encomenda · fica pronta em até 3 dias", logo abaixo do
preço. Não preencha prazo na planilha: como quase tudo é sob encomenda com o
mesmo prazo, repetir o número em cada linha só cria chance de esquecer uma na
hora de mudar.

A exceção tem saída: uma peça que demore mais pode ter o próprio número na
coluna `prazo_dias`, que vence o padrão.

> Mudar este número é mudança de **código**, não de planilha — precisa de commit
> e leva ~1 minuto de build, mais o cache. Trocar preço continua sendo instantâneo.

### Mudar o preço

Escreva só o número na coluna `preco`. Vale `35`, `35,00` ou `R$ 35,00`.
Deixar em branco faz a peça mostrar **"Preço sob consulta"** — que é como está
quase tudo hoje.

> ⚠️ **Decimal com vírgula.** A conta do Google está em português: `35.90` com
> ponto vira data e estraga a célula. Use `35,90`.

### As colunas, uma por uma

| Coluna | Obrigatória | O que é |
|---|---|---|
| `id` | sim | Apelido único na URL (`cachepo-curva`). Nunca mudar. |
| `ativo` | sim | `SIM` mostra, `NÃO` esconde. |
| `ordem` | não | Ordem na página, menor primeiro. Em branco vai pro fim. |
| `nome` | sim | Nome que aparece. **Tem que ser igual ao da aba Estoque**, senão o estoque não casa. |
| `categoria` | sim | Organiza a página: vira uma seção na home, uma cápsula no topo e uma página própria. Categoria nova aparece sozinha. |
| `descricao` | não | 1 a 3 frases. Pode ter vírgula. |
| `preco` | não | Número. Vazio = "Preço sob consulta". |
| `fotos` | não | Caminhos separados por `\|`. A primeira é a capa. |
| `cores` | não | Separadas por ponto-e-vírgula: `Terracota; Osso`. O cliente escolhe e a cor entra na mensagem do WhatsApp. |
| `personalizavel` | não | `SIM` avisa que a peça leva nome/texto e já abre espaço na mensagem. |
| `prazo_dias` | não | **Deixe vazio.** O prazo padrão é do site (`js/config.js` → `PRAZO_PRODUCAO_DIAS`, hoje 3 dias) e vale para todas as peças. Use esta coluna só na exceção: a peça que demora mais que as outras. |
| `disponivel` | não | **Fórmula** — não digitar à mão. Maior que 0 = "Pronta entrega". |
| `destaque` | não | `SIM` põe a peça na seção **Em destaque**, que abre a página inicial — e ela continua aparecendo na fileira da própria categoria. |
| `specs` | não | A ficha técnica em cima da foto: `PLA fosco · camada 0,20 mm · 120 × 112 × 98 mm`. |

---

## Configuração (feito uma vez)

### 1. Converter a planilha principal

`Favna_Planilha.xlsx` precisa virar Planilhas Google de verdade
(**Arquivo → Salvar como Planilhas Google**). O `IMPORTRANGE` não lê `.xlsx`.

### 2. Criar a `Favna_Catalogo`

Planilha nova, e dentro dela:

**Aba `Catalogo`** — importar `dados/modelo_catalogo.csv` (já vem com as 14 peças).

**Aba `_estoque`** — na célula A1:

```
=IMPORTRANGE("URL_DA_FAVNA_PLANILHA"; "'📦 Estoque'!B5:E200")
```

Clicar em **Permitir acesso** na primeira vez. Isso traz Peça (coluna 1) e
✅ Disponível (coluna 4).

**De volta na aba `Catalogo`**, coluna `disponivel`, linha 2 — e arrastar pra baixo:

```
=SEERRO(PROCV(D2; _estoque!A:D; 4; FALSO); 0)
```

`D2` é a coluna `nome`. Se o nome na `Catalogo` não for **idêntico** ao da aba
Estoque, o resultado é 0 e a peça aparece como "Sob encomenda".

### 3. Publicar só a aba do catálogo

**Arquivo → Compartilhar → Publicar na web** → escolher **a aba `Catalogo`**
(nunca "Documento inteiro") → formato **CSV** → Publicar. Copiar o link.

> 🔒 Publicar o documento inteiro exporia a aba `_estoque` e, por ela, dados da
> planilha principal. **Só a aba `Catalogo`.**

### 4. Ligar o site na planilha

Em `js/config.js`:

```js
CSV_URL: 'cole aqui o link do passo 3',
USAR_CSV_LOCAL: false,
WHATSAPP_NUMERO: '5527999998888',   // 55 + DDD + número, só dígitos
```

Enquanto `WHATSAPP_NUMERO` estiver com o texto `55DDDNUMERO`, o botão de pedido
não aparece — no lugar dele o site avisa que falta configurar. É de propósito:
melhor não ter botão do que ter um botão que abre conversa nenhuma.

Os **botões redondos flutuantes** (WhatsApp e Instagram, no canto de baixo à
direita) saem do mesmo arquivo:

```js
MENSAGEM_WHATSAPP_GERAL: 'Olá! Vim pelo catálogo e quero saber mais sobre as peças.',
INSTAGRAM_USUARIO: 'favna.3d',
```

Quem clica no flutuante ainda não escolheu peça nenhuma — por isso a mensagem é
geral, separada da mensagem do pedido. Deixar `INSTAGRAM_USUARIO` em branco
esconde o botão do Instagram; número de WhatsApp inválido esconde o outro.

### 5. Google Analytics (opcional)

```js
GA_MEASUREMENT_ID: 'G-XXXXXXXXXX',
```

Como conseguir o ID: analytics.google.com → Admin → Fluxos de dados → o site
`favna3d.com.br`. Em branco, a página não carrega o Analytics — mesma regra do
WhatsApp e do Instagram acima.

Com o ID preenchido, o site manda pageviews normais do GA4 e mais três eventos
próprios do funil:

| evento | quando dispara |
|---|---|
| `view_item` | abre o detalhe de uma peça |
| `pedir_whatsapp` | clica em "Pedir pelo WhatsApp" dentro do detalhe |
| `clique_flutuante` | clica no botão redondo de WhatsApp ou Instagram (parâmetro `canal`) |

É o que mostra, no GA, quantas visitas viram uma peça x quantas de fato
chegaram a clicar pra pedir — pageview sozinho não distingue isso.

---

## Testar no computador

O navegador bloqueia a leitura do CSV se você abrir o `index.html` com dois
cliques. Precisa de um servidor:

```bash
cd catalogo
python3 -m http.server 8000
# abrir http://localhost:8000
```

Com `USAR_CSV_LOCAL: true`, o site lê `dados/exemplo.csv` e mostra uma tarja
avisando que está em modo de teste.

---

## Publicar no GitHub Pages

1. Subir a pasta `catalogo/` para um repositório no GitHub.
2. Settings → Pages → Source: **Deploy from a branch** → branch `main`, pasta
   `/catalogo` (ou a raiz, se o repositório for só o catálogo).
3. O endereço sai em `https://<usuário>.github.io/<repositório>/`.

**O repositório é público.** Nada de custo, margem, lucro, nome de cliente ou
link de modelo do Patreon pode entrar em arquivo nenhum daqui.

### Qual endereço de CSV vale (testado)

Vale o link do **"Publicar na web"**, formato CSV — o que termina em
`/pub?gid=0&single=true&output=csv`. Testado em 12/09/2026 contra a origem do
GitHub Pages: o Google devolve `access-control-allow-origin: *` e o navegador
aceita a leitura sem reclamar.

Não é preciso deixar a planilha aberta a "qualquer pessoa com o link": a
publicação da aba basta, e é o arranjo mais fechado dos dois.

---

## Como o site se comporta quando algo dá errado

| Situação | O que o cliente vê |
|---|---|
| Google fora do ar, já visitou antes | A última versão salva no aparelho dele, com aviso |
| Google fora do ar, primeira visita | Recado pedindo pra recarregar ou chamar no WhatsApp |
| Linha sem `id` ou sem `nome` | A linha é ignorada, o resto carrega normal |
| Foto que não existe | Um retângulo neutro com textura de camadas, sem quebrar o layout |
| Busca sem resultado | "Nada encontrado para X" com sugestão de voltar pra Tudo |

---

## Arquivos

```
index.html              a página
css/style.css           visual (paleta e tipografia do Manual de Identidade v2)
js/config.js            ← o único arquivo que se mexe no dia a dia
js/app.js               a lógica: lê o CSV e monta a página
fotos/                  fotos das peças (com cópia num bucket privado do R2)
dados/exemplo.csv       cópia local pra testar sem internet
dados/modelo_catalogo.csv  o que importar na planilha nova
```

A única biblioteca externa é o PapaParse (lê o CSV), carregado do cdnjs.
Sem framework, sem build, sem `npm install`.
