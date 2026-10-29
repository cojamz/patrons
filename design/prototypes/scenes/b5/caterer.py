import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def caterer():
    c = C(N)
    pal = base(PALE, 'silver', p='#6e5a6e', P='#625064', m='#efe8dc', M='#d6cdbf', o='#6a3d25',
               y='#f2cf5a', Y='#c3962c', e='#e6eaee', E='#aeb5bd', g='#7a9a5a', R='#b8473c',
               q='#2f2a33', H='#b0662e', z='#7e4520', t='#2c2a3a')
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'P')

    def table(l):                                   # the buffet behind her, white cloth
        l.rect(0, 38, 63, 52, 'm'); l.hl(0, 63, 38, 'M'); l.rect(0, 46, 63, 47, 'M')
        l.ell(2, 34, 12, 39, 'E'); l.ell(4, 32, 10, 36, 'R')
        l.ell(48, 34, 60, 39, 'E'); l.ell(50, 32, 58, 36, 'g')
    bg(c, table, None)
    for x in (16, 44):                              # two candles, the light sources
        c.rect(x, 30, x + 1, 37, 'm'); c.pts('y', [(x, 28), (x, 29), (x + 1, 29)])

    cx = 26
    DK = {'1': '2', 'w': 'M', 'm': 'M', 'e': 'E', 'q': 'q'}

    def front(f):                                   # white collar, bow tie, long apron
        f.poly([(cx - 4, 32), (cx + 4, 32), (cx, 38)], 'w')
        f.rect(cx - 1, 33, cx, 34, 'q')
        f.rect(cx - 8, 43, cx + 8, 50, 'm'); f.rect(cx + 5, 43, cx + 8, 50, 'M')

    def tray(f):                                    # tray up on a flat hand, a silver dome
        t = layer()
        t.ell(cx + 6, 13, cx + 20, 26, 'e'); t.rect(cx + 6, 21, cx + 20, 24, '.')
        t.rect(cx + 15, 15, cx + 19, 20, 'E'); t.rect(cx + 12, 11, cx + 14, 12, 'E')
        t.px(cx + 9, 16, 'w'); t.px(cx + 10, 15, 'w')
        t.hl(cx + 4, cx + 22, 21, 'E'); t.hl(cx + 5, cx + 21, 22, 'E')
        over(f, t, DK)
        h_ = layer(); hand(h_, cx + 10, 23, 'flat', 's', 'S'); over(f, h_, DK)

    def towel(f):                                   # forearm across the waist, a narrow towel fold over it
        t = layer(); t.rect(cx - 7, 42, cx - 4, 49, 'm'); t.vl(cx - 4, 43, 49, 'M'); t.hl(cx - 7, cx - 4, 42, 'w')
        over(f, t, DK)
        h_ = layer(); hand(h_, cx - 3, 42, 'grip', 's', 'S'); over(f, h_, DK)

    person(c, cx, 17, hs='long', hk='H', hdk='z', mouth='smile', brows='soft',
           shirt='1', sdk='2', sw=7, ww=7, th=16, pants='t', pdk='t', shoe='q', lh=4, front=front, DK=DK,
           arms=[([(cx - 6, 36), (cx - 9, 42), (cx - 3, 43)], 4, '1'),
                 ([(cx + 6, 37), (cx + 11, 37), (cx + 12, 26)], 4, '1')],
           top=lambda f: (towel(f), tray(f)))
    return c.rows(), pal


PORTRAIT = ('silver.caterer', caterer)
