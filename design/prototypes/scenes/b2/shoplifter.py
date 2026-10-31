import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def shoplifter():
    c = C(N)
    pal = {'k': INK, 'w': WHITE, 't': '#e4e2d6', 'T': '#d6d3c4', 'f': '#c8c4b2', 'g': '#a9aeac', 'G': '#7d8381',
           'r': '#d9534a', 'R': '#a83a35', 'y': '#f2d27a', 'u': '#7fb0d8', 'U': '#5a8cb8', 'n': '#8fb877', 'p': '#c4bfae', 'P': '#b3ad9a',
           '1': MAGENTA[0], '2': MAGENTA[1], 'a': LIGHT[0], 'A': LIGHT[1],
           'h': '#b0552c', 'H': '#84402a', 'x': '#4b5a78', 'X': '#3a4660', 'z': '#3a2a22'}
    c.rect(0, 0, 63, 63, 't'); c.rect(0, 54, 63, 63, 'f')

    def shelf(l):
        for y in (12, 26, 40):
            l.rect(0, y, 63, y + 1, 'g')
            for i, x in enumerate(range(2, 63, 10)):
                col = 'pP'[(i + y // 12) % 2]
                if y == 26 and 18 <= x <= 44:
                    continue
                l.rect(x, y - 6, x + 3, y - 1, col)
        l.rect(0, 41, 63, 53, 'T')
    bg(c, shelf, None)
    c.ell(54, 2, 61, 9, 'g'); c.ell(55, 3, 60, 8, 'G'); c.pts('y', [(56, 4)])      # the round security mirror

    def can(f, DK):
        f.rect(37, 33, 41, 39, 'r'); f.hl(37, 41, 33, 'g'); f.vl(41, 34, 39, 'R'); f.hl(37, 40, 36, 'y')

    def hoodup(f):
        f.ell(21, 9, 42, 30, '2'); f.rect(21, 20, 42, 30, '2')
    person(c, 25, 14, 14, 'a', 'A', '1', '2', th=14, sw=9, ww=8,
           lg=dict(pants='x', pdark='X', shoe='z', lh=9, stance=1),
           back=hoodup,
           front=lambda f, DK: f.rect(27, 39, 37, 42, '2'),
           arms=[([(25, 33), (22, 38), (25, 42)], 4, '1'), ([(39, 33), (42, 37), (40, 37)], 4, '1')],
           hands=[(23, 41, 'fist', False)],
           late=lambda f, DK: (can(f, DK), hand(f, 38, 36, 'grip', 'a', 'A', True)),
           mouth='smirk', brows='soft', brow='H', hr=('side', 'h', 'H'),
           face=lambda l: (freckles(l, 25, 14, 14, 'A'), l.pts('k', [(29, 21), (35, 21)]) if False else None),
           dk={'r': 'R'})
    return c.rows(), pal


PORTRAIT = ('thieves.shoplifter', shoplifter)
