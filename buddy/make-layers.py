# ぼのぼのの絵を、動かす部品（体・手と貝・左足・右足・しっぽ）に切り分ける作業用スクリプト。
# 使い方: python3 make-layers.py 背景を透明にした元の絵.png 出力先フォルダ
# 座標は元の絵（1060x1831）に合わせてある。絵を差し替えたら座標も見直すこと。
import sys
from PIL import Image, ImageDraw, ImageChops
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')
W, H = im.size
# 足もとの影の残り（足の下・足のあいだ）を消す
_px = im.load()
for y in range(1650, H):
    for x in range(W):
        if y > 1780 or 410 <= x <= 690:
            _px[x, y] = (0, 0, 0, 0)
BLUE = (85, 184, 251, 255)
S = 1 / 0.6
def P(pts):  # 表示座標（60%）→ 元画像の座標
    return [(x * S, y * S) for x, y in pts]

def mask_poly(pts):
    m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon(pts, fill=255); return m
def mask_rect(x0, y0, x1, y1):
    m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).rectangle([x0, y0, x1, y1], fill=255); return m
def cut(m):
    a = ImageChops.multiply(im.getchannel('A'), m)
    l = im.copy(); l.putalpha(a); return l

tail = mask_poly(P([(0, 830), (122, 830), (122, 950), (0, 950)]))
legL = mask_rect(0, 1588, 530, H)     # 体の後ろに少し重ねて、つなぎ目の線が出ないようにする
legR = mask_rect(530, 1588, W, H)
legCutL = mask_rect(0, 1612, 530, H)  # 体から消すのはここから下
legCutR = mask_rect(530, 1612, W, H)
hold = mask_poly(P([(196, 538), (236, 536), (292, 596), (330, 572), (392, 556), (418, 536), (446, 536),
                    (448, 600), (430, 690), (398, 752), (346, 756), (298, 724), (284, 700), (226, 632), (192, 566)]))
layers = {'tail': tail, 'leg-l': legL, 'leg-r': legR, 'hold': hold}
for k, m in layers.items():
    l = cut(m)
    l = l.resize((150, round(H * 150 / W)), Image.LANCZOS)
    l.save(f'{out}/{k}.png', optimize=True)
# 体（残り）。手と貝のところは体の青で埋める（手と貝が動いたときに下から見える）
base = im.copy()
a = base.getchannel('A')
for m in (tail, legCutL, legCutR):
    a = ImageChops.subtract(a, m)
base.putalpha(a)
fill = Image.new('RGBA', (W, H), BLUE)
inside = ImageChops.multiply(hold, im.getchannel('A'))
base.paste(fill, (0, 0), inside)
base = base.resize((150, round(H * 150 / W)), Image.LANCZOS)
base.save(f'{out}/body.png', optimize=True)
