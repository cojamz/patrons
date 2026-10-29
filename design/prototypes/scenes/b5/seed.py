import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def treasurer():
    c = C(N)
    pal = base(PALE, 'gold', p='#9a9590', P='#8c8782', b='#c9dce4', o='#8a5434', O='#6a3d25', d='#a2683f',
               y='#f2cf5a', Y='#c3962c', Z='#f8e39a', H='#a0612e', z='#73431e', e='#b9bec4', E='#8d9399', t='#5b3a52')
    c.rect(0, 0, 63, 63, 'p')
    for (x, y) in ((4, 10), (14, 24), (50, 30), (44, 6), (56, 18)):   # a few stone joints, sparse
        c.hl(x, x + 5, y, 'P'); c.vl(x + 5, y - 3, y, 'P')

    def window(l):
        l.ell(4, 4, 12, 12, 'P'); l.ell(5, 5, 11, 11, 'b'); l.rect(5, 8, 11, 18, 'b'); l.rect(4, 8, 4, 19, 'P'); l.rect(12, 8, 12, 19, 'P'); l.hl(4, 12, 19, 'P')
    bg(c, window, None)

    cx = 31
    DK = {'1': '2', 'e': 'E', 't': 't'}

    def front(f):                                   # robe collar and sash
        f.poly([(cx - 4.5, 27), (cx + 4.5, 27), (cx, 32)], 't')
        f.poly([(cx - 9, 36), (cx - 7, 34), (cx + 9, 41), (cx + 8, 43)], '2')

    def key(f):                                     # a big key held up, angled
        p = layer()
        p.ring(38, 11, 44, 17, 'e'); p.ring(39, 12, 43, 16, 'E')
        for i in range(9):
            p.px(44 + i, 11 - i, 'e'); p.px(45 + i, 11 - i, 'E')
        p.pts('e', [(50, 6), (50, 7), (51, 7), (52, 4), (52, 5), (53, 5)]); p.pts('E', [(51, 8), (53, 6)])
        over(f, p, DK)
        h_ = layer(); hand(h_, 38, 17, 'grip', 's', 'S', True); over(f, h_, DK)

    person(c, cx, 10, size=16, hs='long', hk='H', hdk='z', mouth='smile', brows='soft',
           shirt='1', sdk='2', sw=10, ww=10, th=18, behind=True, front=front, DK=DK,
           arms=[([(cx - 8, 31), (cx - 11, 37), (cx - 9, 42)], 5, '1'),
                 ([(cx + 8, 31), (cx + 12, 34), (cx + 10, 22)], 4, '1')],
           top=key)

    def chest(l):                                   # open chest full of coins, in front
        l.rect(12, 43, 52, 63, 'o'); l.rect(12, 43, 52, 45, 'd')
        l.rect(12, 50, 52, 51, 'O'); l.rect(30, 47, 34, 53, 'Y'); l.rect(31, 49, 33, 51, 'O')
        l.rect(12, 43, 13, 63, 'Y'); l.rect(51, 43, 52, 63, 'Y')
    bg(c, chest, None)

    def heap(l):
        l.ell(14, 37, 50, 47, 'y'); l.rect(12, 43, 52, 47, '.')
    bg(c, heap, 'Y')
    for (x, y) in ((20, 40), (27, 38), (36, 39), (43, 41), (24, 42), (40, 42)):
        c.pts('Y', [(x + 2, y + 1), (x + 1, y + 2)]); c.px(x, y, 'Z')
    h_ = layer(); hand(h_, cx - 12, 42, 'flat', 's', 'S'); c.paste(h_)
    return c.rows(), pal


PORTRAIT = ('gold.seed', treasurer)
