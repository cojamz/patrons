import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def martyr():
    c = C(N)
    pal = {'k': INK, 'w': WHITE[0], 'W': WHITE[1],
           'p': '#e8b98f', 'P': '#dba882', 'l': '#f6dca6', 'L': '#f0cc92', 'g': '#8e9a6a', 'G': '#7b8758',
           'y': '#f2d27a', 'Y': '#c9a24a', 'u': MED[0], 'U': MED[1], 'H': '#2a1c14', 'h': '#4a3426',
           'z': '#8a6a4e'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 0, 63, 14, 'P')
    c.ell(14, 4, 50, 40, 'L'); c.ell(19, 9, 45, 35, 'l')
    c.poly([(-1, 44), (14, 38), (32, 41), (50, 37), (65, 42), (65, 64), (-1, 64)], 'G')
    c.poly([(-1, 50), (20, 46), (40, 48), (65, 45), (65, 64), (-1, 64)], 'g')
    DK = {'w': 'W', 'u': 'U'}

    def robe(f):
        f.poly([(25, 39), (39, 39), (42, 54), (22, 54)], 'w'); f.poly([(35, 39), (39, 39), (42, 54), (37, 54)], 'W')
        f.rect(25, 54, 29, 55, 'z'); f.rect(35, 54, 39, 55, 'z')
        f.poly([(26, 28), (29, 28), (33, 40), (31, 40)], 'W')       # sash fold, angled

    def calm(f):                                   # eyes closed, soft arcs
        for ex in (28, 34):
            f.rect(ex, 19, ex + 1, 20, 'u'); f.hl(ex, ex + 1, 20, 'k'); f.px(ex - 1, 19, 'k') if ex == 28 else f.px(ex + 2, 19, 'k')
    person(c, DK, 25, 12, ('u', 'U'), 'side', 'H', 'h', mouth='smile', brows='soft', brow='h', cloth='w', cdark='W',
           sw=7, ww=7, th=12, nolegs=True, front=robe, top=calm, glint=None,
           arms=[([(26, 30), (21, 35), (18, 39)], 3, 'w'), ([(39, 30), (44, 34), (48, 30)], 3, 'w')],
           hands=[(14, 39, 'flat', False), (46, 25, WAVE, False)])
    halo = layer(); halo.ring(24, 3, 39, 9, 'Y'); halo.ring(25, 4, 38, 8, 'y'); halo.ell(27, 5, 36, 7, '.', only='y')
    c.paste(halo)
    return c.rows(), pal


PORTRAIT = ('trading.martyr', martyr)
