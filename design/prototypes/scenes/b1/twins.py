import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(s='#bfdbe6', S='#aecfdc', g='#93c26f', G='#7fb05c', m='#f2ecdc', M='#cfc6b0',
                   t='#6f9a52', T='#5a8443', o='#8a6142', n='#3a4660', N='#4b5878', z='#2a2220',
                   H='#c0602e', h='#934520', y='#f3d27a')
    pal['1'], pal['2'] = RED
    pal['a'], pal['A'] = PALE
    c.rect(0, 0, 63, 63, 's'); c.rect(0, 46, 63, 63, 'g'); c.rect(0, 56, 63, 63, 'G')

    def yard(l):                          # backyard: a tree and a picket fence
        l.rect(0, 36, 63, 46, 't')
        for x in range(-2, 64, 6):
            l.ell(x, 32, x + 7, 39, 't')
    bg(c, lambda l: (l.ell(38, 0, 70, 22, 't'), l.rect(52, 18, 55, 40, 'o')), 'T')
    bg(c, yard, 'T')
    c.ell(42, 4, 50, 10, 'T'); c.ell(57, 9, 63, 15, 'T')
    c.ell(6, 3, 11, 8, 'y')

    def kid(hx, hy, cx, arms, hands, mouth):
        def freckles(f):
            f.pts('A', [(hx + 3, hy + 10), (hx + 10, hy + 10)])
        person(c, hx=hx, hy=hy, size=14, skin='a', shade='A', hs='side', hk='H', hd='h', mouth=mouth, brows='soft',
               shirt='1', sdark='2', cx=cx, sw=6, ww=5, th=11, arms=arms, hands=hands,
               lg=dict(pants='n', pdark='N', shoe='z', lh=7), top=freckles, DK={'n': 'N'})

    kid(3, 19, 10, [([(5, 37), (3, 42), (3, 45)], 3, '2'), ([(15, 37), (17, 42), (19, 45)], 3, '2')],
        [(1, 45, 'fist', False), (18, 44, 'fist', False)], 'grin')
    kid(25, 18, 32, [([(27, 36), (24, 41), (22, 44)], 3, '2'), ([(37, 36), (40, 41), (42, 44)], 3, '2')],
        [(20, 44, 'grip', False), (41, 44, 'grip', True)], 'smile')
    kid(47, 19, 54, [([(49, 37), (46, 42), (44, 45)], 3, '2'), ([(59, 37), (61, 42), (60, 46)], 3, '2')],
        [(58, 46, 'fist', False)], 'smile')
    return c.rows(), pal


PORTRAIT = ('red.twins', draw)
