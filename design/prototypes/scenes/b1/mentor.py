import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(p='#d9cdb4', P='#c9bca2', q='#3f5a4c', Q='#344c40', o='#8a6142', O='#6d4a31',
                   t='#b07a4a', T='#7a5130', m='#e8eee6', g='#9aa1a6', n='#3d3a45', N='#504c5a', z='#2f2723',
                   H='#3a2620', h='#55392c', y='#e2b85a', Y='#b08a3a', j='#f0e6c8', J='#cfc2a0', v='#5a7fb0', V='#46679a')
    pal['1'], pal['2'] = RED
    pal['a'], pal['A'] = MED
    pal['b'], pal['B'] = LIGHT
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 53, 63, 63, 'P')

    def board(l):                         # chalkboard with a lesson on it
        l.rect(1, 5, 31, 30, 'o'); l.rect(3, 7, 29, 28, 'q')
        l.hl(1, 31, 31, 'O'); l.rect(5, 31, 9, 31, 'm')
    bg(c, board, 'O')
    # chalk: a star with an arrow to a circle
    c.hl(6, 10, 10, 'm'); c.hl(6, 10, 14, 'm'); c.vl(6, 10, 14, 'm'); c.vl(10, 10, 14, 'm')
    c.line(12, 13, 19, 13, 'm'); c.pts('m', [(17, 11), (18, 12), (18, 14), (17, 15)])
    c.ring(21, 10, 26, 16, 'm')
    c.hl(6, 15, 21, 'm'); c.hl(6, 12, 24, 'm'); c.hl(18, 25, 22, 'm')
    c.rect(4, 26, 28, 28, 'O')

    def shelf(l):
        l.rect(48, 8, 63, 9, 'O')
        l.rect(49, 1, 51, 7, '2'); l.rect(52, 2, 54, 7, 'q'); l.rect(55, 3, 57, 7, 'y'); l.rect(59, 1, 61, 7, 'o')
    bg(c, shelf)

    # mentor: right, pointing at the board
    def glasses(f):
        f.ring(38, 17, 42, 21, 'g'); f.ring(44, 17, 48, 21, 'g'); f.px(43, 19, 'g')

    def front(f):
        f.poly([(41, 27), (47, 27), (44, 32)], 'j')
        f.rect(37, 31, 38, 45, '2'); f.rect(50, 31, 51, 45, '2')

    def pointer(p):
        p.line(30, 25, 20, 13, 'o'); p.line(31, 25, 21, 13, 'O')

    person(c, hx=36, hy=10, size=16, skin='a', shade='A', hs='bun', hk='H', hd='z', side='R', mouth='smile',
           brows='soft', shirt='1', sdark='2', cx=44, ty=27, sw=8, ww=7, th=14,
           arms=[([(38, 30), (34, 34), (31, 27)], 4), ([(50, 30), (52, 36), (51, 41)], 4)],
           hands=[(29, 24, 'grip', False), (50, 41, 'fist', False)],
           lg=dict(pants='n', pdark='n', shoe='z', lh=9),
           front=front, top=None, props=pointer, after=None, DK={'n': 'n'})
    for ex in (40, 46):
        c.hl(ex - 1, ex + 2, 17, 'g'); c.hl(ex - 1, ex + 2, 20, 'g'); c.vl(ex - 1, 17, 20, 'g'); c.vl(ex + 2, 17, 20, 'g')
    c.px(43, 18, 'g')
    for (x, y) in ((40, 20), (46, 20)):
        pass

    # protege: left, smaller, notebook held to the chest
    def nb(f):
        b = layer(); b.rect(13, 41, 22, 49, 'v'); b.vl(13, 41, 49, 'V'); b.vl(14, 41, 49, 'V')
        over(f, b, {'1': '2'})
        for hx_ in (11, 21):
            hl = layer(); hl.rect(hx_, 44, hx_ + 2, 46, 'b'); hl.pts('B', [(hx_ + 1, 46), (hx_ + 2, 46), (hx_ + 2, 45)])
            over(f, hl, {'v': 'V', '1': '2'})

    person(c, hx=11, hy=26, size=14, skin='b', shade='B', hs='side', hk='y', hd='Y', mouth='o', brows='soft',
           brow='Y', shirt='1', sdark='2', cx=18, sw=6, ww=6, th=10,
           arms=[([(13, 43), (12, 47)], 3), ([(23, 43), (23, 47)], 3)],
           lg=dict(pants='n', pdark='n', shoe='z', lh=6),
           top=nb, DK={'n': 'n'})
    return c.rows(), pal


PORTRAIT = ('red.mentor', draw)
