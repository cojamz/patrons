import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def art():
    c = C(N)
    pal = base_pal(**{
        'p': '#4f6a52', 'P': '#456048',          # dining room wall, panels
        'y': '#f2d27a', 'Y': '#c9a24a',          # candles, brass
        'c': '#f1ebe0', 'C': '#d3c9ba',          # tablecloth
        'o': '#c27a3a', 'O': '#94552a',          # roast
        'g': '#7fae5b',                          # garnish
        '1': SILVER[0], '2': SILVER[1], '3': '#e3e6e9',
        'x': '#2f2a33',                          # shirt/tie dark
        'h': '#2b2120', 'H': '#463431',
        's': OLIVE[0], 'S': OLIVE[1], 'r': '#7a2a2a'})
    c.rect(0, 0, 63, 63, 'p')
    for px_ in (6, 44):
        c.rect(px_, 0, px_ + 14, 18, 'P')

    def window(l):
        l.rect(5, 8, 14, 22, 'Y'); l.rect(6, 9, 13, 21, '#')
        l.recolor('#', '.')
    # a small warm window on the left, a sconce on the right
    def sconce(l):
        l.rect(48, 7, 49, 13, 'Y'); l.hl(46, 51, 13, 'Y'); l.ell(47, 3, 50, 7, 'y')
    bg(c, sconce, None)
    def painting(l):
        l.rect(8, 2, 19, 15, 'Y'); l.rect(10, 4, 17, 13, 'w'); l.ell(8, 9, 20, 17, '2', only='w'); l.ell(14, 5, 16, 7, 'y')
    bg(c, painting, None)

    DK = {'1': '2', 's': 'S', 'w': 'C', 'x': 'x', 'h': 'H', '3': '2'}
    cx = 32

    def front(f):
        f.poly([(cx - 3.5, 27), (cx + 3.5, 27), (cx, 37)], 'w')
        f.rect(cx - 1, 28, cx, 36, 'x')
        for (x, y) in ((27, 27), (27, 28), (28, 29), (28, 30), (29, 31), (29, 32), (30, 33)):
            f.px(x, y, '2'); f.px(2 * cx - x - 1, y, '2')
        f.pts('3', [(36, 31), (37, 31), (36, 32)])           # pocket square

    def moustache(h):
        h.pts('h', [(29, 21), (30, 21), (31, 21), (34, 21), (35, 21), (36, 21), (29, 22), (36, 22)])

    person(c, DK, hx=24, hy=10, size=16, skin='s', shade='S', mouth='grin', brows='soft', brow='h',
           hs='side', hk='h', hd='H', cloth='1', cdark='2', cx=cx, sw=10, ww=10, th=16,
           arms=[([(24, 30), (19, 36), (21, 34)], 4), ([(41, 30), (45, 36), (44, 43)], 4)],
           hands=[(41, 41, 'fist', True)], front=front, face=moustache)
    hl = layer(); hand(hl, 18, 31, 'flat', 's', 'S'); hl.outline('k'); c.paste(hl)

    def table(l):
        l.rect(0, 43, 63, 63, 'c')
        l.hl(0, 63, 43, 'C')
        # roast on a silver platter
        l.ell(16, 40, 30, 46, '1'); l.ell(18, 40, 28, 44, '3')
        l.ell(18, 34, 28, 43, 'o'); l.poly([(24, 35), (28, 38), (28, 42), (24, 42)], 'O', only='o')
        l.pts('c', [(20, 37), (21, 36)])
        l.pts('g', [(17, 42), (18, 43), (28, 43), (29, 42)])
        # candlestick
        l.rect(44, 41, 49, 42, 'Y'); l.rect(46, 33, 47, 40, 'Y'); l.rect(45, 27, 48, 33, 'c')
        l.vl(48, 28, 33, 'C'); l.rect(46, 24, 47, 26, 'y')
    t = layer(); table(t); edged(t, 'C'); c.paste(t)
    for (x, y) in ((16, 43), (17, 44), (29, 44)):
        pass
    c.pts('2', [(17, 44), (29, 44)])
    return c.rows(), pal


PORTRAIT = ('silver.grandhost', art)
