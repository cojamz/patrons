import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def hoarder():
    c = C(N)
    pal = {'k': INK, 'w': WHITE[0], 'W': WHITE[1],
           'p': '#a39182', 'P': '#958374', 'o': '#c9a066', 'O': '#a07c48', 'n': '#d8d2c2', 'N': '#bab3a2',
           'j': '#a9cfd8', 'J': '#7fa9b4', 'r': '#d9534a', 'g': '#5aa05a', 'b': '#4f82c4', 'y': '#f0c548', 'l': '#fff3c4',
           'a': PALE[0], 'A': PALE[1], 'H': '#cfcbc4', 'h': '#a8a39b', 'z': '#5a4a3e', 'q': '#6a5f7a', 'Q': '#574d66'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'P')

    def piles(l):
        for (x0, y0, x1, y1) in ((0, 30, 13, 52), (2, 16, 12, 29), (50, 36, 63, 52), (52, 22, 62, 35), (54, 10, 61, 21)):
            l.rect(x0, y0, x1, y1, 'o'); l.rect(x1 - 2, y0, x1, y1, 'O'); l.hl(x0, x1, y0 + 2, 'O')
        for y in range(40, 52, 3):                              # a stack of papers, one value step
            l.rect(14, y, 22, y + 2, 'n')
        l.rect(20, 40, 22, 51, 'N')
        l.rect(3, 6, 10, 15, 'n'); l.rect(9, 6, 10, 15, 'N')
        for (x0, y0, x1, y1) in ((40, 40, 49, 52), (42, 30, 48, 39), (14, 26, 22, 39)):
            l.rect(x0, y0, x1, y1, 'o'); l.rect(x1 - 1, y0, x1, y1, 'O'); l.hl(x0, x1, y0 + 2, 'O')
        l.vl(31, 0, 2, 'N'); l.stamp(29, 3, ['.lll.', 'lllll', 'lllll', '.yyy.'])
    bg(c, piles, None)
    DK = {'w': 'W', 'a': 'A', 'j': 'J', 'q': 'Q'}

    def jar(f):
        f.rect(25, 31, 39, 45, 'j'); f.rect(36, 32, 39, 45, 'J'); f.hl(25, 39, 45, 'J')
        f.rect(26, 28, 38, 30, 'q'); f.hl(26, 38, 30, 'Q')
        for (x, y, k) in ((27, 40, 'r'), (29, 42, 'b'), (31, 39, 'y'), (33, 41, 'g'), (35, 43, 'r'), (28, 36, 'g'),
                          (32, 36, 'b'), (34, 38, 'y'), (30, 44, 'y'), (27, 43, 'b'), (36, 40, 'b'), (33, 44, 'r')):
            f.rect(x, y, x + 1, y + 1, k)
        f.vl(27, 32, 34, 'w')
    person(c, DK, 25, 11, ('a', 'A'), 'short', 'H', 'h', mouth='flat', brows='stern', brow='h', cloth='w', cdark='W',
           sw=8, ww=7, th=14, pants=('q', 'Q'), lh=8, front=jar,
           arms=[([(25, 29), (22, 35), (27, 41)], 3, 'w'), ([(39, 29), (42, 35), (37, 41)], 3, 'w')],
           hands=[(26, 39, 'flat', False), (34, 39, 'flat', True)])
    return c.rows(), pal


PORTRAIT = ('trading.hoarder', hoarder)
