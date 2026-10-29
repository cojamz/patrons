import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def changer():
    c = C(N)
    pal = {'k': INK, 'w': WHITE[0], 'W': WHITE[1],
           'p': '#c9b48e', 'P': '#b9a37c', 'b': '#3a4252', 'B': '#4a5366', 'r': '#d06a5a', 'g': '#7fb08a',
           'u': '#7fa6d0', 'o': '#8a5434', 'O': '#6a3d25', 'y': '#f2d27a', 'Y': '#c9a24a',
           's': '#d4d8dc', 'S': '#9aa1a8', 'm': '#a8693f', 'M': '#86512f', 'H': '#8e8a86', 'h': '#6a6662',
           'z': '#4a3c34', 'q': '#2f3640'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 0, 63, 6, 'P')

    def board(l):
        l.rect(36, 9, 61, 33, 'b')
        for i, (y, k) in enumerate(((12, 'r'), (18, 'g'), (24, 'u'))):
            l.rect(39, y, 43, y + 3, k)
            l.hl(46, 58, y + 1, 'B'); l.hl(46, 52, y + 2, 'B')
        l.hl(39, 58, 29, 'B')
    bg(c, board, None)

    def counter(l):
        l.rect(0, 46, 63, 63, 'o'); l.hl(0, 63, 46, 'O'); l.hl(0, 63, 47, 'O')
        for x, top, k, K in ((40, 36, 'y', 'Y'), (46, 33, 's', 'S'), (52, 38, 'y', 'Y')):   # solid coin stacks
            l.rect(x, top, x + 4, 45, k); l.rect(x + 3, top + 1, x + 4, 45, K); l.hl(x, x + 4, top, K)
    bg(c, counter, None)
    DK = {'w': 'W', 'm': 'M', 'y': 'Y', 's': 'S', 'q': 'q'}

    def vest(f):
        f.poly([(15, 30), (19, 29), (20, 46), (11, 46)], 'q'); f.poly([(29, 29), (33, 30), (36, 46), (27, 46)], 'q')

    def glasses(f):
        f.ring(15, 19, 19, 23, 'S'); f.ring(21, 19, 25, 23, 'S'); f.px(20, 20, 'S')

    def coin(f):
        f.stamp(8, 17, ['.yyy.', 'yywyY', 'yyyyY', 'yyyyY', '.YYY.'])
    person(c, DK, 15, 13, ('m', 'M'), 'crop', 'H', 'h', mouth='smile', brows='soft', brow='h', cloth='w', cdark='W',
           sw=8, ww=9, th=18, nolegs=True, front=vest, top=lambda f: (glasses(f), coin(f)),
           arms=[([(15, 31), (9, 33), (10, 25)], 3, 'w'), ([(30, 31), (34, 38), (38, 40)], 3, 'w')],
           hands=[(8, 21, 'fist', False), (36, 38, 'flat', False)])
    return c.rows(), pal


PORTRAIT = ('trading.changer', changer)
