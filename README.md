# Catálogo FAVNA 3D

**No ar: https://gbrcmg.github.io/favna3d-catalogo/**

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

Coloque o arquivo na pasta `fotos/` do repositório e escreva o caminho na coluna
`fotos`, assim: `fotos/vaso-ritmo-01.jpg`.

Para mais de uma foto, separe com uma barra vertical `|`. **A primeira é a capa:**

```
fotos/vaso-01.jpg|fotos/vaso-02.jpg|fotos/vaso-03.jpg
```

Também funciona um link do Google Drive — mas o arquivo precisa estar
compartilhado como "qualquer pessoa com o link". O site converte o endereço
sozinho. Foto do repositório é mais confiável e carrega mais rápido.

### A seção de cores

A página tem uma seção **"As cores"**, no fim, com todo o catálogo de cores:
amostra, nome e acabamento. Ela se monta sozinha a partir de `js/cores.js` —
cadastrar uma cor nova já a faz aparecer lá.

O endereço direto é útil no dia a dia: quando alguém pergunta que cores existem,
mande

```
https://gbrcmg.github.io/favna3d-catalogo/#cores
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
| `categoria` | sim | Vira um botão de filtro. Categoria nova cria botão novo sozinha. |
| `descricao` | não | 1 a 3 frases. Pode ter vírgula. |
| `preco` | não | Número. Vazio = "Preço sob consulta". |
| `fotos` | não | Caminhos separados por `\|`. A primeira é a capa. |
| `cores` | não | Separadas por ponto-e-vírgula: `Terracota; Osso`. O cliente escolhe e a cor entra na mensagem do WhatsApp. |
| `personalizavel` | não | `SIM` avisa que a peça leva nome/texto e já abre espaço na mensagem. |
| `prazo_dias` | não | Número. Vira "fica pronta em até N dias". |
| `disponivel` | não | **Fórmula** — não digitar à mão. Maior que 0 = "Pronta entrega". |
| `destaque` | não | `SIM` joga a peça pro começo da página. |
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
fotos/                  fotos das peças
dados/exemplo.csv       cópia local pra testar sem internet
dados/modelo_catalogo.csv  o que importar na planilha nova
```

A única biblioteca externa é o PapaParse (lê o CSV), carregado do cdnjs.
Sem framework, sem build, sem `npm install`.
