import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def fence():
    c = C(N)
    pal = {'k': INK, 'w': WHITE, 'W': '#d6cdbd', 't': '#7a6a5c', 'T': '#6c5d50', 'o': '#8a5434', 'O': '#6a3d25',
           'd': '#a2683f', 'y': '#f2d27a', 'Y': '#c9a24a', 'g': '#c8ccd2', 'G': '#8f959e', 'u': '#7fb0d8',
           '1': MAGENTA[0], '2': MAGENTA[1], 'a': LIGHT[0], 'A': LIGHT[1],
           'h': '#8a6a52', 'H': '#5e4636', 'x': '#2c2a36', 'r': '#b0552c'}
    c.rect(0, 0, 63, 63, 't')

    def shelves(l):
        for y in (14, 30):
            l.rect(0, y, 63, y + 1, 'O')
        # pawned goods: a clock, a trumpet bell, a lamp, a radio, a vase
        l.ell(3, 5, 11, 13, 'Y'); l.ell(4, 6, 10, 12, 'w'); l.pts('O', [(7, 7), (7, 8), (7, 9), (8, 9)])
        l.rect(48, 6, 60, 13, 'r'); l.rect(50, 8, 54, 11, 'O'); l.rect(56, 8, 58, 11, 'O')
        l.ell(50, 18, 57, 24, 'Y'); l.rect(53, 24, 54, 27, 'Y'); l.rect(51, 28, 56, 29, 'O')
        l.rect(2, 22, 10, 29, 'G'); l.rect(4, 24, 8, 27, 'g')
        l.rect(58, 20, 63, 29, 'r'); l.rect(59, 21, 62, 23, 'w')
    bg(c, shelves)

    def counter(l):
        l.rect(0, 44, 63, 63, 'o'); l.rect(0, 44, 63, 46, 'd'); l.hl(0, 63, 47, 'O')
        l.rect(4, 50, 59, 60, 'O'); l.rect(6, 52, 57, 58, 'u')                  # glass case
        l.rect(10, 54, 13, 56, 'y'); l.ell(22, 53, 26, 57, 'g'); l.rect(36, 54, 40, 56, 'Y'); l.ell(48, 53, 52, 57, 'y')
        l.pts('w', [(7, 52), (8, 52), (7, 53)])
    bg(c, counter)

    def necklace(f, DK):
        f.pts('y', [(42, 28), (43, 30), (43, 32), (44, 34), (46, 35), (48, 34), (49, 32), (49, 30), (50, 28)])
        f.pts('Y', [(42, 29), (43, 31), (43, 33), (45, 35), (47, 35), (49, 33), (49, 31), (50, 29)])
        f.rect(45, 36, 47, 38, 'u')

    def loupe(f):
        f.rect(17, 17, 21, 20, 'G'); f.rect(18, 17, 20, 19, 'g'); f.px(18, 18, 'w')
    person(c, 18, 11, 14, 'a', 'A', '1', '2', th=17, sw=8, ww=8,
           front=lambda f, DK: (f.poly([(22, 26), (28, 26), (25, 32)], 'w'), f.rect(24, 27, 25, 34, 'x')),
           arms=[([(18, 30), (15, 36), (17, 42)], 4, '1'), ([(31, 30), (37, 33), (42, 28)], 3, '1')],
           hands=[(14, 42, 'flat', False)],
           late=lambda f, DK: (necklace(f, DK), hand(f, 41, 25, 'grip', 'a', 'A', True)),
           mouth='smirk', brows='soft', brow='H', hr=('side', 'h', 'H'), hat=loupe,
           dk={'y': 'Y', 'w': 'W'})
    return c.rows(), pal


PORTRAIT = ('thieves.fence', fence)
