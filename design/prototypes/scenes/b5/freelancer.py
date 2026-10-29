import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def alchemist():
    c = C(N)
    pal = base(LIGHT, 'grey', p='#6b5546', P='#5f4b3e', o='#8a5e3c', O='#6e4a2e',
               R='#d0533f', g='#5fae5a', u='#4f86c6', v='#9a5bb8', y='#f0c548', e='#d9e6ea', E='#a9bcc4',
               H='#4a2e1e', z='#2e1c12', q='#4b4f55')
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'P')

    def shelves(l):                                 # two shelves of coloured bottles
        for y in (16, 32):
            l.rect(0, y, 63, y + 1, 'O')
        for (x, y, k, h) in ((3, 16, 'R', 6), (8, 16, 'u', 4), (46, 16, 'g', 5), (52, 16, 'v', 7), (58, 16, 'y', 4),
                             (4, 32, 'g', 5), (10, 32, 'v', 4), (48, 32, 'u', 6), (55, 32, 'R', 4)):
            l.rect(x, y - h, x + 3, y - 1, k); l.rect(x + 1, y - h - 2, x + 2, y - h - 1, 'E')
    bg(c, shelves, None)

    cx = 28
    DK = {'1': '2', 'e': 'E', 'q': 'q'}

    def front(f):                                   # robe sash
        f.rect(cx - 7, 42, cx + 7, 43, 'q')
        f.poly([(cx - 3.5, 34), (cx + 3.5, 34), (cx, 38)], '2')

    def flask(f):                                   # held high: one flask, every colour in it
        p = layer()
        p.ell(cx + 9, 12, cx + 19, 22, 'e'); p.rect(cx + 12, 6, cx + 16, 12, 'e')
        p.rect(cx + 11, 5, cx + 17, 6, 'E')
        p.ell(cx + 10, 15, cx + 18, 21, 'R')
        p.ell(cx + 10, 15, cx + 18, 21, 'y', only='R') if False else None
        p.rect(cx + 13, 15, cx + 14, 21, 'g', ) if False else None
        p.recolor('R', 'u', (cx + 13, 15, cx + 15, 21)); p.recolor('R', 'g', (cx + 16, 15, cx + 18, 21))
        p.px(cx + 11, 14, 'w'); p.px(cx + 11, 15, 'w')
        over(f, p, DK)
        h_ = layer(); hand(h_, cx + 12, 21, 'grip', 's', 'S', True); over(f, h_, DK)
        f.pts('S', [(cx - 4, 29), (cx + 3, 29)])   # two freckles

    person(c, cx, 18, hs='side', hk='H', hdk='z', mouth='o', brows='soft',
           shirt='1', sdk='2', sw=8, ww=9, th=18, pants='q', pdk='q', shoe='z', lh=3, front=front, DK=DK,
           arms=[([(cx - 7, 37), (cx - 9, 43), (cx - 7, 47)], 5, '1'),
                 ([(cx + 7, 37), (cx + 12, 36), (cx + 14, 25)], 4, '1')],
           hands=[(cx - 10, 48, 'fist', False)], top=flask)
    return c.rows(), pal


PORTRAIT = ('benders.freelancer', alchemist)
