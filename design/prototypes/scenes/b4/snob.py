import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def snob():
    c = C(N)
    pal = {'k': INK, 'w': '#f6f1e6', 'W': '#d3cabb',
           'p': '#c9ab95', 'P': '#b8977f', 'y': '#e2b85a', 'Y': '#a88238', 'g': '#8aa37a', 's': '#a9c3c9',
           '1': BLUE[0], '2': BLUE[1], 'a': PALE[0], 'A': PALE[1],
           'H': '#b98a4a', 'z': '#7a5530', 'm': '#3c2c3a', 'q': '#5d7a52'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 40, 63, 63, 'P'); c.hl(0, 63, 40, 'Y')

    def frame(l):
        l.rect(3, 6, 18, 26, 'Y'); l.rect(4, 7, 17, 25, 'y'); l.rect(6, 9, 15, 23, 's')
        l.poly([(6, 23), (6, 17), (10, 14), (15, 19), (15, 23)], 'g')
        l.poly([(10, 23), (13, 18), (15, 20), (15, 23)], 'q')
    bg(c, frame)

    def fern(l):
        l.rect(48, 44, 57, 54, 'z'); l.hl(47, 58, 44, 'm')
        for (x0, y0, x1, y1) in ((52, 44, 45, 30), (53, 44, 53, 26), (54, 44, 61, 31), (52, 44, 47, 36), (54, 44, 60, 37)):
            l.line(x0, y0, x1, y1, 'q'); l.line(x0 + 1, y0, x1 + 1, y1, 'g')
    bg(c, fern)
    DK = {'1': '2', 'a': 'A', 'w': 'W', 'y': 'Y'}

    def gown(f):
        f.poly([(25, 40), (39, 40), (44, 53), (20, 53)], '1')
        f.poly([(36, 41), (39, 40), (44, 53), (39, 53)], '2')
        f.hl(20, 44, 53, '2')
        f.rect(24, 54, 27, 55, 'm'); f.rect(36, 54, 39, 55, 'm')
        f.poly([(28.5, 28), (36.5, 28), (32.5, 33)], 'a')                    # open neckline
        for i, (x, y) in enumerate(((29, 28), (30, 29), (31, 30), (32, 30), (33, 30), (34, 29), (35, 28))):
            f.px(x, y, 'w' if i % 2 == 0 else 'W')                          # pearls on skin

    def lorgnette(f):
        f.ring(26, 18, 31, 23, 'y'); f.px(31, 22, 'Y'); f.px(30, 23, 'Y')

    def handle(p):
        p.line(26, 24, 23, 27, 'Y'); p.line(27, 24, 24, 27, 'y')

    def cup(f):
        f.hl(34, 41, 40, 'W'); f.rect(35, 36, 39, 39, 'w'); f.vl(39, 37, 39, 'W'); f.pts('w', [(40, 37), (41, 38), (40, 39)])
    person(c, DK, 25, 13, ('a', 'A'), 'bun', 'H', 'z', mouth='flat', brows='stern', brow='z',
           cloth='1', cdark='2', sw=6, ww=6, th=12, nolegs=True, front=gown,
           arms=[([(26, 31), (21, 36), (22, 30)], 3, '1'), ([(38, 31), (41, 36), (34, 39)], 3, '1')],
           hands=[(21, 27, 'fist', False), (30, 38, 'flat', True)], top=lorgnette,
           props=handle, side='R')
    return c.rows(), pal


PORTRAIT = ('market.snob', snob)
