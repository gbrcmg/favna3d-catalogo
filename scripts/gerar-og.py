#!/usr/bin/env python3
"""
Gera a imagem de compartilhamento (og:image) do catálogo FAVNA 3D.
ESPECIFICACAO.md REQ-61 — 1200x630, imagem dedicada, não recorte de foto.

Uso:  python3 scripts/gerar-og.py     (rodar da raiz do catalogo/)
Saída: og-favna-catalogo.jpg

Depende de Pillow e das fontes do sistema macOS. Não faz parte do site:
é ferramenta de autor, rodada só quando a arte precisa mudar.
"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
OFFWHITE = (250, 248, 245)
CARVAO   = (44, 42, 41)
TERRA    = (200, 125, 85)
TITANIO  = (122, 130, 136)
LINHA    = (230, 223, 214)

lona = Image.new("RGB", (W, H), OFFWHITE)
d = ImageDraw.Draw(lona)

# --- foto à direita, cover-crop ---
FOTO_W = 545
foto = Image.open("fotos/porta-objetos-01.jpg").convert("RGB")
esc = max(FOTO_W / foto.width, H / foto.height)
foto = foto.resize((round(foto.width * esc), round(foto.height * esc)), Image.LANCZOS)
esq = (foto.width - FOTO_W) // 2
topo = max(0, int((foto.height - H) * 0.35))
lona.paste(foto.crop((esq, topo, esq + FOTO_W, topo + H)), (W - FOTO_W, 0))

# --- faixa de camadas separando texto e foto ---
x_faixa = W - FOTO_W - 6
for y in range(0, H, 3):
    d.line([(x_faixa, y), (x_faixa + 5, y)], fill=LINHA)

# --- logo oficial (Sliced V + FAVNA + 3D) ---
# O conteudo do arquivo vai de (331,285) a (947,1033); recorto COM FOLGA de
# ~45 px para que a esfumacada da borda caia em fundo puro, nunca em cima da
# tipografia. O fundo do arquivo (249,244,238) e mais quente que o off-white
# oficial, entao sem esfumacar ele aparece como um retangulo na lona.
from PIL import ImageFilter
FOLGA = 45
logo = Image.open("marca/favna-logo.jpg").convert("RGB").crop(
    (331 - FOLGA, 285 - FOLGA, 947 + FOLGA, 1033 + FOLGA))
LOGO_W = 250
escala_logo = LOGO_W / logo.width
logo = logo.resize((LOGO_W, round(logo.height * escala_logo)), Image.LANCZOS)

# mascara: opaca no centro, sumindo nos ultimos ~13 px (a folga reescalada)
pena = max(6, round(FOLGA * escala_logo) - 2)
mascara = Image.new("L", logo.size, 0)
ImageDraw.Draw(mascara).rectangle(
    [pena, pena, logo.width - pena, logo.height - pena], fill=255)
mascara = mascara.filter(ImageFilter.GaussianBlur(pena / 2))

M = 76
y = 62
lona.paste(logo, (M, y), mascara)
y += logo.height + 18

d.line([(M + 2, y), (M + 80, y)], fill=TERRA, width=3)
y += 30

HELV = "/System/Library/Fonts/HelveticaNeue.ttc"
AVENIR = "/System/Library/Fonts/Avenir Next.ttc"
f_tag = ImageFont.truetype(AVENIR, 33, index=2)
f_sub = ImageFont.truetype(HELV, 21, index=0)
f_miudo = ImageFont.truetype(HELV, 18, index=0)

d.text((M, y), "Atmosfera & Forma", font=f_tag, fill=TERRA)
y += 56
d.text((M, y), "Vasos, luminárias e objetos de casa,", font=f_sub, fill=CARVAO)
d.text((M, y + 30), "impressos camada por camada.", font=f_sub, fill=CARVAO)

d.text((M, H - 58), "Manufatura aditiva sustentável", font=f_miudo, fill=TITANIO)

lona.save("og-favna-catalogo.jpg", "JPEG", quality=88, optimize=True)
print("gerado", lona.size, "| logo:", logo.size)
