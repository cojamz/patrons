import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def art():
    c = C(N)
    pal = base_pal(**{
        'p': '#5e4258', 'P': '#523950',          # ballroom wall, arches
        'f': '#7d5a46', 'F': '#6e4f3d',          # floor
        'y': '#f2d27a', 'Y': '#c9a24a',          # chandelier
        '1': SILVER[0], '2': SILVER[1], '3': '#e8ebee',
        'g': '#f4ede1', 'G': '#cfc6bb',          # gloves, fan
        'h': '#2e2124', 'H': '#4a3530',          # hair
        'r': '#7a2a2a',
        's': MED[0], 'S': MED[1]})
    c.rect(0, 0, 63, 63, 'p')
    for ax in (2, 46):
        c.rect(ax, 14, ax + 15, 50, 'P'); c.ell(ax, 6, ax + 15, 22, 'P')
    c.rect(0, 51, 63, 63, 'f'); c.hl(0, 63, 51, 'F')

    def chandelier(l):
        l.vl(53, 0, 5, 'Y')
        l.ell(46, 8, 60, 13, 'Y'); l.hl(47, 59, 8, 'y'); l.rect(52, 5, 54, 8, 'Y')
        for x in (47, 52, 58):
            l.vl(x, 5, 7, 'w'); l.px(x, 4, 'y')
    bg(c, chandelier, None)
    for x in (7, 9, 53, 55):
        c.px(x, 30 + (x % 3), 'Y')

    DK = {'1': '2', 's': 'S', 'g': 'G', 'h': 'H', '3': '2'}
    cx = 32

    def front(f):
        # bodice neckline: skin above, silver below, with a lit sheen
        f.poly([(cx - 3, 25), (cx + 3, 25), (cx + 2, 28), (cx - 2, 28)], 's')
        f.hl(cx - 2, cx + 1, 25, 'S')
        f.pts('3', [(cx - 4, 30), (cx - 4, 31), (cx - 3, 32)])
        sk = layer(); skirt(sk, cx, 36, 58, 7, 17, '1', '2')
        for x, y in ((cx - 9, 46), (cx - 12, 52), (cx - 6, 54), (cx - 3, 41)):
            sk.pts('3', [(x, y), (x + 1, y), (x, y + 1)])
        sk.hl(cx - 17, cx + 17, 58, '2')
        over(f, sk, DK)

    def tiara(f):
        f.pts('3', [(27, 8), (29, 7), (31, 7), (33, 7), (35, 8), (31, 6), (32, 6)])
        f.hl(27, 36, 9, '3')

    def fan(f):
        f.poly([(43, 24), (45, 15), (50, 13), (54, 16), (55, 22)], 'g')
        for ex, ey in ((45, 16), (49, 14), (53, 17)):
            f.line(46, 26, ex, ey, 'G')

    person(c, DK, hx=25, hy=10, skin='s', shade='S', mouth='smile', brows='soft', brow='h', glint='w',
           hs='bun', hk='h', hd='H', side='L', cloth='1', cdark='2', cx=cx, sw=6, ww=5, th=11,
           arms=[([(26, 28), (22, 33), (24, 38)], 3, 'g'), ([(38, 28), (43, 32), (45, 27)], 3, 'g')],
           hands=[(23, 38, 'fist', False), (44, 25, 'grip', False)],
           front=front, top=lambda f: (tiara(f), fan(f)))
    return c.rows(), pal


PORTRAIT = ('silver.gala', art)
