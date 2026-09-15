/* ============================================================
   FAVNA 3D — Catálogo · CATÁLOGO DE CORES
   ------------------------------------------------------------
   GERADO por scripts/extrair-cores.py. Não editar à mão:
   a próxima rodada do script sobrescreve.

   A cor de cada filamento foi amostrada da foto do fornecedor
   (que fica em favna3d/assets/cores/ e não é publicada — ver
   ESPECIFICACAO.md REQ-15). Aqui vive só o dado: nome, hex e
   acabamento. A amostra é desenhada em CSS, sem imagem.

   Para acrescentar uma cor: ponha a foto em assets/cores/ com
   o nome em minúsculas e hífens (verde-oliva.png) e rode o
   script. O nome escrito na planilha casa por esse mesmo slug.
   ============================================================ */

'use strict';

(function (raiz) {
  const CORES = {
  "azul-marinho": {
    "nome": "Azul Marinho",
    "hex": "#36446D",
    "acabamento": "fosco"
  },
  "bege": {
    "nome": "Bege",
    "hex": "#E9E0D7",
    "acabamento": "fosco"
  },
  "marmorizado": {
    "nome": "Marmorizado",
    "hex": "#CBCBD6",
    "acabamento": "marmorizado"
  },
  "marrom-chocolate": {
    "nome": "Marrom Chocolate",
    "hex": "#774234",
    "acabamento": "fosco"
  },
  "ouro-envelhecido-silk": {
    "nome": "Ouro Envelhecido Silk",
    "hex": "#D39C3B",
    "acabamento": "silk"
  },
  "preto-matte": {
    "nome": "Preto Matte",
    "hex": "#373737",
    "acabamento": "fosco"
  },
  "rosa": {
    "nome": "Rosa",
    "hex": "#F199C9",
    "acabamento": "fosco"
  },
  "terracota": {
    "nome": "Terracota",
    "hex": "#B07768",
    "acabamento": "fosco"
  },
  "transparente": {
    "nome": "Transparente",
    "hex": "#E2E2E2",
    "acabamento": "transparente"
  },
  "verde-oliva": {
    "nome": "Verde Oliva",
    "hex": "#5D6D38",
    "acabamento": "fosco"
  },
  "vermelho-fosco": {
    "nome": "Vermelho Fosco",
    "hex": "#CC3A33",
    "acabamento": "fosco"
  },
  "vermelho-silk": {
    "nome": "Vermelho Silk",
    "hex": "#D0382E",
    "acabamento": "silk"
  }
};

  raiz.CORES = CORES;
  if (typeof module !== 'undefined' && module.exports) module.exports = CORES;
})(typeof globalThis !== 'undefined' ? globalThis : this);
