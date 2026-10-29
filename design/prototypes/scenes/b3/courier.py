import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base(p='#c9a98c', P='#bb9a7d', d='#5b6f8a', D='#475a73', y='#f2d27a', g='#6f9a5a', G='#557a45',
               f='#9a948c', F='#857f77', m='#a8acb4', M='#6f747b',
               a=MED[0], A=MED[1], h='#2a1e1a', H='#4a3328', n='#3d4152', N='#30333f', z='#5a463c',
               o='#c9a066', O='#9e7840', t='#5a463c', T='#3e2f28',
               **{'1': PURPLE[0], '2': PURPLE[1]})
    DK = {'1': '2', '2': '2', 'a': 'A', 'n': 'N', 'o': 'O', 't': 'T', 'h': 'H'}
    c.rect(0, 0, 63, 63, 'p')
    c.rect(0, 52, 63, 63, 'f'); c.hl(0, 63, 52, 'F')

    def door(l):
        l.rect(3, 6, 20, 51, 'd'); l.rect(5, 9, 18, 27, 'D'); l.rect(5, 31, 18, 49, 'D')
        l.rect(6, 10, 17, 26, 'd'); l.rect(6, 32, 17, 48, 'd')
        l.rect(16, 29, 17, 30, 'y')
        l.rect(1, 50, 22, 53, 'f')
    bg(c, door, 'D')

    def bike(l):                            # bike leaning on the wall, right
        l.ring(43, 36, 56, 49, 'M'); l.ring(53, 36, 66, 49, 'M')
        l.line(49, 42, 55, 34, 'M'); l.line(55, 34, 60, 42, 'M'); l.line(49, 42, 56, 42, 'M')
        l.hl(53, 57, 33, 'n')
    bg(c, bike)
    c.rect(51, 8, 59, 17, 'P'); c.rect(52, 9, 58, 16, 'd'); c.vl(55, 9, 16, 'P')   # a small window

    def front(f):                           # bag strap across the chest
        for i in range(12):
            f.px(26 + i, 28 + i, 't'); f.px(27 + i, 28 + i, 't')
    def back(f):                            # messenger bag on the far hip
        f.rect(38, 38, 46, 46, 't'); f.rect(38, 38, 46, 40, 'T')

    def top(f):
        cap(f, 25, 12, 14, '1', '2', brim='R')
    person(c, DK, hx=25, hy=12, skin='a', shade='A', mouth='grin', brows='soft', brow='h',
           hs='crop', hk='h', hd='H', cx=32, sw=7, ww=6, th=13, cloth='1', back=back, front=front, top=top,
           lg=dict(gap=2, lw=4, lh=10, pants='n', pdark='N', shoe='z', stance=1),
           arms=[([(25, 30), (22, 36), (24, 38)], 3, '1'), ([(39, 30), (42, 35), (40, 38)], 3, '1')],
           hands=[(21, 37, 'grip', False), (38, 37, 'grip', True)])
    bx = layer()                            # the parcel, held out in both hands
    bx.rect(22, 33, 40, 44, 'o'); bx.rect(22, 33, 40, 34, 'O'); bx.rect(37, 35, 40, 44, 'O')
    bx.vl(31, 33, 44, 'w'); bx.vl(32, 35, 44, 'O')
    outline_once(bx); c.paste(bx)
    hl = layer()
    hand(hl, 19, 39, 'flat', 'a', 'A'); hand(hl, 39, 39, 'flat', 'a', 'A', flip=True)
    outline_once(hl); c.paste(hl)
    return c.rows(), pal


PORTRAIT = ('purple.courier', draw)
