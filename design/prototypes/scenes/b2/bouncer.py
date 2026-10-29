import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def bouncer():
    c = C(N)
    pal = {'k': INK, 'w': WHITE, 'W': '#d6cdbd', 'b': '#3a2f4a', 'B': '#45385a', 'n': '#f08ad0', 'N': '#7fe0f0',
           'y': '#f2d27a', 'Y': '#c9a24a', 'r': '#b5304a', 'R': '#8a2238', 'o': '#a8703f', 'O': '#7a4e2a',
           '1': PURPLE[0], '2': PURPLE[1], 's': OLIVE[0], 'S': OLIVE[1],
           'h': '#2a1c18', 'x': '#2c2a36', 'X': '#45424f', 'z': '#3a2a22', 'f': '#2e2638'}
    c.rect(0, 0, 63, 63, 'b'); c.rect(0, 54, 63, 63, 'f')

    def door(l):
        l.rect(2, 10, 18, 54, 'B'); l.rect(4, 12, 16, 54, 'f'); l.px(14, 34, 'y')
    bg(c, door)
    # neon sign over the door: a small pink star and a cyan bar
    c.hl(5, 15, 3, 'n'); c.hl(5, 15, 8, 'n'); c.vl(4, 4, 7, 'n'); c.vl(16, 4, 7, 'n'); c.hl(7, 13, 5, 'N'); c.hl(8, 12, 6, 'N')

    def rope(l):
        for x in (40, 60):
            l.rect(x, 40, x + 1, 56, 'Y'); l.ell(x - 1, 37, x + 2, 40, 'y'); l.rect(x - 2, 56, x + 3, 57, 'Y')
        for x in range(42, 60):
            y = 42 + int(4 * (1 - ((x - 50.5) / 9) ** 2))
            l.px(x, y, 'r'); l.px(x, y + 1, 'R')
    bg(c, rope)

    def clip(f, DK):
        f.rect(16, 34, 24, 45, 'o'); f.rect(17, 36, 23, 44, 'w'); f.rect(19, 33, 21, 35, 'X')
        for y in (38, 40, 42):
            f.hl(18, 22, y, 'W')
    person(c, 24, 12, 16, 's', 'S', '1', '2', th=17, sw=12, ww=11,
           lg=dict(pants='x', pdark='X', shoe='z', lh=8, lw=5, gap=3),
           arms=[([(21, 34), (17, 39), (19, 44)], 5, '1'), ([(43, 34), (46, 39), (44, 45)], 5, '1')],
           hands=[(43, 45, 'fist', True)],
           late=lambda f, DK: (f.recolor('1', '2', (41, 36, 41, 44)), f.recolor('1', '2', (42, 43, 42, 45)), clip(f, DK), hand(f, 15, 41, 'grip', 's', 'S')),
           mouth='flat', brows='stern', brow='h', hr=('crop', 'h', 'x'),
           dk={'o': 'O', 'w': 'W'})
    return c.rows(), pal


PORTRAIT = ('purple.bouncer', bouncer)
