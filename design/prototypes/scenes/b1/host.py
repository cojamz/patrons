import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(p='#5b4a6b', P='#4f405e', o='#7a5a44', O='#614634', d='#3f3448',
                   y='#f6d77e', Y='#e0a94f', g='#c9dbe0', G='#9db6bd', m='#b8324a',
                   e='#e79a3a', E='#b8742a', n='#2e2a36', z='#231c22', H='#1f1717')
    pal['1'], pal['2'] = RED
    pal['a'], pal['A'] = DEEP
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 50, 63, 63, 'P')

    def door(l):                         # open front door, warm light spilling
        l.rect(44, 10, 62, 50, 'O'); l.rect(46, 12, 60, 50, 'Y'); l.rect(48, 14, 58, 50, 'y')
        l.poly([(46, 12), (52, 15), (52, 50), (46, 50)], 'o')
        l.px(50, 32, 'Y')
    bg(c, door)

    def lights(l):                       # string of party lights, sagging
        pts = [(0, 6), (8, 9), (16, 11), (24, 12), (32, 11), (40, 9), (48, 6), (56, 4), (63, 3)]
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            l.line(x0, y0, x1, y1, 'd')
        for (x, y) in ((4, 8), (12, 11), (20, 12), (28, 12), (36, 11), (44, 8), (52, 6), (60, 4)):
            l.rect(x, y + 1, x + 1, y + 2, 'y' if (x // 4) % 2 else 'e')
    bg(c, lights)

    def balloons(l):
        l.ell(3, 16, 10, 25, 'm'); l.ell(9, 22, 15, 30, 'e')
        l.line(7, 26, 9, 44, 'd'); l.line(12, 31, 11, 44, 'd')
    bg(c, balloons)
    c.pts('g', [(5, 18), (5, 19), (11, 24)])

    def front(f):
        f.poly([(29, 30), (35, 30), (32, 38)], 'w')
        f.rect(31, 30, 32, 31, 'n'); f.pts('n', [(30, 30), (33, 30), (29, 31), (34, 31)])   # bow tie
        for (x, y) in ((28, 30), (28, 31), (29, 32), (29, 33), (30, 34), (30, 35), (31, 36), (31, 37)):
            f.px(x, y, '2'); f.px(63 - x, y, '2')
        f.hl(37, 39, 34, 'y')

    def top(f):
        gl = layer()
        gl.poly([(15.5, 24), (24.5, 24), (20, 29)], 'g'); gl.poly([(17, 25), (23, 25), (20, 28)], 'm')
        gl.hl(16, 23, 24, 'G')
        over(f, gl, {'1': '2'})
        hl = layer(); hand(hl, 18, 30, 'grip', 'a', 'A'); over(f, hl, {'g': 'G', '1': '2'})

    def stem(p):
        p.vl(20, 29, 30, 'G')

    person(c, hx=24, hy=12, size=16, skin='a', shade='A', hs='side', hk='H', hd='z', mouth='smile', brows='soft',
           shirt='1', sdark='2', cx=32, ty=29, sw=8, ww=7, th=13,
           arms=[([(25, 33), (21, 39), (20, 34)], 4), ([(39, 33), (44, 39), (48, 40)], 4)],
           hands=[(48, 38, 'flat', False)],
           lg=dict(pants='n', pdark='n', shoe='z', lh=8, stance=1),
           front=front, top=top, props=stem, DK={'n': 'n'})
    return c.rows(), pal


PORTRAIT = ('red.host', draw)
