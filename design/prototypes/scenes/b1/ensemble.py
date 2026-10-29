import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(p='#2f2a3e', c='#7a3a5a', C='#632e4a', o='#a2683f', O='#7d4f2e', y='#f6d77e', Y='#e0a94f',
                   n='#2c3a33', z='#231c1c', H='#2a1d18', h='#4a3328', j='#f3ead2', e='#d9b46a', E='#a8843f')
    pal['1'], pal['2'] = GREEN
    pal['a'], pal['A'] = DEEP
    pal['b'], pal['B'] = PALE
    c.rect(0, 0, 63, 63, 'p')

    def curtains(l):                      # stage curtains drawn back, a valance on top
        l.poly([(0, 0), (14, 0), (9, 30), (12, 54), (0, 54)], 'c')
        l.poly([(63, 0), (49, 0), (54, 30), (51, 54), (63, 54)], 'c')
        l.rect(0, 0, 63, 5, 'c')
        for x in range(0, 64, 8):
            l.ell(x, 3, x + 7, 8, 'c')
        l.vl(5, 9, 52, 'C'); l.vl(58, 9, 52, 'C')
    bg(c, curtains, 'C')

    def stage(l):
        l.rect(0, 54, 63, 63, 'o'); l.hl(0, 63, 54, 'O')
        for x in (6, 22, 38, 54):
            l.ell(x, 59, x + 4, 63, 'y')
    bg(c, stage, 'O')

    # A: deep, left, in a green gown
    def gown(f):
        f.poly([(14, 40), (26, 40), (29, 54), (11, 54)], '1')
        f.poly([(22, 42), (26, 40), (29, 54), (24, 54)], '2', only='1')
        f.rect(12, 54, 15, 55, 'z'); f.rect(24, 54, 27, 55, 'z')
    person(c, hx=13, hy=15, size=14, skin='a', shade='A', hs='long', hk='H', hd='h', mouth='smile', brows='soft',
           shirt='1', sdark='2', cx=20, sw=6, ww=5, th=11,
           arms=[([(15, 33), (11, 38), (8, 41)], 3), ([(25, 32), (28, 28), (30, 22)], 3)],
           hands=[(6, 41, 'flat', False), (29, 19, 'grip', False)],
           front=gown)

    # B: pale, right, in a green waistcoat, mid-song
    def vest(f):
        f.poly([(40.5, 29), (47.5, 29), (44, 35)], 'j')
        f.rect(43, 30, 44, 41, 'j'); f.pts('e', [(43, 36), (43, 39)])
    person(c, hx=37, hy=13, size=14, skin='b', shade='B', hs='side', hk='e', hd='E', mouth='open', brows='soft',
           brow='E', shirt='1', sdark='2', cx=44, sw=7, ww=6, th=13,
           arms=[([(38, 32), (35, 28), (33, 22)], 3), ([(50, 32), (54, 36), (57, 39)], 3)],
           hands=[(31, 18, 'fist', True), (56, 39, 'flat', True)],
           lg=dict(pants='n', pdark='n', shoe='z', lh=9), front=vest, DK={'n': 'n'})
    return c.rows(), pal


PORTRAIT = ('echo.ensemble', draw)
