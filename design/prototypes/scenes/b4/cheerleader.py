import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def cheerleader():
    c = C(N)
    pal = {'k': INK, 'w': '#f4ede1', 'W': '#cfc8bb', '1': GREY[0], '2': GREY[1],
           'p': '#b9d6e6', 'b': '#9fa6b0', 'B': '#8c939d', 'g': '#78ac5b', 'G': '#6da151',
           'y': '#f0c548', 'Y': '#c08f22',
           'e': DEEP[0], 'E': DEEP[1], 'H': '#2a1c16', 'h': '#463026', 'z': '#55504a'}
    c.rect(0, 0, 63, 63, 'p')
    c.rect(0, 16, 63, 39, 'b'); c.rect(0, 28, 63, 39, 'B')
    c.rect(0, 40, 63, 63, 'g'); c.rect(0, 50, 63, 63, 'G')
    DK = {'1': '2', 'e': 'E', 'w': 'W', 'y': 'Y'}

    def uniform(f):
        f.poly([(24, 39), (40, 39), (43, 45), (21, 45)], '1'); f.poly([(32, 40), (36, 40), (37, 45), (33, 45)], '2')
        f.poly([(27, 29), (37, 29), (32, 33)], 'w')                      # white V collar
        f.stamp(29, 34, ['..y..', 'yyyyy', '.yyy.', 'y...y'])           # a star, not a cross

    def poms(f):
        for (x0, y0) in ((5, 3), (47, 3)):
            for (bx, by) in ((0, 3), (3, 0), (7, 1), (8, 5), (5, 7), (1, 7), (4, 4)):
                f.ell(x0 + bx, y0 + by, x0 + bx + 4, y0 + by + 4, 'w')
            f.ell(x0 + 6, y0 + 5, x0 + 12, y0 + 11, 'W', only='w')
    person(c, DK, 25, 13, ('e', 'E'), 'afro', 'H', 'h', mouth='grin', brows='soft', brow='H', cloth='1', cdark='2',
           sw=7, ww=6, th=12, pants=('e', 'E'), shoe='w', lh=8, lw=3, front=uniform, top=poms,
           arms=[([(26, 30), (19, 27), (13, 18)], 3, 'e'), ([(38, 30), (45, 27), (51, 18)], 3, 'e')],
           hands=[(11, 14, 'fist', False), (49, 14, 'fist', True)])
    return c.rows(), pal


PORTRAIT = ('benders.cheerleader', cheerleader)
