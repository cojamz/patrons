import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def banker():
    c = C(N)
    pal = base(DEEP, 'gold', p='#c9b89a', P='#b9a888',      # wall, lower wall
               g='#9aa1a6', G='#767d83', o='#8a5434', O='#6a3d25', d='#a2683f',
               Z='#f8e39a', y='#f2cf5a', Y='#c3962c', q='#3a3340', H='#a8a6a4', z='#7e7c7a', t='#3d3a52',
               m='#d8dde0', e='#5a6170')
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 30, 63, 63, 'P')

    def vault(l):                                   # round vault door, right
        l.rect(40, 2, 63, 32, 'P'); l.edgeless = 1
        l.ell(42, 4, 66, 30, 'g'); l.ell(45, 7, 63, 27, 'G'); l.ell(46, 8, 62, 26, 'g')
        l.ell(51, 13, 57, 21, 'G'); l.ell(52, 14, 56, 20, 'g')
        l.rect(53, 9, 55, 12, 'G'); l.rect(53, 22, 55, 25, 'G')
    bg(c, vault, 'G')

    def sign(l):                                    # small brass plaque, left
        l.rect(3, 8, 17, 13, 'Y'); l.rect(4, 9, 16, 12, 'y')
        l.hl(6, 14, 10, 'Y'); l.hl(6, 11, 11, 'Y')
    bg(c, sign, None)

    DK = {'w': 'm', 't': 'q', 'S': 'S'}

    def front(f):                                   # white shirt, dark tie, gold waistcoat
        f.poly([(cx - 4.5, 31), (cx + 4.5, 31), (cx, 40)], 'w')
        f.rect(cx - 1, 32, cx, 42, 't'); f.rect(cx - 1, 32, cx, 33, 'q')
        f.pts('Y', [(cx + 2, 40), (cx + 2, 43)])

    def hat(f):                                     # round spectacles on the face
        f.ring(cx - 6, 20, cx - 2, 23, 'e'); f.ring(cx + 1, 20, cx + 5, 23, 'e')
        f.px(cx - 1, 21, 'e')

    cx = 31
    person(c, cx, 14, size=16, hs='crop', hk='H', hdk='z', mouth='smile', brows='soft', brow='H',
           shirt='1', sdk='2', sw=12, ww=11, th=14, behind=True, front=front, hat=hat, DK=DK,
           arms=[([(20, 34), (18, 40), (21, 45)], 5, 'w'), ([(42, 34), (44, 40), (41, 45)], 5, 'w')],
           hands=[(19, 45, 'flat', False), (39, 45, 'flat', True)])

    def counter(l):
        l.rect(0, 47, 63, 50, 'd'); l.rect(0, 51, 63, 63, 'o'); l.hl(0, 63, 51, 'O')
        for x in (10, 30, 50):
            l.rect(x, 54, x + 1, 63, 'O')
    bg(c, counter, None)

    def coins(l):
        for (x, n) in ((5, 2), (11, 3), (48, 2), (54, 3)):
            coin_stack(l, x, 46, n)
            l.ell(x, 46 - n * 2 - 1, x + 5, 46 - n * 2 + 1, 'Z')
    bg(c, coins, None)
    # hands back over the counter edge
    for (x, fl) in ((19, False), (39, True)):
        h_ = layer(); hand(h_, x, 45, 'flat', 's', 'S', fl); c.paste(h_)
    return c.rows(), pal


PORTRAIT = ('gold.banker', banker)
