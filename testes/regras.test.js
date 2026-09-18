/* ============================================================
   FAVNA 3D — Catálogo · testes das regras de negócio
   ------------------------------------------------------------
   Rodar:  node --test testes/
   Sem npm, sem dependência: usa o test runner embutido do Node.

   Cada teste cita o requisito da ESPECIFICACAO.md que ele prova.
   Teste que não prova requisito nenhum não deveria existir aqui.
   ============================================================ */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const R = require('../js/regras.js');

/** O Intl usa espaço não-quebrável entre "R$" e o número. */
const semNbsp = (s) => s.replace(/ /g, ' ');

/* ============================================================
   REQ-05 — campos SIM/NÃO
   ============================================================ */

test('REQ-05: aceita as várias formas de "sim" da planilha', () => {
  ['SIM', 'sim', 'Sim', ' sim ', 'S', 's', 'TRUE', 'true',
   'VERDADEIRO', 'verdadeiro', '1'].forEach((v) => {
    assert.equal(R.ehSim(v), true, `"${v}" deveria ser verdadeiro`);
  });
});

test('REQ-05: qualquer outra coisa é falso', () => {
  ['NÃO', 'NAO', 'nao', 'n', 'FALSE', '0', '', '   ', null, undefined, 'talvez']
    .forEach((v) => {
      assert.equal(R.ehSim(v), false, `"${v}" deveria ser falso`);
    });
});

/* ============================================================
   REQ-06 — leitura de preço. O requisito mais perigoso do projeto:
   a conta Google desta casa usa vírgula decimal.
   ============================================================ */

test('REQ-06: vírgula e ponto decimais chegam ao mesmo número', () => {
  assert.equal(R.leNumero('35,90'), 35.9);
  assert.equal(R.leNumero('35.90'), 35.9);
  assert.equal(R.leNumero('0,16'), 0.16);
  assert.equal(R.leNumero('0.16'), 0.16);
});

test('REQ-06: aceita as formas que aparecem na planilha', () => {
  assert.equal(R.leNumero(35), 35);
  assert.equal(R.leNumero('35'), 35);
  assert.equal(R.leNumero('35,00'), 35);
  assert.equal(R.leNumero('R$ 35,00'), 35);
  assert.equal(R.leNumero('r$35'), 35);
  assert.equal(R.leNumero(' 90 '), 90);
});

test('REQ-06: ponto como separador de milhar', () => {
  assert.equal(R.leNumero('R$ 1.250,00'), 1250);
  assert.equal(R.leNumero('1.250'), 1250);       // 3 dígitos após o ponto = milhar
  assert.equal(R.leNumero('1.250.000'), 1250000);
});

test('REQ-06: sem número devolve null, não zero', () => {
  // null tem que ser diferente de 0: 0 significaria "de graça".
  [null, undefined, '', '   ', 'sob consulta', 'R$', 'abc'].forEach((v) => {
    assert.equal(R.leNumero(v), null, `"${v}" deveria ser null`);
  });
});

test('REQ-06/REQ-29: preço vazio vira "Preço sob consulta"', () => {
  assert.equal(R.formataPreco(''), 'Preço sob consulta');
  assert.equal(R.formataPreco(null), 'Preço sob consulta');
  assert.equal(R.formataPreco('combinar'), 'Preço sob consulta');
});

test('REQ-29: preço sai formatado em real brasileiro', () => {
  assert.equal(semNbsp(R.formataPreco(90)), 'R$ 90,00');
  assert.equal(semNbsp(R.formataPreco('95')), 'R$ 95,00');
  assert.equal(semNbsp(R.formataPreco('35,90')), 'R$ 35,90');
  assert.equal(semNbsp(R.formataPreco('1250')), 'R$ 1.250,00');
});

/* ============================================================
   REQ-24 — busca sem acento e sem caixa
   ============================================================ */

test('REQ-24: "cachepo" encontra "Cachepô"', () => {
  assert.equal(R.normaliza('Cachepô'), 'cachepo');
  assert.equal(R.normaliza('PORTA-PINCÉIS GEO'), 'porta-pinceis geo');
  assert.equal(R.normaliza('  Óculos  '), 'oculos');
  assert.equal(R.normaliza('Sandália'), 'sandalia');
});

/* ============================================================
   REQ-08 — listas de fotos e cores
   ============================================================ */

test('REQ-08: fotos separadas por barra vertical, cores por ponto-e-vírgula', () => {
  assert.deepEqual(R.separaLista('a.jpg|b.jpg|c.jpg', '|'), ['a.jpg', 'b.jpg', 'c.jpg']);
  assert.deepEqual(R.separaLista('Creme; Terracota', ';'), ['Creme', 'Terracota']);
});

