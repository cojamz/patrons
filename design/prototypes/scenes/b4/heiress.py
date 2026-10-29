import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def heiress():
    c = C(N)
    pal = {'k': INK, 'w': WHITE[0], 'W': WHITE[1],
           'p': '#b98e9a', 'P': '#a97f8b', 'g': '#d9cdb8', 'G': '#c4b69e', 'y': '#f2d27a', 'Y': '#c9a24a',
           'l': '#fff3c4', 's': '#dfe4e8', 'S': '#a9b2ba', 'c': '#e9d8a0',
           'v': VDEEP[0], 'V': VDEEP[1], 'e': DEEP[0], 'H': '#140c0a', 'h': '#2e201c', 'x': '#2a1610',
           'r': '#7a3a3a', 'z': '#8a7a6a'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 50, 63, 63, 'P')

    def windows(l):
        for x in (2, 47):
            l.rect(x, 10, x + 14, 44, 'G'); l.rect(x + 2, 12, x + 12, 42, 'g')
            l.ell(x, 4, x + 14, 18, 'G', only='.p'); l.ell(x + 2, 6, x + 12, 18, 'g')
            l.vl(x + 7, 8, 42, 'G')
    bg(c, windows, None)

    def chandelier(l):
        l.vl(31, 0, 3, 'Y'); l.ell(28, 3, 35, 6, 'Y'); l.hl(29, 34, 4, 'y')
        l.pts('Y', [(26, 5), (27, 6), (36, 6), (37, 5), (24, 4), (25, 5), (38, 5), (39, 4)])
        for x in (24, 39):
            l.vl(x, 2, 3, 'l')
        l.vl(31, 0, 0, 'Y')
    bg(c, chandelier, None)
    DK = {'w': 'W', 'v': 'V', 'y': 'Y', 's': 'S'}

    def gown(f):
        f.poly([(25, 37), (39, 37), (46, 55), (18, 55)], 'w')
        f.poly([(35, 41), (39, 39), (46, 55), (39, 55)], 'W')
        f.hl(18, 46, 55, 'W')
        f.pts('y', [(28, 28), (29, 29), (30, 30), (31, 31), (32, 31), (33, 30), (34, 29), (35, 28)])
        f.rect(31, 32, 32, 33, 'Y')

    def tiara(f):
        f.hl(27, 36, 11, 's'); f.pts('s', [(28, 10), (31, 9), (32, 9), (35, 10)]); f.px(31, 10, 'l'); f.px(32, 10, 'l')

    def lit(f):                                      # forehead and cheekbone highlight, a stepped plane
        f.pts('e', [(28, 14), (29, 14), (30, 14), (27, 15), (28, 15), (27, 22), (28, 22)])

    def flute(p):
        p.vl(43, 17, 22, 'c'); p.vl(44, 17, 22, 'Y'); p.vl(43, 23, 26, 's'); p.vl(44, 23, 26, 'S')
        p.hl(43, 44, 27, 's')
    person(c, DK, 25, 12, ('v', 'V'), 'long', 'H', 'h', mouth='smile', brows='soft', brow='h', eye='x',
           cloth='w', cdark='W', sw=6, ww=6, th=12, nolegs=True, front=gown, top=lambda f: (tiara(f), lit(f)),
           arms=[([(26, 31), (23, 36), (24, 41)], 3, 'v'), ([(38, 31), (42, 35), (43, 30)], 3, 'v')],
           hands=[(22, 41, 'flat', False), (41, 27, 'grip', True)], props=flute)
    return c.rows(), pal


PORTRAIT = ('trading.heiress', heiress)
