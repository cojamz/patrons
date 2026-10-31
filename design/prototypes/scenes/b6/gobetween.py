import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def art():
    c = C(N)
    pal = base_pal(**{
        'p': '#b7a8c4', 'P': '#a898b6',          # corridor wall, floor
        'e': '#b84a42', 'E': '#953a34',          # left door (red)
        'u': '#4c78b0', 'U': '#3c6292',          # right door (blue)
        'y': '#f2d27a', 'Y': '#c9a24a',          # knobs, lamp
        'c': '#f4ede1', 'C': '#c9bfae',          # letters
        '1': YELLOW[0], '2': YELLOW[1],
        'x': '#4d4a5c', 'X': '#3e3b4c', 'z': '#2b211d',
        'h': '#a0603a', 'H': '#7a4628',
        's': LIGHT[0], 'S': LIGHT[1], 'r': '#b0302a'})
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'P')

    def doors(l):
        l.rect(0, 10, 11, 52, 'e'); l.rect(2, 14, 9, 28, 'E'); l.rect(2, 33, 9, 48, 'E')
        l.rect(52, 10, 63, 52, 'u'); l.rect(54, 14, 61, 28, 'U'); l.rect(54, 33, 61, 48, 'U')
        l.rect(6, 29, 9, 32, 'Y'); l.rect(6, 29, 8, 31, 'y')
        l.rect(54, 29, 57, 32, 'Y'); l.rect(55, 29, 57, 31, 'y')
    bg(c, doors, None)
    c.vl(11, 10, 52, 'E'); c.vl(52, 10, 52, 'U')

    def lamp(l):
        l.hl(29, 34, 1, 'Y'); l.vl(31, 0, 3, 'Y'); l.ell(28, 3, 35, 7, 'y')

    DK = {'1': '2', 's': 'S', 'x': 'X', 'h': 'H', 'c': 'C'}
    cx = 32

    def front(f):
        f.vl(cx, 30, 43, '2')
        for y in (32, 36, 40):
            f.px(cx - 2, y, 'Y'); f.px(cx + 2, y, 'Y')
        f.poly([(cx - 4, 27), (cx - 1, 27), (cx - 2, 30)], 'w'); f.poly([(cx + 1, 27), (cx + 4, 27), (cx + 2, 30)], 'w')

    def letters(f):
        for x0 in (10, 46):
            f.rect(x0, 25, x0 + 7, 30, 'c'); f.hl(x0, x0 + 7, 30, 'C')
            f.pts('C', [(x0, 25), (x0 + 1, 26), (x0 + 2, 27), (x0 + 3, 28), (x0 + 4, 28), (x0 + 5, 27), (x0 + 6, 26), (x0 + 7, 25)])
            f.rect(x0 + 3, 28, x0 + 4, 29, 'r')
        for hx_, fl in ((12, False), (47, True)):
            hl = layer(); hand(hl, hx_, 29, 'grip', 's', 'S', fl); over(f, hl, DK)

    def cap(f):
        f.ell(24, 9, 39, 17, '1'); f.hl(23, 40, 16, '2')
        f.hl(36, 43, 17, '2'); f.hl(37, 43, 18, '2')

    person(c, DK, hx=25, hy=13, skin='s', shade='S', mouth='smile', brows='soft', brow='H',
           hs='crop', hk='h', hd='H', cloth='1', cdark='2', cx=cx, sw=7, ww=6, th=14,
           lg=dict(pants='x', pdark='X', shoe='z', lh=8),
           arms=[([(26, 31), (21, 35), (16, 31)], 3), ([(38, 31), (43, 35), (48, 31)], 3)],
           hands=[],
           front=front, top=lambda f: (cap(f), letters(f)))
    return c.rows(), pal


PORTRAIT = ('yellow.gobetween', art)
