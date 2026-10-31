import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def art():
    c = C(N)
    pal = base_pal(**{
        'p': '#8a6d8c', 'P': '#7c617e',          # palace wall, columns
        'f': '#a4515a', 'F': '#8e444c',          # red carpet
        'y': '#f2d27a', 'Y': '#c9a24a',          # gold trim, crown
        'e': '#5b7fb5', 'E': '#476a9b',          # parasol
        'o': '#9a6a42', 'O': '#734c2c',          # trunk
        'c': '#b33a4a',                          # cushion
        '1': SILVER[0], '2': SILVER[1], '3': '#e3e6e9',
        'x': '#3a3540', 'z': '#2b211d',
        'h': '#2b1d18', 'H': '#4a332a', 'j': '#d9b46a', 'J': '#b08a44',
        'a': DEEP[0], 'A': DEEP[1], 'm': MED[0], 'M': MED[1], 's': PALE[0], 'S': PALE[1]})
    c.rect(0, 0, 63, 63, 'p')
    for x in (0, 21, 42):
        c.rect(x + 8, 0, x + 12, 46, 'P')
    c.rect(0, 47, 63, 63, 'F'); c.poly([(18, 47), (46, 47), (58, 63), (6, 63)], 'f')

    DK = {'1': '2', 'a': 'A', 'm': 'M', 's': 'S', 'x': 'x', 'h': 'H', 'j': 'J', '3': '2', 'o': 'O', 'c': 'c', 'y': 'Y'}

    def livery(cx):
        def fr(f):
            f.vl(cx, 0 + 0, 0, '2')
        return fr

    # left: parasol bearer (deep), pole held high
    def parasol(p):
        pole(p, 11, 6, 40, 'Y', 'O')

    def canopy(f):
        f.poly([(0, 11), (5, 4), (11, 1), (17, 4), (23, 11)], 'e')
        f.poly([(12, 1), (17, 4), (23, 11), (13, 11)], 'E', only='e')
        f.hl(0, 23, 11, 'E')
    person(c, DK, hx=3, hy=18, skin='a', shade='A', mouth='smile', brows='soft', brow='h',
           hs='crop', hk='h', hd='H', cloth='1', cdark='2', cx=10, sw=6, ww=5, th=11,
           lg=dict(pants='x', pdark='x', shoe='H', lh=8),
           arms=[([(15, 36), (17, 33), (13, 31)], 3)],
           hands=[(10, 30, 'grip', False)], back=canopy, props=parasol,
           front=lambda f: f.pts('y', [(10, 36), (10, 39)]))

    # middle: cushion with a crown (med), arms forward
    def cushion(f):
        f.ell(22, 37, 41, 44, 'f'); f.hl(24, 39, 43, 'F'); f.pts('y', [(22, 40), (41, 40)])
        f.stamp(27, 33, ['y..yy..y', 'yy.yy.yy', 'yyyyyyyy', 'yeyyyyey', 'YYYYYYYY'])   # crown seated on the cushion
    person(c, DK, hx=25, hy=15, skin='m', shade='M', mouth='smile', brows='soft', brow='h',
           hs='bun', hk='h', hd='H', side='R', cloth='1', cdark='2', cx=32, sw=7, ww=6, th=12,
           lg=dict(pants='x', pdark='x', shoe='H', lh=9, stance=1),
           arms=[([(26, 34), (24, 41)], 3), ([(38, 34), (40, 41)], 3)],
           hands=[(21, 42, 'flat', False), (38, 42, 'flat', True)], top=cushion,
           front=lambda f: f.pts('y', [(32, 34), (32, 37)]))

    # right: trunk carrier (pale), trunk on the shoulder
    def trunk(f):
        f.rect(46, 34, 60, 43, 'o'); f.rect(46, 34, 60, 35, 'O'); f.vl(50, 36, 43, 'O'); f.vl(56, 36, 43, 'O')
        f.rect(52, 38, 53, 40, 'y')
        f.pts('y', [(53, 37)])
    person(c, DK, hx=46, hy=19, skin='s', shade='S', mouth='smile', brows='soft', brow='Y',
           hs='short', hk='y', hd='Y', cloth='1', cdark='2', cx=53, sw=6, ww=5, th=11,
           lg=dict(pants='x', pdark='x', shoe='H', lh=8),
           arms=[([(48, 33), (45, 37), (46, 39)], 3), ([(58, 33), (61, 37), (60, 39)], 3)],
           hands=[(43, 37, 'grip', False), (59, 37, 'grip', True)], front=trunk)
    return c.rows(), pal


PORTRAIT = ('silver.retinue', art)
