import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def art():
    c = C(N)
    pal = base_pal(**{
        'p': '#c9b79a', 'P': '#baa88b',          # workshop wall, floor
        'o': '#8a6a4c', 'O': '#6e5238',          # vat staves, line posts, paddle
        'r': '#d0524a', 'b': '#4f86c6', 'g': '#5fae6a', 'm': '#b0509a',   # dyed cloths
        'R': '#a33d37', 'B': '#3c6aa3', 'G': '#478d52', 'M': '#8c3d7b',
        'v': '#e6b82c',                          # dye in the vat
        '1': YELLOW[0], '2': YELLOW[1],
        'x': '#5a4c40',
        'h': '#7a4a2a', 'H': '#5e3820',
        's': PALE[0], 'S': PALE[1]})
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'P')

    def line(l):
        l.hl(0, 63, 5, 'O')
        for i, (k, kd) in enumerate((('r', 'R'), ('b', 'B'), ('g', 'G'), ('m', 'M'))):
            x = 3 + i * 16
            l.rect(x, 6, x + 10, 19 + (i % 2) * 3, k)
            l.rect(x + 8, 7, x + 10, 19 + (i % 2) * 3, kd)
    bg(c, line, None)
    for i in range(4):
        x = 3 + i * 16
        c.pts('o', [(x + 1, 4), (x + 1, 5), (x + 9, 4), (x + 9, 5)])

    DK = {'1': '2', 's': 'S', 'w': 'P', 'h': 'H', 'o': 'O', 'x': 'x'}
    cx = 22

    def apron(f):
        f.poly([(cx - 5, 32), (cx + 5, 32), (cx + 6, 48), (cx - 6, 48)], 'w')
        f.poly([(cx + 2, 33), (cx + 5, 32), (cx + 6, 48), (cx + 3, 48)], 'P', only='w')
        f.pts('r', [(cx - 3, 40), (cx - 2, 40)]); f.pts('b', [(cx + 1, 44), (cx + 2, 44)])

    def paddle(p):
        p.vl(44, 18, 44, 'o'); p.vl(45, 18, 44, 'O')

    person(c, DK, hx=15, hy=13, skin='s', shade='S', mouth='smile', brows='soft', brow='H',
           hs='bun', hk='h', hd='H', side='L', cloth='1', cdark='2', cx=cx, sw=7, ww=6, th=15,
           lg=dict(pants='x', pdark='x', shoe='O', lh=7),
           arms=[([(28, 34), (34, 35), (42, 29)], 3, 's'), ([(27, 32), (30, 34)], 4),
                 ([(16, 33), (14, 38), (15, 43)], 3, 's'), ([(17, 32), (14, 35)], 4)],
           hands=[(42, 26, 'grip', False), (13, 43, 'fist', False)],
           front=apron, props=paddle)

    def vat(l):
        l.rect(37, 42, 62, 58, 'o'); l.ell(37, 54, 62, 61, 'o')
        l.rect(55, 44, 62, 59, 'O')
        l.hl(37, 62, 47, 'O'); l.hl(37, 62, 55, 'O')
        l.ell(36, 38, 63, 46, 'o')
        l.ell(38, 39, 61, 45, 'v')
        l.ring(36, 38, 63, 46, 'O')
    v = layer(); vat(v); c.paste(v)
    # paddle shows above the dye
    c.vl(44, 38, 41, 'o'); c.vl(45, 38, 41, 'O')
    c.pts('w', [(49, 41), (50, 41), (40, 43)])
    return c.rows(), pal


PORTRAIT = ('yellow.dyer', art)
