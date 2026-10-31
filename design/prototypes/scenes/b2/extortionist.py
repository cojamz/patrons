import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def extortionist():
    c = C(N)
    pal = {'k': INK, 'w': WHITE, 'W': '#d6cdbd', 't': '#a8c9b8', 'T': '#98bba8', 'o': '#a8703f', 'O': '#7a4e2a',
           'y': '#f3d27a', 'r': '#d9534a', 'R': '#a83a35', 'q': '#c9e0e6', 'Q': '#a9c6ce',
           '1': MAGENTA[0], '2': MAGENTA[1], 'a': PALE[0], 'A': PALE[1],
           'x': '#3b3446', 'X': '#2c2733', 'z': '#3a2a22', 'h': '#6a4a30', 'H': '#4a3220', 'm': '#c49a5a'}
    c.rect(0, 0, 63, 63, 't'); c.rect(0, 54, 63, 63, 'T')

    def shop(l):
        l.rect(2, 6, 22, 30, 'O'); l.rect(4, 8, 20, 28, 'q'); l.poly([(4, 28), (4, 22), (12, 15), (14, 28)], 'Q')
        l.rect(44, 18, 63, 22, 'O'); l.rect(44, 30, 63, 34, 'O')
        for x in (46, 51, 56, 60):
            l.rect(x, 13, x + 3, 17, 'r' if x % 2 else 'y'); l.rect(x, 25, x + 3, 29, 'y' if x % 2 else 'r')
    bg(c, shop)


    def batf(f):
        thick(f, [(42, 42), (33, 37)], 2, 'm')
        thick(f, [(33, 37), (24, 32)], 3, 'm')
        thick(f, [(24, 32), (17, 29)], 4, 'm')
        sh = layer(); sh.line(33, 39, 18, 32, 'h')
        for y in range(N):
            for x in range(N):
                if sh.get(x, y) == 'h' and f.get(x, y) == 'm':
                    f.px(x, y, 'h')

    def bat(p):
        p.line(40, 28, 52, 6, 'm'); p.line(41, 28, 53, 6, 'h')
        p.line(51, 9, 54, 3, 'm'); p.line(52, 9, 55, 3, 'm'); p.line(53, 10, 56, 4, 'h')

    def tie(f, DK):
        f.poly([(30, 31), (34, 31), (32, 34)], 'w'); f.pts('2', [(31, 32), (32, 33), (32, 34), (32, 35), (32, 36), (33, 37)])
    person(c, 24, 13, 16, 'a', 'A', '1', '2', th=15, sw=11, ww=10,
           lg=dict(pants='x', pdark='X', shoe='z', lh=8, lw=5, gap=2, stance=1),
           front=tie,
           arms=[([(23, 34), (19, 38), (20, 32)], 5, '1'), ([(41, 34), (45, 39), (42, 42)], 5, '1')],
           late=lambda f, DK: (batf(f), hand(f, 17, 29, 'flat', 'a', 'A'), hand(f, 39, 40, 'grip', 'a', 'A', True)),
           mouth='smirk', brows='angry', brow='H', hr=('side', 'h', 'H'),
           dk={'w': 'W', 'm': 'h'})
    return c.rows(), pal


PORTRAIT = ('thieves.extortionist', extortionist)
