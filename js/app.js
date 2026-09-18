/* ============================================================
   FAVNA 3D — Catálogo
   Carrega o CSV (planilha publicada ou arquivo local) e monta a página.
   Sem framework, sem build. Única dependência: PapaParse.

   As regras de negócio NÃO moram aqui — estão em js/regras.js, isoladas
   do DOM para poderem ser testadas (ESPECIFICACAO.md REQ-71).
   Aqui fica só o que toca a tela.
   ============================================================ */

'use strict';

const CHAVE_CACHE = 'favna-catalogo-csv-v1';
const CHAVE_CACHE_DATA = 'favna-catalogo-csv-data-v1';

/* ---------- estado ---------- */

const estado = {
  produtos: [],
  categoria: 'todas',
  busca: '',
  aberto: null,      // produto aberto no detalhe
  corEscolhida: null,
  origem: null,      // 'planilha' | 'local' | 'cache'
};

const $ = (sel) => document.querySelector(sel);

const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
const telaLarga = window.matchMedia('(min-width: 880px)');

/** Endereço da página sem o hash — entra na mensagem do WhatsApp (REQ-31). */
function urlBase() {
  return location.origin + location.pathname;
}

/** Config do pedido no formato que as regras esperam. */
function configPedido() {
  return { numero: CONFIG.WHATSAPP_NUMERO, modelo: CONFIG.MENSAGEM_WHATSAPP };
}

function situacaoDe(produto) {
  return Regras.situacao(produto, {
    mostrarQuantidade: CONFIG.MOSTRAR_QUANTIDADE,
    prazoPadrao: CONFIG.PRAZO_PRODUCAO_DIAS,
  });
}

/** Índice de peça sempre com dois dígitos: 01, 02… 14. */
function doisDigitos(n) {
  return String(n).padStart(2, '0');
}

/* ============================================================
   PARALAXE
   Um só laço, preso ao requestAnimationFrame do scroll, movendo vários
   planos em velocidades diferentes. Cada elemento registrado recebe a
   variável --py em px; quem desenha o translate é o CSS.

   Quem pediu menos movimento (REQ-54) simplesmente não tem plano nenhum
   registrado: o laço fica vazio e nada é escrito.
   ============================================================ */

const paralaxe = {
  planos: [],
  ativo: !semMovimento.matches,

  /** velocidade em px: o curso total que o plano percorre na tela inteira. */
  registra(el, velocidade) {
    if (!this.ativo || !el) return;
    this.planos.push({ el: el, v: velocidade });
  },

  /** A grade é redesenhada a cada filtro: planos órfãos saem daqui. */
  limpaOrfaos() {
    this.planos = this.planos.filter((p) => p.el.isConnected);
  },

  atualiza() {
    if (!this.ativo) return;
    const altura = window.innerHeight;
    for (const plano of this.planos) {
      const r = plano.el.getBoundingClientRect();
      if (r.bottom < -300 || r.top > altura + 300) continue;
      // -1 quando o elemento está entrando por baixo, +1 quando já saiu por
      // cima; 0 no centro exato da tela.
      const desvio = ((r.top + r.height / 2) - altura / 2) / altura;
      plano.el.style.setProperty('--py', (desvio * plano.v).toFixed(2) + 'px');
    }
  },
};

/* ---------- laço único de scroll ---------- */

let tiqueAgendado = false;

function aoRolar() {
  if (tiqueAgendado) return;
  tiqueAgendado = true;
  requestAnimationFrame(() => {
    tiqueAgendado = false;
    revelaVisiveis();
    paralaxe.atualiza();
    atualizaBarra();
  });
}