test('REQ-08: espaços e itens vazios são descartados', () => {
  assert.deepEqual(R.separaLista(' a.jpg | b.jpg ', '|'), ['a.jpg', 'b.jpg']);
  assert.deepEqual(R.separaLista('a.jpg||b.jpg', '|'), ['a.jpg', 'b.jpg']);
  assert.deepEqual(R.separaLista('', '|'), []);
  assert.deepEqual(R.separaLista(null, ';'), []);
});

/* ============================================================
   REQ-26 — fotos: relativo, URL e Google Drive
   ============================================================ */

test('REQ-26: caminho relativo e URL completa passam intactos', () => {
  assert.equal(R.resolveFoto('fotos/vaso.jpg'), 'fotos/vaso.jpg');
  assert.equal(R.resolveFoto(' fotos/vaso.jpg '), 'fotos/vaso.jpg');
  assert.equal(R.resolveFoto('https://exemplo.com/v.jpg'), 'https://exemplo.com/v.jpg');
  assert.equal(R.resolveFoto(''), '');
});

test('REQ-26: link do Drive vira URL de thumbnail', () => {
  const id = '1x4H26T2HGiERUqzXMrmBWC_MdacChpVu';
  const esperado = `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
  assert.equal(R.resolveFoto(`https://drive.google.com/file/d/${id}/view?usp=sharing`), esperado);
  assert.equal(R.resolveFoto(`https://drive.google.com/open?id=${id}`), esperado);
  assert.equal(R.resolveFoto(`https://drive.google.com/uc?id=${id}`), esperado);
});

/* ============================================================
   REQ-04 / REQ-07 — leitura tolerante das linhas
   ============================================================ */

test('REQ-04: linha sem id ou sem nome é descartada', () => {
  assert.equal(R.montaProduto({ id: '', nome: 'Vaso' }), null);
  assert.equal(R.montaProduto({ id: 'vaso', nome: '' }), null);
  assert.equal(R.montaProduto({ id: '  ', nome: '  ' }), null);
  assert.equal(R.montaProduto({}), null);
});

test('REQ-07: espaços em volta dos valores são aparados', () => {
  const p = R.montaProduto({
    id: ' vaso-01 ', nome: ' Vaso Ritmo ', categoria: ' Vasos ',
    ativo: ' SIM ', preco: ' 90 ',
  });
  assert.equal(p.id, 'vaso-01');
  assert.equal(p.nome, 'Vaso Ritmo');
  assert.equal(p.categoria, 'Vasos');
  assert.equal(p.ativo, true);
});

test('REQ-04: categoria vazia cai em "Outros" em vez de ficar sem filtro', () => {
  assert.equal(R.montaProduto({ id: 'x', nome: 'X' }).categoria, 'Outros');
});

test('REQ-04: uma linha ruim não derruba o catálogo', () => {
  const catalogo = R.montaCatalogo([
    { id: 'bom-1', nome: 'Bom 1', ativo: 'SIM', ordem: '1' },
    { id: '', nome: 'Sem id', ativo: 'SIM' },
    { nome: 'Sem id nenhum', ativo: 'SIM' },
    { id: 'bom-2', nome: 'Bom 2', ativo: 'SIM', ordem: '2' },
  ]);
  assert.deepEqual(catalogo.map((p) => p.id), ['bom-1', 'bom-2']);
});

/* ============================================================
   REQ-02 — só peças ativas
   ============================================================ */

test('REQ-02: ativo=NÃO fica fora do site mas segue na planilha', () => {
  const catalogo = R.montaCatalogo([
    { id: 'visivel', nome: 'Visível', ativo: 'SIM' },
    { id: 'porta-vinho-reserva', nome: 'Porta-Vinho Reserva', ativo: 'NÃO' },
    { id: 'sem-campo', nome: 'Sem campo ativo' },
  ]);
  assert.deepEqual(catalogo.map((p) => p.id), ['visivel']);
});

/* ============================================================
   REQ-03 — ordem de exibição
   ============================================================ */

test('REQ-03: destaque vem primeiro, depois ordem, depois nome', () => {
  const catalogo = R.montaCatalogo([
    { id: 'c', nome: 'Comum C', ativo: 'SIM', ordem: '3' },
    { id: 'a', nome: 'Comum A', ativo: 'SIM', ordem: '1' },
    { id: 'd', nome: 'Destaque D', ativo: 'SIM', ordem: '9', destaque: 'SIM' },
    { id: 'b', nome: 'Comum B', ativo: 'SIM', ordem: '2' },
  ]);
  assert.deepEqual(catalogo.map((p) => p.id), ['d', 'a', 'b', 'c']);
});

