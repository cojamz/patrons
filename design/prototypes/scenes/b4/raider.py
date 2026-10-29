import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def raider():
    c = C(N)
    pal = {'k': INK, 'w': WHITE[0], 'W': WHITE[1],
           'p': '#5c6478', 'P': '#525a6d', 'g': '#9aa1a8', 'G': '#7d848c', 'q': '#3e4452',
           's': '#c9a978', 'S': '#a58856', 'y': '#f2d27a', 'Y': '#c9a24a', 'm': '#2d3a5a',
           'b': LIGHT[0], 'B': LIGHT[1], 'd': OLIVE[0], 'D': OLIVE[1], 'H': '#b0552c', 'h': '#7e3a1e',
           'J': '#3a2a22', 'j': '#5a4232', 'n': '#4a4f5c', 'z': '#6a5040'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'P')

    def vault(l):
        l.ell(18, 2, 50, 34, 'G'); l.ell(21, 5, 47, 31, 'q')
        l.ell(42, 4, 62, 34, 'g'); l.ell(46, 9, 58, 29, 'G'); l.ell(49, 13, 55, 25, 'g')
        for x in (27, 33, 39):
            l.rect(x, 18, x + 3, 30, 'Y'); l.hl(x, x + 3, 18, 'y')
    bg(c, vault, None)
    DK = {'w': 'W', 'b': 'B', 'd': 'D', 's': 'S', 'n': 'n', 'm': 'm', 'y': 'Y'}

    def mask(x0, y0):
        def f(l):
            l.rect(x0 + 1, y0 + 6, x0 + 12, y0 + 9, 'm')
            l.px(x0 + 3, y0 + 7, 'w'); l.px(x0 + 9, y0 + 7, 'w')
            l.rect(x0 + 4, y0 + 7, x0 + 4, y0 + 8, 'm'); l.rect(x0 + 10, y0 + 7, x0 + 10, y0 + 8, 'm')
        return f

    def sack(x0, y0):
        def f(l):
            l.ell(x0, y0, x0 + 12, y0 + 12, 's'); l.ell(x0 + 6, y0 + 3, x0 + 12, y0 + 12, 'S', only='s')
            l.rect(x0 + 4, y0 - 2, x0 + 7, y0, 'S')
            l.stamp(x0 + 3, y0 + 5, ['.yyy.', 'yyyyY', '.YYY.'])
        return f
    # second raider, behind, olive, a friendly equal
    person(c, DK, 40, 13, ('d', 'D'), 'crop', 'J', 'j', mouth='grin', brows=None, cloth='w', cdark='W',
           sw=6, ww=5, th=12, pants=('n', 'n'), shoe='z', lh=10, stance=2, front=None,
           top=lambda l: (mask(40, 13)(l), sack(50, 22)(l)),
           arms=[([(42, 30), (39, 35), (40, 39)], 3, 'w'), ([(52, 30), (55, 28), (55, 24)], 3, 'w')],
           hands=[(38, 39, 'fist', False), (53, 20, 'fist', True)])
    # lead raider, light, running with a sack on the shoulder
    person(c, DK, 10, 16, ('b', 'B'), 'side', 'H', 'h', mouth='grin', brows=None, cloth='w', cdark='W',
           sw=7, ww=6, th=12, pants=('n', 'n'), shoe='z', lh=10, stance=3, front=None,
           top=lambda l: (mask(10, 16)(l), sack(1, 22)(l)),
           arms=[([(12, 33), (8, 31), (6, 27)], 3, 'w'), ([(23, 33), (26, 38), (26, 41)], 3, 'w')],
           hands=[(4, 24, 'fist', False), (24, 41, 'fist', True)])
    for (x, y) in ((33, 54), (24, 57)):
        c.stamp(x, y, ['.yyy.', 'yyyyY', '.YYY.'])
    return c.rows(), pal


PORTRAIT = ('trading.raider', raider)
