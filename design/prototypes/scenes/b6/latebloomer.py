import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def art():
    c = C(N)
    pal = base_pal(**{
        'b': '#cfe2d6', 'B': '#c0d6c8',          # morning sky
        'g': '#86b064', 'G': '#76a056',          # garden, hedge
        'o': '#8e6a48', 'O': '#6f5034',          # soil, fence
        'e': '#e46a8a', 'm': '#b45cc0', 'f': '#f39a3a',   # blooms
        'v': '#5e9a4c',
        'n': '#7e8c96', 'N': '#5f6c76',          # watering can
        't': '#c56a3e', 'T': '#9a4e2c',          # clay pot
        '1': YELLOW[0], '2': YELLOW[1],
        'x': '#5a5a6a', 'z': '#3a2c24',
        'h': '#e2e0dc', 'H': '#b9b5ae',          # grey-white hair
        'a': DEEP[0], 'A': DEEP[1], 's': LIGHT[0], 'S': LIGHT[1]})
    c.rect(0, 0, 63, 63, 'b'); 

    def fence(l):
        for x in range(2, 64, 8):
            l.rect(x, 22, x + 3, 40, 'o'); l.px(x, 22, '.'); l.px(x + 3, 22, '.')
        l.hl(0, 63, 27, 'o'); l.hl(0, 63, 34, 'o')
    bg(c, fence, 'O')
    c.rect(0, 40, 63, 63, 'g'); 

    def bed(l):
        l.ell(-4, 49, 68, 62, 'o')
        for x, k in ((3, 'e'), (12, 'm'), (50, 'm'), (58, 'e')):
            l.vl(x + 1, 47, 51, 'v'); l.ell(x, 44, x + 3, 47, k)
    bg(c, bed, 'O')

    DK = {'1': '2', 'a': 'A', 's': 'S', 'h': 'H', 'x': 'x', 'n': 'N', 't': 'T'}

    def cardigan(cx, ty):
        def fr(f):
            f.poly([(cx - 3, ty), (cx + 3, ty), (cx, ty + 4)], 'w')
            f.vl(cx, ty + 4, ty + 12, '2')
            for y in (ty + 6, ty + 9):
                f.px(cx - 2, y, 'w')
        return fr

    # left: deep skin, holding up a pot with a fresh bloom, glasses
    def potflower(f):
        p = layer()
        p.rect(11, 34, 21, 36, 'T'); p.poly([(12, 37), (21, 37), (20, 43), (13, 43)], 't')
        p.poly([(18, 37), (21, 37), (20, 43), (18, 43)], 'T', only='t')
        p.vl(16, 27, 33, 'v'); p.pts('v', [(14, 30), (15, 31), (18, 29), (17, 30)])
        p.ell(14, 22, 19, 27, 'e'); p.ell(16, 24, 17, 25, 'w')
        over(f, p, DK)
        hl = layer(); hand(hl, 19, 39, 'grip', 'a', 'A', True); over(f, hl, DK)

    def specs(h):
        glasses(h, 3, 17, 14, 'n')
    person(c, DK, hx=3, hy=17, skin='a', shade='A', mouth='smile', brows='soft', brow='H',
           hs='side', hk='h', hd='H', cloth='1', cdark='2', cx=10, sw=7, ww=6, th=13,
           lg=dict(pants='x', pdark='x', shoe='z', lh=6),
           arms=[([(15, 34), (19, 39), (21, 41)], 3), ([(5, 34), (3, 39), (4, 43)], 3)],
           hands=[(2, 43, 'fist', False)],
           face=specs, front=cardigan(10, 32), top=potflower)

    # right: light skin, white bun, tipping a watering can
    def can(f):
        f.rect(46, 34, 56, 43, 'n'); f.rect(53, 35, 56, 43, 'N')
        f.line(45, 36, 38, 30, 'n'); f.line(45, 37, 39, 31, 'N'); f.rect(36, 28, 38, 30, 'N')
        f.ring(48, 30, 55, 37, 'N')

    def drops(l):
        l.pts('u' if False else 'n', [(35, 33), (36, 36), (34, 38), (37, 40)])
    person(c, DK, hx=44, hy=14, skin='s', shade='S', mouth='smile', brows='soft', brow='H',
           hs='bun', hk='h', hd='H', side='R', cloth='1', cdark='2', cx=51, sw=7, ww=6, th=14,
           lg=dict(pants='x', pdark='x', shoe='z', lh=8),
           arms=[([(46, 33), (44, 38), (47, 40)], 3), ([(57, 33), (59, 38), (56, 41)], 3)],
           hands=[(46, 38, 'grip', False), (54, 40, 'grip', True)],
           top=can, after=drops)
    return c.rows(), pal


PORTRAIT = ('yellow.latebloomer', art)
