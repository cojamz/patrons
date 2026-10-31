import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def art():
    c = C(N)
    pal = base_pal(**{
        'b': '#a9cfe0', 'B': '#97c1d4',          # sky
        'q': '#8ca2b5', 'Q': '#7a91a5',          # far mountains
        'n': '#eef3f6',                          # snow
        'g': '#8fb06a', 'G': '#7a9c58',          # foothills
        'o': '#a7865e', 'O': '#87683f',          # trail, pack
        'y': '#f8e3a0', 'r': '#c8463a',                          # sun
        't': '#8a5a34', 'T': '#6a4226',          # hat, boots
        'm': '#b9c0c4', 'M': '#7e878c',          # brass/steel scope
        '1': YELLOW[0], '2': YELLOW[1],
        'x': '#6b6a4e', 'X': '#585740',          # khaki trousers
        'h': '#1f1714', 'H': '#3a2a22',
        's': DEEP[0], 'S': DEEP[1]})
    c.rect(0, 0, 63, 63, 'b'); 
    c.ell(5, 5, 12, 12, 'y')

    def mountains(l):
        l.poly([(-2, 40), (14, 14), (28, 34), (40, 18), (66, 40)], 'q')
        l.poly([(10, 21), (14, 14), (18, 21), (15, 20), (13, 22)], 'n')
        l.poly([(36, 24), (40, 18), (44, 24), (41, 23), (39, 25)], 'n')
    bg(c, mountains, 'Q')
    c.rect(0, 40, 63, 63, 'g'); c.ell(-10, 36, 30, 48, 'g'); c.rect(0, 54, 63, 63, 'G')
    c.poly([(30, 63), (34, 48), (40, 48), (50, 63)], 'o')

    DK = {'1': '2', 's': 'S', 'x': 'X', 'h': 'H', 'o': 'O', 'm': 'M', 't': 'T'}
    cx = 31

    def pack(f):
        f.rect(19, 27, 43, 40, 'o'); f.rect(38, 28, 43, 40, 'O')
        f.ell(20, 23, 42, 31, 'o')

    def front(f):
        f.vl(cx, 29, 40, '2')
        f.pts('O', [(cx - 5, 28), (cx - 5, 29), (cx - 4, 30), (cx - 4, 31), (cx - 4, 32), (cx - 4, 33),
                    (cx + 4, 28), (cx + 4, 29), (cx + 3, 30), (cx + 3, 31), (cx + 3, 32), (cx + 3, 33)])
        f.rect(cx - 6, 35, cx - 3, 37, '2')                          # pocket flap

    def hat(f):
        # wide soft brim, low crown with a band, no helmet
        f.rect(26, 7, 38, 12, 't'); f.ell(26, 4, 38, 10, 't')
        f.hl(26, 38, 11, 'T'); f.hl(26, 38, 12, '2')
        f.hl(20, 44, 13, 't'); f.hl(21, 43, 14, 'T')
        f.rect(34, 6, 36, 10, 'T')

    def scope(f):
        # an open map held in both hands, a trail and a red goal dot
        f.poly([(19, 33), (31, 31), (43, 33), (43, 45), (31, 43), (19, 45)], 'n')
        f.poly([(31, 31), (43, 33), (43, 45), (31, 43)], 'm', only='n')
        f.vl(31, 31, 43, 'M')
        f.pts('O', [(22, 41), (24, 40), (26, 38), (28, 38), (30, 37), (33, 36), (35, 37), (37, 38)])
        f.rect(38, 36, 39, 37, 'r')
        f.pts('g', [(22, 35), (23, 35), (23, 36), (34, 41), (35, 41)])
        for hx_, fl in ((16, False), (43, True)):
            hl = layer(); hand(hl, hx_, 37, 'grip', 's', 'S', fl); over(f, hl, DK)

    person(c, DK, hx=24, hy=13, size=16, skin='s', shade='S', mouth='smile', brows='soft', brow='h',
           hs='crop', hk='h', hd='H', cloth='1', cdark='2', cx=cx, sw=8, ww=7, th=13,
           lg=dict(pants='x', pdark='x', shoe='T', lh=10, stance=1),
           arms=[([(24, 32), (19, 37), (19, 39)], 4), ([(38, 32), (43, 37), (44, 39)], 4)],
           hands=[],
           back=pack, front=front, top=lambda f: (hat(f), scope(f)))
    return c.rows(), pal


PORTRAIT = ('yellow.explorer', art)
