import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def art():
    c = C(N)
    pal = base_pal(**{
        'b': '#f0d9b0', 'B': '#e6cb9e',          # dawn sky
        'q': '#b7a3a8', 'Q': '#a39096',          # distant hills
        'm': '#e9e2d6', 'M': '#c8bfb1',          # far shrine tower
        'g': '#a9b878', 'G': '#97a768',          # meadow
        'o': '#c9a77a', 'O': '#b0905f',          # road
        't': '#8a5a34', 'T': '#6a4226',          # staff, sandals, bundle strap
        'n': '#8c8a7a',                          # bundle
        '1': YELLOW[0], '2': YELLOW[1],
        'h': '#3a2a22', 'H': '#58402f',
        's': LIGHT[0], 'S': LIGHT[1]})
    c.rect(0, 0, 63, 63, 'b'); c.rect(0, 0, 63, 8, 'B')

    def hills(l):
        l.ell(-12, 22, 30, 50, 'q'); l.ell(20, 26, 76, 54, 'q')
    bg(c, hills, 'Q')

    def shrine(l):
        l.rect(49, 12, 54, 28, 'm'); l.poly([(48, 13), (51.5, 7), (55, 13)], 'm'); l.rect(51, 16, 52, 19, 'M')
    bg(c, shrine, 'M')
    c.rect(0, 36, 63, 63, 'g'); c.rect(0, 52, 63, 63, 'G')
    c.poly([(36, 36), (42, 36), (60, 63), (16, 63)], 'o'); c.poly([(39, 36), (42, 36), (60, 63), (44, 63)], 'O')

    DK = {'1': '2', 's': 'S', 'h': 'H', 't': 'T', 'n': 'n'}
    cx = 26

    def hood(f):
        # rounded hood, never peaked, falling onto the shoulders
        f.ell(16, 7, 37, 30, '1')
        f.poly([(30, 9), (35, 14), (37, 22), (36, 29), (32, 30)], '2', only='1')

    def robe(f):
        sk = layer(); skirt(sk, cx, 38, 54, 8, 10, '1', '2'); over(f, sk, DK)
        f.rect(cx - 8, 37, cx + 9, 38, 'T')                          # rope belt
        for lx in (cx - 4, cx + 2):
            f.rect(lx, 55, lx + 3, 56, 'T')

    def bundle(f):
        f.ell(10, 24, 19, 33, 'n'); f.line(12, 26, 19, 32, 'T')

    def staff(p):
        pole(p, 41, 10, 56, 't', 'T')

    person(c, DK, hx=19, hy=13, skin='s', shade='S', mouth='smile', brows='soft', brow='h',
           hs='short', hk='h', hd='H', cloth='1', cdark='2', cx=cx, sw=8, ww=8, th=10,
           arms=[([(33, 31), (37, 34), (40, 31)], 3), ([(19, 31), (16, 35), (17, 39)], 3)],
           hands=[(40, 28, 'grip', False), (15, 38, 'fist', False)],
           back=hood, front=robe, props=staff)
    return c.rows(), pal


PORTRAIT = ('yellow.pilgrim', art)
