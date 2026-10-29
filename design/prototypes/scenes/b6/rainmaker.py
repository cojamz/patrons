import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def art():
    c = C(N)
    pal = base_pal(**{
        'b': '#c9cdb0',                          # pale dry sky
        'q': '#7d8796', 'Q': '#69737f',          # rain cloud
        'u': '#8fb6e0',                          # rain
        'f': '#c9a768', 'F': '#b8955a',          # dry field, two values
        'g': '#7fa85a',                          # wet green patch under the rain
        't': '#8a5a34', 'T': '#6a4226',          # rod, boots
        'm': '#d9dde0', 'M': '#a7aeb3',          # rod tip
        '1': YELLOW[0], '2': YELLOW[1],
        'h': '#2b1d18', 'H': '#4a332a',
        's': OLIVE[0], 'S': OLIVE[1]})
    c.rect(0, 0, 63, 63, 'b')
    c.rect(0, 42, 63, 63, 'f'); c.rect(0, 53, 63, 63, 'F')
    c.hl(4, 14, 48, 'F'); c.hl(40, 52, 58, 'f')               # a single furrow hint each way

    def cloud(l):
        l.ell(22, 1, 38, 12, 'q'); l.ell(32, 0, 50, 11, 'q'); l.ell(44, 2, 60, 13, 'q'); l.rect(24, 7, 58, 13, 'q')
        l.hl(25, 58, 13, 'Q'); l.hl(27, 57, 12, 'Q')
    bg(c, cloud, None)
    for x in range(30, 58, 5):
        for y in range(16 + (x % 3) * 2, 41, 7):
            c.pts('u', [(x, y), (x - 1, y + 2)])
    c.ell(28, 40, 62, 46, 'g', only='f')

    DK = {'1': '2', 's': 'S', 'h': 'H', 't': 'T'}
    cx = 18

    def coat(f):
        sk = layer(); skirt(sk, cx, 39, 47, 7, 8, '1', '2'); over(f, sk, DK)
        f.vl(cx, 32, 47, '2')
        for y in (35, 39, 43):
            f.px(cx - 2, y, '2')
        f.poly([(cx - 4, 30), (cx + 4, 30), (cx, 34)], '2')           # coat collar

    def rod(p):
        # a long rod pointed up at the cloud, two tones, bright tip
        p.line(29, 27, 38, 10, 't'); p.line(30, 27, 39, 10, 'T')
        p.rect(38, 8, 40, 10, 'm'); p.px(40, 10, 'M')

    person(c, DK, hx=11, hy=15, skin='s', shade='S', mouth='smile', brows='stern', brow='h',
           hs='long', hk='h', hd='H', cloth='1', cdark='2', cx=cx, sw=7, ww=7, th=10,
           lg=dict(pants='2', pdark='2', shoe='T', lh=7, gap=2),
           arms=[([(23, 34), (29, 35), (30, 28)], 3), ([(13, 34), (11, 39), (12, 43)], 3)],
           hands=[(28, 25, 'grip', False), (10, 43, 'fist', False)],
           front=coat, props=rod)
    return c.rows(), pal


PORTRAIT = ('yellow.rainmaker', art)
