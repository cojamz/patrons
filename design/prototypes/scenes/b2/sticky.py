import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def sticky():
    c = C(N)
    pal = {'k': INK, 'w': WHITE, 'W': '#d6cdbd', 't': '#c9b9a0', 'T': '#bba98e', 'f': '#a8977b',
           'r': '#9a3446', 'R': '#7a2838', 'y': '#f2d27a', 'Y': '#c9a24a', 'u': '#7fd0e0', 'U': '#4aa8c0',
           'g': '#a9aeac', 'G': '#7d8381',
           '1': MAGENTA[0], '2': MAGENTA[1], 's': OLIVE[0], 'S': OLIVE[1],
           'h': '#6a4530', 'H': '#4a2e20', 'x': '#2c2a36', 'X': '#45424f', 'z': '#3a2a22', 'o': '#8a6a4a'}
    c.rect(0, 0, 63, 63, 't'); c.rect(0, 52, 63, 63, 'f')

    def gallery(l):
        l.rect(3, 8, 17, 26, 'Y'); l.rect(5, 10, 15, 24, 'T')
        l.poly([(5, 24), (5, 18), (10, 14), (15, 20), (15, 24)], 'f')
        l.rect(46, 6, 60, 22, 'Y'); l.rect(48, 8, 58, 20, 'f'); l.ell(50, 11, 56, 17, 'T')
    bg(c, gallery)

    def plinth(l):
        l.rect(40, 36, 55, 63, 'w'); l.rect(38, 34, 57, 36, 'w'); l.rect(52, 37, 55, 63, 'W'); l.hl(38, 57, 36, 'W')
        l.ell(42, 31, 53, 34, 'r')                                   # velvet cushion
    bg(c, plinth, 'W')

    def rope(l):
        l.rect(4, 40, 5, 55, 'Y'); l.rect(3, 38, 6, 40, 'Y'); l.rect(2, 56, 7, 57, 'Y')
        for x in range(6, 30):
            y = 42 + int(3 * (1 - ((x - 18) / 12) ** 2))
            l.px(x, y, 'r'); l.px(x, y + 1, 'R')
    bg(c, rope)

    def gem(f, DK):
        f.stamp(43, 20, ['.uuu.', 'uwuuU', '.uuU.', '..U..'])

    def mask(f):
        f.rect(22, 18, 37, 21, 'x'); f.pts('g', [(25, 19), (33, 19)])
    person(c, 22, 12, 14, 's', 'S', '1', '2', th=15, sw=8, ww=7,
           lg=dict(pants='x', pdark='X', shoe='z', lh=9, stance=1),
           arms=[([(35, 31), (40, 30), (43, 26)], 3, '1'), ([(23, 31), (20, 36), (22, 40)], 3, '1')],
           hands=[(20, 40, 'fist', False)],
           late=lambda f, DK: (gem(f, DK), hand(f, 42, 23, 'grip', 's', 'S', True)),
           mouth='smile', brows='soft', brow='H', hr=('bun', 'h', 'H', 'L'), hat=mask,
           dk={'u': 'U', 'x': 'X'})
    return c.rows(), pal


PORTRAIT = ('thieves.sticky', sticky)
