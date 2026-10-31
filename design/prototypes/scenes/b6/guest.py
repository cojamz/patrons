import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def art():
    c = C(N)
    pal = base_pal(**{
        'p': '#a67a64', 'P': '#976c57',          # house wall, step
        'd': '#4b5d7a', 'D': '#3e4f69',          # front door
        'y': '#f2d27a', 'Y': '#c9a24a',          # lamp, knocker
        'e': '#c95d7a', 'E': '#9c4560',          # gift box
        'b': '#f0d36a',                          # bow
        '1': SILVER[0], '2': SILVER[1], '3': '#e3e6e9',
        'x': '#3a3540', 'X': '#4f4957', 'z': '#2f2420',
        'h': '#c66a36', 'H': '#9a4e26',          # ginger hair
        's': PALE[0], 'S': PALE[1], 'f': '#d39a7c', 'r': '#7a2a2a',
        'g': '#7a9a5a', 'G': '#617f46'})
    c.rect(0, 0, 63, 63, 'p')
    c.rect(0, 54, 63, 63, 'P')

    def door(l):
        l.rect(36, 4, 59, 53, 'Y'); l.rect(38, 6, 57, 53, 'd')
        l.rect(40, 9, 46, 26, 'D'); l.rect(49, 9, 55, 26, 'D')
        l.rect(40, 31, 46, 49, 'D'); l.rect(49, 31, 55, 49, 'D')
        l.ell(51, 27, 53, 29, 'y')
    bg(c, door, None)

    def lamp(l):
        l.rect(5, 18, 10, 25, 'Y'); l.rect(6, 19, 9, 24, 'y'); l.hl(4, 11, 17, 'Y'); l.vl(7, 26, 28, 'Y')
    bg(c, lamp, None)

    def bush(l):
        l.ell(0, 40, 14, 56, 'g'); l.ell(7, 44, 18, 56, 'g')
    bg(c, bush, 'G')

    DK = {'1': '2', 's': 'S', 'x': 'X', 'e': 'E', 'h': 'H', '3': '2'}
    cx = 24

    def front(f):
        f.vl(cx, 28, 41, '2')
        f.pts('3', [(cx - 2, 31), (cx - 2, 36)])
        for (x, y) in ((cx - 3, 26), (cx - 2, 27), (cx - 1, 28)):
            f.px(x, y, '3'); f.px(2 * cx - x, y, '3')

    def gift(f):
        f.rect(19, 35, 30, 45, 'e'); f.rect(27, 36, 30, 45, 'E')
        f.rect(18, 33, 31, 35, 'E'); f.hl(18, 31, 33, 'e')               # lid
        f.stamp(20, 31, ['bbb..bbb', 'bbbbbbbb', '.bbYYbb.'])            # flat bow sitting on the lid
        f.pts('Y', [(21, 32), (26, 32)])
        for hx_, fl in ((16, False), (30, True)):
            hl = layer(); hand(hl, hx_, 37, 'grip', 's', 'S', fl); over(f, hl, DK)

    def freckles(h):
        h.pts('f', [(19, 22), (29, 22)])

    person(c, DK, hx=17, hy=11, skin='s', shade='S', mouth='smile', brows='soft', brow='H',
           hs='side', hk='h', hd='H', cloth='1', cdark='2', cx=cx, sw=7, ww=6, th=14,
           lg=dict(pants='x', pdark='X', shoe='z', lh=10),
           arms=[([(18, 29), (15, 35), (17, 40)], 3), ([(30, 29), (33, 35), (31, 40)], 3)],
           hands=[],
           top=gift, face=freckles)
    return c.rows(), pal


PORTRAIT = ('silver.guest', art)
