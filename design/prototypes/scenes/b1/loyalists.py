import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(s='#bcd6df', g='#a9a39a', G='#958f86', o='#8a6142', O='#6d4a31', t='#a8703f', T='#6e4528',
                   x='#7d9a5c', n='#3a3644', N='#4b4656', z='#2f2723', H='#2c201b', y='#e7c46a', Y='#b88d3a')
    pal['1'], pal['2'] = RED
    pal['a'], pal['A'] = DEEP
    pal['b'], pal['B'] = PALE
    c.rect(0, 0, 63, 63, 's')

    def wall(l):                         # stone gatehouse wall with a shut wooden gate
        l.rect(0, 14, 63, 54, 'g')
        for x in range(0, 64, 9):
            l.rect(x, 10, x + 4, 13, 'g')
        l.rect(20, 22, 44, 54, 'O'); l.ell(20, 14, 44, 30, 'O')
        l.rect(22, 24, 42, 54, 'o'); l.ell(22, 16, 42, 32, 'o')
        l.vl(32, 17, 54, 'O')
        for y0 in (22, 38):
            l.hl(22, 42, y0, 'O')
    bg(c, wall, 'G')
    for (x, y) in ((4, 22), (11, 30), (52, 20), (57, 34), (6, 44), (49, 46)):
        c.hl(x, x + 3, y, 'G')
    c.rect(0, 55, 63, 63, 'x')

    # A: deep, left, holding the gate's banner pole
    def poleA(p):
        pole(p, 7, 4, 58, 't', 'T')

    def bannerA(f):
        pass

    person(c, hx=14, hy=16, skin='a', shade='A', hs='crop', hk='H', hd='z', mouth='smile', brows='soft',
           shirt='1', sdark='2', cx=21, sw=6, ww=5, th=12,
           arms=[([(15, 33), (11, 39), (9, 36)], 4), ([(27, 33), (29, 38), (30, 43)], 3, '2')],
           hands=[(6, 33, 'grip', False), (29, 43, 'fist', False)],
           lg=dict(pants='n', pdark='N', shoe='z', lh=8),
           props=poleA, DK={'n': 'N', 'N': 'N'})
    # banner on A's pole, flying right over the wall
    fl = layer()
    fl.poly([(9, 5), (22, 6), (20, 10), (22, 14), (9, 14)], '1')
    fl.poly([(9, 11), (21, 12), (22, 14), (9, 14)], '2', only='1')
    fl.stamp(13, 6, ['..y..', '.yyy.', 'yyyyy', '.yyy.', '.y.y.'])
    c.paste(fl)

    # B: pale, right, linking hands with A
    person(c, hx=35, hy=15, skin='b', shade='B', hs='long', hk='y', hd='Y', mouth='smile', brows='soft', brow='Y',
           shirt='1', sdark='2', cx=42, sw=6, ww=5, th=13,
           arms=[([(36, 33), (34, 38), (33, 43)], 3, '2'), ([(48, 33), (50, 38), (50, 44)], 3, '2')],
           hands=[(31, 42, 'grip', True), (48, 44, 'fist', False)],
           lg=dict(pants='n', pdark='N', shoe='z', lh=8),
           DK={'n': 'N', 'N': 'N'})
    return c.rows(), pal


PORTRAIT = ('red.loyalists', draw)