test('REQ-03: ordem vazia vai para o fim, não para o começo', () => {
  const catalogo = R.montaCatalogo([
    { id: 'sem-ordem', nome: 'Sem ordem', ativo: 'SIM', ordem: '' },
    { id: 'com-ordem', nome: 'Com ordem', ativo: 'SIM', ordem: '5' },
  ]);
  assert.deepEqual(catalogo.map((p) => p.id), ['com-ordem', 'sem-ordem']);
});

test('REQ-03: empate na ordem desempata por nome em pt-BR', () => {
  const catalogo = R.montaCatalogo([
    { id: 'o', nome: 'Órbita', ativo: 'SIM', ordem: '1' },
    { id: 'a', nome: 'Ânfora', ativo: 'SIM', ordem: '1' },
    { id: 'c', nome: 'Cachepô', ativo: 'SIM', ordem: '1' },
  ]);
  // Em pt-BR, Â vem antes de C, que vem antes de Ó.
  assert.deepEqual(catalogo.map((p) => p.id), ['a', 'c', 'o']);
});

/* ============================================================
   REQ-21 / REQ-22 — pronta entrega x sob encomenda
   ============================================================ */

test('REQ-21: estoque maior que zero é pronta entrega', () => {
  const s = R.situacao({ disponivel: 3 }, {});
  assert.equal(s.pronta, true);
  assert.equal(s.texto, 'Pronta entrega');
});

test('REQ-21: a quantidade exata não vaza sem MOSTRAR_QUANTIDADE', () => {
  assert.equal(R.situacao({ disponivel: 7 }, {}).texto, 'Pronta entrega');
  assert.equal(R.situacao({ disponivel: 7 }, { mostrarQuantidade: false }).texto, 'Pronta entrega');
  assert.equal(R.situacao({ disponivel: 7 }, { mostrarQuantidade: true }).texto, 'Pronta entrega (7)');
});

test('REQ-22: sem estoque é sob encomenda', () => {
  const s = R.situacao({ disponivel: 0 }, {});
  assert.equal(s.pronta, false);
  assert.equal(s.texto, 'Sob encomenda');
});

test('REQ-22: havendo prazo, ele entra no texto', () => {
  assert.equal(
    R.situacao({ disponivel: 0, prazoDias: 10 }, {}).texto,
    'Sob encomenda · fica pronta em até 10 dias');
});

test('REQ-21: disponivel ilegível é tratado como zero, não como estoque', () => {
  // Se o PROCV da planilha falhar e devolver texto, a peça não pode
  // prometer pronta entrega.
  const p = R.montaProduto({ id: 'x', nome: 'X', disponivel: '#N/D' });
  assert.equal(p.disponivel, 0);
  assert.equal(R.situacao(p, {}).pronta, false);
});

/* ============================================================
   REQ-23 / REQ-24 — filtro e busca
   ============================================================ */

const amostra = R.montaCatalogo([
  { id: 'cachepo-curva', nome: 'Cachepô Curva', categoria: 'Vasos e cachepôs',
    descricao: 'Uma diagonal fluida separa duas texturas.', ativo: 'SIM', ordem: '1' },
  { id: 'porta-objetos', nome: 'Porta-Objetos', categoria: 'Mesa e escritório',
    descricao: 'Chave, relógio, o anel que sai da mão.', ativo: 'SIM', ordem: '2' },
  { id: 'mini-vaso', nome: 'Mini Vaso Canelado', categoria: 'Vasos e cachepôs',
    descricao: 'Um cilindro pequeno e canelado.', ativo: 'SIM', ordem: '3' },
]);

test('REQ-23: categorias saem dos dados, sem repetir', () => {
  assert.deepEqual(R.categoriasDe(amostra), ['Vasos e cachepôs', 'Mesa e escritório']);
});

test('REQ-23: filtro por categoria', () => {
  const r = R.filtraProdutos(amostra, { categoria: 'Vasos e cachepôs' });
  assert.deepEqual(r.map((p) => p.id), ['cachepo-curva', 'mini-vaso']);
});

test('REQ-23: "todas" não filtra nada', () => {
  assert.equal(R.filtraProdutos(amostra, { categoria: 'todas' }).length, 3);
  assert.equal(R.filtraProdutos(amostra, {}).length, 3);
});

test('REQ-24: busca ignora acento e caixa', () => {
  assert.deepEqual(R.filtraProdutos(amostra, { busca: 'cachepo' }).map((p) => p.id),
    ['cachepo-curva', 'mini-vaso']);   // um pelo nome, outro pela categoria
  assert.deepEqual(R.filtraProdutos(amostra, { busca: 'CACHEPÔ CURVA' }).map((p) => p.id),
    ['cachepo-curva']);
});

