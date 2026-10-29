import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def art():
    c = C(N)
    pal = base_pal(**{
        'b': '#b9cfdc', 'B': '#a7bfcd',          # sky
        'm': '#d8c7a8', 'M': '#b8a586',          # manor stone
        'q': '#5c6f86',                          # manor windows
        'o': '#8b5e4a',                          # roof
        'g': '#7fae5b', 'G': '#6d9c4c',          # lawn
        'y': '#f2d27a', 'Y': '#c9a24a',          # key
        '1': SILVER[0], '2': SILVER[1], '3': '#e3e6e9',
        'x': '#3a3540', 'X': '#4f4957', 'z': '#2b211d', 'n': '#3b5a8a',
        'h': '#1f1714', 'H': '#3a2a22',
        's': DEEP[0], 'S': DEEP[1]})
    c.rect(0, 0, 63, 63, 'b'); c.rect(0, 0, 63, 8, 'B')
    c.rect(0, 40, 63, 63, 'g'); c.rect(0, 52, 63, 63, 'G')

    def manor(l):
        l.rect(2, 18, 61, 40, 'm')
        l.poly([(0, 19), (10, 11), (53, 11), (64, 19)], 'o')
        l.rect(28, 6, 35, 18, 'm'); l.poly([(27, 7), (31.5, 2), (37, 7)], 'o')
        for x in (5, 12, 46, 53):
            l.rect(x, 22, x + 4, 28, 'q'); l.rect(x, 32, x + 4, 37, 'q')
        l.rect(30, 9, 33, 14, 'q')
    bg(c, manor, 'M')

    DK = {'1': '2', 's': 'S', 'x': 'X', 'h': 'H', '3': '2', 'w': '2'}
    cx = 31

    def front(f):
        f.poly([(cx - 3.5, 29), (cx + 3.5, 29), (cx, 37)], 'w')
        f.poly([(cx - 1, 30), (cx + 1, 30), (cx + 1, 34), (cx, 36), (cx - 1, 34)], 'n')
        for (x, y) in ((26, 29), (26, 30), (27, 31), (27, 32), (28, 33), (28, 34), (29, 35)):
            f.px(x, y, '2'); f.px(2 * cx - x, y, '2')

    def key(f):
        # big key held up, tilted, so it never reads as a cross
        f.ell(50, 29, 57, 36, 'y'); f.ell(52, 31, 55, 34, '.')
        f.pts('Y', [(56, 33), (56, 34), (55, 35), (54, 36)])
        thick(f, [(50, 34), (41, 38)], 2, 'y')
        f.pts('Y', [(46, 37), (43, 38)])
        f.pts('y', [(41, 40), (42, 40), (41, 41), (43, 41)])

    person(c, DK, hx=23, hy=12, size=16, skin='s', shade='S', mouth='smile', brows='soft', brow='h',
           hs='crop', hk='h', hd='H', cloth='1', cdark='2', cx=cx, sw=8, ww=7, th=13,
           lg=dict(pants='1', pdark='2', shoe='z', lh=9),
           arms=[([(24, 33), (22, 38), (25, 42)], 4), ([(38, 32), (42, 38), (46, 37)], 4)],
           hands=[(24, 41, 'fist', False), (45, 34, 'grip', False)],
           top=None, front=front, back=key)
    return c.rows(), pal


PORTRAIT = ('silver.heir', art)
