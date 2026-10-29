import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def crasher():
    c = C(N)
    pal = base(MED, 'grey', p='#5e4a72', P='#544266', f='#4a3a5a', y='#f6d24a', Y='#fff3b0',
               R='#d0533f', T='#a83e30', u='#4f9ad0', U='#3b78a8', g='#6fbf73', G='#4e9a54',
               e='#f4ede1', E='#c9c4b8', a='#f2a6b8', A='#d27a92', H='#2b1d17', z='#1a1210', q='#3b3f48', o='#8a5e3c')
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'f')
    for x in range(0, 64, 3):                       # string of little lights
        y = 5 + int(((x - 32) / 32.0) ** 2 * 5)
        c.px(x, y, 'P')
        if x % 9 == 0:
            c.px(x, y + 1, 'Y')

    def balloons(l):
        for (x, y, k, d) in ((3, 14, 'R', 'T'), (11, 20, 'u', 'U'), (50, 12, 'g', 'G'), (57, 20, 'R', 'T')):
            l.ell(x, y, x + 6, y + 8, k); l.pts(d, [(x + 5, y + 5), (x + 5, y + 6), (x + 4, y + 7)]); l.px(x + 2, y + 2, 'Y')
            l.px(x + 3, y + 9, d)
            for j in range(10, 22):
                l.px(x + 3 + (j // 5) % 2, y + j, 'E')
    bg(c, balloons, None)

    def table(l):                                   # cake table with a cake
        l.rect(44, 42, 63, 45, 'e'); l.rect(44, 46, 63, 52, 'E')
        l.rect(48, 34, 58, 41, 'a'); l.rect(48, 34, 58, 35, 'e'); l.rect(55, 36, 58, 41, 'A')
        l.rect(53, 31, 53, 33, 'e'); l.px(53, 30, 'y')
    bg(c, table, None)

    cx = 28
    DK = {'1': '2', 'e': 'E', 'a': 'A', 'q': 'q'}

    def front(f):                                   # hoodie: pocket and strings
        f.rect(cx - 5, 41, cx + 4, 45, '2'); f.rect(cx - 4, 41, cx + 3, 44, '1')
        f.pts('E', [(cx - 2, 34), (cx - 2, 35), (cx + 1, 34), (cx + 1, 35)])

    def party_hat(f):                               # a cone hat, worn crooked
        f.poly([(cx - 1, 19), (cx + 7, 19), (cx + 6, 9)], 'u')
        f.poly([(cx + 3, 19), (cx + 7, 19), (cx + 6, 9)], 'U')
        f.pts('y', [(cx + 3, 16), (cx + 5, 13)]); f.rect(cx + 5, 7, cx + 7, 8, 'y')

    def plate(f):                                   # a plate of somebody else's cake
        p = layer(); p.hl(cx + 7, cx + 18, 38, 'e'); p.hl(cx + 8, cx + 17, 39, 'E')
        p.poly([(cx + 9, 37), (cx + 16, 37), (cx + 16, 32)], 'a'); p.hl(cx + 13, cx + 16, 33, 'e')
        p.vl(cx + 16, 33, 37, 'A')
        over(f, p, DK)
        h_ = layer(); hand(h_, cx + 10, 39, 'flat', 's', 'S'); over(f, h_, DK)

    person(c, cx, 20, hs='crop', hk='H', hdk='z', mouth='grin', brows='soft', brow='z',
           shirt='1', sdk='2', sw=8, ww=7, th=12, pants='q', pdk='q', shoe='o', lh=8, stance=1, front=front, hat=party_hat, DK=DK,
           arms=[([(cx - 7, 39), (cx - 9, 44), (cx - 7, 48)], 4, '1'),
                 ([(cx + 7, 39), (cx + 9, 43), (cx + 12, 41)], 4, '1')],
           hands=[(cx - 9, 48, 'fist', False)], top=plate)
    return c.rows(), pal


PORTRAIT = ('benders.squatter', crasher)