test('REQ-24: busca alcança a descrição', () => {
  assert.deepEqual(R.filtraProdutos(amostra, { busca: 'relogio' }).map((p) => p.id),
    ['porta-objetos']);
});

test('REQ-24: busca e categoria se somam', () => {
  const r = R.filtraProdutos(amostra, { categoria: 'Vasos e cachepôs', busca: 'canelado' });
  assert.deepEqual(r.map((p) => p.id), ['mini-vaso']);
});

test('REQ-24: busca sem resultado devolve lista vazia, não erro', () => {
  assert.deepEqual(R.filtraProdutos(amostra, { busca: 'guarda-chuva' }), []);
});

/* ============================================================
   REQ-36 — seções por categoria e página da categoria
   ============================================================ */

test('REQ-36: agrupa na ordem em que as categorias aparecem', () => {
  const secoes = R.agrupaPorCategoria(amostra);
  assert.deepEqual(secoes.map((s) => s.categoria),
    ['Vasos e cachepôs', 'Mesa e escritório']);
  assert.deepEqual(secoes[0].pecas.map((p) => p.id), ['cachepo-curva', 'mini-vaso']);
});

test('REQ-36: o slug da categoria sai do nome, sem cadastro', () => {
  const secoes = R.agrupaPorCategoria(amostra);
  assert.equal(secoes[0].slug, 'vasos-e-cachepos');
  assert.equal(secoes[1].slug, 'mesa-e-escritorio');
});

test('REQ-36: o limite corta a seção e avisa que há mais', () => {
  const secoes = R.agrupaPorCategoria(amostra, 1);
  assert.deepEqual(secoes[0].pecas.map((p) => p.id), ['cachepo-curva']);
  assert.equal(secoes[0].total, 2);
  assert.equal(secoes[0].temMais, true);
  // A categoria que cabe inteira não ganha "Ver tudo".
  assert.equal(secoes[1].temMais, false);
  assert.equal(secoes[1].total, 1);
});

test('REQ-36: sem limite, a seção vem inteira', () => {
  const secoes = R.agrupaPorCategoria(amostra);
  assert.equal(secoes[0].pecas.length, 2);
  assert.equal(secoes[0].temMais, false);
});

test('REQ-36: catálogo vazio não gera seção nenhuma', () => {
  assert.deepEqual(R.agrupaPorCategoria([], 6), []);
  assert.deepEqual(R.agrupaPorCategoria(null, 6), []);
});

test('REQ-36: o slug da URL volta a ser o nome escrito na planilha', () => {
  assert.equal(R.categoriaPorSlug(amostra, 'vasos-e-cachepos'), 'Vasos e cachepôs');
  assert.equal(R.categoriaPorSlug(amostra, 'mesa-e-escritorio'), 'Mesa e escritório');
});

test('REQ-36: slug desconhecido devolve nulo — a rota não inventa categoria', () => {
  assert.equal(R.categoriaPorSlug(amostra, 'guarda-chuvas'), null);
  assert.equal(R.categoriaPorSlug(amostra, ''), null);
  assert.equal(R.categoriaPorSlug(amostra, undefined), null);
});

test('REQ-36: o slug é o mesmo para cor e para categoria', () => {
  assert.equal(R.slug('Cozinha e ritual'), 'cozinha-e-ritual');
  assert.equal(R.slug('  Joias   e Acessórios  '), 'joias-e-acessorios');
  assert.equal(R.slug('Banheiro & beleza'), 'banheiro-beleza');
  assert.equal(R.slug(R.slug('Mesa e escritório')), 'mesa-e-escritorio');
});

/* ============================================================
   REQ-38 — seção de destaques
   ============================================================ */

const comDestaque = R.montaCatalogo([
  { id: 'a', nome: 'Peça A', categoria: 'Vasos', ativo: 'SIM', ordem: '2', destaque: 'SIM' },
  { id: 'b', nome: 'Peça B', categoria: 'Vasos', ativo: 'SIM', ordem: '3' },
  { id: 'c', nome: 'Peça C', categoria: 'Mesa', ativo: 'SIM', ordem: '1', destaque: 'SIM' },
]);

test('REQ-38: só as peças marcadas como destaque entram', () => {
  assert.deepEqual(R.destaquesDe(comDestaque).map((p) => p.id), ['c', 'a']);
});

test('REQ-38: o destaque continua na prateleira da própria categoria', () => {
  const secoes = R.agrupaPorCategoria(comDestaque);
  const vasos = secoes.filter((s) => s.categoria === 'Vasos')[0];
  assert.deepEqual(vasos.pecas.map((p) => p.id), ['a', 'b']);
});

