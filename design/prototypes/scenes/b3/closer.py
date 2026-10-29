import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base(s='#2f3a5c', S='#283252', y='#f3dc8a', g='#5f9a52', G='#558c49', o='#b98a5c', O='#9c7148',
               a=DEEP[0], A=DEEP[1], L='#8c5a3a', h='#2b201c', n='#e8e2d6', N='#c4bdb0', z='#4a3a34',
               t='#c48a4a', T='#8f5e2e', b='#f4ede1',
               **{'1': PURPLE[0], '2': PURPLE[1]})
    DK = {'1': '2', '2': '2', 'a': 'A', 'n': 'N', 'N': 'N', 't': 'T', 'b': 'N'}
    c.rect(0, 0, 63, 63, 's'); c.rect(0, 22, 63, 34, 'S')
    for lx in (6, 50):                       # two small stadium lights
        c.rect(lx, 5, lx + 7, 8, 'y'); c.rect(lx + 3, 9, lx + 4, 21, 'S')
    c.rect(0, 35, 63, 63, 'g')
    c.rect(0, 35, 63, 37, 'G')
    c.ell(6, 50, 58, 70, 'o'); c.ell(10, 52, 54, 66, 'O', only='o')
    c.rect(24, 57, 40, 58, 'b')            # the rubber

    def top(f):
        cap(f, 25, 12, 14, '1', '2', brim='L')
        f.pts('w', [(31, 10), (32, 10)])
        f.ell(7, 28, 16, 37, 't'); f.rect(7, 34, 10, 37, 'T'); f.pts('T', [(15, 31), (15, 32), (14, 35)])   # glove on the hand

    lg = layer()                            # stride: front knee bent, back leg straight
    thick(lg, [(29, 42), (24, 47), (23, 54)], 5, 'n'); lg.rect(18, 55, 25, 56, 'z')
    thick(lg, [(36, 42), (45, 53)], 5, 'N'); lg.rect(44, 54, 50, 55, 'z')
    lg.rect(26, 40, 38, 43, 'n')

    def front(f):
        f.vl(32, 28, 39, '2'); f.pts('w', [(29, 31), (30, 31)])   # placket and a small number dash
        f.rect(25, 40, 39, 41, '2')                                # belt
    person(c, DK, hx=25, hy=12, skin='a', shade='A', mouth='flat', brows='stern', brow='h', glint='w',
           hs='crop', hk='h', hd='h', cx=32, sw=8, ww=7, th=14, cloth='1',
           back=lambda f: f.paste(lg), front=front, top=top,
           face=lambda h: None,
           arms=[([(24, 31), (17, 36), (13, 33)], 4, '1'), ([(40, 30), (46, 29), (50, 21)], 4, '1')],
           hands=[(48, 17, 'fist', False)])
    ball = layer(); ball.ell(48, 13, 52, 17, 'b'); ball.pts('N', [(49, 14), (51, 16)])
    outline_once(ball); c.paste(ball)
    return c.rows(), pal


PORTRAIT = ('purple.closer', draw)