/** Fio de progresso + sombra da barra quando ela desencosta da capa. */
function atualizaBarra() {
  const rolado = window.scrollY;
  const total = document.documentElement.scrollHeight - window.innerHeight;
  const fracao = total > 0 ? Math.min(1, Math.max(0, rolado / total)) : 0;

  const fio = $('#progresso-fio');
  if (fio) fio.style.transform = `scaleX(${fracao.toFixed(4)})`;

  const barra = $('#barra');
  if (barra) barra.classList.toggle('encostada', barra.getBoundingClientRect().top <= 0);

  // Os atalhos flutuantes entram quando a capa já saiu da tela.
  const flutuantes = $('#flutuantes');
  if (flutuantes && !flutuantes.hidden) {
    flutuantes.classList.toggle('mostra', rolado > window.innerHeight * 0.55);
  }

  // A capa se afasta enquanto some: o conteúdo desbota antes de sair.
  const capa = $('.capa-interna');
  if (capa && paralaxe.ativo) {
    const altura = window.innerHeight;
    capa.style.opacity = String(Math.max(0, 1 - (rolado / altura) * 1.25));
  }
}

/* ---------- leitura de fatiador (os números da capa) ---------- */

function escreveLeitura(rotulo, valor, unidade) {
  const alvo = $(rotulo);
  if (!alvo) return;
  alvo.textContent = valor;
  if (unidade) {
    const u = document.createElement('span');
    u.className = 'unidade';
    u.textContent = unidade;
    alvo.appendChild(u);
  }
}

function atualizaLeitura() {
  const cores = Regras.paletaOrdenada(typeof CORES === 'undefined' ? null : CORES);
  if (estado.produtos.length) escreveLeitura('#leitura-pecas', estado.produtos.length, 'no ar');
  if (cores.length) escreveLeitura('#leitura-cores', cores.length, 'filamentos');

  const prazo = CONFIG.PRAZO_PRODUCAO_DIAS;
  escreveLeitura('#leitura-prazo', prazo ? `até ${prazo}` : 'sob', prazo ? 'dias' : 'consulta');
}

/** A tagline vem da config; o conectivo curto ("&") vira o acento em terracota. */
function escreveTagline(texto) {
  const h1 = $('#tagline');
  if (!h1) return;
  h1.textContent = '';
  const palavras = String(texto || '').trim().split(/\s+/).filter(Boolean);
  palavras.forEach((palavra, i) => {
    const span = document.createElement('span');
    if (/^[&+]$|^e$/i.test(palavra)) span.className = 'elo';
    span.textContent = palavra;
    h1.appendChild(span);
    if (i < palavras.length - 1) h1.appendChild(document.createTextNode(' '));
  });
}

/* ---------- leitura do CSV ---------- */

/** O PapaParse fica aqui; a interpretação das linhas é das regras. */
function interpretaCsv(texto) {
  const r = Papa.parse(texto.trim(), { header: true, skipEmptyLines: true });
  return Regras.montaCatalogo(r.data);
}

/* ---------- cache offline (REQ-40 a REQ-43) ---------- */

function guardaCache(texto) {
  if (!CONFIG.USAR_CACHE_OFFLINE) return;
  try {
    localStorage.setItem(CHAVE_CACHE, texto);
    localStorage.setItem(CHAVE_CACHE_DATA, new Date().toISOString());
  } catch (e) { /* cheio ou bloqueado: seguir sem cache (REQ-43) */ }
}

function leCache() {
  if (!CONFIG.USAR_CACHE_OFFLINE) return null;
  try {
    const texto = localStorage.getItem(CHAVE_CACHE);
    if (!texto) return null;
    return { texto, data: localStorage.getItem(CHAVE_CACHE_DATA) };
  } catch (e) { return null; }
}

/* ---------- carregamento ---------- */

async function carrega() {
  const local = CONFIG.USAR_CSV_LOCAL || !CONFIG.CSV_URL;
  const url = local ? 'dados/exemplo.csv' : CONFIG.CSV_URL;

  try {
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const texto = await resp.text();
    const produtos = interpretaCsv(texto);
    if (!produtos.length) throw new Error('CSV sem produtos ativos');
    if (!local) guardaCache(texto);
    estado.produtos = produtos;
    estado.origem = local ? 'local' : 'planilha';
    return;
  } catch (erro) {
    console.warn('Falha ao carregar o catálogo:', erro);
  }

  const cache = leCache();
  if (cache) {
    estado.produtos = interpretaCsv(cache.texto);
    estado.origem = 'cache';
    if (estado.produtos.length) return;
  }
  throw new Error('sem-dados');
}

/* ---------- render: filtros ---------- */

