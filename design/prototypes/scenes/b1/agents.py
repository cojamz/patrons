import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(p='#b4bfc2', P='#a3afb3', o='#7d8a8f', O='#68757a', i='#d8e4e8', q='#3e4a52', Q='#56656e',
                   x='#33404a', X='#4a5a66', n='#2c3a33', z='#231c1c', H='#1f1717', h='#3b2a22',
                   e='#6a4a32', E='#4f3624', y='#f3e3a0')
    pal['1'], pal['2'] = GREEN
    pal['a'], pal['A'] = DEEP
    pal['b'], pal['B'] = PALE
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'P')

    def doors(l):                         # hallway: two shut office doors
        l.rect(-2, 8, 8, 52, 'o'); l.rect(0, 12, 5, 24, 'i')
        l.rect(55, 8, 66, 52, 'o'); l.rect(58, 12, 63, 24, 'i')
        l.hl(26, 37, 3, 'i')
    bg(c, doors, 'O')
    c.px(57, 32, 'y'); c.px(6, 32, 'y')

    def suit_front(cx):
        def f(fl):
            fl.poly([(cx - 3.5, 29 + (0 if cx < 32 else -1)), (cx + 3.5, 29 + (0 if cx < 32 else -1)), (cx, 35)], 'w')
            fl.rect(cx - 1, 30 + (0 if cx < 32 else -1), cx, 37, 'x')
        return f

    def shades(hx, hy):
        def t(f):
            for ex in (hx + 3, hx + 9):
                f.rect(ex - 1, hy + 7, ex + 2, hy + 9, 'q'); f.px(ex, hy + 7, 'i')
            f.hl(hx + 5, hx + 8, hy + 7, 'q')
        return t

    # A: deep, left, a finger to the earpiece
    def tA(f):
        shades(13, 14)(f)
        f.pts('Q', [(11, 21), (11, 22)])
    person(c, hx=13, hy=14, size=14, skin='a', shade='A', hs='crop', hk='H', hd='z', mouth='flat', brows='stern',
           brow='H', glint=None, shirt='1', sdark='2', cx=20, sw=7, ww=6, th=12,
           arms=[([(14, 32), (9, 35), (9, 27)], 4), ([(26, 32), (28, 38), (27, 43)], 4)],
           hands=[(8, 22, 'fist', False), (26, 43, 'fist', False)],
           lg=dict(pants='n', pdark='n', shoe='z', lh=8), front=suit_front(20), top=tA, DK={'n': 'n', 'x': 'x', 'q': 'q'})

    # B: pale, right, briefcase at the side
    def bc(f):
        shades(37, 13)(f)
        b = layer(); b.rect(47, 45, 58, 53, 'e'); b.hl(47, 58, 45, 'E'); b.rect(50, 43, 55, 44, 'E'); b.rect(52, 47, 53, 48, 'y')
        over(f, b, {'1': '2', 'n': 'n'})
        hl = layer(); hand(hl, 51, 41, 'grip', 'b', 'B'); over(f, hl, {'e': 'E', 'E': 'E'})
    person(c, hx=37, hy=13, size=14, skin='b', shade='B', hs='side', hk='h', hd='H', mouth='smirk', brows='stern',
           glint=None, shirt='1', sdark='2', cx=44, ty=28, sw=8, ww=7, th=13,
           arms=[([(37, 31), (35, 37), (36, 43)], 4), ([(51, 31), (53, 36), (52, 41)], 4)],
           hands=[(35, 43, 'fist', False)],
           lg=dict(pants='n', pdark='n', shoe='z', lh=8), front=suit_front(44), top=bc, DK={'n': 'n', 'x': 'x', 'q': 'q'})
    return c.rows(), pal


PORTRAIT = ('echo.agents', draw)
