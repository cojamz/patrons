import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def oldmoney():
    c = C(N)
    pal = {'k': INK, 'w': WHITE[0], 'W': WHITE[1],
           'p': '#9fc2d6', 'm': '#c9a982', 'M': '#b89770', 'q': '#5e6e78', 'g': '#7fa65e', 'G': '#6d9450',
           'o': '#6a4a36', 'O': '#4e3426', 'y': '#e6b84a', 'Y': '#b98c2c', 'r': '#8f2f3d',
           'a': PALE[0], 'A': PALE[1], 'H': '#e8e4dc', 'h': '#bdb7ad', 'z': '#6a4a36', 'n': '#d8d0c0', 'N': '#b8ae9c'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 44, 63, 63, 'g'); c.rect(0, 52, 63, 63, 'G')

    def mansion(l):
        l.rect(0, 14, 63, 44, 'm'); l.poly([(-1, 14), (31, 3), (64, 14)], 'M')
        for x in (3, 13, 47, 57):
            l.rect(x, 16, x + 3, 44, 'M')
        for x in (7, 51):
            l.rect(x + 1, 22, x + 4, 32, 'q')
        l.hl(0, 63, 14, 'M'); l.rect(0, 42, 63, 44, 'M')
    bg(c, mansion, None)
    DK = {'w': 'W', 'a': 'A', 'n': 'N', 'y': 'Y'}

    def vest(f):
        f.poly([(29, 26), (35, 26), (32, 32)], 'n')
        f.poly([(31, 26), (33, 26), (33, 30), (31, 30)], 'r')
        for (x, y) in ((27, 26), (27, 27), (28, 28), (28, 29), (29, 30), (29, 31)):
            f.px(x, y, 'W'); f.px(64 - x, y, 'W')
        f.pts('y', [(32, 33), (33, 34), (34, 35), (35, 35), (36, 35), (37, 34)]); f.px(37, 33, 'Y')   # watch chain to the pocket
        f.rect(41, 29, 47, 30, 'y'); f.px(47, 31, 'Y')                # cane knob, under the hand

    def brows(f):
        f.hl(27, 29, 16, 'h'); f.hl(34, 36, 16, 'h')

    def cane(p):
        p.vl(44, 34, 52, 'o'); p.vl(45, 34, 52, 'O')
    person(c, DK, 25, 10, ('a', 'A'), 'crop', 'H', 'h', mouth='smirk', brows=None, cloth='w', cdark='W',
           sw=8, ww=7, th=15, pants=('w', 'W'), shoe='z', lh=9, front=vest, top=brows,
           arms=[([(25, 29), (22, 36), (27, 40)], 3, 'w'), ([(39, 29), (43, 33), (44, 32)], 3, 'w')],
           hands=[(26, 38, 'flat', False), (42, 31, 'grip', True)], props=cane)
    return c.rows(), pal


PORTRAIT = ('trading.oldmoney', oldmoney)