function desenhaFiltros() {
  const alvo = $('#filtros');
  alvo.innerHTML = '';
  const categorias = Regras.categoriasDe(estado.produtos);
  [['todas', 'Tudo'], ...categorias.map((c) => [c, c])].forEach(([valor, rotulo]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'filtro';
    b.textContent = rotulo;
    b.setAttribute('aria-pressed', String(estado.categoria === valor));
    b.addEventListener('click', () => {
      estado.categoria = valor;
      desenhaFiltros();
      desenhaGrade();
    });
    alvo.appendChild(b);
  });
}

/* ---------- render: grade ---------- */

/* ---------- revelação em cascata ----------
   A peça nasce transparente e aparece quando entra na tela. A varredura
   mora no mesmo laço do paralaxe em vez de num IntersectionObserver à
   parte: é uma medida por peça ainda não revelada (nunca mais de algumas
   dezenas) e, principalmente, não existe o caso em que o observador não
   dispara e o catálogo inteiro fica invisível. */

let porRevelar = [];

function revelaVisiveis() {
  if (!porRevelar.length) return;
  const limite = window.innerHeight * 0.94;
  porRevelar = porRevelar.filter((peca) => {
    if (peca.getBoundingClientRect().top > limite) return true;
    peca.classList.add('vista');
    return false;
  });
}

function cartao(produto, indice) {
  const art = document.createElement('article');
  art.className = 'peca' + (produto.destaque ? ' destaque' : '');
  // A cascata escalona só dentro da fileira: a última peça de uma lista
  // longa não pode ficar meio segundo atrasada.
  art.style.setProperty('--atraso', `${(indice % 4) * 0.07}s`);

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'peca-abre';
  botao.setAttribute('aria-label', `Ver ${produto.nome}`);

  const moldura = document.createElement('div');
  moldura.className = 'peca-foto';

  if (produto.fotos[0]) {
    const img = document.createElement('img');
    img.src = produto.fotos[0];
    img.alt = produto.nome;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.className = 'capa-img';
    img.addEventListener('error', () => moldura.classList.add('sem-foto'));
    moldura.appendChild(img);
    paralaxe.registra(img, 22);

    // Segunda foto: a peça se vira no hover. Quem não tem, não ganha.
    if (produto.fotos[1]) {
      const virada = document.createElement('img');
      virada.src = produto.fotos[1];
      virada.alt = '';
      virada.setAttribute('aria-hidden', 'true');
      virada.loading = 'lazy';
      virada.decoding = 'async';
      virada.className = 'virada';
      virada.addEventListener('error', () => virada.remove());
      moldura.appendChild(virada);
      paralaxe.registra(virada, 22);
    }
  } else {
    moldura.classList.add('sem-foto');
  }

  const num = document.createElement('span');
  num.className = 'peca-indice';
  num.setAttribute('aria-hidden', 'true');
  num.textContent = doisDigitos(indice + 1);
  moldura.appendChild(num);

  if (produto.specs) {
    const ficha = document.createElement('p');
    ficha.className = 'ficha';
    ficha.textContent = produto.specs;
    moldura.appendChild(ficha);
    moldura.classList.add('com-ficha');
  }
  botao.appendChild(moldura);

  const info = document.createElement('div');
  info.className = 'peca-info';
  const s = situacaoDe(produto);

  const h3 = document.createElement('h3');
  h3.textContent = produto.nome;
  const preco = document.createElement('p');
  preco.className = 'preco';
  preco.textContent = Regras.formataPreco(produto.preco);
  const sit = document.createElement('p');
  sit.className = 'situacao' + (s.pronta ? ' pronta' : '');
  sit.textContent = s.texto;
  info.append(h3, preco, sit);

  // A peça em destaque ocupa duas colunas e sobra espaço de texto: a
  // primeira frase da descrição entra ali. O CSS esconde o resumo onde o
  // cartão não é partido em dois.
  if (produto.destaque && produto.descricao) {
    const resumo = document.createElement('p');
    resumo.className = 'peca-resumo';
    const frase = produto.descricao.split(/(?<=[.!?])\s/)[0];
    resumo.textContent = frase.length > 150 ? frase.slice(0, 147).trim() + '…' : frase;
    info.appendChild(resumo);
  }

  botao.appendChild(info);

  botao.addEventListener('click', () => abre(produto.id));
  art.appendChild(botao);

  porRevelar.push(art);
  return art;
}

