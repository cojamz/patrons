import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base(p='#3a3552', P='#332f49', q='#1f2440', y='#f3dc8a', Y='#d9b65a', o='#7a5034', O='#5e3c26', d='#8f6040',
               g='#4f7a5a', G='#3a5c44', m='#a8acb4', M='#6f747b', e='#f2e8d2', x='#8a7a68',
               a=DEEP[0], A=DEEP[1], L='#8e5c3c', h='#1f1612', H='#3a2a24', j='#c0b7a6',
               **{'1': PURPLE[0], '2': PURPLE[1]})
    DK = {'1': '2', '2': '2', 'a': 'A', 'm': 'M'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 0, 63, 3, 'P')

    def window(l):                          # moon and an owl on the sill
        l.rect(42, 4, 60, 26, 'P'); l.rect(44, 6, 58, 24, 'q')
        l.ell(52, 8, 56, 12, 'y'); l.ell(53, 7, 57, 11, 'q', only='y')
        l.ell(45, 15, 51, 24, 'x'); l.rect(46, 17, 47, 18, 'y'); l.rect(49, 17, 50, 18, 'y'); l.pts('h', [(47, 18), (49, 18)])
        l.pts('O', [(45, 14), (46, 15), (51, 14), (50, 15)])
        l.px(47, 20, 'Y')
        l.rect(42, 24, 60, 26, 'P')
    bg(c, window, None)

    def lamp(l):
        l.rect(4, 40, 13, 42, 'O'); l.rect(8, 30, 9, 39, 'O')
        l.poly([(3, 30), (6, 23), (12, 23), (15, 30)], 'g'); l.hl(4, 14, 30, 'y')
    bg(c, lamp, None)
    c.poly([(10, 23), (12, 23), (15, 30), (12, 30)], 'G', only='g')

    def front(f):                           # hoodie strings and pocket
        f.pts('j', [(30, 30), (30, 31), (30, 32), (34, 30), (34, 31), (34, 32)])

    def top(f):                             # hood behind the head
        pass
    person(c, DK, hx=24, hy=11, size=16, skin='a', shade='A', mouth='smile', brows='soft', brow='h',
           hs='crop', hk='h', hd='H', cx=32, sw=11, ww=11, th=17, cloth='1', front=front,
           back=lambda f: (f.ell(20, 23, 44, 34, '2')),
           face=lambda h: (glasses(h, 24, 11, 'm', None, 16),
                           None),
           arms=[([(22, 31), (19, 37), (21, 42)], 4, '1'), ([(42, 31), (45, 37), (43, 42)], 4, '1')])

    def desk(l):
        l.rect(0, 43, 63, 46, 'd'); l.rect(0, 47, 63, 63, 'o'); l.hl(0, 63, 47, 'O')
        l.rect(8, 51, 26, 59, 'O'); l.rect(38, 51, 56, 59, 'O')
    bg(c, desk)
    lap = layer()                           # laptop, screen glow toward the face
    lap.poly([(22, 34), (40, 34), (42, 45), (20, 45)], 'm'); lap.rect(19, 44, 43, 46, 'M')
    lap.rect(23, 36, 39, 43, 'e'); lap.hl(23, 39, 43, 'j')
    outline_once(lap); c.paste(lap)
    hl = layer(); hand(hl, 16, 41, 'flat', 'a', 'A'); hand(hl, 44, 41, 'flat', 'a', 'A', flip=True); outline_once(hl); c.paste(hl)
    mg = layer(); mg.rect(50, 36, 55, 43, 'y'); mg.rect(54, 36, 55, 43, 'Y'); mg.rect(56, 38, 57, 41, 'Y')
    outline_once(mg); c.paste(mg)
    c.pts('j', [(52, 33), (53, 32), (52, 31)])
    return c.rows(), pal


PORTRAIT = ('purple.nightowl', draw)
