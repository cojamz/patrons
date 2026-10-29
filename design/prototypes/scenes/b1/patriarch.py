import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(p='#6b5a4c', P='#5e4e42', s='#8d8478', S='#77706a', y='#f6d77e', e='#ef8a3a',
                   g='#4f7a5a', G='#3d6147', o='#8a6142', O='#6d4a31', t='#a8703f', T='#6e4528',
                   m='#d8d6d0', M='#aeaba4', n='#3a3644', N='#4b4656', z='#2a2220', j='#f3ead2')
    pal['1'], pal['2'] = RED
    pal['a'], pal['A'] = MED
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'P')

    def fireplace(l):
        l.rect(0, 22, 13, 52, 's'); l.rect(0, 20, 15, 22, 'S')
        l.rect(0, 34, 9, 52, 'z')
    bg(c, fireplace, 'S')
    c.ell(1, 41, 8, 52, 'e'); c.ell(3, 45, 7, 52, 'y')
    c.rect(1, 50, 9, 51, 'O')

    def frame(l):                         # landscape painting over the chair
        l.rect(44, 6, 61, 18, 'o'); l.rect(46, 8, 59, 16, 'M')
        l.poly([(46, 16), (51, 11), (55, 14), (59, 10), (59, 16)], 'g')
    bg(c, frame, 'O')

    def chair(l):                         # green wingback armchair
        l.rect(15, 18, 49, 52, 'g'); l.ell(15, 12, 49, 26, 'g')
        l.rect(12, 32, 19, 52, 'g'); l.rect(45, 32, 52, 52, 'g')
        l.ell(12, 29, 19, 35, 'g'); l.ell(45, 29, 52, 35, 'g')
        l.rect(16, 52, 18, 55, 'T'); l.rect(46, 52, 48, 55, 'T')
    bg(c, chair, 'G')
    c.rect(19, 33, 20, 51, 'G'); c.rect(44, 33, 45, 51, 'G')

    def front(f):
        f.poly([(29, 32), (35, 32), (32, 38)], 'j')
        f.rect(26, 43, 38, 46, 'n'); f.rect(36, 43, 38, 46, 'N')     # lap
        f.rect(26, 47, 30, 52, 'n'); f.rect(34, 47, 38, 52, 'N')     # shins
        f.rect(25, 53, 30, 54, 'z'); f.rect(34, 53, 39, 54, 'z')

    def beard(f):
        b = [(25, 25), (26, 25), (26, 26), (27, 26), (27, 27), (28, 27), (29, 28), (30, 28), (31, 28), (32, 28),
             (33, 28), (34, 28), (35, 27), (36, 27), (36, 26), (37, 26), (37, 25), (38, 25)]
        f.rect(27, 27, 37, 29, 'm'); f.rect(29, 30, 35, 30, 'm'); f.hl(30, 34, 31, 'M')
        f.pts('m', [(24, 22), (24, 23), (25, 24), (39, 22), (39, 23), (38, 24)])
        f.pts('m', b)
        f.pts('M', [(36, 28), (37, 27), (35, 29), (34, 30)])
        f.hl(27, 37, 26, 'm')                          # beard fills round the mouth
        f.rect(29, 24, 35, 25, 'm'); f.pts('M', [(29, 25), (35, 25), (32, 25)])   # one moustache mass under the nose
        f.hl(31, 33, 27, 'O')                          # mouth, a short warm row inside the beard
        f.px(32, 23, 'A')

    def cane(p):
        pole(p, 43, 30, 54, 't', 'T')
        p.pts('t', [(43, 29), (42, 28), (41, 28), (40, 29)]); p.pts('T', [(44, 29), (44, 28)])

    person(c, hx=24, hy=13, size=16, skin='a', shade='A', hs='crop', hk='m', hd='M', mouth=None, brows='stern',
           brow='M', shirt='1', sdark='2', cx=32, ty=30, sw=8, ww=7, th=13,
           arms=[([(25, 33), (23, 39), (27, 42)], 4), ([(39, 33), (41, 38), (42, 40)], 4)],
           hands=[(26, 41, 'flat', False), (41, 37, 'grip', False)],
           front=front, top=beard, props=cane, DK={'n': 'N', 'N': 'N', 'm': 'M'})
    return c.rows(), pal


PORTRAIT = ('red.patriarch', draw)
