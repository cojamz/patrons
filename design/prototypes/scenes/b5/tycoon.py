import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def tycoon():
    c = C(N)
    pal = base(COOL, 'gold', p='#3c3a52', P='#33314a', u='#7fa6c9', U='#6b93b8', i='#4d5f80', I='#43546f',
               g='#8a8a90', y='#f2cf5a', Y='#c3962c', Z='#f8e39a', H='#1c1410', z='#2e221c', q='#2f2a33', t='#7a2a2a',
               o='#7a4a2e', O='#5e3824')
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'P')

    def window(l):                                    # tall window with the city below
        l.rect(4, 4, 59, 44, 'u')
        l.poly([(4, 44), (4, 30), (10, 30), (10, 22), (17, 22), (17, 34), (24, 34), (24, 18), (31, 18), (31, 32),
                (40, 32), (40, 24), (47, 24), (47, 14), (53, 14), (53, 30), (59, 30), (59, 44)], 'U')
        l.vl(31, 4, 44, 'I'); l.vl(32, 4, 44, 'I')
    bg(c, window, 'I')
    c.ell(48, 6, 52, 10, 'Z')

    def bars(l):                                      # a stack of gold bars at his elbow
        for (x, y) in ((38, 52), (47, 52), (56, 52), (42, 47), (51, 47), (46, 42)):
            l.poly([(x, y), (x + 9, y), (x + 8, y - 4), (x + 1, y - 4)], 'y')
            l.hl(x + 2, x + 7, y - 4, 'Z'); l.rect(x + 7, y - 3, x + 8, y, 'Y')
    bg(c, bars, 'Y')
    cx = 26
    DK = {'1': '2', 'w': 'w', 'q': 'q'}

    def front(f):                                     # white shirt, red tie
        f.poly([(cx - 4.5, 34), (cx + 4.5, 34), (cx, 41)], 'w')
        f.rect(cx - 1, 35, cx, 41, 't'); f.px(cx - 1, 35, 'r')
        for (x, y) in ((cx - 5, 34), (cx - 5, 35), (cx - 4, 36), (cx - 4, 37), (cx - 3, 38), (cx - 3, 39), (cx - 2, 40)):
            f.px(x, y, '2'); f.px(2 * cx - x - 1, y, '2')
        f.px(cx + 1, 44, 'Y'); f.px(cx + 1, 47, 'Y')

    person(c, cx, 18, hs='side', hk='H', hdk='z', mouth='smile', brows='stern', hat=lambda f: f.pts('g', [(19, 22), (19, 23), (32, 22), (32, 23)]),
           shirt='1', sdk='2', sw=8, ww=7, th=13, pants='1', pdk='2', shoe='q', lh=8, front=front, DK=DK,
           arms=[([(cx - 7, 37), (cx - 9, 42), (cx - 8, 46)], 4, '1'),
                 ([(cx + 7, 37), (cx + 11, 41), (cx + 16, 39)], 4, '1')],
           hands=[(cx - 10, 47, 'fist', False), (cx + 16, 39, 'flat', True)])

    return c.rows(), pal


PORTRAIT = ('gold.tycoon', tycoon)
