import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def art():
    c = C(N)
    pal = base_pal(**{
        'b': '#c4dbe0', 'B': '#b3ced4',          # sky
        'q': '#d8c3a0', 'Q': '#c4ae8a',          # town wall behind
        'o': '#9a7350', 'O': '#76553a',          # cart wood, wheel
        'd': '#b49a78', 'D': '#a0866a',          # cobbled road (flat)
        'e': '#d0524a', 'u': '#4f86c6', 'g': '#5fae6a', 'm': '#b0509a', 'y': '#f2d27a',   # wares
        '1': YELLOW[0], '2': YELLOW[1],
        'x': '#55506a', 'X': '#46425a', 'z': '#2b211d',
        'h': '#6a4428', 'H': '#4f311c',
        's': LIGHT[0], 'S': LIGHT[1]})
    c.rect(0, 0, 63, 63, 'b'); c.rect(0, 0, 63, 6, 'B')

    def town(l):
        l.rect(0, 18, 63, 44, 'q')
        l.poly([(0, 18), (8, 10), (16, 18)], 'q'); l.poly([(40, 18), (50, 8), (60, 18)], 'q')
        l.rect(5, 24, 9, 30, 'Q'); l.rect(46, 22, 50, 28, 'Q'); l.rect(24, 28, 30, 44, 'Q')
    bg(c, town, 'Q')
    c.rect(0, 44, 63, 63, 'd'); c.hl(0, 63, 44, 'D')
    for x, y in ((6, 50), (20, 56), (44, 52), (56, 58), (30, 61)):
        c.hl(x, x + 3, y, 'D')

    def cart(l):
        l.rect(30, 35, 62, 46, 'o'); l.hl(30, 62, 35, 'O'); l.rect(30, 44, 62, 46, 'O')
        # wares: a jar of each colour and a bolt of cloth
        for i, k in enumerate('eugmy'):
            x = 32 + i * 6
            l.rect(x, 28, x + 4, 34, k); l.rect(x + 1, 26, x + 3, 27, k)
        l.ell(41, 47, 51, 57, 'O'); l.ell(43, 49, 49, 55, 'o'); l.ell(45, 51, 47, 53, 'O')
    bg(c, cart, 'O')
    c.pts('w', [(33, 29), (39, 29), (45, 29), (51, 29), (57, 29)])

    DK = {'1': '2', 's': 'S', 'x': 'X', 'h': 'H', 'o': 'O'}
    cx = 18

    def vest(f):
        f.poly([(cx - 4, 28), (cx + 4, 28), (cx, 33)], 'e'); f.pts('e', [(cx + 3, 33), (cx + 4, 34)])
        f.vl(cx, 32, 41, '2'); f.px(cx - 2, 35, 'O'); f.px(cx - 2, 38, 'O')

    def cap(f):
        f.ell(9, 9, 26, 16, 'o'); f.ell(10, 9, 24, 14, 'O', only='') ; f.hl(9, 27, 16, 'O'); f.hl(22, 28, 17, 'O')
        f.pts('O', [(22, 10), (23, 11), (24, 12)])

    def handle(p):
        p.hl(24, 31, 37, 'o'); p.hl(24, 31, 38, 'O')

    person(c, DK, hx=11, hy=13, skin='s', shade='S', mouth='grin', brows='soft', brow='H',
           hs='short', hk='h', hd='H', cloth='1', cdark='2', cx=cx, sw=7, ww=6, th=14,
           lg=dict(pants='x', pdark='X', shoe='z', lh=8, stance=1),
           arms=[([(12, 31), (10, 37), (12, 41)], 3), ([(24, 31), (24, 35), (25, 37)], 3)],
           hands=[(10, 41, 'fist', False), (24, 36, 'grip', False)],
           front=vest, top=cap, props=handle)
    return c.rows(), pal


PORTRAIT = ('yellow.peddler', art)
