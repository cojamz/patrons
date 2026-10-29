import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def prospector():
    c = C(N)
    pal = base(OLIVE, 'gold', R='#b8473c', T='#8f3428', l='#f6e7a8', b='#b9d3dc', m='#9fb3a6', M='#8ea395', g='#a9b98a',
               u='#6f9fbf', U='#5d8cad', v='#a7cde0',
               h='#7a5532', j='#5e4026', q='#4b5a78', Q='#3d4a64',
               e='#8d9296', E='#6b7075', y='#f2cf5a', Y='#c3962c', H='#3a2a22', z='#24180f')
    c.rect(0, 0, 63, 63, 'b')

    def hills(l):
        l.poly([(-2, 30), (12, 12), (24, 24), (36, 10), (52, 26), (66, 16), (66, 40), (-2, 40)], 'm')
        l.poly([(30, 16), (36, 10), (42, 16), (38, 15), (35, 17)], 'M')
    bg(c, hills, None)
    c.rect(0, 34, 63, 40, 'g')
    c.rect(0, 41, 63, 63, 'u')
    c.pts('v', [(4, 46), (5, 46), (6, 46), (52, 44), (53, 44), (55, 58), (56, 58), (57, 58), (8, 58), (9, 58)])

    cx = 32
    DK = {'q': 'Q', 'e': 'E', 'y': 'Y', 'h': 'j', '1': '2', 'R': 'T'}

    def front(f):                                   # gold-and-red plaid shirt, open collar
        pass

    def plaid(f):
        for x in range(cx - 14, cx + 15):
            for y in range(31, 48):
                if f.get(x, y) in '12' and ((x - cx) % 5 == 0 or (y - 31) % 5 == 4):
                    f.px(x, y, 'R' if f.get(x, y) == '1' else 'T')
        f.poly([(cx - 3.5, 31), (cx + 3.5, 31), (cx, 35)], 's')
        f.recolor('R', 'S', (cx - 3, 31, cx + 3, 35)) if False else None

    def hat(f):                                     # miner's hard hat with a lamp
        f.ell(cx - 7, 9, cx + 6, 21, 'y'); f.rect(cx - 7, 17, cx + 6, 21, '.')
        f.ell(cx - 7, 9, cx + 6, 21, 'Y', only='') if False else None
        f.rect(cx + 2, 11, cx + 6, 17, 'Y', ) if False else None
        f.pts('Y', [(cx + 4, 12), (cx + 5, 13), (cx + 5, 14), (cx + 6, 15), (cx + 6, 16)])
        f.hl(cx - 9, cx + 8, 17, 'y'); f.hl(cx - 9, cx + 8, 18, 'Y')
        f.rect(cx - 2, 11, cx + 1, 14, 'e'); f.rect(cx - 1, 12, cx, 13, 'l')
        f.recolor('s', 'S', (cx - 7, 19, cx + 6, 19))

    def pan(f):                                         # the gold pan, held in both hands
        plaid(f); f.poly([(cx - 3.5, 31), (cx + 3.5, 31), (cx, 35)], 's')
        p = layer()
        p.ell(20, 38, 44, 49, 'E'); p.ell(22, 39, 42, 47, 'e'); p.ell(25, 43, 39, 47, 'U', only='e')
        p.rect(28, 43, 29, 44, 'y'); p.px(29, 44, 'Y'); p.rect(33, 44, 35, 45, 'y'); p.px(35, 45, 'Y')
        p.rect(31, 41, 32, 42, 'y')
        over(f, p, DK)
        for (x, fl) in ((19, False), (41, True)):     # fingers over the rim
            h_ = layer(); hand(h_, x, 38, 'grip', 's', 'S', fl); over(f, h_, DK)

    person(c, cx, 17, hs='short', hk='H', hdk='z', mouth='smile', brows='soft', brow='H',
           shirt='1', sdk='2', sw=8, ww=7, th=13, pants='q', pdk='Q', shoe='z', lh=9,
           front=front, hat=hat, DK=DK,
           arms=[([(cx - 7, 35), (cx - 10, 39), (cx - 12, 41)], 4, '1'),
                 ([(cx + 7, 35), (cx + 10, 39), (cx + 12, 41)], 4, '1')],
           top=pan)
    # water over the shins
    c.rect(0, 52, 63, 63, 'u')
    c.hl(18, 26, 52, 'U'); c.hl(33, 42, 52, 'U'); c.pts('v', [(20, 53), (21, 53), (38, 53), (39, 53)])
    return c.rows(), pal


PORTRAIT = ('gold.prospector', prospector)
