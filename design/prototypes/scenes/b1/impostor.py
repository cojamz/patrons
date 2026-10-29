import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(p='#6f5a7a', P='#63506d', c='#a4475e', C='#86384c', y='#f6d77e', Y='#d9b54f',
                   m='#efe6d6', M='#cdbfa6', t='#a8703f', T='#6e4528', n='#2c3a33', z='#231c1c',
                   H='#2a1d18', h='#4a3328', x='#45507a', j='#f3ead2')
    pal['1'], pal['2'] = GREEN
    pal['a'], pal['A'] = PALE
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'P')

    def curtains(l):                      # a masked ball: tall curtained window
        l.rect(42, 4, 60, 44, 'x'); l.ell(53, 8, 57, 12, 'y'); l.ell(55, 7, 59, 11, 'x')
        l.rect(40, 2, 45, 46, 'c'); l.rect(58, 2, 62, 46, 'c')
        l.rect(39, 1, 63, 3, 'C')
    bg(c, curtains, 'C')

    def lamp(l):                          # wall sconce
        l.rect(6, 18, 9, 20, 'Y'); l.rect(7, 12, 8, 17, 'm'); l.px(7, 10, 'y'); l.px(7, 11, 'y'); l.px(8, 11, 'y')

    def front(f):
        # trench coat: wide lapels, belt
        f.poly([(29.5, 29), (34.5, 29), (32, 34)], 'j')
        for (x, y) in ((27, 29), (27, 30), (28, 31), (28, 32), (29, 33), (29, 34), (30, 35)):
            f.px(x, y, '2'); f.px(64 - x, y, '2')
        f.rect(24, 40, 40, 41, '2'); f.rect(31, 40, 33, 41, 'Y')
        f.vl(32, 42, 47, '2')

    def top(f):
        mk = layer()                      # a blank mask on a stick, held up beside the face
        mk.ell(8, 10, 20, 24, 'm'); mk.poly([(14, 24), (8, 18), (20, 18)], 'm')
        mk.pts('M', [(19, 15), (19, 16), (19, 17), (18, 20), (17, 22), (15, 24)])
        mk.rect(10, 15, 12, 16, 'k'); mk.rect(15, 15, 17, 16, 'k')
        over(f, mk, {'1': '2', 'a': 'A'})

    def stick(p):
        pole(p, 14, 25, 33, 't', 'T')

    person(c, hx=25, hy=13, size=14, skin='a', shade='A', hs='side', hk='H', hd='h', mouth='smirk', brows='angry',
           brow='H', shirt='1', sdark='2', cx=32, sw=8, ww=8, th=17,
           arms=[([(26, 31), (21, 37), (16, 35)], 4), ([(38, 31), (40, 38), (38, 43)], 4)],
           hands=[(13, 33, 'grip', False), (37, 43, 'fist', False)],
           lg=dict(pants='n', pdark='n', shoe='z', lh=5), front=front, top=top, props=stick, DK={'n': 'n'})
    return c.rows(), pal


PORTRAIT = ('echo.impostor', draw)
