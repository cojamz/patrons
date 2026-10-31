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
        l.ell(16, 0, 48, 32, 'G'); l.ell(18, 2, 46, 30, 'g')          # round vault door
        l.ring(25, 9, 39, 23, 'G'); l.ring(26, 10, 38, 22, 'G')       # wheel handle, three spokes
        l.line(32, 16, 32, 10, 'G'); l.line(32, 16, 27, 20, 'G'); l.line(32, 16, 37, 20, 'G')
        l.ell(30, 14, 34, 18, 'G'); l.px(31, 15, 'g')
        for (x, y) in ((20, 14), (44, 14), (32, 28)):
            l.rect(x, y, x + 1, y + 1, 'G')
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
    def stripes(l):                                  # striped burglar shirt
        for y in (34, 38, 42):
            l.rect(40, y, 54, y + 1, 'm')
        l.recolor('m', '.', (0, 0, 39, 63))

    def hug(l):                                      # crouched, sack hugged low in both arms
        sack(40, 36)(l)
    person(c, DK, 40, 18, ('d', 'D'), 'crop', 'J', 'j', mouth='grin', brows=None, cloth='w', cdark='W',
           sw=7, ww=6, th=11, pants=('n', 'n'), shoe='z', lh=5, stance=2, front=None, post=lambda f: [f.recolor('wW', 'm', (34, y, 60, y)) for y in (34, 37, 40, 43)],
           top=lambda l: (mask(40, 18)(l), hug(l)),
           arms=[([(41, 35), (38, 40), (41, 44)], 3, 'w'), ([(54, 35), (57, 40), (53, 44)], 3, 'w')],
           hands=[(39, 43, 'fist', False), (51, 43, 'fist', True)])
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
