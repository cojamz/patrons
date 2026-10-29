import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(p='#c98f74', P='#b98066', s='#b3aca2', S='#a19a90', i='#e7dcb0', x='#3d3f48', X='#5a5c66',
                   o='#e3a24e', O='#b5782e', d='#6d4a31', D='#4f3423', y='#f3d27a', Y='#c9a24a',
                   n='#3a4660', N='#4b5878', z='#2a2220', H='#c0602e', h='#934520')
    pal['1'], pal['2'] = GREEN
    pal['a'], pal['A'] = PALE
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 50, 63, 63, 's'); c.hl(0, 63, 50, 'S')

    for (x, y) in ((3, 6), (14, 10), (50, 4), (44, 16), (6, 28), (55, 30), (20, 40), (48, 42), (2, 44)):
        c.hl(x, x + 5, y, 'P')                        # a few bricks, not a pattern

    def window(l):                        # lit shop window round the corner
        l.rect(48, 8, 63, 34, 'd'); l.rect(50, 10, 63, 32, 'i'); l.vl(56, 10, 32, 'd')
    bg(c, window, 'D')

    def lamp(l):
        l.rect(6, 6, 7, 50, 'x'); l.rect(3, 3, 10, 5, 'x'); l.hl(4, 9, 6, 'y')
    bg(c, lamp)

    def case(l):                          # open guitar case with a few coins
        l.poly([(6, 51), (30, 51), (31, 46), (7, 46)], 'd')
        l.rect(5, 51, 31, 59, 'D'); l.rect(7, 52, 29, 57, '2')
    bg(c, case)
    c.pts('y', [(11, 54), (12, 54), (18, 53), (19, 53), (24, 55), (25, 55)])
    c.pts('Y', [(12, 55), (19, 54), (25, 56)])

    def front(f):
        f.poly([(31.5, 27), (36.5, 27), (34, 30)], 'n')

    def top(f):
        hat = layer()                     # knit beanie
        hat.ell(26, 5, 42, 18, '1'); hat.rect(26, 13, 42, 15, '2'); hat.ell(32, 3, 36, 6, '2')
        hat.rect(26, 16, 42, 18, '.')
        f.paste(hat)
        g = layer()
        thick(g, [(32, 39), (17, 27)], 3, 'd'); g.ell(15, 24, 19, 28, 'D')
        g.ell(28, 32, 39, 42, 'o'); g.ell(31, 36, 46, 49, 'o')
        g.poly([(40, 36), (47, 42), (46, 49), (38, 49)], 'O', only='o')
        g.ell(32, 36, 35, 39, 'D'); g.rect(40, 45, 43, 46, 'd')
        over(f, g, {'1': '2', 'a': 'A', 'n': 'N'})
        hl = layer(); hand(hl, 18, 26, 'grip', 'a', 'A'); over(f, hl, {'d': 'D', '1': '2'})
        hl = layer(); hand(hl, 38, 41, 'fist', 'a', 'A'); over(f, hl, {'o': 'O', 'D': 'D'})
        f.pts('A', [(30, 22), (37, 22)])          # two freckles

    person(c, hx=27, hy=12, size=14, skin='a', shade='A', hs='short', hk='H', hd='h', mouth='smile', brows='soft',
           shirt='1', sdark='2', cx=34, sw=7, ww=6, th=13,
           arms=[([(28, 30), (23, 36), (20, 29)], 4), ([(40, 30), (45, 35), (41, 41)], 4)],
           lg=dict(pants='n', pdark='N', shoe='z', lh=8, stance=1), front=front, top=top, DK={'n': 'N'})
    return c.rows(), pal


PORTRAIT = ('echo.evergreen', draw)