function desenhaGrade() {
  const alvo = $('#grade');
  const lista = Regras.filtraProdutos(estado.produtos, {
    categoria: estado.categoria,
    busca: estado.busca,
  });
  alvo.innerHTML = '';
  porRevelar = [];
  paralaxe.limpaOrfaos();

  const conta = $('#grade-conta');
  if (conta) {
    conta.textContent = !estado.produtos.length ? ''
      : lista.length === estado.produtos.length
        ? `${doisDigitos(lista.length)} peças`
        : `${doisDigitos(lista.length)} de ${doisDigitos(estado.produtos.length)}`;
  }

  if (!lista.length) {
    const vazio = $('#vazio');
    vazio.hidden = false;
    vazio.textContent = estado.busca
      ? `Nada encontrado para “${estado.busca}”. Tente outra palavra ou volte para Tudo.`
      : 'Nenhuma peça nesta categoria por enquanto.';
    return;
  }
  $('#vazio').hidden = true;
  lista.forEach((p, i) => alvo.appendChild(cartao(p, i)));
  aoRolar();
  // Rede de segurança: se por qualquer motivo o quadro de animação demorar,
  // as peças que já estão na tela aparecem assim mesmo. Nunca um catálogo
  // em branco por causa de um efeito.
  setTimeout(revelaVisiveis, 400);
}

/* ---------- render: vitrine de cores (REQ-17) ---------- */

const NOME_ACABAMENTO = {
  fosco: 'fosco',
  silk: 'acetinado',
  marmorizado: 'mesclado',
  transparente: 'translúcido',
};

function desenhaPaleta() {
  const secao = $('#cores');
  const alvo = $('#paleta');
  const catalogo = typeof CORES === 'undefined' ? null : CORES;
  const cores = Regras.paletaOrdenada(catalogo);

  // Sem catálogo de cores, a seção inteira não existe — e isso importa mais
  // agora que ela fica antes das peças: um rótulo solto no meio da página
  // seria pior que nada.
  if (!cores.length) { secao.hidden = true; return; }

  // REQ-20 — o rótulo sai dos dados, nunca de texto fixo.
  $('#cores-rotulo').textContent = Regras.resumoDaPaleta(catalogo);

  alvo.innerHTML = '';
  cores.forEach((cor) => {
    const item = document.createElement('li');
    item.className = 'amostra';

    const disco = document.createElement('span');
    disco.className = 'amostra-disco cor-disco ' + cor.acabamento;
    disco.style.setProperty('--cor', cor.hex);
    disco.setAttribute('aria-hidden', 'true');

    const nome = document.createElement('p');
    nome.className = 'amostra-nome';
    nome.textContent = cor.nome;

    const acab = document.createElement('p');
    acab.className = 'amostra-acabamento';
    acab.textContent = NOME_ACABAMENTO[cor.acabamento] || cor.acabamento;

    item.append(disco, nome, acab);
    alvo.appendChild(item);
  });
  secao.hidden = false;
  // A trama de camadas do fundo desliza mais devagar que a faixa.
  paralaxe.registra(secao, 60);
  ligaCarrossel();
}

/* ---------- carrossel: setas e barra de posição (REQ-19) ---------- */

function atualizaCarrossel() {
  const trilho = $('#paleta');
  const p = Regras.progressoCarrossel(trilho);

  // Nada a rolar (poucas cores, tela larga): esconde os controles em vez
  // de deixar seta que não faz nada.
  $('#barra-posicao').hidden = !p.rola;
  $('#cor-antes').hidden = !p.rola || p.noInicio;
  $('#cor-depois').hidden = !p.rola || p.noFim;
  if (!p.rola) return;

  // O tento tem LARGURA_TENTO% da barra e precisa percorrer o resto dela.
  // translateX em % é relativo à largura do PRÓPRIO elemento, não à da
  // barra — daí a razão: percorrer 72% da barra são 257% do tento.
  const LARGURA_TENTO = 28;
  const curso = (100 - LARGURA_TENTO) / LARGURA_TENTO * 100;
  $('#barra-posicao-tento').style.transform =
    `translateX(${(p.fracao * curso).toFixed(2)}%)`;
}

