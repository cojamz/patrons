import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(p='#3a3550', P='#332e47', o='#8a6142', O='#6d4a31', s='#4a4462', y='#f6e08e', Y='#d9b54f',
                   m='#c8ccd0', M='#8d939a', x='#26262e', u='#4f6fa8', U='#3e5a8c',
                   H='#1f1717', j='#f3ead2', e='#c9a24a')
    pal['1'], pal['2'] = GREEN
    pal['a'], pal['A'] = OLIVE
    pal['d'], pal['D'] = DEEP
    pal['f'], pal['F'] = PALE
    c.rect(0, 0, 63, 63, 'p')

    def light(l):                         # a soft spotlight cone on the singer
        l.poly([(26, 0), (38, 0), (52, 54), (12, 54)], 's')
    bg(c, light)
    c.rect(28, 0, 36, 2, 'M'); c.hl(29, 35, 3, 'y')

    def drums(l):                         # the band's kit and an amp behind
        # a bass drum seen three-quarter: shell side, cream head in a light hoop, two little legs
        l.rect(10, 36, 21, 50, 'u'); l.hl(10, 21, 50, 'U'); l.vl(21, 37, 49, 'U')
        l.ell(2, 35, 16, 51, 'm'); l.ell(3, 36, 15, 50, 'j')
        l.rect(7, 41, 10, 44, 'e'); l.pts('Y', [(10, 44), (7, 44)])
        l.vl(4, 51, 53, 'M'); l.vl(19, 51, 53, 'M')
        # a cymbal on a thin stand
        l.rect(20, 23, 21, 35, 'M'); l.hl(16, 24, 21, 'e'); l.hl(17, 23, 22, 'Y')
        l.rect(48, 32, 62, 54, 's'); l.rect(50, 35, 60, 51, 'x'); l.ell(51, 38, 59, 48, 's')
    # Tribute Band counts as 3 members (Cory, Oct 29): a drummer behind the kit and a guitarist join the singer
    def costume(cx, ty, sw):              # the same gold epaulettes and buttons as the singer
        return lambda f: (f.hl(cx - sw + 1, cx - sw + 3, ty + 2, 'e'), f.hl(cx + sw - 3, cx + sw - 1, ty + 2, 'e'),
                          f.pts('y', [(cx - 3, ty + 6), (cx + 2, ty + 6)]))

    def stick(p):                         # one stick up, mid-beat
        p.line(19, 25, 23, 16, 'j'); p.line(20, 25, 24, 16, 'M')
    person(c, hx=4, hy=15, size=14, skin='d', shade='D', hs='crop', hk='H', hd='O', mouth='smile', brows='soft',
           shirt='1', sdark='2', cx=11, sw=7, ww=6, th=16, front=costume(11, 30, 7),
           arms=[([(16, 33), (20, 31), (19, 27)], 4)], hands=[(17, 24, 'fist', True)], props=stick)
    bg(c, drums)
    c.rect(0, 54, 63, 63, 'o'); c.hl(0, 63, 54, 'O')

    def front(f):
        # big standing collar and a gold belt: the costume of the star they copy
        f.poly([(28.5, 25), (35.5, 25), (32, 31)], 'a')
        f.rect(24, 42, 40, 43, 'e')
        f.pts('y', [(27, 37), (37, 37), (30, 40), (34, 40)])

    def hair_top(f):                      # pompadour and sideburns
        f.ell(25, 4, 39, 12, 'H'); f.pts('O', [(29, 6), (30, 5), (31, 5), (32, 5), (33, 6), (35, 7)])
        f.rect(25, 16, 25, 20, 'H'); f.rect(38, 16, 38, 20, 'H')
        f.poly([(23, 27), (27, 28), (27, 30), (23, 29)], 'e'); f.poly([(41, 27), (37, 28), (37, 30), (41, 29)], 'e')
        # the mic in hand, at the mouth
        mk = layer(); mk.rect(22, 21, 24, 24, 'M'); mk.px(22, 21, 'm')
        over(f, mk, {'a': 'A'})
        hl = layer(); hand(hl, 21, 26, 'grip', 'a', 'A'); over(f, hl, {'1': '2', 'M': 'M'})

    def stand(p):
        pole(p, 22, 29, 53, 'm', 'M'); p.hl(18, 27, 53, 'M')

    person(c, hx=25, hy=10, size=14, skin='a', shade='A', hs='crop', hk='H', hd='O', mouth='smirk', brows='soft',
           shirt='1', sdark='2', cx=32, sw=8, ww=7, th=14,
           arms=[([(26, 28), (21, 33), (22, 28)], 4), ([(38, 28), (42, 33), (42, 38)], 4)],
           hands=[(40, 38, 'fist', False)],
           lg=dict(pants='1', pdark='2', shoe='j', lh=10, stance=2),
           front=front, top=hair_top, props=stand)

    def guitar(f):                        # a gold guitar slung across the body
        costume(55, 30, 6)(f); f.rect(49, 41, 61, 42, 'e')
        f.ell(43, 37, 54, 47, 'e'); f.ell(46, 40, 50, 44, 'Y'); f.rect(47, 41, 49, 43, 'x')
        f.line(52, 41, 61, 33, 'O'); f.line(53, 41, 62, 33, 'o')
    person(c, hx=48, hy=15, size=14, skin='f', shade='F', hs='side', hk='O', hd='H', side='R', mouth='grin', brows='soft',
           shirt='1', sdark='2', cx=55, sw=6, ww=6, th=13,
           arms=[([(50, 32), (47, 37), (48, 41)], 4), ([(60, 32), (62, 35), (59, 36)], 4)],
           hands=[(46, 40, 'flat', False), (58, 34, 'grip', True)],
           lg=dict(pants='1', pdark='2', shoe='j', lh=8, stance=1), front=guitar)
    return c.rows(), pal


PORTRAIT = ('echo.dejavu', draw)
