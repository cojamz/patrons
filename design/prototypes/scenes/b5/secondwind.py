import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def coach():
    c = C(N)
    pal = base(PALE, 'grey', p='#d9cbb0', P='#cbbd a2'.replace(' ', ''), o='#c49a62', O='#b08856', d='#a37a48',
               e='#f4ede1', E='#c9c4b8', a='#e0703a', A='#b8562a', u='#33456a', U='#26354f', g='#c9ced3', G='#8d9296',
               m='#a0784e', M='#7e5a36', H='#8a5a32', z='#5e3c1e', q='#3b3f48')
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 50, 63, 63, 'o'); c.hl(0, 63, 50, 'O'); c.hl(0, 63, 57, 'O')
    c.rect(0, 30, 63, 31, 'P')

    def hoop(l):                                    # backboard, rim and a short net
        l.rect(44, 4, 62, 18, 'e'); l.rect(50, 9, 56, 15, 'E'); l.rect(51, 10, 55, 15, 'e')
        l.hl(48, 58, 17, 'a'); l.hl(48, 58, 18, 'A')
        l.poly([(48, 19), (58, 19), (56, 25), (50, 25)], 'E'); l.poly([(50, 19), (56, 19), (55, 24), (51, 24)], 'e')
    bg(c, hoop, 'E')
    c.hl(48, 58, 17, 'a'); c.hl(48, 58, 18, 'A')
    c.ell(4, 42, 11, 49, 'a'); c.ell(4, 42, 11, 49, 'A', only='') ; c.pts('A', [(10, 45), (10, 46), (9, 48), (8, 48)])   # a ball on the floor

    cx = 28
    DK = {'1': '2', 'u': 'U', 'm': 'M', 'e': 'E', 'g': 'G'}

    def front(f):                                   # track jacket: zip, a stripe, the whistle
        f.vl(cx, 33, 46, '2')
        f.line(cx - 3, 32, cx, 38, 'q'); f.line(cx + 3, 32, cx, 38, 'q')
        f.rect(cx - 1, 38, cx + 1, 40, 'g'); f.px(cx + 1, 40, 'G')

    def cap(f):
        f.ell(cx - 7, 13, cx + 6, 22, 'u'); f.rect(cx - 7, 18, cx + 6, 20, 'u')
        f.hl(cx - 7, cx + 11, 20, 'U'); f.hl(cx - 6, cx + 11, 21, 'U')
        f.pts('U', [(cx - 2, 14), (cx - 2, 15)])

    def board(f):                                   # clipboard at the hip
        p = layer(); p.rect(cx - 15, 37, cx - 7, 48, 'm'); p.rect(cx - 14, 39, cx - 8, 47, 'e')
        p.rect(cx - 12, 36, cx - 10, 38, 'g')
        p.pts('E', [(cx - 13, 41), (cx - 12, 41), (cx - 10, 42), (cx - 9, 42), (cx - 13, 44), (cx - 11, 44)])
        over(f, p, DK)
        h_ = layer(); hand(h_, cx - 10, 44, 'grip', 's', 'S'); over(f, h_, DK)

    person(c, cx, 18, hs='short', hk='H', hdk='z', mouth='grin', brows='soft', brow='z',
           shirt='1', sdk='2', sw=8, ww=7, th=13, pants='1', pdk='2', shoe='q', lh=8, front=front, hat=cap, DK=DK,
           arms=[([(cx - 7, 36), (cx - 9, 41), (cx - 8, 44)], 4, '1'),
                 ([(cx + 7, 36), (cx + 11, 40), (cx + 12, 32)], 4, '1')],
           hands=[(cx + 10, 27, 'thumb', True)], top=board)
    return c.rows(), pal


PORTRAIT = ('benders.secondwind', coach)