function ligaCarrossel() {
  const trilho = $('#paleta');
  if (!trilho || trilho.dataset.ligado) { atualizaCarrossel(); return; }
  trilho.dataset.ligado = '1';

  // Um passo = a largura visível menos uma amostra, para a cor da borda
  // não ser pulada e servir de ponto de referência.
  const passo = () => Math.max(120, trilho.clientWidth - 110);
  const suave = !semMovimento.matches;

  const anda = (sentido) => trilho.scrollBy({
    left: sentido * passo(),
    behavior: suave ? 'smooth' : 'auto',
  });

  $('#cor-antes').addEventListener('click', () => anda(-1));
  $('#cor-depois').addEventListener('click', () => anda(1));
  trilho.addEventListener('scroll', atualizaCarrossel, { passive: true });
  window.addEventListener('resize', atualizaCarrossel);

  atualizaCarrossel();
}

/* ---------- render: detalhe ---------- */

/** Galeria com contador e miniaturas; arrasta no dedo, clica no desktop. */
function montaGaleria(produto) {
  const bloco = document.createElement('div');
  bloco.className = 'galeria-bloco';

  // O quadro existe para o contador se ancorar só na foto — ancorado no
  // bloco inteiro, ele caía por cima das miniaturas.
  const quadro = document.createElement('div');
  quadro.className = 'galeria-quadro';

  const galeria = document.createElement('div');
  galeria.className = 'galeria';
  galeria.id = 'galeria';

  // Uma foto que quebra some da galeria; se já houver contador e miniaturas,
  // eles se recontam. Com uma foto só, não há o que recontar — daí o gancho
  // começar vazio em vez de apontar para algo que ainda não existe.
  let aoQuebrarFoto = () => {};

  const fotos = [];
  produto.fotos.forEach((src, i) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = `${produto.nome} — foto ${i + 1}`;
    img.loading = i === 0 ? 'eager' : 'lazy';
    img.addEventListener('error', () => { img.remove(); aoQuebrarFoto(); });
    galeria.appendChild(img);
    fotos.push(img);
  });
  if (!fotos.length) galeria.classList.add('sem-foto');
  quadro.appendChild(galeria);
  bloco.appendChild(quadro);

  if (fotos.length < 2) return bloco;   // uma foto só: nada a contar nem navegar

  const conta = document.createElement('p');
  conta.className = 'galeria-conta';
  quadro.appendChild(conta);

  const tiras = document.createElement('div');
  tiras.className = 'galeria-miniaturas';

  const atual = () => {
    const largura = galeria.clientWidth || 1;
    return Math.round(galeria.scrollLeft / largura);
  };

  function atualizaConta() {
    const vivas = galeria.querySelectorAll('img');
    const i = Math.min(atual(), vivas.length - 1);
    conta.textContent = `${doisDigitos(i + 1)} / ${doisDigitos(vivas.length)}`;
    tiras.querySelectorAll('.miniatura').forEach((b, n) =>
      b.setAttribute('aria-current', String(n === i)));
  }

  fotos.forEach((img, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'miniatura';
    b.setAttribute('aria-label', `Ver foto ${i + 1}`);
    const mini = document.createElement('img');
    mini.src = img.src;
    mini.alt = '';
    b.appendChild(mini);
    b.addEventListener('click', () => vaiPara(i));
    tiras.appendChild(b);
  });
  bloco.appendChild(tiras);

  galeria.addEventListener('scroll', atualizaConta, { passive: true });
  aoQuebrarFoto = atualizaConta;
  atualizaConta();
  return bloco;
}

/** Leva a galeria aberta para a foto N (usada pelas miniaturas e setas). */
function vaiPara(indice) {
  const galeria = $('#galeria');
  if (!galeria) return;
  const fotos = galeria.querySelectorAll('img');
  const i = Math.max(0, Math.min(indice, fotos.length - 1));
  galeria.scrollTo({
    left: i * galeria.clientWidth,
    behavior: semMovimento.matches ? 'auto' : 'smooth',
  });
}

