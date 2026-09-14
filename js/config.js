/* ============================================================
   FAVNA 3D — Catálogo
   Este é o ÚNICO arquivo que precisa ser editado no dia a dia.
   Tudo abaixo tem explicação. Não é preciso saber programar.
   ============================================================ */

const CONFIG = {

  /* ---- 1. De onde vêm os produtos -------------------------- */

  // Endereço do CSV publicado da planilha Favna_Catalogo.
  // Como conseguir: na planilha, Arquivo > Compartilhar > Publicar na web,
  // escolher SOMENTE a aba "Catalogo", formato CSV, e colar o link aqui.
  // Enquanto estiver vazio, o site usa o arquivo local dados/exemplo.csv.
  CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vScPnvQDMKhtuHZMJ7VyBzv5p3sfhUheT9DMzGaGeyI3yq77BBGfnbc8ws1dsFuIFNOXpb2aPuJ3Qn5/pub?gid=0&single=true&output=csv',

  // true  = usa dados/exemplo.csv (para testar no computador)
  // false = usa a planilha publicada em CSV_URL
  USAR_CSV_LOCAL: false,


  /* ---- 2. Para onde vão os pedidos ------------------------- */

  // Número que recebe os pedidos, no formato 55 + DDD + número, só dígitos.
  // Aqui: (19) 99982-7588 → 55 + 19 + 999827588
  // Sem um número válido de 12 ou 13 dígitos, o site mostra um aviso no lugar
  // do botão, em vez de abrir uma conversa que não existe.
  WHATSAPP_NUMERO: '5519999827588',


  /* ---- 3. Textos da marca ---------------------------------- */

  NOME_LOJA: 'FAVNA 3D',
  TAGLINE: 'Atmosfera & Forma',
  SUBTITULO: 'Objetos de casa impressos camada por camada.',

  // {nome}, {preco} e {link} são trocados automaticamente.
  MENSAGEM_WHATSAPP: 'Olá! Vi no catálogo e quero o *{nome}* ({preco}).',


  /* ---- 4. Ajustes finos ------------------------------------ */

  // false = mostra só "Pronta entrega". true = mostra "Pronta entrega (3)".
  MOSTRAR_QUANTIDADE: false,

  // Guarda o último catálogo que carregou bem, para o site não ficar
  // vazio se o Google estiver fora do ar. Deixe true.
  USAR_CACHE_OFFLINE: true,
};
