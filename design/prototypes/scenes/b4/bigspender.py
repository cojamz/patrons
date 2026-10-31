import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def bigspender():
    c = C(N)
    pal = {'k': INK, 'w': '#f4ede1', '1': GREY[0], '2': GREY[1],
           'p': '#6a3448', 'P': '#5e2e40', 'f': '#8a4a3a', 'F': '#763e30', 'y': '#f2d27a', 'Y': '#c9a24a',
           'g': '#b8bcc0', 'G': '#8e9397', 'r': '#c9443c', 'n': '#8fb877', 'N': '#5d8a50',
           'a': PALE[0], 'A': PALE[1], 'H': '#3a2a22', 'h': '#5a4232', 'z': '#3e3632', 'q': '#4a4f5c', 'Q': '#3a3e4a'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 50, 63, 63, 'f'); c.hl(0, 63, 50, 'F')

    def slots(l):
        for x0 in (1, 49):
            l.rect(x0, 18, x0 + 13, 50, 'G'); l.rect(x0 + 1, 19, x0 + 12, 49, 'g')
            l.rect(x0 + 2, 25, x0 + 11, 31, 'w')
            for i in range(3):
                l.rect(x0 + 3 + i * 3, 27, x0 + 4 + i * 3, 29, 'ryr'[i])
            l.rect(x0 + 2, 20, x0 + 11, 22, 'Y')
            l.rect(x0 + 3, 36, x0 + 10, 38, 'G')
    bg(c, slots, None)
    DK = {'1': '2', 'a': 'A', 'n': 'N', 'w': 'w', 'y': 'Y'}

    def shirt(f):
        f.poly([(28.5, 29), (35.5, 29), (32, 36)], 'w')
        f.poly([(30, 29), (34, 29), (32, 32)], 'r')
        for (x, y) in ((28, 29), (28, 30), (29, 31), (29, 32), (30, 33), (30, 34)):
            f.px(x, y, '2'); f.px(64 - x, y, '2')

    def fan(f):                                  # a fan of bills in the raised hand
        for (x, y) in ((40, 13), (43, 12), (46, 14)):
            p = layer(); bill(p, x, y, 5, 8); over(f, p, {'n': 'N'})
        f.rect(43, 26, 45, 26, 'y')               # gold watch
    person(c, DK, 25, 13, ('a', 'A'), 'side', 'H', 'h', mouth='grin', brows='soft', brow='H', cloth='1', cdark='2',
           sw=8, ww=7, th=13, pants=('1', '2'), shoe='z', lh=8, front=shirt, top=fan,
           arms=[([(39, 31), (45, 30), (44, 23)], 3, '1'), ([(25, 31), (21, 36), (21, 42)], 3, '1')],
           hands=[(42, 19, 'fist', True), (19, 41, 'thumb', False)])
    for (x, y) in ((14, 8), (22, 4), (52, 6), (56, 12), (18, 13)):           # bills in the air
        b = layer(); bill(b, x, y, 6, 4); edged(b, 'N'); c.paste(b)
    return c.rows(), pal


PORTRAIT = ('benders.bigspender', bigspender)