function andaGaleria(sentido) {
  const galeria = $('#galeria');
  if (!galeria) return;
  const largura = galeria.clientWidth || 1;
  vaiPara(Math.round(galeria.scrollLeft / largura) + sentido);
}

function desenhaDetalhe(produto) {
  const s = situacaoDe(produto);
  const corpo = $('#detalhe-corpo');
  corpo.innerHTML = '';
  corpo.appendChild(montaGaleria(produto));

  const texto = document.createElement('div');
  texto.className = 'detalhe-texto';

  const cat = document.createElement('p');
  cat.className = 'categoria';
  cat.textContent = produto.categoria;

  const h2 = document.createElement('h2');
  h2.id = 'detalhe-titulo';
  h2.textContent = produto.nome;

  const linha = document.createElement('div');
  linha.className = 'preco-linha';
  const preco = document.createElement('p');
  preco.className = 'preco grande';
  preco.textContent = Regras.formataPreco(produto.preco);
  const sit = document.createElement('p');
  sit.className = 'situacao' + (s.pronta ? ' pronta' : '');
  sit.textContent = s.texto;
  linha.append(preco, sit);

  texto.append(cat, h2, linha);

  if (produto.descricao) {
    const d = document.createElement('p');
    d.className = 'descricao';
    d.textContent = produto.descricao;
    texto.appendChild(d);
  }
  if (produto.specs) {
    const f = document.createElement('p');
    f.className = 'ficha ficha-detalhe';
    f.textContent = produto.specs;
    texto.appendChild(f);
  }

  if (produto.cores.length) {
    const bloco = document.createElement('div');
    bloco.className = 'cores';
    const rotulo = document.createElement('p');
    rotulo.className = 'rotulo-cor';
    rotulo.textContent = 'Cor';
    bloco.appendChild(rotulo);

    const linhaCores = document.createElement('div');
    linhaCores.className = 'cores-linha';
    produto.cores.forEach((cor, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cor';

      // REQ-15/REQ-16 — amostra do filamento quando a cor está no catálogo;
      // cor sem cadastro fica só com o rótulo, e continua vendável.
      const amostra = Regras.amostraDeCor(cor, typeof CORES === 'undefined' ? null : CORES);
      if (amostra) {
        const disco = document.createElement('span');
        disco.className = 'cor-disco ' + amostra.acabamento;
        disco.style.setProperty('--cor', amostra.hex);
        disco.setAttribute('aria-hidden', 'true');
        b.appendChild(disco);
      }
      b.appendChild(document.createTextNode(cor));
      b.setAttribute('aria-pressed', String(i === 0));
      b.addEventListener('click', () => {
        estado.corEscolhida = cor;
        linhaCores.querySelectorAll('.cor').forEach((o) =>
          o.setAttribute('aria-pressed', String(o === b)));
        atualizaBotaoPedido(produto);
      });
      linhaCores.appendChild(b);
    });
    bloco.appendChild(linhaCores);
    texto.appendChild(bloco);
    estado.corEscolhida = produto.cores[0];
  } else {
    estado.corEscolhida = null;
  }

  if (produto.personalizavel) {
    const p = document.createElement('p');
    p.className = 'personalizavel';
    p.textContent = 'Esta peça pode levar um nome ou texto seu.';
    texto.appendChild(p);
  }

  const acao = document.createElement('div');
  acao.className = 'acao';
  acao.id = 'acao-pedido';
  texto.appendChild(acao);

  corpo.appendChild(texto);
  atualizaBotaoPedido(produto);
}

