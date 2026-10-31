import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def accomplice():
    c = C(N)
    pal = {'k': INK, 'w': WHITE, 'b': '#2f3554', 'B': '#283049', 'h': '#45405e', 'H': '#3a3651',
           'y': '#f3d27a', 'Y': '#e0b85a', 'o': '#a8703f', 'O': '#7a4e2a',
           '1': MAGENTA[0], '2': MAGENTA[1], 's': OLIVE[0], 'S': OLIVE[1],
           'x': '#2c2a36', 'X': '#45424f', 'z': '#3a2a22', 'm': '#c9b48a', 'M': '#a08a62', 'g': '#8d9296', 'q': '#3b3446'}
    c.rect(0, 0, 63, 63, 'b')
    c.ell(54, 3, 59, 8, 'y'); c.ell(55, 2, 60, 7, 'b', only='y')

    def house(l):
        l.rect(0, 10, 40, 63, 'h'); l.poly([(-2, 10), (20, 2), (42, 10)], 'H')
        l.rect(4, 16, 15, 28, 'H'); l.rect(5, 17, 14, 27, 'y'); l.rect(9, 17, 10, 27, 'Y'); l.hl(5, 14, 22, 'Y')
    bg(c, house, 'H')
    c.rect(0, 54, 63, 63, 'B')

    def ladder(l):
        l.line(13, 26, 22, 56, 'o'); l.line(14, 26, 23, 56, 'O')
        l.line(19, 25, 28, 55, 'o'); l.line(20, 25, 29, 55, 'O')
        for t in range(29, 54, 6):
            x = 13 + (t - 26) * 9 // 30
            l.hl(x + 1, x + 6, t, 'O')
    bg(c, ladder)

    def sack(f, DK):
        f.ell(45, 21, 61, 38, 'm'); f.poly([(50, 20), (53, 20), (54, 24), (49, 24)], 'm')
        f.ell(55, 28, 60, 36, 'M'); f.pts('M', [(51, 21), (51, 22), (52, 23)])

    def beanie(f):
        f.ell(30, 10, 45, 19, 'x'); f.hl(30, 45, 18, 'X'); f.hl(30, 45, 19, 'X')
    person(c, 31, 14, 14, 's', 'S', '1', '2', th=14, sw=8, ww=7,
           lg=dict(pants='x', pdark='q', shoe='z', lh=9, stance=1),
                      arms=[([(32, 33), (28, 37), (25, 40)], 3, '1'), ([(45, 32), (49, 30), (51, 34)], 3, '1')],
           hands=[(23, 39, 'grip', False)],
           late=lambda f, DK: (sack(f, DK), hand(f, 49, 19, 'fist', 's', 'S', True)),
           mouth='smirk', brows='stern', brow='z', hr=('crop', 'z', 'z'), hat=beanie,
           dk={'m': 'M', 'x': 'X'})
    return c.rows(), pal


PORTRAIT = ('thieves.accomplice', accomplice)
