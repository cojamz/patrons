import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def art():
    c = C(N)
    pal = base_pal(**{
        'p': '#8f8270', 'P': '#7f7362',          # chapel stone, niche
        'q': '#5e6f8e', 'Q': '#4f5f7c',          # niche back
        'y': '#f6dc8a', 'Y': '#d6b157',          # halo, flames
        'c': '#efe6d2', 'C': '#cbbfa6',          # candles
        'f': '#e98a3a',
        '1': SILVER[0], '2': SILVER[1], '3': '#e9ecef',
        'h': '#3a2a22', 'H': '#58402f',
        's': MED[0], 'S': MED[1]})
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 54, 63, 63, 'P')

    def niche(l):
        l.ell(12, 2, 51, 30, 'q'); l.rect(12, 16, 51, 55, 'q')
    bg(c, niche, 'Q')
    c.ell(18, 6, 45, 28, 'Q', only='q')                            # soft glow ring in the niche

    def candles(l):
        for x in (3, 56):
            l.rect(x, 40, x + 4, 55, 'c'); l.vl(x + 4, 41, 55, 'C')
            l.vl(x + 2, 37, 39, 'f'); l.px(x + 2, 36, 'y')
        l.rect(1, 55, 8, 57, 'Y'); l.rect(54, 55, 61, 57, 'Y')
    bg(c, candles, None)

    DK = {'1': '2', 's': 'S', 'h': 'H', '3': '2'}
    cx = 31

    def halo(f):
        f.ring(20, 2, 42, 18, 'y'); f.ring(21, 3, 41, 17, 'y')

    def robe(f):
        sk = layer(); skirt(sk, cx, 39, 56, 8, 13, '1', '2')
        sk.vl(cx - 3, 44, 56, '2'); sk.vl(cx + 4, 46, 56, '2')
        over(f, sk, DK)
        f.poly([(cx - 3, 27), (cx + 3, 27), (cx, 31)], 's')       # open collar
        f.rect(cx - 9, 35, cx + 9, 36, 'Y')                       # gold sash
        f.pts('y', [(cx - 9, 35), (cx - 4, 35), (cx + 2, 35)])

    def soft(h):
        happy_eyes(h, 24, 11, 14, 's', k='h')

    def palms(f):
        # open palms facing out, fingers up, a thumb notch on the inner side
        P = ['.sss.', 'ssss.', 'ssssS', 'sssSs', '.sSs.']
        for x0, flip in ((10, False), (48, True)):
            for j, r in enumerate(P):
                r = r[::-1] if flip else r
                for i, ch in enumerate(r):
                    if ch != '.':
                        f.px(x0 + i, 29 + j, ch)
            f.px(x0 + (3 if not flip else 1), 29, 'S' if False else '.')

    person(c, DK, hx=24, hy=11, size=14, skin='s', shade='S', mouth='smile', brows='none',
           hs='long', hk='h', hd='H', cloth='1', cdark='2', cx=cx, sw=8, ww=8, th=14,
           arms=[([(24, 31), (19, 37), (14, 34)], 4), ([(38, 31), (43, 37), (48, 34)], 4)],
           hands=[], back=halo, front=robe, face=soft,
           top=palms)
    return c.rows(), pal


PORTRAIT = ('silver.saint', art)
