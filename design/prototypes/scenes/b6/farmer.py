import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def art():
    c = C(N)
    pal = base_pal(**{
        'b': '#bcd8e4', 'B': '#aacbd9',          # sky
        'e': '#b5473c', 'E': '#933930',          # barn
        'g': '#7fa85a',                          # far field
        'f': '#e2c060', 'F': '#c9a548',          # wheat field
        'v': '#e8cf74', 'V': '#b8913a',          # wheat sheaf held
        't': '#e6cf8a', 'T': '#bfa461',          # straw hat
        'u': '#4f73a8', 'U': '#405f8d',          # overalls
        '1': YELLOW[0], '2': YELLOW[1],
        'z': '#4a3324', 'o': '#7a5a3c',
        'h': '#2b1d18', 'H': '#4a332a',
        's': MED[0], 'S': MED[1]})
    c.rect(0, 0, 63, 63, 'b'); c.rect(0, 0, 63, 8, 'B')
    c.rect(0, 30, 63, 38, 'g')

    def barn(l):
        l.rect(42, 14, 62, 34, 'e'); l.poly([(40, 15), (52, 5), (64, 15)], 'e')
        l.rect(48, 23, 56, 34, 'E'); l.hl(48, 56, 23, 'w'); l.line(48, 23, 56, 34, 'w')
        l.rect(50, 11, 53, 14, 'w')
    bg(c, barn, 'E')
    c.rect(0, 38, 63, 63, 'f')
    for x in range(1, 64, 5):
        c.pts('F', [(x, 40 + (x % 3)), (x + 1, 41 + (x % 3))])
    c.rect(0, 54, 63, 63, 'F')

    DK = {'1': '2', 's': 'S', 'u': 'U', 'h': 'H', 't': 'T', 'v': 'V'}
    cx = 26

    def overalls(f):
        f.rect(cx - 5, 34, cx + 5, 43, 'u'); f.rect(cx + 2, 35, cx + 5, 43, 'U')
        f.vl(cx - 4, 28, 33, 'u'); f.vl(cx + 4, 28, 33, 'u')
        f.pts('y' if False else 'w', [(cx - 4, 34), (cx + 4, 34)])

    def hat(f):
        f.ell(19, 7, 33, 15, 't'); f.hl(13, 39, 14, 't'); f.hl(14, 38, 15, 'T')
        f.hl(20, 32, 13, 'T'); f.px(20, 12, 'T')

    def sheaf(f):
        # a sheaf of wheat hugged in the near arm, heads up and fanned
        for i, x in enumerate(range(33, 44, 2)):
            f.line(37 + i // 2, 46, x, 22, 'V')
        for x, y in ((31, 18), (34, 16), (37, 15), (40, 16), (43, 18)):
            f.ell(x, y, x + 2, y + 6, 'v')
        f.rect(35, 34, 41, 35, 'o')

    person(c, DK, hx=19, hy=14, skin='s', shade='S', mouth='smile', brows='soft', brow='h',
           hs='crop', hk='h', hd='H', cloth='1', cdark='2', cx=cx, sw=7, ww=6, th=14,
           lg=dict(pants='u', pdark='U', shoe='z', lh=8, stance=1),
           arms=[([(20, 32), (17, 38), (19, 43)], 3), ([(32, 32), (35, 37), (38, 35)], 3)],
           hands=[(17, 42, 'fist', False), (36, 33, 'grip', False)],
           front=overalls, back=sheaf, top=hat)
    return c.rows(), pal


PORTRAIT = ('yellow.farmer', art)
