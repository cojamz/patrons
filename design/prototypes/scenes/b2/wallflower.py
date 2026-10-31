import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def wallflower():
    c = C(N)
    pal = {'k': INK, 'w': WHITE, 'W': '#cfc6d6', 't': '#6b5a86', 'T': '#5e4e78', 'f': '#4a3f60', 'F': '#55496e',
           'y': '#f3d27a', 'p': '#e47a9a', 'u': '#7fc8d8', 'g': '#c8ccd2', 'G': '#8f959e',
           '1': GREEN[0], '2': GREEN[1], 's': OLIVE[0], 'S': OLIVE[1],
           'h': '#3a2620', 'H': '#24170f', 'o': '#b0603a', 'O': '#84452a', 'e': '#9a3a44', 'D': '#2c5534', 'z': '#3e2a26'}
    c.rect(0, 0, 63, 63, 't'); c.rect(0, 50, 63, 63, 'f')
    c.rect(36, 0, 63, 49, 'T')                                 # the room opens up to the right
    # string lights, small bright dots
    for i, x in enumerate(range(2, 64, 6)):
        y = 4 + (1 if i % 2 else 0)
        c.px(x, y, 'y' if i % 3 else 'p')
    c.pts('G', [(x, 3 + (x // 3) % 2) for x in range(0, 64, 3)])

    def ball(l):
        l.vl(52, 0, 9, 'G'); l.ell(47, 10, 57, 20, 'g'); l.pts('w', [(50, 12), (51, 12), (50, 13)]); l.pts('G', [(54, 17), (55, 16), (53, 18)])
    bg(c, ball, 'G')

    def plant(l):
        l.ell(0, 30, 6, 40, '2'); l.ell(5, 27, 12, 39, '2'); l.ell(2, 22, 8, 33, '2')
    bg(c, plant, 'D')

    def pot(l):
        l.rect(2, 42, 10, 50, 'o'); l.hl(1, 11, 42, 'O')
    bg(c, pot, 'O')

    def cup(f, DK):
        f.rect(23, 33, 26, 37, 'e'); f.hl(23, 26, 33, 'p')

    def hd_hair(l):
        hair(l, 18, 12, 14, 'long', 'h', 'H')
    person(c, 18, 12, 14, 's', 'S', '1', '2', th=22, sw=6, ww=9,
           lg=dict(pants='s', pdark='S', shoe='z', lh=4, gap=2, lw=3),
           arms=[([(19, 30), (18, 35), (22, 37)], 3, '1'), ([(31, 30), (33, 35), (28, 37)], 3, '1')],
           late=lambda f, DK: (cup(f, DK), hand(f, 20, 35, 'grip', 's', 'S'), hand(f, 26, 35, 'grip', 's', 'S', True)),
           mouth='flat', brows='soft', brow='h', hr=hd_hair, dk={'e': 'e'},
           face=lambda l: l.pts('k', [(22, 19), (28, 19)]) or l.pts('s', []) )
    return c.rows(), pal


PORTRAIT = ('echo.wallflower', wallflower)
