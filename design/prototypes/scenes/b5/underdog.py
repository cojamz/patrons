import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def underdog():
    c = C(N)
    pal = base(MED, 'gold', p='#3a3446', P='#332e3e', f='#c9cdd2', F='#b5bac0', R='#c8463c', T='#9a3328',
               g='#8d9296', G='#6b7075', H='#2b1d17', z='#1a1210', q='#4a3a2a', m='#efe6d4', y='#f2cf5a')
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 44, 63, 63, 'f'); c.hl(0, 63, 44, 'F')
    for x in (4, 13, 22, 40, 49, 58):                # dim heads in the crowd, sparse
        c.ell(x, 6 + (x % 3), x + 5, 11 + (x % 3), 'P')
    c.rect(27, 2, 32, 3, 'y'); c.hl(26, 33, 1, 'P')                        # the one ring light

    def ropes(l):
        l.rect(2, 16, 5, 50, 'g')
        for y in (22, 30, 38):
            l.rect(2, y, 63, y + 1, 'R'); l.hl(2, 63, y + 1, 'T')
    bg(c, ropes, None)
    c.rect(2, 16, 5, 50, 'g'); c.rect(4, 16, 5, 50, 'G')

    cx = 34
    DK = {'1': '2', 'R': 'T', 'q': 'q', 'S': 'S'}

    def front(f):                                   # gold tank top: bare shoulders
        f.recolor('1', 's', (0, 37, 63, 39)); f.recolor('2', 'S', (0, 37, 63, 39))
        f.rect(cx - 4, 37, cx + 3, 39, '1')
        f.rect(cx - 6, 46, cx + 6, 47, 'q')

    def gloves(f):
        for gx in (cx - 9, cx + 4):
            g = layer(); g.ell(gx, 31, gx + 6, 37, 'R'); g.rect(gx + 1, 37, gx + 5, 38, 'm')
            g.pts('T', [(gx + 5, 34), (gx + 5, 35), (gx + 4, 36), (gx + 1, 34)]); g.px(gx + 2, 32, 'w')
            over(f, g, DK)

    person(c, cx, 22, hs='short', hk='H', hdk='z', mouth='flat', brows='angry', brow='z',
           shirt='1', sdk='2', sw=8, ww=6, th=11, pants='1', pdk='2', shoe='T', lh=8, stance=1, front=front, DK=DK,
           arms=[([(cx - 7, 40), (cx - 9, 44), (cx - 6, 38)], 3, 's'),
                 ([(cx + 7, 40), (cx + 9, 44), (cx + 7, 38)], 3, 's')],
           top=gloves)
    return c.rows(), pal


PORTRAIT = ('gold.underdog', underdog)
