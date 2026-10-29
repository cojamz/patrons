import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(p='#3a3550', P='#332e47', o='#8a6142', O='#6d4a31', s='#4a4462', y='#f6e08e', Y='#d9b54f',
                   m='#c8ccd0', M='#8d939a', x='#26262e', X='#3a3a46', u='#4f6fa8', U='#3e5a8c',
                   H='#1f1717', h='#3b2a22', j='#f3ead2', e='#c9a24a')
    pal['1'], pal['2'] = GREEN
    pal['a'], pal['A'] = OLIVE
    c.rect(0, 0, 63, 63, 'p')

    def light(l):                         # a soft spotlight cone on the singer
        l.poly([(26, 0), (38, 0), (52, 54), (12, 54)], 's')
    bg(c, light)
    c.rect(28, 0, 36, 2, 'M'); c.hl(29, 35, 3, 'y')

    def drums(l):                         # the band's kit and an amp behind
        l.ell(2, 32, 20, 50, 'u'); l.ell(5, 35, 17, 47, 'U'); l.ell(7, 37, 15, 45, 'j')
        l.rect(14, 28, 22, 33, 'u'); l.hl(14, 22, 28, 'm')
        l.rect(3, 22, 4, 31, 'M'); l.ell(0, 20, 8, 23, 'e')
        l.rect(48, 32, 62, 54, 'X'); l.rect(50, 35, 60, 51, 'x'); l.ell(51, 38, 59, 48, 'X')
    bg(c, drums)
    c.rect(0, 54, 63, 63, 'o'); c.hl(0, 63, 54, 'O')

    def front(f):
        # big standing collar and a gold belt: the costume of the star they copy
        f.poly([(28.5, 25), (35.5, 25), (32, 31)], 'a')
        f.rect(24, 42, 40, 43, 'e')
        f.pts('y', [(27, 37), (37, 37), (30, 40), (34, 40)])

    def hair_top(f):                      # pompadour and sideburns
        f.ell(25, 4, 39, 12, 'H'); f.pts('h', [(29, 6), (30, 5), (31, 5), (32, 5), (33, 6), (35, 7)])
        f.rect(25, 16, 25, 20, 'H'); f.rect(38, 16, 38, 20, 'H')
        f.poly([(22, 26), (27, 28), (27, 31), (22, 30)], 'j'); f.poly([(42, 26), (37, 28), (37, 31), (42, 30)], 'j')
        # the mic in hand, at the mouth
        mk = layer(); mk.rect(22, 21, 24, 24, 'M'); mk.px(22, 21, 'm')
        over(f, mk, {'a': 'A'})
        hl = layer(); hand(hl, 21, 25, 'grip', 'a', 'A'); over(f, hl, {'1': '2', 'M': 'M'})

    def stand(p):
        pole(p, 22, 29, 53, 'm', 'M'); p.hl(18, 27, 53, 'M')

    person(c, hx=25, hy=10, size=14, skin='a', shade='A', hs='crop', hk='H', hd='h', mouth='smirk', brows='soft',
           shirt='1', sdark='2', cx=32, sw=8, ww=7, th=14,
           arms=[([(26, 28), (21, 33), (22, 28)], 4), ([(38, 28), (44, 31), (47, 26)], 4)],
           hands=[(46, 22, 'fist', False)],
           lg=dict(pants='1', pdark='2', shoe='j', lh=10, stance=2),
           front=front, top=hair_top, props=stand)
    return c.rows(), pal


PORTRAIT = ('echo.dejavu', draw)