/** REQ-30 / REQ-33 — botão de pedido, ou o aviso quando falta o número. */
function atualizaBotaoPedido(produto) {
  const alvo = $('#acao-pedido');
  if (!alvo) return;
  alvo.innerHTML = '';

  const url = Regras.linkWhatsApp(produto, estado.corEscolhida, configPedido(), urlBase());

  if (!url) {
    const aviso = document.createElement('p');
    aviso.className = 'aviso';
    aviso.textContent =
      'O número de WhatsApp ainda não foi configurado (js/config.js → WHATSAPP_NUMERO).';
    alvo.appendChild(aviso);
    return;
  }
  const a = document.createElement('a');
  a.className = 'botao-pedido';
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener';

  const rotulo = document.createElement('span');
  rotulo.textContent = 'Pedir pelo WhatsApp';
  const seta = document.createElement('span');
  seta.className = 'seta-pedido';
  seta.setAttribute('aria-hidden', 'true');
  seta.textContent = '→';

  a.append(rotulo, seta);
  alvo.appendChild(a);
}

/* ---------- abrir e fechar o detalhe ---------- */

let focoAnterior = null;

function abre(id) {
  const produto = estado.produtos.find((p) => p.id === id);
  if (!produto) return;
  estado.aberto = produto;
  focoAnterior = document.activeElement;
  desenhaDetalhe(produto);
  $('#detalhe').hidden = false;
  document.body.classList.add('travado');
  $('#detalhe-fecha').focus();
  if (location.hash !== `#/p/${id}`) history.pushState(null, '', `#/p/${id}`);
}

function fecha() {
  if (!estado.aberto) return;
  estado.aberto = null;
  $('#detalhe').hidden = true;
  document.body.classList.remove('travado');
  if (location.hash.startsWith('#/p/')) history.pushState(null, '', location.pathname);
  if (focoAnterior) focoAnterior.focus();
}

/** REQ-52 — prende o Tab dentro do diálogo enquanto ele está aberto. */
function prendeFoco(evento) {
  if (evento.key !== 'Tab' || !estado.aberto) return;
  const focaveis = $('#detalhe').querySelectorAll(
    'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])');
  if (!focaveis.length) return;
  const primeiro = focaveis[0];
  const ultimo = focaveis[focaveis.length - 1];
  if (evento.shiftKey && document.activeElement === primeiro) {
    evento.preventDefault(); ultimo.focus();
  } else if (!evento.shiftKey && document.activeElement === ultimo) {
    evento.preventDefault(); primeiro.focus();
  }
}

/**
 * REQ-50 — link direto #/p/<id>.
 * REQ-18 — link direto #cores para a vitrine de cores.
 *
 * A âncora nativa não resolve o #cores: o navegador tenta rolar no
 * carregamento, quando a seção ainda está `hidden`, e desiste. Por isso a
 * rolagem é feita aqui, depois de a vitrine existir.
 */
