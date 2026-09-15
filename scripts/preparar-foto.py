#!/usr/bin/env python3
"""
Prepara foto para o catálogo: corrige rotação, recorta, redimensiona,
comprime e salva já com o nome certo em fotos/.

Uma foto crua de celular tem ~3,8 MB. Publicada assim, a página fica
inutilizável em 4G fraco e cada peça nova engorda o repositório em 4 MB.
Preparada, a mesma foto tem ~200 KB — 18x menor, sem diferença visível no
tamanho em que ela aparece na tela.

Uso:
  preparar-foto.py <slug> <foto> [<foto> ...]      (rodar da raiz do catalogo/)
  preparar-foto.py vaso-ritmo-01 ~/Desktop/IMG_*.jpg
  preparar-foto.py vaso-ritmo-01 foto.jpg --proporcao 1:1
  preparar-foto.py vaso-ritmo-01 foto.jpg --comecar-em 3   (não sobrescrever 01 e 02)

Saída: fotos/<slug>/01.jpg, 02.jpg, ... na ordem dos arquivos dados.
A primeira é a capa, então passe a melhor primeiro.

Uma pasta por peça: a pasta carrega a identidade e o arquivo carrega só a
ordem. Assim dá para guardar alternativas e originais junto da peça sem
poluir o diretório, e apagar uma peça é apagar uma pasta.
"""
import argparse
import os
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("falta o Pillow: python3 -m pip install --user Pillow")

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "fotos"

LADO_MAXIMO = 1400        # px no maior lado
PESO_MAXIMO = 300 * 1024  # 300 KB por foto
QUALIDADE_INICIAL = 88
QUALIDADE_MINIMA = 62

PROPORCOES = {
    "4:5": 4 / 5,      # padrão do catálogo: retrato, combina com a grade
    "1:1": 1.0,
    "3:4": 3 / 4,
    "16:9": 16 / 9,
    "original": None,
}


def recorta_centro(im, proporcao):
    """Recorta no centro para a proporção pedida, sem distorcer."""
    if proporcao is None:
        return im
    largura, altura = im.size
    atual = largura / altura
    if abs(atual - proporcao) < 0.01:
        return im
    if atual > proporcao:                      # largura sobrando
        nova_largura = round(altura * proporcao)
        esq = (largura - nova_largura) // 2
        return im.crop((esq, 0, esq + nova_largura, altura))
    nova_altura = round(largura / proporcao)   # altura sobrando
    # recorta mais de baixo que de cima: em foto de produto o objeto costuma
    # ficar no terço superior, e o chão é o que sobra
    topo = int((altura - nova_altura) * 0.35)
    return im.crop((0, topo, largura, topo + nova_altura))


def salva_no_peso(im, destino):
    """Baixa a qualidade até caber no limite. Devolve (bytes, qualidade)."""
    for q in range(QUALIDADE_INICIAL, QUALIDADE_MINIMA - 1, -4):
        im.save(destino, "JPEG", quality=q, optimize=True, progressive=True)
        peso = destino.stat().st_size
        if peso <= PESO_MAXIMO:
            return peso, q
    return destino.stat().st_size, QUALIDADE_MINIMA


def prepara(origem, destino, proporcao):
    with Image.open(origem) as img:
        # EXIF primeiro: foto de celular vem deitada com a orientação no
        # metadado. Sem isto, o recorte acontece no eixo errado.
        orientacao = img.getexif().get(274)
        im = ImageOps.exif_transpose(img).convert("RGB")

    antes = im.size
    im = recorta_centro(im, proporcao)
    im.thumbnail((LADO_MAXIMO, LADO_MAXIMO), Image.LANCZOS)
    peso, q = salva_no_peso(im, destino)
    return {
        "antes": antes, "depois": im.size, "peso": peso, "q": q,
        "girada": orientacao not in (None, 1),
        "peso_origem": os.path.getsize(origem),
    }


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("slug", help="id da peça na planilha (ex.: vaso-ritmo-01)")
    ap.add_argument("fotos", nargs="+", help="fotos cruas, a melhor primeiro")
    ap.add_argument("--proporcao", default="4:5", choices=list(PROPORCOES))
    ap.add_argument("--comecar-em", type=int, default=1,
                    help="número da primeira foto (para acrescentar sem sobrescrever)")
    args = ap.parse_args()

    DESTINO.mkdir(parents=True, exist_ok=True)
    proporcao = PROPORCOES[args.proporcao]
    gerados = []

    for i, origem in enumerate(args.fotos, start=args.comecar_em):
        origem = Path(origem).expanduser()
        if not origem.exists():
            print(f"  ! não achei {origem}")
            continue
        destino = DESTINO / args.slug / f"{i:02d}.jpg"
        destino.parent.mkdir(parents=True, exist_ok=True)
        r = prepara(origem, destino, proporcao)
        gerados.append(f"{args.slug}/{destino.name}")
        girou = " (girada pelo EXIF)" if r["girada"] else ""
        print(f"  {args.slug}/{destino.name:<24} {r['antes'][0]}x{r['antes'][1]} → "
              f"{r['depois'][0]}x{r['depois'][1]}  "
              f"{r['peso_origem']/1024:.0f} KB → {r['peso']/1024:.0f} KB (q{r['q']}){girou}")
        if r["peso"] > PESO_MAXIMO:
            print(f"    ! ainda acima de {PESO_MAXIMO//1024} KB mesmo na qualidade mínima")

    if gerados:
        print(f"\ncoluna `fotos` da planilha (a primeira é a capa):")
        print("  " + "|".join(f"fotos/{n}" for n in gerados))


if __name__ == "__main__":
    main()
