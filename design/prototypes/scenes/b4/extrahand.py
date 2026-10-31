import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def extrahand():
    c = C(N)
    pal = {'k': INK, 'w': '#f4ede1', '1': GREY[0], '2': GREY[1],
           'p': '#b9a07e', 'P': '#a88f6e', 's': '#c9dde0', 'f': '#8e8a84', 'F': '#7c7872', 'o': '#5e4a3a', 'O': '#4a3a2c',
           'r': '#c9443c', 'R': '#9e342e', 'g': '#d4d8dc', 'G': '#9aa1a8', 'y': '#e6c25a', 'Y': '#b8932f',
           'b': LIGHT[0], 'B': LIGHT[1], 'H': '#b0552c', 'h': '#7e3a1e', 'z': '#5a4a3e', 'q': '#5d7a9c', 'Q': '#4a6484'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'f'); c.hl(0, 63, 52, 'F')

    def door(l):
        l.rect(14, 4, 50, 52, 'o'); l.rect(17, 7, 47, 52, 'P')
        l.rect(17, 7, 47, 26, 's')                               # daylight through the open door, behind them
        l.rect(50, 12, 61, 52, 'O'); l.rect(52, 30, 53, 32, 'G')  # the door, swung open
    bg(c, door, None)

    def sign(l):
        l.rect(3, 18, 11, 24, 'w'); l.hl(4, 10, 20, 'G'); l.hl(4, 8, 22, 'G')
    bg(c, sign, 'G')
    DK = {'1': '2', 'b': 'B', 'r': 'R', 'q': 'Q', 'g': 'G', 'y': 'Y'}

    def overalls(f):
        f.rect(27, 33, 37, 41, 'q'); f.rect(35, 33, 37, 41, 'Q')
        f.vl(28, 28, 33, 'q'); f.vl(36, 28, 33, 'q'); f.px(28, 33, 'g'); f.px(36, 33, 'g')

    def cap(f):
        f.rect(25, 9, 38, 14, 'y'); f.hl(27, 36, 8, 'y'); f.rect(35, 9, 38, 14, 'Y'); f.rect(21, 14, 30, 15, 'Y')

    def box(f):
        f.rect(40, 42, 52, 49, 'r'); f.rect(40, 42, 52, 43, 'R'); f.rect(49, 44, 52, 49, 'R'); f.rect(44, 45, 47, 46, 'g')
        f.rect(44, 39, 48, 39, 'G'); f.vl(44, 39, 41, 'G'); f.vl(48, 39, 41, 'G')
    person(c, DK, 25, 13, ('b', 'B'), 'short', 'H', 'h', mouth='smile', brows='soft', brow='h', cloth='1', cdark='2',
           sw=7, ww=6, th=13, pants=('q', 'Q'), shoe='z', lh=9, front=overalls, top=lambda f: (cap(f), box(f)),
           arms=[([(26, 30), (21, 30), (19, 22)], 3, '1'), ([(38, 30), (42, 35), (45, 38)], 3, '1')],
           hands=[(17, 17, WAVE, False), (44, 37, 'grip', True)])
    return c.rows(), pal


PORTRAIT = ('benders.extrahand', extrahand)
