import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def art():
    c = C(N)
    pal = base_pal(**{
        'b': '#e8b98c', 'B': '#dba97a',          # sunset sky
        'q': '#8d7aa0', 'Q': '#7c6a90',          # skyline
        'y': '#f6dc8a',                          # lit windows
        'o': '#9a7f6c', 'O': '#836a58',          # rooftop
        'c': '#dfe3e7', 'C': '#a3aab1',          # silver coins
        '1': SILVER[0], '2': SILVER[1], '3': '#eef0f2',
        'x': '#3a3540', 'X': '#5e4a3a', 'z': '#8a6a4c',
        'h': '#d8a94e', 'H': '#a87d30',          # blond slick
        'n': '#c0466a',
        's': LIGHT[0], 'S': LIGHT[1]})
    c.rect(0, 0, 63, 63, 'b'); c.rect(0, 0, 63, 14, 'B')

    def skyline(l):
        for x0, x1, top in ((0, 9, 24), (10, 17, 16), (18, 27, 28), (40, 47, 20), (48, 55, 12), (56, 63, 26)):
            l.rect(x0, top, x1, 50, 'q')
        l.rect(13, 12, 14, 16, 'q')
    bg(c, skyline, 'Q')
    for x, y in ((3, 28), (12, 21), (15, 25), (51, 17), (52, 23), (43, 26), (59, 31), (21, 33)):
        c.pts('y', [(x, y), (x, y + 1)])
    c.rect(0, 50, 63, 63, 'o'); c.hl(0, 63, 50, 'O')

    def sack(l):
        # a fat sack of silver at his feet, coins spilling out
        l.ell(3, 40, 23, 59, 'z'); l.rect(10, 36, 16, 41, 'z'); l.ell(5, 31, 21, 38, 'z')
        l.ell(7, 30, 19, 35, 'c'); l.pts('C', [(9, 33), (12, 34), (15, 32), (17, 34)])
        l.ell(12, 41, 24, 60, 'X', only='z'); l.ell(8, 40, 20, 57, 'z', only='X')
        l.hl(10, 16, 39, 'X'); l.hl(10, 16, 40, 'X')
    bg(c, sack, 'x')
    for x, y in ((22, 56), (27, 58), (46, 57), (52, 55)):
        cn = layer(); cn.ell(x, y, x + 4, y + 2, 'c'); edged(cn, 'C'); c.paste(cn)

    DK = {'1': '2', 's': 'S', 'x': 'x', 'h': 'H', '3': '2', 'n': 'n'}
    cx = 32

    def front(f):
        f.poly([(cx - 3.5, 26), (cx + 3.5, 26), (cx, 33)], 'w')
        f.poly([(cx - 2, 27), (cx + 2, 27), (cx, 30)], 'n')          # bow tie, a bit loud
        for (x, y) in ((27, 26), (27, 27), (28, 28), (28, 29), (29, 30), (29, 31)):
            f.px(x, y, '2'); f.px(2 * cx - x - 1, y, '2')

    def spoon(f):
        # silver spoon raised high, bowl up, handle in the fist
        f.ell(43, 3, 50, 9, '3'); f.ell(44, 4, 49, 8, 'C'); f.ell(44, 4, 49, 7, '3'); f.px(45, 5, 'w')
        f.vl(46, 10, 19, '3'); f.vl(47, 10, 19, '2'); f.rect(46, 18, 47, 20, '2')

    person(c, DK, hx=25, hy=9, skin='s', shade='S', mouth='smirk', brows='angry', brow='H',
           hs='side', hk='h', hd='H', cloth='1', cdark='2', cx=cx, sw=7, ww=6, th=13,
           lg=dict(pants='1', pdark='2', shoe='x', lh=11, stance=2),
           arms=[([(26, 30), (23, 35), (27, 38)], 4), ([(38, 29), (44, 32), (46, 24)], 4)],
           hands=[(25, 36, 'fist', False), (44, 19, 'grip', False)],
           back=spoon, front=front)
    return c.rows(), pal


PORTRAIT = ('silver.spoon', art)
