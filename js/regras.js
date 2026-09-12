/* ============================================================
   FAVNA 3D — Catálogo · REGRAS DE NEGÓCIO
   ------------------------------------------------------------
   Só funções puras: nada de DOM, nada de fetch, nada de CONFIG
   global. É isso que permite testar sem navegador e sem build
   (ver ESPECIFICACAO.md REQ-71 e testes/regras.test.js).

   Cada função cita o requisito que ela cumpre.
   ============================================================ */

(function (raiz) {
  'use strict';

  /* ---------- texto ---------- */

  /**
   * REQ-24 — tira acento e caixa, para busca tolerante.
   * "Cachepô" e "cachepo" têm que casar.
   */
  function normaliza(texto) {
    return String(texto === null || texto === undefined ? '' : texto)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  /** REQ-05 — SIM / sim / S / TRUE / VERDADEIRO / 1 são verdadeiros. */
  function ehSim(valor) {
    const v = normaliza(valor);
    return v === 'sim' || v === 's' || v === 'true' || v === 'verdadeiro' || v === '1';
  }

  /** REQ-08 — "a; b ; c" → ["a","b","c"], descartando vazios. */
  function separaLista(bruto, separador) {
    return String(bruto === null || bruto === undefined ? '' : bruto)
      .split(separador)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
  }

  /* ---------- números e preço ---------- */

  /**
   * REQ-06 — lê número tolerando as formas que aparecem na planilha:
   * 35 · 35,00 · 35.00 · "R$ 35,00" · "R$ 1.250,00" · "1.250"
   *
   * ATENÇÃO: a conta Google desta casa usa vírgula decimal. Tanto "35,90"
   * quanto "35.90" precisam virar 35.9 — se o ponto fosse tratado como
   * milhar aqui, "35.90" viraria 3590 e o preço sairia 100x errado.
   * Regra: ponto só é separador de milhar quando há vírgula na string
   * (1.250,00) ou quando agrupa exatamente 3 dígitos (1.250).
   */
  function leNumero(valor) {
    if (valor === null || valor === undefined) return null;
    let t = String(valor).replace(/r\$/i, '').replace(/\s/g, '').trim();
    if (!t) return null;

    const temVirgula = t.indexOf(',') !== -1;
    const pontos = (t.match(/\./g) || []).length;

    if (temVirgula) {
      // 1.250,00 → ponto é milhar, vírgula é decimal
      t = t.replace(/\./g, '').replace(',', '.');
    } else if (pontos > 1) {
      // 1.250.000 → todos os pontos são milhar
      t = t.replace(/\./g, '');
    } else if (pontos === 1 && /^\d{1,3}\.\d{3}$/.test(t)) {
      // 1.250 → milhar. Mas 35.90 e 35.9 seguem sendo decimais.
      t = t.replace(/\./g, '');
    }

    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }

  const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  /** REQ-29 / REQ-06 — preço em BRL, ou o texto de consulta quando não há número. */
  function formataPreco(valor) {
    const n = leNumero(valor);
    return n === null ? 'Preço sob consulta' : moeda.format(n);
  }

  /* ---------- fotos ---------- */

  /**
   * REQ-26 — resolve o endereço de uma foto.
   * Caminho relativo e URL completa passam direto; link do Google Drive
   * (file/d/<ID>, open?id=, uc?id=) vira a URL de thumbnail que funciona
   * embutida numa tag <img>.
   */
  function resolveFoto(bruto) {
    const src = String(bruto === null || bruto === undefined ? '' : bruto).trim();
    if (!src) return '';
    const drive = src.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]{20,})/);
    if (drive) return 'https://drive.google.com/thumbnail?id=' + drive[1] + '&sz=w1000';
    return src;
  }

  /* ---------- produto ---------- */

  /**
   * REQ-04 / REQ-07 — converte uma linha crua do CSV em produto.
   * Devolve null se a linha não tem `id` ou `nome`: linha incompleta é
   * ignorada, nunca derruba o catálogo.
   */
  function montaProduto(linha) {
    const pega = function (campo) {
      const v = linha ? linha[campo] : '';
      return String(v === null || v === undefined ? '' : v).trim();
    };
    const id = pega('id');
    const nome = pega('nome');
    if (!id || !nome) return null;

    return {
      id: id,
      nome: nome,
      ativo: ehSim(pega('ativo')),
      ordem: leNumero(pega('ordem')),
      categoria: pega('categoria') || 'Outros',
      descricao: pega('descricao'),
      preco: pega('preco'),
      fotos: separaLista(pega('fotos'), '|').map(resolveFoto),
      cores: separaLista(pega('cores'), ';'),
      personalizavel: ehSim(pega('personalizavel')),
      prazoDias: leNumero(pega('prazo_dias')),
      disponivel: leNumero(pega('disponivel')) || 0,
      destaque: ehSim(pega('destaque')),
      specs: pega('specs'),
    };
  }

  /** REQ-03 — destaque primeiro, depois `ordem`, depois nome em pt-BR. */
  function ordenaProdutos(a, b) {
    if (a.destaque !== b.destaque) return a.destaque ? -1 : 1;
    const oa = a.ordem === null ? Infinity : a.ordem;   // ordem vazia vai para o fim
    const ob = b.ordem === null ? Infinity : b.ordem;
    if (oa !== ob) return oa - ob;
    return a.nome.localeCompare(b.nome, 'pt-BR');
  }

  /**
   * REQ-02 / REQ-03 / REQ-04 — recebe as linhas já interpretadas (o PapaParse
   * fica no app.js, fora daqui) e devolve o catálogo pronto: só peças ativas,
   * na ordem certa.
   */
  function montaCatalogo(linhas) {
    return (linhas || [])
      .map(montaProduto)
      .filter(function (p) { return p && p.ativo; })
      .sort(ordenaProdutos);
  }

  /* ---------- situação ---------- */

  /**
   * REQ-21 / REQ-22 — pronta entrega x sob encomenda.
   * A quantidade exata só aparece com mostrarQuantidade ligado.
   */
  function situacao(produto, opcoes) {
    const mostrarQuantidade = !!(opcoes && opcoes.mostrarQuantidade);
    if (produto.disponivel > 0) {
      return {
        texto: mostrarQuantidade
          ? 'Pronta entrega (' + produto.disponivel + ')'
          : 'Pronta entrega',
        pronta: true,
      };
    }
    return {
      texto: produto.prazoDias
        ? 'Sob encomenda · fica pronta em até ' + produto.prazoDias + ' dias'
        : 'Sob encomenda',
      pronta: false,
    };
  }

  /* ---------- busca e filtro ---------- */

  /** REQ-23 / REQ-24 — filtra por categoria e por texto, sem acento e sem caixa. */
  function filtraProdutos(produtos, criterios) {
    const categoria = (criterios && criterios.categoria) || 'todas';
    const busca = normaliza(criterios && criterios.busca);
    return (produtos || []).filter(function (p) {
      if (categoria !== 'todas' && p.categoria !== categoria) return false;
      if (!busca) return true;
      return normaliza(p.nome + ' ' + p.descricao + ' ' + p.categoria).indexOf(busca) !== -1;
    });
  }

  /** REQ-23 — as categorias saem dos próprios dados, na ordem em que aparecem. */
  function categoriasDe(produtos) {
    const vistas = [];
    (produtos || []).forEach(function (p) {
      if (vistas.indexOf(p.categoria) === -1) vistas.push(p.categoria);
    });
    return vistas;
  }

  /* ---------- cores ---------- */

  /**
   * REQ-15 — transforma o nome escrito na planilha no slug do catálogo de
   * cores: "Vermelho Fosco" -> "vermelho-fosco", "Ouro Envelhecido Silk" ->
   * "ouro-envelhecido-silk". É o mesmo slug do nome do arquivo da foto, então
   * acrescentar cor é só pôr a foto em assets/cores/ e rodar o script — sem
   * tabela de tradução para alguém esquecer de atualizar.
   */
  function slugDeCor(nome) {
    return normaliza(nome)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * REQ-15 / REQ-16 — acha a cor no catálogo. Devolve null quando não existe,
   * e aí a interface cai no rótulo de texto de sempre: cor sem amostra
   * cadastrada continua vendável, só não ganha o disco.
   */
  function amostraDeCor(nome, catalogo) {
    if (!nome || !catalogo) return null;
    return catalogo[slugDeCor(nome)] || null;
  }

  /**
   * REQ-17 — luminância relativa de um hex, 0 (preto) a 1 (branco).
   * Usa os pesos da percepção humana: o olho lê verde como muito mais
   * claro que azul na mesma intensidade. Serve para ordenar a paleta do
   * claro ao escuro de um jeito que pareça certo, não aritmeticamente certo.
   */
  function luminanciaDe(hex) {
    const m = String(hex || '').match(/^#?([0-9a-f]{6})$/i);
    if (!m) return 0;
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }

  // Ordem dos acabamentos na vitrine: o do dia a dia primeiro, os
  // especiais depois. Acabamento desconhecido cai no fim.
  const ORDEM_ACABAMENTO = ['fosco', 'silk', 'marmorizado', 'transparente'];

  /**
   * REQ-17 — o catálogo de cores virado numa lista para a vitrine:
   * agrupado por acabamento e, dentro de cada grupo, do mais claro ao mais
   * escuro. Assim a seção lê como uma cartela de cores, não como uma lista
   * alfabética.
   */
  function paletaOrdenada(catalogo) {
    if (!catalogo) return [];
    return Object.keys(catalogo)
      .map(function (slug) {
        const c = catalogo[slug];
        return {
          slug: slug,
          nome: c.nome,
          hex: c.hex,
          acabamento: c.acabamento,
        };
      })
      .sort(function (a, b) {
        let ia = ORDEM_ACABAMENTO.indexOf(a.acabamento);
        let ib = ORDEM_ACABAMENTO.indexOf(b.acabamento);
        if (ia === -1) ia = ORDEM_ACABAMENTO.length;
        if (ib === -1) ib = ORDEM_ACABAMENTO.length;
        if (ia !== ib) return ia - ib;
        const la = luminanciaDe(a.hex), lb = luminanciaDe(b.hex);
        if (la !== lb) return lb - la;              // claro primeiro
        return a.nome.localeCompare(b.nome, 'pt-BR');
      });
  }

  /* ---------- pedido ---------- */

  /** REQ-33 — 55 + DDD + número, só dígitos. Placeholder não passa. */
  function numeroConfigurado(numero) {
    return /^\d{12,13}$/.test(String(numero === null || numero === undefined ? '' : numero));
  }

  /**
   * REQ-31 / REQ-32 — monta o texto do pedido: nome, preço, cor escolhida,
   * pedido de personalização quando couber, e o link direto da peça.
   */
  function montaMensagem(produto, cor, modelo, urlBase) {
    let msg = String(modelo || '')
      .replace('{nome}', produto.nome)
      .replace('{preco}', formataPreco(produto.preco));
    if (cor) msg += ' Na cor ' + cor + '.';
    if (produto.personalizavel) msg += ' Gostaria de personalizar com: ';
    if (urlBase) msg += '\n\n' + urlBase + '#/p/' + produto.id;
    return msg;
  }

  /** REQ-30 — link do WhatsApp com a mensagem escapada. */
  function linkWhatsApp(produto, cor, config, urlBase) {
    const numero = config && config.numero;
    if (!numeroConfigurado(numero)) return null;   // REQ-33: sem número, sem link
    const msg = montaMensagem(produto, cor, config && config.modelo, urlBase);
    return 'https://wa.me/' + numero + '?text=' + encodeURIComponent(msg);
  }

  /* ---------- exporta ---------- */

  const Regras = {
    normaliza: normaliza,
    ehSim: ehSim,
    separaLista: separaLista,
    leNumero: leNumero,
    formataPreco: formataPreco,
    resolveFoto: resolveFoto,
    montaProduto: montaProduto,
    ordenaProdutos: ordenaProdutos,
    montaCatalogo: montaCatalogo,
    situacao: situacao,
    filtraProdutos: filtraProdutos,
    categoriasDe: categoriasDe,
    slugDeCor: slugDeCor,
    luminanciaDe: luminanciaDe,
    paletaOrdenada: paletaOrdenada,
    amostraDeCor: amostraDeCor,
    numeroConfigurado: numeroConfigurado,
    montaMensagem: montaMensagem,
    linkWhatsApp: linkWhatsApp,
  };

  // No navegador vira window.Regras; no node (testes) vira module.exports.
  raiz.Regras = Regras;
  if (typeof module !== 'undefined' && module.exports) module.exports = Regras;

})(typeof globalThis !== 'undefined' ? globalThis : this);