test('REQ-38: sem destaque na planilha, a seção não existe', () => {
  const semNenhum = R.montaCatalogo([
    { id: 'x', nome: 'Peça X', categoria: 'Vasos', ativo: 'SIM' },
  ]);
  assert.deepEqual(R.destaquesDe(semNenhum), []);
  assert.deepEqual(R.destaquesDe([]), []);
  assert.deepEqual(R.destaquesDe(null), []);
});

/* ============================================================
   REQ-30 a REQ-33 — pedido pelo WhatsApp
   ============================================================ */

const peca = R.montaProduto({
  id: 'mini-vaso-canelado', nome: 'Mini Vaso Canelado', ativo: 'SIM',
  preco: '90', cores: 'Creme; Terracota',
});

const modelo = 'Olá! Vi no catálogo e quero o *{nome}* ({preco}).';
const config = { numero: '5527999998888', modelo: modelo };

test('REQ-31: a mensagem leva nome e preço', () => {
  const msg = R.montaMensagem(peca, null, modelo, '');
  assert.ok(msg.includes('Mini Vaso Canelado'), 'falta o nome');
  assert.ok(semNbsp(msg).includes('R$ 90,00'), 'falta o preço formatado');
});

test('REQ-31: a cor escolhida entra na mensagem', () => {
  assert.ok(R.montaMensagem(peca, 'Terracota', modelo, '').includes('Na cor Terracota.'));
  assert.ok(!R.montaMensagem(peca, null, modelo, '').includes('Na cor'));
});

test('REQ-31: a mensagem leva o link direto da peça', () => {
  const msg = R.montaMensagem(peca, null, modelo, 'https://favna.github.io/catalogo/');
  assert.ok(msg.includes('https://favna.github.io/catalogo/#/p/mini-vaso-canelado'));
});

test('REQ-32: peça personalizável pede o texto do cliente', () => {
  const custom = R.montaProduto({ id: 'mao', nome: 'Mão Porta-Joias',
    ativo: 'SIM', personalizavel: 'SIM' });
  assert.ok(R.montaMensagem(custom, null, modelo, '').includes('Gostaria de personalizar com:'));
  assert.ok(!R.montaMensagem(peca, null, modelo, '').includes('personalizar'));
});

test('REQ-30: o link é wa.me com a mensagem escapada', () => {
  const url = R.linkWhatsApp(peca, 'Creme', config, 'https://exemplo.com/');
  assert.ok(url.startsWith('https://wa.me/5527999998888?text='));
  const texto = url.split('?text=')[1];
  // Espaço e quebra de linha crus quebrariam a URL. O `*` do negrito do
  // WhatsApp sobrevive literal de propósito: encodeURIComponent não o
  // escapa e não precisa — asterisco é válido em query string.
  assert.ok(!/[ \n]/.test(texto), 'a mensagem não foi escapada');
  assert.ok(texto.includes('%20'), 'os espaços deveriam ter virado %20');
  assert.ok(decodeURIComponent(texto).includes('*Mini Vaso Canelado*'));
});

test('REQ-33: sem número configurado não existe link de pedido', () => {
  assert.equal(R.linkWhatsApp(peca, null, { numero: '55DDDNUMERO', modelo }, ''), null);
  assert.equal(R.linkWhatsApp(peca, null, { numero: '', modelo }, ''), null);
  assert.equal(R.linkWhatsApp(peca, null, {}, ''), null);
});

test('REQ-33: valida o formato 55 + DDD + número', () => {
  assert.equal(R.numeroConfigurado('5527999998888'), true);   // 13 dígitos, celular
  assert.equal(R.numeroConfigurado('552733334444'), true);    // 12 dígitos, fixo
  assert.equal(R.numeroConfigurado('55DDDNUMERO'), false);    // o placeholder
  assert.equal(R.numeroConfigurado('27999998888'), false);    // falta o 55
  assert.equal(R.numeroConfigurado('+55 27 99999-8888'), false); // precisa ser só dígito
  assert.equal(R.numeroConfigurado(''), false);
  assert.equal(R.numeroConfigurado(null), false);
});

/* ============================================================
   REQ-10 — privacidade: o catálogo real não pode ter dado interno
   ============================================================ */

test('REQ-10: o produto exposto só tem campos públicos', () => {
  // Se alguém acrescentar uma coluna de custo na planilha, ela não deve
  // atravessar para o objeto que o site usa.
  const p = R.montaProduto({
    id: 'x', nome: 'X', ativo: 'SIM',
    custo: '14,43', margem: '0,3', cliente: 'Papelaria Estrela',
    lucro_renata: '12', link_modelo: 'https://patreon.com/posts/123',
  });
  const permitidos = ['id', 'nome', 'ativo', 'ordem', 'categoria', 'descricao',
    'preco', 'fotos', 'cores', 'personalizavel', 'prazoDias', 'disponivel',
    'destaque', 'specs'];
  assert.deepEqual(Object.keys(p).sort(), permitidos.slice().sort());
});

