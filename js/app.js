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

/** Endereço da página sem o hash — entra na mensagem do WhatsApp (REQ-31). */
function urlBase() {
  return location.origin + location.pathname;
}

/** Config do pedido no formato que as regras esperam. */
function configPedido() {
  return { numero: CONFIG.WHATSAPP_NUMERO, modelo: CONFIG.MENSAGEM_WHATSAPP };
}

function situacaoDe(produto) {
  return Regras.situacao(produto, { mostrarQuantidade: CONFIG.MOSTRAR_QUANTIDADE });
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

function cartao(produto) {
  const art = document.createElement('article');
  art.className = 'peca';

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
    img.addEventListener('error', () => moldura.classList.add('sem-foto'));
    moldura.appendChild(img);
  } else {
    moldura.classList.add('sem-foto');
  }
  if (produto.specs) {
    const ficha = document.createElement('p');
    ficha.className = 'ficha';
    ficha.textContent = produto.specs;
    moldura.appendChild(ficha);
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
  botao.appendChild(info);

  botao.addEventListener('click', () => abre(produto.id));
  art.appendChild(botao);
  return art;
}

function desenhaGrade() {
  const alvo = $('#grade');
  const lista = Regras.filtraProdutos(estado.produtos, {
    categoria: estado.categoria,
    busca: estado.busca,
  });
  alvo.innerHTML = '';

  if (!lista.length) {
    const vazio = $('#vazio');
    vazio.hidden = false;
    vazio.textContent = estado.busca
      ? `Nada encontrado para “${estado.busca}”. Tente outra palavra ou volte para Tudo.`
      : 'Nenhuma peça nesta categoria por enquanto.';
    return;
  }
  $('#vazio').hidden = true;
  lista.forEach((p) => alvo.appendChild(cartao(p)));
}

/* ---------- render: detalhe ---------- */

function desenhaDetalhe(produto) {
  const s = situacaoDe(produto);
  const corpo = $('#detalhe-corpo');
  corpo.innerHTML = '';

  const galeria = document.createElement('div');
  galeria.className = 'galeria';
  if (produto.fotos.length) {
    produto.fotos.forEach((src, i) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = `${produto.nome} — foto ${i + 1}`;
      img.loading = i === 0 ? 'eager' : 'lazy';
      img.addEventListener('error', () => img.remove());
      galeria.appendChild(img);
    });
  } else {
    galeria.classList.add('sem-foto');
  }
  corpo.appendChild(galeria);

  const texto = document.createElement('div');
  texto.className = 'detalhe-texto';

  const cat = document.createElement('p');
  cat.className = 'categoria';
  cat.textContent = produto.categoria;

  const h2 = document.createElement('h2');
  h2.id = 'detalhe-titulo';
  h2.textContent = produto.nome;

  const preco = document.createElement('p');
  preco.className = 'preco grande';
  preco.textContent = Regras.formataPreco(produto.preco);

  const sit = document.createElement('p');
  sit.className = 'situacao' + (s.pronta ? ' pronta' : '');
  sit.textContent = s.texto;

  texto.append(cat, h2, preco, sit);

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

    const linha = document.createElement('div');
    linha.className = 'cores-linha';
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
        linha.querySelectorAll('.cor').forEach((o) =>
          o.setAttribute('aria-pressed', String(o === b)));
        atualizaBotaoPedido(produto);
      });
      linha.appendChild(b);
    });
    bloco.appendChild(linha);
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
  a.textContent = 'Pedir pelo WhatsApp';
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

/** REQ-50 — link direto #/p/<id>. */
function aplicaHash() {
  const m = location.hash.match(/^#\/p\/(.+)$/);
  if (m) abre(decodeURIComponent(m[1]));
  else if (estado.aberto) fecha();
}

/* ---------- avisos (REQ-41, REQ-42, REQ-44) ---------- */

function mostraAviso(texto, tipo) {
  const alvo = $('#aviso-topo');
  if (!texto) { alvo.hidden = true; return; }
  alvo.hidden = false;
  alvo.className = `aviso-topo ${tipo || ''}`;
  alvo.textContent = texto;
}

/* ---------- início ---------- */

async function inicia() {
  $('#nome-loja').textContent = CONFIG.NOME_LOJA;
  $('#tagline').textContent = CONFIG.TAGLINE;
  $('#subtitulo').textContent = CONFIG.SUBTITULO;
  document.title = `${CONFIG.NOME_LOJA} — Catálogo`;

  $('#detalhe-fecha').addEventListener('click', fecha);
  $('#detalhe').addEventListener('click', (e) => { if (e.target.id === 'detalhe') fecha(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecha();
    prendeFoco(e);
  });
  window.addEventListener('popstate', aplicaHash);

  const campo = $('#busca');
  campo.addEventListener('input', () => { estado.busca = campo.value; desenhaGrade(); });

  try {
    await carrega();
  } catch (e) {
    $('#carregando').hidden = true;
    mostraAviso(
      'Não deu para carregar o catálogo agora. Verifique a conexão e recarregue a página — ' +
      'ou fale com a gente pelo WhatsApp.', 'erro');
    return;
  }

  $('#carregando').hidden = true;
  if (estado.origem === 'cache') {
    mostraAviso('Mostrando a última versão salva no seu aparelho — o catálogo online não respondeu agora.', 'atencao');
  } else if (estado.origem === 'local') {
    mostraAviso('Modo de teste: lendo dados/exemplo.csv, não a planilha.', 'atencao');
  }

  desenhaFiltros();
  desenhaGrade();
  aplicaHash();
}

document.addEventListener('DOMContentLoaded', inicia);
