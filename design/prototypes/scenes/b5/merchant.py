import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def merchant():
    c = C(N)
    pal = base(LIGHT, 'gold', b='#d8e4e0', a='#d9876a', A='#c47a5e', o='#9a6a40', O='#7a5030', d='#b07c4a',
               R='#c94a3c', T='#9a3328', e='#ef9b3a', E='#c2742a', g='#6f9a4a', H='#5a3a24', z='#3e2a1c',
               q='#4b4250', m='#efe6d4')
    c.rect(0, 0, 63, 63, 'b')

    def stalls(l):                                     # the stall frame and the far wall
        l.rect(0, 10, 63, 63, 'm')
    bg(c, stalls, None)
    c.rect(0, 10, 63, 12, 'b')

    def awning(l):                                     # wide stripes, scalloped edge
        for i, x in enumerate(range(-2, 64, 8)):
            l.rect(x, 0, x + 7, 9, 'a' if i % 2 == 0 else 'A')
            l.ell(x, 7, x + 7, 12, 'a' if i % 2 == 0 else 'A')
    bg(c, awning, None)
    c.rect(1, 12, 2, 46, 'o'); c.rect(61, 12, 62, 46, 'o')

    def fruit(l):                                      # crates of apples and oranges on the counter
        for (x0, k, d) in ((2, 'R', 'T'), (44, 'e', 'E')):
            for (dx, dy) in ((0, 4), (5, 4), (10, 4), (2, 0), (7, 0), (12, 4)):
                l.ell(x0 + dx, 39 + dy, x0 + dx + 4, 43 + dy, k)
                l.px(x0 + dx + 3, 42 + dy, d); l.px(x0 + dx + 3, 43 + dy, d); l.px(x0 + dx + 2, 43 + dy, d)
                l.px(x0 + dx + 1, 40 + dy, 'w')
    bg(c, fruit, None)
    cx = 29
    DK = {'1': '2', 'R': 'T', 'H': 'z'}

    def front(f):                                      # brown apron over the gold tunic
        f.poly([(cx - 6, 37), (cx + 6, 37), (cx + 8, 46), (cx - 8, 46)], 'o')
        f.hl(cx - 6, cx + 6, 37, 'O')
        f.pts('2', [(cx - 1, 31), (cx, 32), (cx + 1, 31), (cx, 33)])

    def apple(f):
        p = layer()
        p.ell(45, 34, 50, 39, 'R'); p.pts('T', [(49, 37), (49, 38), (48, 39)])
        p.px(46, 35, 'w'); p.px(47, 33, 'O'); p.px(48, 33, 'g')
        over(f, p, DK)
        h_ = layer(); hand(h_, 44, 39, 'flat', 's', 'S', True); over(f, h_, DK)

    person(c, cx, 13, size=16, hs='side', hk='H', hdk='z', mouth='grin', brows='soft',
           shirt='1', sdk='2', sw=11, ww=10, th=16, behind=True, front=front, DK=DK,
           arms=[([(cx - 9, 34), (cx - 12, 40), (cx - 9, 45)], 5, '1'),
                 ([(cx + 9, 34), (cx + 11, 41), (cx + 15, 41)], 4, '1')],
           hands=[(cx - 12, 45, 'flat', False)], top=apple)

    def counter(l):
        l.rect(0, 47, 63, 49, 'd'); l.rect(0, 50, 63, 63, 'o'); l.hl(0, 63, 50, 'O')
    bg(c, counter, None)

    c.hl(0, 63, 50, 'O')
    h_ = layer(); hand(h_, cx - 12, 45, 'flat', 's', 'S'); c.paste(h_)
    return c.rows(), pal


PORTRAIT = ('gold.merchant', merchant)
