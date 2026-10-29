import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(p='#e3d6bd', P='#d3c5aa', o='#d9b27a', O='#a8804a', b='#e6c08a', B='#b98a58', u='#7fa6c9', U='#5c84a8',
                   g='#78b05a', G='#55893f', y='#f0c548', e='#e88a3a', m='#c8ccd0', M='#9aa0a6',
                   n='#3a4458', N='#4d5873', z='#2a2220', H='#3b2a22', h='#2a1d18', j='#f3ead2')
    pal['1'], pal['2'] = RED
    pal['a'], pal['A'] = DEEP
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'P')

    def shelves(l):                       # pantry shelves, a few cans and jars
        for y in (17, 33):
            l.rect(0, y, 63, y + 1, 'O')
        for (x, y, k) in ((2, 11, 'u'), (6, 12, 'e'), (48, 11, 'g'), (52, 11, 'u'), (57, 12, 'y'),
                          (3, 27, 'y'), (8, 28, 'g'), (50, 27, 'e'), (55, 27, 'u'), (59, 28, 'j')):
            l.rect(x, y, x + 3, 16 if y < 17 else 32, k)
        l.rect(0, 0, 1, 52, 'O'); l.rect(62, 0, 63, 52, 'O')
    bg(c, shelves)
    c.rect(2, 44, 14, 52, 'o'); c.hl(2, 14, 44, 'O'); c.rect(50, 42, 62, 52, 'o'); c.hl(50, 62, 42, 'O')

    def front(f):
        f.rect(26, 31, 37, 33, 'j')          # shirt showing at the vest's neck
        f.rect(36, 35, 38, 36, 'y')

    def top(f):
        bx = layer()
        bx.ell(21, 30, 28, 38, 'g'); bx.pts('G', [(23, 33), (25, 32), (26, 35)])   # leafy greens
        bx.ell(33, 28, 39, 38, 'b'); bx.pts('B', [(35, 31), (36, 33), (37, 35), (38, 33), (38, 34)])   # loaf
        bx.rect(29, 32, 32, 37, 'u'); bx.hl(29, 32, 34, 'U')          # a can
        bx.rect(20, 37, 43, 45, 'o'); bx.hl(20, 43, 37, 'O'); bx.hl(21, 42, 40, 'O')
        over(f, bx, {'1': '2', 'a': 'A', 'j': 'j'})
        hl = layer(); hand(hl, 18, 40, 'flat', 'a', 'A'); over(f, hl, {'o': 'O'})
        hl = layer(); hand(hl, 41, 40, 'flat', 'a', 'A', flip=True); over(f, hl, {'o': 'O'})

    person(c, hx=25, hy=14, size=14, skin='a', shade='A', hs='afro', hk='H', hd='h', mouth='smile', brows='soft',
           shirt='1', sdark='2', cx=32, sw=7, ww=6, th=12,
           arms=[([(26, 32), (21, 36), (20, 41)], 4), ([(38, 32), (43, 36), (43, 41)], 4)],
           lg=dict(pants='n', pdark='N', shoe='z', lh=9), front=front, top=top, DK={'n': 'N'})
    return c.rows(), pal


PORTRAIT = ('red.volunteer', draw)
