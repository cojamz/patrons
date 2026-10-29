import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(p='#bfc4c9', P='#adb2b8', o='#c9a066', O='#9e7840', x='#33343c', X='#55565f',
                   u='#6b8fbf', U='#55779f', m='#e9e4d8', y='#f3d27a',
                   z='#231c1c', H='#2f2420', h='#5e463c', q='#3a4a55', i='#cfe0e6')
    pal['1'], pal['2'] = GREEN
    pal['a'], pal['A'] = VDEEP
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'P')

    def crash(l):                         # crash mat and boxes for the fall
        l.rect(2, 30, 13, 43, 'o'); l.rect(10, 34, 20, 43, 'o')
        l.hl(2, 13, 36, 'O'); l.vl(16, 34, 43, 'O')
    bg(c, crash, 'O')
    bg(c, lambda l: (l.rect(0, 44, 22, 55, 'u'), l.hl(1, 21, 50, 'U')), 'U')

    def camera(l):                        # film camera on a tripod
        l.rect(51, 24, 63, 32, 'x'); l.ell(50, 16, 56, 23, 'x'); l.ell(57, 16, 63, 23, 'x')
        l.rect(47, 26, 50, 30, 'X')
        l.line(57, 33, 51, 52, 'X'); l.line(57, 33, 63, 52, 'X'); l.vl(57, 33, 52, 'X')
    bg(c, camera)
    c.ell(52, 18, 54, 20, 'X'); c.ell(59, 18, 61, 20, 'X'); c.px(48, 28, 'i')

    def slate(l):                         # clapperboard leaning on the boxes
        l.rect(4, 22, 13, 29, 'x'); l.poly([(4, 21), (13, 18), (13, 20), (4, 22)], 'm')
        l.hl(6, 11, 25, 'm'); l.hl(6, 9, 27, 'm')
    bg(c, slate)

    def front(f):
        f.vl(32, 30, 40, '2'); f.rect(25, 41, 38, 42, 'x'); f.rect(31, 41, 33, 42, 'y')
        f.pts('m', [(27, 33), (28, 33)])

    def top(f):
        hr = layer()                      # warm dark high-top: a clear flat-topped shape at 32px
        hr.rect(26, 7, 37, 13, 'H'); hr.hl(27, 36, 6, 'H'); hr.pts('h', [(28, 7), (29, 7), (30, 7), (28, 8), (29, 8), (28, 9)])
        f.paste(hr)
        hm = layer()                      # helmet carried at the hip, a hand resting on it
        hm.ell(38, 35, 50, 47, 'm'); hm.poly([(38, 41), (50, 41), (50, 43), (38, 43)], '1', only='m')
        hm.ell(43, 36, 49, 41, 'q'); hm.pts('i', [(46, 37), (47, 37)])
        over(f, hm, {'1': '2', 'a': 'A'})
        hl = layer(); hand(hl, 41, 34, 'flat', 'a', 'A', flip=True); over(f, hl, {'m': 'X', '1': '2', 'q': 'q'})

    person(c, hx=25, hy=13, size=14, skin='a', shade='A', hs='crop', hk='H', hd='h', mouth='grin', brows='soft',
           shirt='1', sdark='2', cx=32, sw=7, ww=6, th=13,
           arms=[([(27, 31), (25, 37), (25, 41)], 4), ([(37, 31), (41, 32), (43, 34)], 4)],
           hands=[(23, 42, 'fist', False)],
           lg=dict(pants='1', pdark='2', shoe='z', lh=9, stance=1), front=front, top=top)
    return c.rows(), pal


PORTRAIT = ('echo.hourglass', draw)
