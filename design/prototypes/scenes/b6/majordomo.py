import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def art():
    c = C(N)
    pal = base_pal(**{
        'p': '#6f8a86', 'P': '#627c78',          # wall, wainscot
        'f': '#8a6a4c', 'F': '#7a5c40',          # floor
        'm': '#b89a5e', 'M': '#94783f',          # frame
        'q': '#9fb7b0', 'Q': '#7f9a92',          # painting
        '1': SILVER[0], '2': SILVER[1],          # coat
        '3': '#e6e9ec', '4': '#a9b0b6',          # tray / cloche
        'x': '#2f2a33', 'X': '#4a4450',          # trousers, bow tie
        'z': '#3b2c26',                          # shoes
        'h': '#c9c4bd', 'H': '#9d978f',          # grey hair
        's': PALE[0], 'S': PALE[1], 'y': '#f2d27a'})
    c.rect(0, 0, 63, 63, 'p')
    c.rect(0, 36, 63, 51, 'P')
    c.rect(0, 52, 63, 63, 'f')
    c.hl(0, 63, 52, 'F')

    def painting(l):
        l.rect(4, 8, 19, 24, 'm'); l.rect(6, 10, 17, 22, 'q')
        l.poly([(6, 22), (10, 15), (13, 19), (15, 16), (18, 22)], 'Q')
    bg(c, painting, 'M')

    def sconce(l):
        l.rect(56, 16, 58, 22, 'm'); l.rect(55, 22, 59, 23, 'm')
        l.ell(55, 12, 59, 16, 'y')
    bg(c, sconce, None)

    DK = {'1': '2', 's': 'S', 'w': '4', 'x': 'X', '3': '4', 'h': 'H'}
    cx = 30

    def front(f):
        # white shirt front, bow tie, waistcoat buttons
        f.poly([(cx - 3.5, 29), (cx + 3.5, 29), (cx + 2, 40), (cx - 2, 40)], 'w')
        f.pts('x', [(cx - 2, 30), (cx - 1, 31), (cx, 31), (cx + 1, 30), (cx - 2, 31), (cx + 1, 31)])
        f.pts('2', [(cx - 1, 34), (cx - 1, 37)])
        for (x, y) in ((25, 30), (25, 31), (26, 32), (26, 33), (27, 34), (27, 35), (28, 36)):
            f.px(x, y, '2'); f.px(2 * cx - x, y, '2')
        # tails of the coat behind the legs
        f.poly([(cx - 7, 42), (cx - 3, 42), (cx - 4, 50), (cx - 7, 49)], '2')

    def tray(f):
        f.hl(37, 55, 34, '4'); f.hl(38, 54, 33, '3')
        f.ell(39, 24, 53, 34, '3'); f.hl(39, 53, 33, '3')
        f.poly([(49, 25), (52, 28), (53, 33), (49, 33)], '4', only='3')
        f.rect(45, 22, 46, 24, '4')
        f.pts('w', [(42, 27), (43, 26)])

    def towel(f):
        f.rect(16, 37, 20, 46, 'w'); f.vl(20, 38, 46, '4'); f.hl(16, 20, 37, '3'); f.pts('4', [(17, 46), (19, 46)])

    person(c, DK, hx=22, hy=12, size=16, skin='s', shade='S', mouth='flat', brows='stern', brow='H',
           hs='crop', hk='h', hd='H', cloth='1', cdark='2', cx=cx, sw=8, ww=7, th=13,
           lg=dict(pants='x', pdark='X', shoe='z', lh=9),
           arms=[([(22, 33), (20, 39), (21, 44)], 4), ([(37, 32), (42, 39), (45, 36)], 4)],
           hands=[(19, 45, 'fist', False), (43, 35, 'flat', False)],
           front=front, top=lambda f: (tray(f), towel(f)))
    return c.rows(), pal


PORTRAIT = ('silver.majordomo', art)
