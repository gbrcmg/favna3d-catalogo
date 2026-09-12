#!/usr/bin/env python3
"""
Lê as fotos de filamento do fornecedor e gera js/cores.js — o catálogo de
cores como DADO (nome, hex, acabamento), não como imagem.

Por que assim, e não publicando as fotos (ESPECIFICACAO.md REQ-13, REQ-15):

  - As fotos são material de divulgação do fabricante do filamento, com a
    marca dele visível. Não são nossas para republicar.
  - Elas não funcionam como amostra: no tamanho de uma amostra na tela, o
    que aparece é o carretel preto com adesivo, não a cor.
  - Pesam ~900 KB cada. A amostra em CSS custa zero requisição.

Uso:  python3 scripts/extrair-cores.py           (da raiz do catalogo/)
      python3 scripts/extrair-cores.py --conferir  (só mostra, não grava)

Origem das fotos: ../assets/cores/ no projeto favna3d. Elas ficam LÁ, como
referência interna, e nunca entram neste repositório.
"""

import colorsys
import json
import os
import sys

from PIL import Image

ORIGEM = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "cores")
SAIDA = os.path.join(os.path.dirname(__file__), "..", "js", "cores.js")

# Acabamento inferido do nome do arquivo. Muda como a amostra é desenhada.
ACABAMENTOS = {
    "silk": "silk",                  # brilho acetinado: ganha reflexo diagonal
    "marmorizado": "marmorizado",    # mesclado: ganha manchas suaves
    "transparente": "transparente",  # translúcido: ganha xadrez por baixo
}


def acabamento_de(slug):
    for chave, valor in ACABAMENTOS.items():
        if chave in slug:
            return valor
    return "fosco"


def nome_de(slug):
    """terracota -> Terracota · ouro-envelhecido-silk -> Ouro Envelhecido Silk"""
    return " ".join(p.capitalize() for p in slug.split("-"))


def cor_da_peca(caminho):
    """
    A peça impressa fica no terço direito da foto. Amostra os pixels de lá e
    descarta o que não é a cor do filamento: fundo branco, carretel preto e o
    verde da etiqueta do fabricante. Devolve a mediana por luminosidade, que
    resiste melhor a brilho e sombra que a média.
    """
    with Image.open(caminho) as img:
        im = img.convert("RGB")
        largura, altura = im.size
        rec = im.crop((int(largura * 0.60), int(altura * 0.15),
                       largura, int(altura * 0.95)))
        rec = rec.resize((max(1, rec.width // 4), max(1, rec.height // 4)))
        pixels = list(rec.getdata())

    bons = []
    for r, g, b in pixels:
        maior, menor = max(r, g, b), min(r, g, b)
        if maior > 245 and maior - menor < 12:
            continue                      # fundo branco do estúdio
        if maior < 45:
            continue                      # carretel preto
        matiz, sat, _ = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if 0.22 < matiz < 0.45 and sat > 0.45:
            continue                      # verde da etiqueta do fabricante
        bons.append((r, g, b))

    if not bons:
        return None, 0
    bons.sort(key=sum)
    return bons[len(bons) // 2], len(bons) * 100 // len(pixels)


def main():
    conferir = "--conferir" in sys.argv
    if not os.path.isdir(ORIGEM):
        sys.exit(f"não achei as fotos em {ORIGEM}")

    cores = {}
    for arquivo in sorted(os.listdir(ORIGEM)):
        if not arquivo.lower().endswith((".png", ".jpg", ".jpeg")):
            continue
        slug = os.path.splitext(arquivo)[0]
        cor, cobertura = cor_da_peca(os.path.join(ORIGEM, arquivo))
        if not cor:
            print(f"  ! {slug}: não achei a cor, pulando")
            continue
        hexa = "#%02X%02X%02X" % cor
        cores[slug] = {
            "nome": nome_de(slug),
            "hex": hexa,
            "acabamento": acabamento_de(slug),
        }
        print(f"  {slug:<24} {hexa}  {acabamento_de(slug):<12} ({cobertura}% dos pixels)")

    if conferir:
        print(f"\n{len(cores)} cores — nada gravado (--conferir)")
        return

    corpo = json.dumps(cores, ensure_ascii=False, indent=2)
    with open(SAIDA, "w", encoding="utf-8") as f:
        f.write(f"""/* ============================================================
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

(function (raiz) {{
  const CORES = {corpo};

  raiz.CORES = CORES;
  if (typeof module !== 'undefined' && module.exports) module.exports = CORES;
}})(typeof globalThis !== 'undefined' ? globalThis : this);
""")
    print(f"\n{len(cores)} cores gravadas em js/cores.js")


if __name__ == "__main__":
    main()
