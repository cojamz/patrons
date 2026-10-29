import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def grifter():
    c = C(N)
    pal = {'k': INK, 'w': WHITE, 'W': '#d6cdbd', 't': '#b8b1c4', 'T': '#a8a0b6', 'f': '#8f879e', 'F': '#7f778e',
           'o': '#9e7840', 'O': '#6e5028', 'r': '#c85a3a', 'R': '#9a4228', 'y': '#f2d27a',
           '1': MAGENTA[0], '2': MAGENTA[1], 'a': PALE[0], 'A': PALE[1],
           'h': '#d9b45a', 'H': '#a8843a', 'x': '#3b3446', 'z': '#3a2a22', 'm': '#6a5a7a'}
    c.rect(0, 0, 63, 63, 't'); c.rect(0, 46, 63, 63, 'f')

    def street(l):
        l.rect(0, 6, 14, 45, 'T'); l.rect(3, 10, 11, 22, 'm'); l.rect(3, 26, 11, 38, 'm')
        l.rect(50, 4, 63, 45, 'T'); l.rect(53, 9, 60, 20, 'm')
        l.vl(56, 26, 45, 'F'); l.vl(57, 26, 45, 'F'); l.rect(54, 22, 59, 25, 'F'); l.hl(55, 58, 24, 'y')
    bg(c, street)

    def crate(l):
        l.rect(12, 46, 52, 49, 'o'); l.rect(14, 50, 50, 63, 'o'); l.hl(14, 50, 55, 'O'); l.vl(32, 50, 63, 'O')
        l.hl(12, 52, 49, 'O')
    bg(c, crate, 'O')
    # three shells and a pea
    def cupd(s, x, y):
        s.poly([(x + 2, y), (x + 7, y), (x + 9, y + 6), (x, y + 6)], 'r'); s.rect(x, y + 5, x + 9, y + 6, 'R')
        s.poly([(x + 5.5, y), (x + 7, y), (x + 9, y + 6), (x + 6.5, y + 6)], 'R')
    for x in (14, 26):
        s = layer(); cupd(s, x, 40); s.outline('k'); c.paste(s)
    c.rect(42, 44, 43, 45, 'w')

    def hat(f):
        f.rect(24, 3, 37, 10, 'x'); f.hl(21, 40, 11, 'x'); f.hl(20, 41, 12, 'x'); f.hl(24, 37, 9, '1')
    person(c, 23, 11, 14, 'a', 'A', '1', '2', th=11, sw=9, ww=8, neck=True,
           front=lambda f, DK: (f.poly([(27, 26), (33, 26), (30, 31)], 'w'), f.pts('2', [(26, 26), (26, 27), (27, 28), (27, 29), (34, 26), (34, 27), (33, 28), (33, 29)])),
           arms=[([(22, 30), (17, 34), (17, 37)], 4, '1'), ([(38, 30), (44, 33), (44, 31)], 4, '1')],
           hands=[(16, 37, 'grip', False)],
           late=lambda f, DK: (cupd(f, 38, 32), hand(f, 41, 29, 'grip', 'a', 'A', True)),
           mouth='grin', brows='soft', brow='H', hr=('short', 'h', 'H'), hat=hat, dk={'w': 'W', 'r': 'R'},
           face=lambda l: l.pts('H', [(27, 23), (28, 23), (32, 23), (33, 23)]) if False else None)
    return c.rows(), pal


PORTRAIT = ('thieves.grifter', grifter)
