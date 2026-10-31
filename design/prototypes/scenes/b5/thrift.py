import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def thrift():
    c = C(N)
    pal = base(MED, 'gold', p='#b7ab98', P='#a89c89', o='#7e5a3c', O='#634530', d='#94704c',
               g='#e4a3a8', G='#c4808a', y='#f2cf5a', Y='#c3962c', Z='#fff0a8', H='#2b2020', z='#1a1414',
               q='#5b5f66', Q='#474b52', m='#efe6d4', e='#8a8f96')
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 50, 63, 63, 'P')

    def frame(l):                                   # one small picture on a bare wall
        l.rect(6, 8, 15, 18, 'O'); l.rect(7, 9, 14, 17, 'd'); l.poly([(7, 17), (10, 12), (14, 17)], 'O')
    bg(c, frame, None)

    def table(l):
        l.rect(38, 42, 63, 45, 'd'); l.rect(40, 46, 42, 60, 'o'); l.rect(59, 46, 61, 60, 'o')
        l.hl(38, 63, 45, 'O')
    bg(c, table, None)

    def piggy(l):
        l.ell(42, 32, 55, 41, 'g'); l.ell(54, 35, 57, 38, 'g'); l.rect(44, 40, 45, 42, 'G'); l.rect(51, 40, 52, 42, 'G')
        l.poly([(46, 32), (47, 29), (49, 32)], 'g'); l.hl(47, 50, 32, 'z')
        l.ell(44, 37, 54, 41, 'G', only='g'); l.px(51, 35, 'z')
    bg(c, piggy, 'G')

    def candle(l):
        l.rect(58, 35, 60, 41, 'm'); l.rect(57, 41, 61, 42, 'e')
    bg(c, candle, None)
    c.pts('y', [(59, 33), (59, 34), (58, 34)]); c.px(59, 32, 'Z')

    cx = 25
    DK = {'1': '2', 'q': 'Q', 'y': 'Y', 'e': 'e'}

    def front(f):                                   # cardigan open over a grey shirt
        f.rect(cx - 2, 34, cx + 1, 46, 'q')
        f.pts('Y', [(cx + 3, 38), (cx + 3, 42)])

    def bun(f):                                     # bun to one side
        f.ell(cx - 11, 18, cx - 6, 23, 'H'); f.pts('z', [(cx - 7, 22), (cx - 8, 23)])

    def face(f):
        f.ring(cx - 5, 24, cx - 1, 27, 'e'); f.ring(cx + 1, 24, cx + 5, 27, 'e'); f.px(cx, 25, 'e')
        f.recolor('S', 's', (cx - 1, 26, cx + 1, 28))
        f.hl(cx - 1, cx + 1, 30, 'k'); f.px(cx + 2, 29, 'k')

    def drop(f):                                    # the coin going into the slot
        p = layer(); p.rect(48, 27, 49, 31, 'y'); p.vl(49, 27, 31, 'Y'); p.px(48, 27, 'Z')
        over(f, p, DK)
        h_ = layer(); hand(h_, 44, 28, 'grip', 's', 'S'); over(f, h_, DK)

    person(c, cx, 18, hs='short', hk='H', hdk='z', mouth='none', brows='stern',
           shirt='1', sdk='2', sw=7, ww=7, th=13, pants='Q', pdk='Q', shoe='z', lh=7, front=front, DK=DK,
           arms=[([(cx - 6, 37), (cx - 8, 42), (cx - 6, 46)], 4, '1'),
                 ([(cx + 6, 37), (cx + 11, 40), (cx + 18, 31)], 4, '1')],
           hands=[(cx - 9, 46, 'fist', False)], hat=bun, top=lambda f: (face(f), drop(f)))
    return c.rows(), pal


PORTRAIT = ('gold.thrift', thrift)
