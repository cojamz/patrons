import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def art():
    c = C(N)
    pal = base_pal(**{
        'p': '#3c3a5e', 'P': '#34325a',          # night party room
        'y': '#f2d27a', 'Y': '#c9a24a',
        'e': '#e46a8a', 'g': '#6cc3a0', 'u': '#7fb0e8',   # confetti / hats
        'E': '#b44d6a', 'G': '#4a9a7a', 'U': '#5a8cc0',
        'c': '#f6e9b8',                          # bubbly
        '1': SILVER[0], '2': SILVER[1], '3': '#e9ecef',
        'x': '#2f2a3a',
        'h': '#2b1d18', 'H': '#4a332a', 'j': '#b0522c',
        'a': MED[0], 'A': MED[1], 's': PALE[0], 'S': PALE[1], 'l': LIGHT[0], 'L': LIGHT[1], 'r': '#7a2a2a'})
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 50, 63, 63, 'P')
    # streamers and confetti, sparse
    for x, y, k in ((4, 5, 'e'), (14, 9, 'y'), (27, 4, 'g'), (39, 8, 'c'), (52, 4, 'e'), (59, 11, 'y'), (8, 14, 'c'), (47, 14, 'g')):
        c.pts(k, [(x, y), (x + 1, y)])
    for x0 in range(0, 64, 2):
        c.px(x0, 1 + (x0 // 2) % 3 // 2, 'Y')

    DK = {'1': '2', 'a': 'A', 's': 'S', 'l': 'L', 'h': 'H', '3': '2', 'c': 'Y', 'e': 'E', 'g': 'G', 'u': 'U', 'j': 'H'}

    def glass(f, x, y):
        f.poly([(x, y), (x + 4, y), (x + 3, y + 3), (x + 1, y + 3)], 'c')
        f.hl(x, x + 4, y, '3'); f.vl(x + 2, y + 4, y + 5, '3'); f.hl(x + 1, x + 3, y + 6, '3')

    def hat(f, x, y, k, kd):
        f.poly([(x, y + 7), (x + 3.5, y), (x + 7, y + 7)], k)
        f.poly([(x + 3.5, y), (x + 7, y + 7), (x + 4, y + 7)], kd, only=k)
        f.ell(x + 2, y - 2, x + 4, y, 'y')

    def sequins(cx):
        def fr(f):
            for dx, dy in ((-3, 4), (2, 7), (-1, 10), (3, 2)):
                f.px(cx + dx, 28 + dy, '3')
        return fr

    # left: med, cheering with a glass up
    person(c, DK, hx=2, hy=20, skin='a', shade='A', mouth='smile', brows='soft', brow='h',
           hs='long', hk='h', hd='H', cloth='1', cdark='2', cx=9, sw=6, ww=6, th=13,
           lg=dict(pants='x', pdark='x', shoe='H', lh=7),
           arms=[([(14, 38), (18, 33), (17, 26)], 3)], hands=[(16, 23, 'grip', False)],
           top=lambda f: (hat(f, 5, 12, 'e', 'E'), glass(f, 15, 17)), front=sequins(9))

    # middle: pale, laughing (the one open mouth), both arms up
    person(c, DK, hx=24, hy=15, skin='s', shade='S', mouth='open', brows='soft', brow='H',
           hs='side', hk='Y', hd='H', cloth='1', cdark='2', cx=31, sw=7, ww=6, th=13,
           lg=dict(pants='x', pdark='x', shoe='H', lh=10, stance=1),
           arms=[([(25, 34), (19, 34), (20, 26)], 3), ([(37, 34), (43, 34), (42, 26)], 3)],
           hands=[(18, 23, 'fist', False), (40, 23, 'fist', False)],
           top=lambda f: hat(f, 27, 6, 'g', 'G'), front=sequins(31))

    # right: light, clinking a glass toward the middle
    def happy(h):
        happy_eyes(h, 46, 21, 14, 'l')
    person(c, DK, hx=46, hy=21, skin='l', shade='L', mouth='grin', brows='none',
           hs='bun', hk='h', hd='H', side='R', cloth='1', cdark='2', cx=53, sw=6, ww=6, th=13,
           lg=dict(pants='x', pdark='x', shoe='H', lh=6),
           arms=[([(48, 39), (45, 36), (44, 29)], 3)], hands=[(42, 25, 'grip', False)],
           face=happy, front=lambda f: (sequins(53)(f), glass(f, 41, 20)))
    return c.rows(), pal


PORTRAIT = ('silver.revelers', art)