/* ============================================================
   REQ-15 / REQ-16 — catálogo de cores
   ============================================================ */

const CORES = require('../js/cores.js');

test('REQ-15: o nome da planilha vira o slug do arquivo da foto', () => {
  assert.equal(R.slugDeCor('Terracota'), 'terracota');
  assert.equal(R.slugDeCor('Vermelho fosco'), 'vermelho-fosco');
  assert.equal(R.slugDeCor('Ouro Envelhecido Silk'), 'ouro-envelhecido-silk');
  assert.equal(R.slugDeCor('Verde Oliva'), 'verde-oliva');
});

test('REQ-15: acento, caixa e espaço extra não impedem o casamento', () => {
  // Quem digita na planilha não deveria ter que acertar a grafia exata.
  assert.equal(R.slugDeCor('BORDÔ'), 'bordo');
  assert.equal(R.slugDeCor('  Marrom   Chocolate  '), 'marrom-chocolate');
  assert.equal(R.slugDeCor('Azul-Marinho'), 'azul-marinho');
  assert.equal(R.slugDeCor('Preto Matte'), 'preto-matte');
});

test('REQ-15: cor cadastrada devolve hex e acabamento', () => {
  const a = R.amostraDeCor('Terracota', CORES);
  assert.ok(a, 'Terracota deveria estar no catálogo');
  assert.match(a.hex, /^#[0-9A-F]{6}$/);
  assert.equal(a.acabamento, 'fosco');
});

test('REQ-16: cor sem amostra devolve null, e a peça segue vendável', () => {
  // A interface cai no rótulo de texto. Não é erro: é o estado normal
  // enquanto o catálogo de cores não está completo.
  assert.equal(R.amostraDeCor('Creme', CORES), null);
  assert.equal(R.amostraDeCor('Cor Que Não Existe', CORES), null);
  assert.equal(R.amostraDeCor('', CORES), null);
  assert.equal(R.amostraDeCor(null, CORES), null);
});

test('REQ-16: sem catálogo carregado nada quebra', () => {
  // Se js/cores.js falhar em carregar, o site continua de pé.
  assert.equal(R.amostraDeCor('Terracota', null), null);
  assert.equal(R.amostraDeCor('Terracota', undefined), null);
});

test('REQ-15: todo item do catálogo de cores está bem formado', () => {
  const acabamentos = ['fosco', 'silk', 'marmorizado', 'transparente'];
  const slugs = Object.keys(CORES);
  assert.ok(slugs.length > 0, 'o catálogo de cores está vazio');
  slugs.forEach((slug) => {
    const c = CORES[slug];
    assert.match(slug, /^[a-z0-9-]+$/, `slug inválido: ${slug}`);
    assert.match(c.hex, /^#[0-9A-F]{6}$/, `hex inválido em ${slug}: ${c.hex}`);
    assert.ok(c.nome, `falta nome em ${slug}`);
    assert.ok(acabamentos.includes(c.acabamento),
      `acabamento desconhecido em ${slug}: ${c.acabamento}`);
    // O slug tem que sobreviver à ida e volta, senão o nome escrito na
    // planilha nunca vai casar com este item.
    assert.equal(R.slugDeCor(c.nome), slug,
      `"${c.nome}" não volta para "${slug}"`);
  });
});

/* ============================================================
   REQ-17 — vitrine de cores
   ============================================================ */

/** Luminância é float: comparar com tolerância, não com igualdade exata.
 *  0.2126+0.7152+0.0722 soma 1, mas a conta em ponto flutuante devolve
 *  0.9999999999999999 para o branco. Isso não afeta a ordenação. */
const perto = (a, b) => Math.abs(a - b) < 1e-9;

test('REQ-17: luminância pesa os canais como o olho', () => {
  assert.ok(perto(R.luminanciaDe('#FFFFFF'), 1), 'branco deveria dar ~1');
  assert.equal(R.luminanciaDe('#000000'), 0);
  // O verde puro é lido como muito mais claro que o azul puro.
  assert.ok(R.luminanciaDe('#00FF00') > R.luminanciaDe('#0000FF'));
  assert.ok(R.luminanciaDe('#E9E0D7') > R.luminanciaDe('#373737'));
});

test('REQ-17: hex inválido não quebra a ordenação', () => {
  [null, undefined, '', 'terracota', '#FFF', '#12345', 'rgb(1,2,3)'].forEach((v) => {
    assert.equal(R.luminanciaDe(v), 0, `${v} deveria dar 0`);
  });
});

test('REQ-17: aceita hex com e sem cerquilha, maiúsculo ou minúsculo', () => {
  assert.ok(perto(R.luminanciaDe('#ffffff'), 1));
  assert.ok(perto(R.luminanciaDe('FFFFFF'), 1));
  assert.ok(perto(R.luminanciaDe('#ffffff'), R.luminanciaDe('FFFFFF')));
});

test('REQ-17: a paleta agrupa por acabamento, na ordem certa', () => {
  const paleta = R.paletaOrdenada({
    z: { nome: 'Z', hex: '#888888', acabamento: 'transparente' },
    a: { nome: 'A', hex: '#888888', acabamento: 'silk' },
    m: { nome: 'M', hex: '#888888', acabamento: 'fosco' },
    n: { nome: 'N', hex: '#888888', acabamento: 'marmorizado' },
  });
  assert.deepEqual(paleta.map((c) => c.acabamento),
    ['fosco', 'silk', 'marmorizado', 'transparente']);
});

test('REQ-17: dentro do grupo, do mais claro ao mais escuro', () => {
  const paleta = R.paletaOrdenada({
    escuro: { nome: 'Escuro', hex: '#222222', acabamento: 'fosco' },
    claro:  { nome: 'Claro',  hex: '#EEEEEE', acabamento: 'fosco' },
    meio:   { nome: 'Meio',   hex: '#888888', acabamento: 'fosco' },
  });
  assert.deepEqual(paleta.map((c) => c.slug), ['claro', 'meio', 'escuro']);
});

test('REQ-17: acabamento desconhecido vai para o fim, sem sumir', () => {
  const paleta = R.paletaOrdenada({
    novo:  { nome: 'Novo',  hex: '#888888', acabamento: 'fluorescente' },
    fosco: { nome: 'Fosco', hex: '#888888', acabamento: 'fosco' },
  });
  assert.deepEqual(paleta.map((c) => c.slug), ['fosco', 'novo']);
});

test('REQ-17: sem catálogo a vitrine recebe lista vazia e se esconde', () => {
  assert.deepEqual(R.paletaOrdenada(null), []);
  assert.deepEqual(R.paletaOrdenada(undefined), []);
  assert.deepEqual(R.paletaOrdenada({}), []);
});

test('REQ-17: a paleta real traz todas as cores do catálogo', () => {
  const paleta = R.paletaOrdenada(CORES);
  assert.equal(paleta.length, Object.keys(CORES).length);
  paleta.forEach((c) => {
    assert.ok(c.slug && c.nome && c.hex && c.acabamento, `item incompleto: ${c.slug}`);
  });
});

/* ============================================================
   REQ-19 — carrossel de cores
   ============================================================ */

test('REQ-19: conteúdo que cabe na tela não é carrossel', () => {
  // O caso que importa: com poucas cores nada rola, e aí seta e barra
  // de posição não devem aparecer.
  const p = R.progressoCarrossel({ scrollLeft: 0, scrollWidth: 400, clientWidth: 400 });
  assert.equal(p.rola, false);
  assert.equal(p.noInicio, true);
  assert.equal(p.noFim, true);
  assert.equal(p.fracao, 0);
});

test('REQ-19: conteúdo mais estreito que a área também não rola', () => {
  const p = R.progressoCarrossel({ scrollLeft: 0, scrollWidth: 300, clientWidth: 400 });
  assert.equal(p.rola, false);
});

test('REQ-19: no começo só existe avançar', () => {
  const p = R.progressoCarrossel({ scrollLeft: 0, scrollWidth: 1200, clientWidth: 400 });
  assert.equal(p.rola, true);
  assert.equal(p.noInicio, true);
  assert.equal(p.noFim, false);
  assert.equal(p.fracao, 0);
});

test('REQ-19: no fim só existe voltar', () => {
  const p = R.progressoCarrossel({ scrollLeft: 800, scrollWidth: 1200, clientWidth: 400 });
  assert.equal(p.noInicio, false);
  assert.equal(p.noFim, true);
  assert.equal(p.fracao, 1);
});

test('REQ-19: no meio, as duas setas e a fração proporcional', () => {
  const p = R.progressoCarrossel({ scrollLeft: 400, scrollWidth: 1200, clientWidth: 400 });
  assert.equal(p.noInicio, false);
  assert.equal(p.noFim, false);
  assert.equal(p.fracao, 0.5);
});

test('REQ-19: subpixel no fim ainda conta como fim', () => {
  // Zoom do navegador deixa sobrar meio pixel; sem tolerância a seta de
  // avançar ficaria visível para sempre, sem ter para onde ir.
  const p = R.progressoCarrossel({ scrollLeft: 799.6, scrollWidth: 1200, clientWidth: 400 });
  assert.equal(p.noFim, true);
});

test('REQ-19: fração nunca escapa de 0 a 1', () => {
  // Rolagem elástica do iOS devolve scrollLeft negativo ou além do fim.
  assert.equal(R.progressoCarrossel({ scrollLeft: -60, scrollWidth: 1200, clientWidth: 400 }).fracao, 0);
  assert.equal(R.progressoCarrossel({ scrollLeft: 9999, scrollWidth: 1200, clientWidth: 400 }).fracao, 1);
});

test('REQ-19: medida ausente não quebra', () => {
  [null, undefined, {}].forEach((m) => {
    const p = R.progressoCarrossel(m);
    assert.equal(p.rola, false, 'sem medida, não rola');
  });
});

/* ============================================================
   REQ-20 — rótulo da faixa de cores
   ============================================================ */

test('REQ-20: o rótulo conta as cores e lista os acabamentos', () => {
  assert.equal(
    R.resumoDaPaleta({
      a: { nome: 'A', hex: '#111111', acabamento: 'fosco' },
      b: { nome: 'B', hex: '#222222', acabamento: 'silk' },
    }),
    '2 cores · fosco e acetinado');
});

test('REQ-20: uma cor só fica no singular', () => {
  assert.equal(
    R.resumoDaPaleta({ a: { nome: 'A', hex: '#111111', acabamento: 'fosco' } }),
    '1 cor · fosco');
});

test('REQ-20: acabamento repetido aparece uma vez', () => {
  assert.equal(
    R.resumoDaPaleta({
      a: { nome: 'A', hex: '#111111', acabamento: 'fosco' },
      b: { nome: 'B', hex: '#222222', acabamento: 'fosco' },
      c: { nome: 'C', hex: '#333333', acabamento: 'fosco' },
    }),
    '3 cores · fosco');
});

test('REQ-20: três ou mais acabamentos usam vírgula e "e" no fim', () => {
  // A contagem vem do catálogo, não fixa no teste: cadastrar cor nova é
  // evento normal e não pode quebrar a suíte.
  const r = R.resumoDaPaleta(CORES);
  assert.match(r, new RegExp(`^${Object.keys(CORES).length} cores · `));
  assert.ok(r.includes(', '), 'deveria separar por vírgula');
  assert.ok(r.includes(' e '), 'o último deveria vir com "e"');
  assert.ok(!r.includes(', e '), 'não deveria ter vírgula antes do "e"');
});

test('REQ-20: catálogo vazio não gera rótulo', () => {
  assert.equal(R.resumoDaPaleta({}), '');
  assert.equal(R.resumoDaPaleta(null), '');
});

test('REQ-20: acabamento desconhecido entra com o próprio nome', () => {
  // Cor nova com acabamento que ainda não tem tradução não deve sumir do
  // rótulo nem aparecer como "undefined".
  assert.equal(
    R.resumoDaPaleta({ a: { nome: 'A', hex: '#111111', acabamento: 'fluorescente' } }),
    '1 cor · fluorescente');
});

/* ============================================================
   REQ-22b — prazo de produção configurado no site
   ============================================================ */

test('REQ-22b: o prazo padrão do site vale sem nada na planilha', () => {
  // O caso normal: quase toda peça é sob encomenda com o mesmo prazo, e a
  // planilha não precisa saber disso.
  const s = R.situacao({ disponivel: 0 }, { prazoPadrao: 3 });
  assert.equal(s.texto, 'Sob encomenda · fica pronta em até 3 dias');
  assert.equal(s.pronta, false);
});

test('REQ-22b: o prazo da peça vence o padrão do site', () => {
  const s = R.situacao({ disponivel: 0, prazoDias: 10 }, { prazoPadrao: 3 });
  assert.equal(s.texto, 'Sob encomenda · fica pronta em até 10 dias');
});

test('REQ-22b: sem padrão e sem prazo na peça, só "Sob encomenda"', () => {
  assert.equal(R.situacao({ disponivel: 0 }, {}).texto, 'Sob encomenda');
  assert.equal(R.situacao({ disponivel: 0 }, { prazoPadrao: 0 }).texto, 'Sob encomenda');
  assert.equal(R.situacao({ disponivel: 0 }, { prazoPadrao: null }).texto, 'Sob encomenda');
});

test('REQ-22b: peça com estoque ignora o prazo, padrão ou não', () => {
  // Prazo de produção não faz sentido para o que já está pronto.
  assert.equal(R.situacao({ disponivel: 2 }, { prazoPadrao: 3 }).texto, 'Pronta entrega');
  assert.equal(R.situacao({ disponivel: 2, prazoDias: 10 }, { prazoPadrao: 3 }).texto,
    'Pronta entrega');
});
