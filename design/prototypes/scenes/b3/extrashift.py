import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base(p='#c8cfc6', P='#b9c1b8', q='#2c3450', y='#f3dc8a', e='#f2e8d2', E='#cfc6b0',
               m='#a8acb4', M='#7c8088', x='#4a4650', X='#35323a', o='#e07a32', j='#c8423a', J='#9a2f2a',
               a=PALE[0], A=PALE[1], h='#7a4a2c', H='#5a341e', u='#f4ede1', U='#cfc8bc', t='#8a5a36',
               **{'1': PURPLE[0], '2': PURPLE[1]})
    DK = {'1': '2', '2': '2', 'a': 'A', 'u': 'U', 'U': 'U', 'm': 'M'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 0, 63, 2, 'P')

    def window(l):                          # night outside
        l.rect(44, 5, 61, 22, 'P'); l.rect(46, 7, 59, 20, 'q')
        l.ell(52, 9, 56, 13, 'y'); l.ell(53, 8, 57, 12, 'q', only='y')
        l.pts('y', [(48, 16), (57, 17)])
    bg(c, window, None)

    def clock(l):                           # wall clock near midnight
        l.ell(1, 2, 10, 11, 'x'); l.ell(2, 3, 9, 10, 'e')
        l.vl(6, 4, 7, 'x'); l.pts('x', [(5, 5), (5, 6)])
    bg(c, clock, 'X')

    def top(f):                             # paper cook's cap
        f.rect(24, 4, 39, 11, 'u'); f.rect(25, 3, 38, 3, 'u'); f.rect(36, 4, 39, 11, 'U')
        f.hl(24, 39, 11, 'U')

    def front(f):                           # apron
        f.poly([(27, 33), (37, 33), (38, 45), (26, 45)], 'u')
        f.poly([(35, 33), (37, 33), (38, 45), (36, 45)], 'U', only='u')
    person(c, DK, hx=24, hy=10, size=16, skin='a', shade='A', mouth='flat', brows='soft', brow='H',
           hs='crop', hk='h', hd='H', cx=32, sw=10, ww=10, th=17, cloth='1', top=top, front=front,
           
           arms=[([(23, 30), (19, 36), (16, 33)], 4, '1'), ([(41, 30), (45, 36), (44, 41)], 4, '1')],
           hands=[(14, 29, 'grip', False), (42, 40, 'grip', True)],
           props=lambda p: (pole(p, 15, 22, 34, 't', 'h'), p.rect(10, 14, 21, 21, 'm'), p.hl(10, 21, 21, 'M'), p.hl(12, 19, 17, 'M')))
    mug = layer()
    mug.rect(43, 36, 49, 44, 'j'); mug.rect(48, 36, 49, 44, 'J')
    mug.pts('J', [(50, 38), (51, 38), (52, 38), (52, 39), (52, 40), (52, 41), (51, 42), (50, 42)])
    mug.hl(44, 47, 36, 'x')
    hand(mug, 41, 39, 'flat', 'a', 'A')
    outline_once(mug); c.paste(mug)
    c.pts('e', [(45, 33), (46, 32), (46, 31), (47, 30)])

    def grill(l):
        l.rect(0, 46, 63, 63, 'x'); l.rect(0, 46, 63, 48, 'm'); l.hl(0, 63, 48, 'M')
        l.rect(6, 52, 26, 60, 'X'); l.rect(38, 52, 58, 60, 'X')
        l.pts('o', [(10, 56), (16, 56), (22, 56), (42, 56), (48, 56), (54, 56)])
    bg(c, grill)
    return c.rows(), pal


PORTRAIT = ('purple.extrashift', draw)
