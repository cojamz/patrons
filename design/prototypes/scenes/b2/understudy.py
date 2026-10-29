import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def understudy():
    c = C(N)
    pal = {'k': INK, 'w': WHITE, 'W': '#d6cdbd', 'b': '#3e3446', 'B': '#4a3f52', 'c': '#9a3446', 'C': '#7a2838',
           'y': '#f2d27a', 'Y': '#c9a24a', 'l': '#6a5e70',
           '1': GREEN[0], '2': GREEN[1], 'a': LIGHT[0], 'A': LIGHT[1],
           'h': '#6a4530', 'H': '#4e3122', 'x': '#3a4a3c', 'z': '#3a2a22', 'f': '#5a4a50', 'o': '#8a6a4a'}
    c.rect(0, 0, 63, 63, 'b'); c.rect(0, 52, 63, 63, 'f')
    c.poly([(42, 0), (63, 0), (63, 52), (34, 52)], 'B')       # stage light spilling from the right

    def curtain(l):
        l.poly([(46, 0), (63, 0), (63, 52), (52, 52), (50, 30)], 'c')
        for x0 in (51, 57):
            l.poly([(x0, 0), (x0 + 2, 0), (x0 + 3, 52), (x0 + 1, 52)], 'C')
    bg(c, curtain, 'C')

    def ropes(l):
        l.vl(8, 0, 22, 'l'); l.vl(13, 0, 30, 'l')
        l.rect(6, 23, 10, 29, 'o'); l.hl(6, 10, 23, 'l')
    bg(c, ropes)

    def script(f, DK):
        f.rect(20, 35, 33, 43, 'w'); f.vl(26, 35, 43, 'W'); f.vl(27, 35, 43, 'W')
        for y in (37, 39, 41):
            f.hl(21, 24, y, 'W'); f.hl(29, 32, y, 'W')

    def crown(f):
        f.rect(21, 7, 32, 10, 'y'); f.pts('y', [(21, 5), (21, 6), (26, 4), (27, 4), (26, 5), (27, 5), (26, 6), (27, 6), (32, 5), (32, 6)])
        f.hl(21, 32, 10, 'Y'); f.pts('c', [(26, 8), (27, 8)])
    def stride(f):
        thick(f, [(25, 44), (22, 50)], 4, 'x'); thick(f, [(30, 44), (33, 50)], 4, 'x')
        f.rect(18, 51, 23, 52, 'z'); f.rect(32, 51, 37, 52, 'z')
    person(c, 20, 12, 14, 'a', 'A', '1', '2', th=16, sw=8, ww=7,
           back=stride,
           arms=[([(20, 31), (18, 36), (20, 41)], 3, '1'), ([(34, 31), (36, 36), (34, 41)], 3, '1')],
           late=lambda f, DK: (script(f, DK), hand(f, 18, 40, 'grip', 'a', 'A'), hand(f, 32, 40, 'grip', 'a', 'A', True)),
           mouth='flat', brows='soft', brow='H', hr=('side', 'h', 'H'), hat=crown,
           dk={'w': 'W', 'y': 'Y'})
    return c.rows(), pal


PORTRAIT = ('echo.understudy', understudy)
