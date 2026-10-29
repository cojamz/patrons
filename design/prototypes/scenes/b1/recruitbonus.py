import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(p='#9cc4bd', P='#8ab4ad', y='#f3cf5a', Y='#c99a2a', o='#c9a066', O='#9e7840',
                   m='#e9e4d8', M='#b8b2a4', g='#5f8f9a', n='#3a3644', N='#4b4656', z='#2a2220', H='#2a1d18',
                   h='#4a3328', u='#7a9fd0', U='#5579b0', x='#d76a8a')
    pal['1'], pal['2'] = RED
    pal['a'], pal['A'] = MED
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 50, 63, 63, 'P')

    def poster(l):                        # framed gold-star certificate
        l.rect(3, 6, 18, 24, 'O'); l.rect(5, 8, 16, 22, 'm')
        l.stamp(7, 10, ['...y...', '...y...', '..yyy..', 'yyyyyyy', '.yyyyy.', '..yyy..', '.yy.yy.', '.y...y.'])
        l.hl(7, 14, 20, 'M')
    bg(c, poster, 'O')

    def clock(l):
        l.ell(48, 5, 59, 16, 'M'); l.ell(49, 6, 58, 15, 'm')
        l.vl(53, 8, 11, 'n'); l.hl(54, 56, 11, 'n')
    for k, pts in (('x', [(26, 4), (40, 8), (6, 32), (56, 27)]), ('y', [(34, 3), (12, 36), (58, 20)]), ('u', [(45, 2), (52, 38)])):
        for (x, y) in pts:
            c.px(x, y, k); c.px(x + 1, y + 1, k)

    def counter(l):
        l.rect(0, 46, 63, 63, 'o'); l.hl(0, 63, 46, 'O'); l.hl(0, 63, 47, 'm')
        l.rect(0, 54, 63, 55, 'O')
    bg(c, counter)

    def top(f):
        ev = layer()                      # the bonus: an envelope with a gold star seal, held up high
        ev.rect(37, 5, 51, 14, 'm'); ev.line(37, 5, 44, 10, 'M'); ev.line(51, 5, 44, 10, 'M')
        ev.stamp(42, 9, ['.Y.', 'YYY', '.Y.'.replace('.Y.', 'Y.Y')])
        ev.rect(43, 9, 45, 11, 'y'); ev.px(44, 12, 'Y'); ev.px(43, 12, 'Y'); ev.px(45, 12, 'Y')
        over(f, ev, {'1': '2'})
        hl = layer(); hand(hl, 39, 13, 'grip', 'a', 'A'); over(f, hl, {'m': 'M', 'M': 'M'})
        hl = layer(); hand(hl, 17, 43, 'flat', 'a', 'A'); over(f, hl, {'1': '2'})

    def front(f):
        f.poly([(25.5, 29), (31.5, 29), (28.5, 34)], 'm')
        for (x, y) in ((24, 29), (24, 30), (25, 31), (25, 32), (26, 33), (26, 34)):
            f.px(x, y, '2'); f.px(57 - x, y, '2')

    person(c, hx=21, hy=14, size=14, skin='a', shade='A', hs='bun', hk='H', hd='h', mouth='grin', brows='soft',
           shirt='1', sdark='2', cx=28, ty=29, sw=7, ww=7, th=17,
           arms=[([(22, 31), (19, 37), (19, 43)], 4), ([(34, 31), (40, 27), (41, 17)], 4)],
           front=front, top=top)
    return c.rows(), pal


PORTRAIT = ('red.recruitbonus', draw)
