import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base(p='#cdbfb2', P='#bfb1a3', f='#9e8a78', F='#8c7866', y='#e0b648', Y='#b08a2c',
               s='#9fc7d9', g='#6f9a5a', G='#4f7a42', j='#9a2f4a', J='#6e1f34', e='#e8eef0', E='#c4ccd0',
               a=DEEP[0], A=DEEP[1], L='#8e5c3c', h='#1f1612', H='#4a3a34', n='#2f3448', N='#252a3a', z='#2f2422',
               **{'1': BLUE[0], '2': BLUE[1]})
    DK = {'1': '2', '2': '2', 'a': 'A', 'n': 'N', 'y': 'Y'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'f'); c.hl(0, 63, 52, 'F')

    def painting(l):                        # a landscape in a gold frame
        l.rect(2, 6, 25, 30, 'y'); l.rect(4, 8, 23, 28, 's')
        l.ell(4, 18, 18, 34, 'g', only='s'); l.ell(12, 20, 30, 36, 'G', only='s')
        l.ell(17, 10, 20, 13, 'e', only='s')
        l.rect(2, 6, 25, 6, 'Y'); l.vl(25, 6, 30, 'Y')
    bg(c, painting, 'Y')
    c.rect(4, 34, 22, 35, 'P'); c.rect(46, 8, 61, 22, 'Y'); c.rect(48, 10, 59, 20, 'J')   # a second, smaller frame
    c.ell(51, 12, 56, 18, 'j')

    def front(f):                           # ascot and lapels
        f.poly([(31.5, 29), (38.5, 29), (35, 33)], 'e'); f.rect(34, 30, 35, 33, 'j')
        f.pts('2', [(31, 30), (32, 32), (32, 33), (38, 30), (37, 32), (37, 33)])
    person(c, DK, hx=28, hy=12, size=16, skin='a', shade='A', mouth='smile', brows='soft', brow='h', glint=None,
           hs='crop', hk='h', hd='H', cx=36, sw=8, ww=7, th=14, cloth='1', front=front,
           lg=dict(gap=2, lw=4, lh=8, pants='n', pdark='N', shoe='z'),
           face=lambda h: (h.rect(32, 20, 33, 21, 'a'), h.rect(38, 20, 39, 21, 'a'),
                           h.hl(32, 33, 21, 'k'), h.hl(38, 39, 21, 'k'),
                           None,
                           h.pts('H', [(43, 13), (44, 14), (42, 12)])),
           arms=[([(28, 33), (24, 38), (27, 40)], 4, '1'), ([(44, 33), (46, 39), (45, 45)], 4, '1')],
           hands=[(25, 38, 'grip', False), (44, 44, 'fist', True)],
           props=lambda p: pole(p, 26, 34, 37, 'e', 'E'))
    gl = layer()                            # the wine glass, raised a little
    gl.poly([(22, 26), (31, 26), (30, 31), (26, 34), (23, 31)], 'e')
    gl.poly([(23, 29), (30, 29), (29, 31), (26, 33), (24, 31)], 'j')
    gl.vl(30, 27, 30, 'E')
    outline_once(gl); c.paste(gl)
    return c.rows(), pal


PORTRAIT = ('market.connoisseur', draw)
