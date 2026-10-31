import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def speculator():
    c = C(N)
    pal = base(LIGHT, 'gold', p='#4a5160', P='#424857', i='#2f3a46', I='#283240', g='#6fc07a', G='#4c9a5a',
               R='#d0604f', T='#a8463a', e='#c9ced3', q='#2c2a30', Q='#55525c', H='#b4532a', z='#8a3c1e', t='#3b3a48', f='#6b6f78')
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 50, 63, 63, 'P')

    def board(l):                                   # the price board, line shooting up
        l.rect(2, 3, 61, 33, 'I'); l.rect(3, 4, 60, 32, 'i')
    bg(c, board, None)
    pts = [(5, 18), (9, 22), (12, 21), (16, 27), (19, 22), (24, 15), (30, 18), (38, 12), (44, 14), (50, 8), (56, 6)]
    for i, (a, b) in enumerate(zip(pts, pts[1:])):
        k, d = ('R', 'T') if i < 3 else ('g', 'G')
        c.line(*a, *b, k); c.line(a[0], a[1] + 1, b[0], b[1] + 1, d)
    c.pts('g', [(54, 5), (55, 5), (56, 5), (57, 5), (57, 6), (57, 7), (57, 8)])

    cx = 30
    DK = {'1': '2', 'q': 'q', 'e': 'e', 'w': 'w'}

    def front(f):
        f.poly([(cx - 4.5, 35), (cx + 4.5, 35), (cx, 41)], 'w')
        for (x, y) in ((cx - 5, 35), (cx - 5, 36), (cx - 4, 37), (cx - 4, 38), (cx - 3, 39), (cx - 3, 40), (cx - 2, 41)):
            f.px(x, y, '2'); f.px(2 * cx - x - 1, y, '2')

    def phone(f):                                   # phone pressed to the ear, hand round it
        p = layer(); p.rect(37, 23, 40, 31, 'Q'); p.vl(40, 23, 31, 'q'); p.px(38, 24, 'e'); over(f, p, DK)
        h_ = layer(); hand(h_, 36, 28, 'grip', 's', 'S', True); over(f, h_, DK)

    person(c, cx, 20, hs='side', hk='H', hdk='z', mouth='open', brows='angry',
           shirt='1', sdk='2', sw=8, ww=7, th=12, pants='t', pdk='t', shoe='q', lh=8, front=front, DK=DK,
           arms=[([(cx - 7, 38), (cx - 13, 37), (cx - 15, 25)], 4, '1'),
                 ([(cx + 7, 38), (cx + 11, 40), (cx + 9, 32)], 4, '1')],
           top=lambda f: (phone(f), fist5(f, cx - 18, 20)))
    c.pts('S', [(26, 31), (34, 31)])                # two freckles
    return c.rows(), pal


PORTRAIT = ('gold.speculator', speculator)
