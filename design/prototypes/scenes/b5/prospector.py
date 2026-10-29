import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def prospector():
    c = C(N)
    pal = base(DEEP, 'gold', b='#b9d3dc', m='#9fb3a6', M='#8ea395', g='#a9b98a',
               u='#6f9fbf', U='#5d8cad', v='#a7cde0',
               h='#7a5532', j='#5e4026', q='#4b5a78', Q='#3d4a64',
               e='#8d9296', E='#6b7075', y='#f2cf5a', Y='#c3962c', H='#1c1410', z='#3a2a22')
    c.rect(0, 0, 63, 63, 'b')

    def hills(l):
        l.poly([(-2, 30), (12, 12), (24, 24), (36, 10), (52, 26), (66, 16), (66, 40), (-2, 40)], 'm')
        l.poly([(30, 16), (36, 10), (42, 16), (38, 15), (35, 17)], 'M')
    bg(c, hills, None)
    c.rect(0, 34, 63, 40, 'g')
    c.rect(0, 41, 63, 63, 'u')
    c.pts('v', [(4, 46), (5, 46), (6, 46), (52, 44), (53, 44), (55, 58), (56, 58), (57, 58), (8, 58), (9, 58)])

    cx = 32
    DK = {'q': 'Q', 'e': 'E', 'y': 'Y', 'h': 'j', '1': '2'}

    def front(f):                                       # overall bib over the gold shirt
        f.rect(cx - 4, 37, cx + 3, 44, 'q')
        f.vl(cx - 4, 31, 36, 'q'); f.vl(cx + 3, 31, 36, 'q')

    def hat(f):                                         # wide brown brim, rounded crown
        f.rect(cx - 5, 9, cx + 4, 15, 'h'); f.hl(cx - 4, cx + 3, 8, 'h')
        f.hl(cx - 5, cx + 4, 14, 'j')
        f.hl(cx - 11, cx + 10, 16, 'h'); f.hl(cx - 10, cx + 9, 17, 'j')
        f.recolor('s', 'S', (cx - 7, 18, cx + 6, 18))

    def pan(f):                                         # the gold pan, held in both hands
        p = layer()
        p.ell(20, 38, 44, 49, 'E'); p.ell(22, 39, 42, 47, 'e'); p.ell(25, 43, 39, 47, 'U', only='e')
        p.rect(28, 43, 29, 44, 'y'); p.px(29, 44, 'Y'); p.rect(33, 44, 35, 45, 'y'); p.px(35, 45, 'Y')
        p.rect(31, 41, 32, 42, 'y')
        over(f, p, DK)
        for (x, fl) in ((17, False), (43, True)):
            h_ = layer(); hand(h_, x, 41, 'grip', 's', 'S', fl); over(f, h_, DK)

    person(c, cx, 17, hs='crop', hk='H', hdk='z', mouth='smile', brows='soft', brow='H',
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
