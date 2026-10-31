import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def underdog():
    c = C(N)
    pal = base(MED, 'gold', p='#3a3446', P='#332e3e', f='#c9cdd2', F='#b5bac0', R='#c8463c', T='#9a3328',
               g='#8d9296', G='#6b7075', H='#2b1d17', z='#1a1210', q='#4a3a2a', m='#efe6d4', u='#3f6fb0', U='#2e5488', y='#f2cf5a')
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 44, 63, 63, 'f'); c.hl(0, 63, 44, 'F')
    for x in (4, 13, 22, 40, 49, 58):                # dim heads in the crowd, sparse
        c.ell(x, 6 + (x % 3), x + 5, 11 + (x % 3), 'P')

    def ropes(l):
        l.rect(2, 16, 5, 50, 'g')
        for y in (22, 30, 38):
            l.rect(2, y, 63, y + 1, 'R'); l.hl(2, 63, y + 1, 'T')
    bg(c, ropes, None)
    c.rect(2, 16, 5, 50, 'g'); c.rect(4, 16, 5, 50, 'G')

    cx = 30
    DK = {'1': '2', 'R': 'T', 'q': 'q', 'S': 'S'}

    def front(f):                                   # gold tank top: bare shoulders
        f.recolor('1', 's', (0, 37, 63, 40)); f.recolor('2', 'S', (0, 37, 63, 40))
        f.rect(cx - 4, 37, cx + 3, 40, '1'); f.pts('2', [(cx - 4, 37), (cx + 3, 37)])

    def lower(f):                                   # gold boxing shorts, bare legs, dark boots
        f.rect(cx - 7, 47, cx + 7, 51, '1'); f.hl(cx - 7, cx + 7, 47, 'q'); f.rect(cx + 4, 48, cx + 7, 51, '2')
        f.rect(cx - 1, 50, cx, 51, '.')

    def gloves(f):
        lower(f)
        for gx in (cx - 9, cx + 3):
            g = layer(); g.ell(gx, 31, gx + 6, 37, 'R'); g.rect(gx + 1, 37, gx + 5, 38, 'm')
            g.pts('T', [(gx + 5, 34), (gx + 5, 35), (gx + 4, 36), (gx + 1, 34)]); g.px(gx + 2, 32, 'w')
            over(f, g, DK)

    person(c, cx, 22, hs='crop', hk='H', hdk='z', mouth='flat', brows='angry', brow='z',
           shirt='1', sdk='2', sw=7, ww=6, th=10, pants='s', pdk='S', shoe='q', lh=8, stance=1, front=front, DK=DK,
           arms=[([(cx - 6, 40), (cx - 8, 44), (cx - 6, 38)], 3, 's'),
                 ([(cx + 6, 40), (cx + 8, 44), (cx + 6, 38)], 3, 's')],
           top=gloves)
    # the opponent: a huge glove and forearm coming in from the right edge
    o = layer()
    o.rect(58, 34, 64, 40, 'm'); o.ell(46, 22, 63, 39, 'u'); o.rect(60, 24, 64, 37, 'u'); o.ell(46, 31, 52, 38, 'u')
    o.pts('U', [(52, 36), (53, 37), (55, 38), (58, 38), (60, 37), (53, 33), (54, 32)]); o.ell(48, 24, 52, 28, 'w', only='R') if False else None
    o.pts('w', [(50, 25), (51, 25), (49, 26)])
    outline_once(o); c.paste(o)
    return c.rows(), pal


PORTRAIT = ('gold.underdog', underdog)
