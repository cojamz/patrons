import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def muse():
    c = C(N)
    pal = {'k': INK, 'w': WHITE, 'W': '#d6cdbd', 't': '#d9cdb6', 'T': '#cbbda3', 'f': '#b9a88c', 'F': '#a8977b',
           'q': '#9fc0cf', 'Q': '#86aabb', 'y': '#f2d27a', 'Y': '#c9a24a',
           '1': GREEN[0], '2': GREEN[1], 'v': VDEEP[0], 'V': VDEEP[1], 'u': '#6a4430',
           'H': '#1c120e', 'p': '#e47a9a', 'P': '#b85574', 'o': '#8a5434', 'O': '#6a3d25'}
    c.rect(0, 0, 63, 63, 't'); c.rect(0, 50, 63, 63, 'f')
    c.hl(0, 63, 50, 'F')

    def window(l):
        l.rect(42, 5, 59, 30, 'T'); l.rect(44, 7, 57, 28, 'q')
        l.rect(50, 7, 51, 28, 'T'); l.rect(44, 17, 57, 18, 'T')
        l.poly([(44, 28), (44, 24), (49, 21), (49, 28)], 'Q')
    bg(c, window)

    def column(l):
        l.rect(3, 6, 12, 49, 'w'); l.rect(1, 3, 14, 6, 'w'); l.rect(1, 46, 14, 49, 'w')
        for x in (5, 8, 11):
            l.vl(x, 8, 44, 'W')
    bg(c, column, 'W')

    def easel(l):
        l.line(48, 34, 46, 49, 'o'); l.line(58, 34, 60, 49, 'o')
        l.rect(45, 30, 61, 42, 'w'); l.rect(47, 32, 59, 40, 'q')
        l.ell(49, 34, 56, 40, '1'); l.ell(51, 33, 54, 35, 'y')
    bg(c, easel, 'O')

    # plinth
    def plinth(l):
        l.rect(18, 52, 45, 63, 'w'); l.rect(16, 50, 47, 52, 'w')
        l.hl(16, 47, 52, 'W'); l.rect(42, 53, 45, 63, 'W')
    bg(c, plinth, 'W')

    def drape(f, DK):
        # one-shoulder drape: bare left shoulder, a fold across
        f.poly([(24, 30), (28, 29), (25, 34)], 'v')
        f.line(26, 33, 36, 46, '2'); f.line(27, 33, 37, 46, '2')

    def lyre(f, DK):
        f.rect(23, 44, 30, 45, 'Y')
        f.vl(22, 34, 44, 'y'); f.vl(23, 36, 44, 'Y'); f.vl(30, 36, 44, 'y'); f.vl(31, 34, 44, 'Y')
        f.hl(22, 31, 34, 'y'); f.px(21, 33, 'y'); f.px(32, 33, 'y')
        for x in (25, 27):
            f.vl(x, 35, 43, 'W')

    def hd_hair(l):
        hair(l, 25, 11, 14, 'bun', 'H', 'u', 'R')
        l.rect(35, 6, 36, 7, 'p'); l.pts('P', [(37, 7), (36, 8)])
    person(c, 25, 11, 14, 'v', 'V', '1', '2', th=23, sw=7, ww=10, front=drape,
           arms=[([(26, 31), (23, 37), (24, 42)], 3, 'v'), ([(38, 31), (39, 37), (33, 41)], 3, 'v')],
           late=lambda f, DK: (lyre(f, DK), hand(f, 22, 40, 'grip', 'v', 'V'), hand(f, 31, 40, 'grip', 'v', 'V', True)),
           mouth='smile', brows='soft', brow='H', hr=hd_hair, dk={'y': 'Y', 'p': 'P'})
    return c.rows(), pal


PORTRAIT = ('echo.muse', muse)
