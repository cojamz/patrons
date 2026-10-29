import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def benefactor():
    c = C(N)
    pal = base(DEEP, 'silver', b='#cfe0e6', p='#e4ddd0', P='#d4ccbe', f='#bfb7a8', F='#b0a898',
               u='#4f9a94', U='#3b7a75', y='#f0c548', Y='#c08f22', t='#2f3a5a', q='#2f2a33', H='#1c1410', z='#3a2a22')
    c.rect(0, 0, 63, 63, 'b')

    def building(l):                                # columns and steps of a grand building
        l.rect(0, 0, 63, 6, 'P'); l.rect(0, 6, 63, 7, 'f')
        for x in (0, 16, 46, 60):
            l.rect(x, 8, x + 6, 50, 'p'); l.rect(x + 5, 8, x + 6, 50, 'P')
            l.rect(x - 1, 8, x + 7, 9, 'P')
        l.rect(0, 50, 63, 53, 'p'); l.rect(0, 54, 63, 57, 'P'); l.rect(0, 58, 63, 63, 'p')
        l.hl(0, 63, 53, 'f'); l.hl(0, 63, 57, 'f')
    bg(c, building, None)

    cx = 25
    DK = {'1': '2', 'u': 'U', 't': 't', 'w': 'w'}

    def front(f):
        f.poly([(cx - 4.5, 34), (cx + 4.5, 34), (cx, 41)], 'w')
        f.rect(cx - 1, 35, cx, 42, 't')
        for (x, y) in ((cx - 5, 34), (cx - 5, 35), (cx - 4, 36), (cx - 4, 37), (cx - 3, 38), (cx - 3, 39), (cx - 2, 40)):
            f.px(x, y, '2'); f.px(2 * cx - x - 1, y, '2')

    def gift(f):                                    # a wrapped box held out, bow only
        g = layer()
        g.rect(33, 37, 45, 47, 'u'); g.rect(43, 37, 45, 47, 'U'); g.hl(33, 45, 37, 'U')
        g.ell(35, 32, 39, 36, 'y'); g.ell(39, 32, 43, 36, 'y'); g.rect(38, 34, 40, 37, 'Y')
        g.pts('Y', [(36, 35), (42, 35)])
        over(f, g, DK)
        for (x, fl) in ((31, False), (44, True)):
            h_ = layer(); hand(h_, x, 42, 'grip', 's', 'S', fl); over(f, h_, DK)

    person(c, cx, 17, hs='crop', hk='H', hdk='z', mouth='smile', brows='soft', brow='H',
           shirt='1', sdk='2', sw=8, ww=7, th=14, pants='1', pdk='2', shoe='q', lh=6, front=front, DK=DK,
           arms=[([(cx - 7, 37), (cx - 6, 43), (cx + 5, 44)], 4, '1'),
                 ([(cx + 7, 37), (cx + 10, 42), (cx + 18, 43)], 4, '1')],
           top=gift)
    return c.rows(), pal


PORTRAIT = ('silver.benefactor', benefactor)
