import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def art():
    c = C(N)
    pal = base_pal(**{
        'b': '#9bb7c9', 'B': '#8cabbf',          # dusk sky
        'g': '#79a45c', 'G': '#6a9450',          # park grass, hedge
        'o': '#8a6a4c', 'O': '#6e5238',          # path
        'm': '#4f5a62', 'M': '#3e474e',          # lamp post
        'y': '#fbe7a0',
        'e': '#e05a78', 'E': '#a83c58',          # roses, heart
        'v': '#5e9a4c',                          # stems
        'p': '#c7dbe8',                          # paper wrap
        '1': YELLOW[0], '2': YELLOW[1],
        'x': '#3d4a6a', 'X': '#323d58', 'z': '#2b211d',
        'h': '#1f1714', 'H': '#3a2a22',
        's': DEEP[0], 'S': DEEP[1], 'l': '#8c5a3c'})
    c.rect(0, 0, 63, 63, 'b'); c.rect(0, 0, 63, 10, 'B')
    c.rect(0, 30, 63, 63, 'g')

    def hedge(l):
        l.rect(0, 26, 63, 38, 'G'); l.ell(-2, 21, 12, 32, 'G'); l.ell(22, 20, 38, 31, 'G'); l.ell(48, 22, 66, 32, 'G')
    bg(c, hedge, None)
    c.poly([(18, 63), (24, 50), (42, 50), (48, 63)], 'o')

    def lamp(l):
        l.rect(52, 10, 53, 52, 'm'); l.rect(50, 52, 55, 54, 'm')
        l.rect(49, 4, 56, 10, 'm'); l.rect(50, 5, 55, 9, 'y'); l.hl(48, 57, 4, 'M')
    bg(c, lamp, 'M')

    DK = {'1': '2', 's': 'S', 'x': 'X', 'h': 'H', 'e': 'E', 'p': 'B', 'v': 'G'}
    cx = 26

    def front(f):
        f.pts('2', [(cx - 1, 29), (cx, 30), (cx + 1, 29)])
        f.vl(cx, 31, 40, '2')
        f.pts('2', [(cx - 2, 33), (cx - 2, 37)])

    def bouquet(f):
        # paper cone pointing down into the hands, roses on top
        f.poly([(33, 30), (44, 26), (41, 40)], 'p')
        f.poly([(38, 28), (44, 26), (41, 40)], 'B', only='p')
        for x, y in ((34, 22), (39, 20), (43, 23), (37, 25), (42, 28)):
            f.ell(x, y, x + 3, y + 3, 'e'); f.px(x + 2, y + 2, 'E')
        f.pts('v', [(36, 28), (40, 25), (44, 27)])

    def heart(l):
        l.stamp(40, 8, ['.ee.ee.', 'eeeeeee', 'eeeeeEe', '.eeeEe.', '..eEe..', '...e...'])

    person(c, DK, hx=19, hy=12, skin='s', shade='S', mouth='smile', brows='soft', brow='h', glint='w',
           hs='crop', hk='h', hd='H', cloth='1', cdark='2', cx=cx, sw=7, ww=6, th=14,
           lg=dict(pants='x', pdark='X', shoe='z', lh=10),
           arms=[([(20, 31), (18, 37), (19, 41)], 3), ([(32, 31), (35, 37), (37, 37)], 3)],
           hands=[(35, 34, 'grip', False), (17, 41, 'fist', False)],
           back=None, top=bouquet)
    h = layer(); heart(h); c.paste(h)
    return c.rows(), pal


PORTRAIT = ('yellow.admirer', art)