function aplicaHash() {
  const m = location.hash.match(/^#\/p\/(.+)$/);
  if (m) { abre(decodeURIComponent(m[1])); return; }

  if (estado.aberto) fecha();

  if (location.hash === '#cores') {
    const secao = $('#cores');
    if (secao && !secao.hidden) {
      secao.scrollIntoView({ block: 'start' });
    }
  }
}

/* ---------- avisos (REQ-41, REQ-42, REQ-44) ---------- */

function mostraAviso(texto, tipo) {
  const alvo = $('#aviso-topo');
  if (!texto) { alvo.hidden = true; return; }
  alvo.hidden = false;
  alvo.className = `aviso-topo ${tipo || ''}`;
  alvo.textContent = texto;
}

/* ---------- busca: gaveta no celular, campo fixo no desktop ---------- */

function ligaBusca() {
  const botao = $('#busca-abre');
  const bloco = $('#busca-linha');
  const campo = $('#busca');

  const ajusta = () => {
    // Em tela larga o campo é permanente: o atributo `hidden` sai, para o
    // leitor de tela não anunciar como escondido o que está à vista.
    if (telaLarga.matches) {
      bloco.hidden = false;
      botao.setAttribute('aria-expanded', 'true');
    } else if (!estado.busca) {
      bloco.hidden = true;
      botao.setAttribute('aria-expanded', 'false');
    }
  };

  botao.addEventListener('click', () => {
    const abrindo = bloco.hidden;
    bloco.hidden = !abrindo;
    botao.setAttribute('aria-expanded', String(abrindo));
    if (abrindo) campo.focus();
    else { campo.value = ''; estado.busca = ''; desenhaGrade(); }
  });

  campo.addEventListener('input', () => {
    estado.busca = campo.value;
    desenhaGrade();
  });

  telaLarga.addEventListener('change', ajusta);
  ajusta();
}

/* ---------- atalhos flutuantes ----------
   Os endereços saem do config.js. O que não estiver configurado não aparece:
   é a mesma regra do botão de pedido (REQ-33) — melhor nenhum botão que um
   botão que não abre conversa nenhuma. */

function ligaFlutuantes() {
  const caixa = $('#flutuantes');
  const zap = $('#flutuante-whatsapp');
  const insta = $('#flutuante-instagram');
  if (!caixa) return;
  let algum = false;

  if (Regras.numeroConfigurado(CONFIG.WHATSAPP_NUMERO)) {
    const recado = String(CONFIG.MENSAGEM_WHATSAPP_GERAL || '').trim();
    zap.href = 'https://wa.me/' + CONFIG.WHATSAPP_NUMERO +
      (recado ? '?text=' + encodeURIComponent(recado) : '');
    zap.hidden = false;
    algum = true;
  }

  // Aceita tanto "favna.3d" quanto "@favna.3d" — o arroba é o jeito como as
  // pessoas escrevem, e não faz parte do endereço.
  const usuario = String(CONFIG.INSTAGRAM_USUARIO || '').trim().replace(/^@/, '');
  if (usuario) {
    insta.href = 'https://instagram.com/' + encodeURIComponent(usuario);
    insta.hidden = false;
    algum = true;
  }

  caixa.hidden = !algum;
}

/* ---------- início ---------- */

async function inicia() {
  $('#nome-loja').textContent = CONFIG.NOME_LOJA;
  escreveTagline(CONFIG.TAGLINE);
  $('#subtitulo').textContent = CONFIG.SUBTITULO;
  document.title = `${CONFIG.NOME_LOJA} — Catálogo`;

  $('#detalhe-fecha').addEventListener('click', fecha);
  $('#detalhe').addEventListener('click', (e) => { if (e.target.id === 'detalhe') fecha(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecha();
    if (estado.aberto && e.key === 'ArrowLeft') andaGaleria(-1);
    if (estado.aberto && e.key === 'ArrowRight') andaGaleria(1);
    prendeFoco(e);
  });
  window.addEventListener('popstate', aplicaHash);

  ligaBusca();
  ligaFlutuantes();

  // Os planos de fundo da capa e do rodapé: o que anda mais depressa fica
  // mais longe, como numa vitrine com profundidade.
  paralaxe.registra($('.capa-fundo'), 150);
  paralaxe.registra($('.capa-luz'), -90);      // a luz vem na direção contrária
  paralaxe.registra($('.capa-interna'), 55);   // o texto atrasa em relação ao fundo
  paralaxe.registra($('.rodape-camadas'), 70);

  window.addEventListener('scroll', aoRolar, { passive: true });
  window.addEventListener('resize', aoRolar);
  aoRolar();

  // A vitrine de cores vem de js/cores.js, não do CSV: desenha antes do
  // fetch para continuar de pé mesmo se o catálogo de peças falhar.
  desenhaPaleta();
  atualizaLeitura();

  try {
    await carrega();
  } catch (e) {
    $('#carregando').hidden = true;
    mostraAviso(
      'Não deu para carregar o catálogo agora. Verifique a conexão e recarregue a página — ' +
      'ou fale com a gente pelo WhatsApp.', 'erro');
    aplicaHash();   // a vitrine de cores não depende do CSV: #cores segue valendo
    return;
  }

  $('#carregando').hidden = true;
  if (estado.origem === 'cache') {
    mostraAviso('Mostrando a última versão salva no seu aparelho — o catálogo online não respondeu agora.', 'atencao');
  } else if (estado.origem === 'local') {
    mostraAviso('Modo de teste: lendo dados/exemplo.csv, não a planilha.', 'atencao');
  }

  atualizaLeitura();
  desenhaFiltros();
  desenhaGrade();
  aplicaHash();
}

document.addEventListener('DOMContentLoaded', inicia);
