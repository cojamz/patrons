import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(p='#cdbfa8', P='#bcae96', q='#8fb3c9', Q='#7aa0b8', s='#6f9a62', S='#557e4c',
                   o='#a77b4f', O='#835c37', c='#d8b26a', C='#b48f48',
                   y='#f3d27a', g='#9aa1a6', G='#6d7479', b='#cfe6ee',
                   n='#3d3a45', z='#2f2723', H='#4a3328', t='#e9dcb6')
    pal['1'], pal['2'] = RED
    pal['a'], pal['A'] = OLIVE
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'P')

    def window(l):                       # office window, city outside
        l.rect(1, 4, 21, 36, 'P'); l.rect(3, 6, 19, 34, 'q')
        l.rect(4, 20, 8, 34, 'Q'); l.rect(10, 15, 14, 34, 'Q'); l.rect(15, 23, 19, 34, 'Q')
        l.pts('y', [(6, 23), (12, 18), (12, 24), (17, 27)])
        l.vl(11, 6, 34, 'P') if False else None
    bg(c, window)

    def board(l):                        # cork board of candidate cards
        l.rect(44, 8, 62, 30, 'c')
        for i, (x, y) in enumerate(((46, 10), (54, 11), (47, 19), (55, 20))):
            l.rect(x, y, x + 5, y + 6, 't')
            l.rect(x + 2, y + 2, x + 3, y + 3, 'a' if i % 2 else 'A')       # a tiny head
            l.hl(x + 1, x + 4, y + 5, 'G' if i % 2 else 'S'); l.hl(x + 2, x + 3, y + 4, 'G' if i % 2 else 'S')  # shoulders
            l.px(x + 2, y, '1')
    bg(c, board, 'C')

    def plant(l):
        l.rect(52, 44, 59, 53, 'O'); l.rect(53, 44, 58, 52, 'o')
    bg(c, plant, 'O')
    c.ell(49, 34, 62, 46, 's'); c.ell(52, 36, 56, 41, 'S'); c.ell(57, 33, 60, 38, 'S')

    def front(f):
        f.poly([(29, 29), (35, 29), (32, 35)], 'w')
        for (x, y) in ((28, 29), (28, 30), (29, 31), (29, 32), (30, 33), (30, 34)):
            f.px(x, y, '2'); f.px(64 - x, y, '2')

    def top(f):
        # folder held against the chest
        fo = layer(); fo.rect(18, 41, 30, 43, 'c'); fo.hl(19, 22, 40, 'c'); fo.hl(18, 30, 43, 'C')
        over(f, fo, {'1': '2', 'a': 'A'})
        hl = layer(); hand(hl, 26, 40, 'flat', 'a', 'A'); over(f, hl, {'c': 'C'})
        # magnifying glass up high
        mg = layer()
        mg.ell(42, 12, 52, 22, 'g'); mg.ell(44, 14, 50, 20, 'b'); mg.pts('w', [(45, 15), (46, 15), (45, 16)])
        mg.pts('G', [(51, 17), (51, 18), (50, 20), (49, 21), (48, 22)])
        mg.rect(44, 22, 45, 24, 'O')
        over(f, mg, {'1': '2'})
        hl = layer(); hand(hl, 43, 24, 'grip', 'a', 'A'); over(f, hl, {'O': 'O', '1': '2'})

    person(c, hx=25, hy=14, skin='a', shade='A', hs='long', hk='H', hd='z', mouth='smirk', brows='stern', brow='H',
           shirt='1', sdark='2', cx=32, sw=7, ww=6, th=12,
           arms=[([(26, 32), (23, 38), (26, 41)], 4), ([(38, 32), (43, 34), (44, 29)], 4)],
           hands=[],
           lg=dict(pants='n', pdark='n', shoe='z', lh=9),
           front=front, top=top, DK={'n': 'n'})
    return c.rows(), pal


PORTRAIT = ('red.headhunter', draw)
