import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base(s='#bcd6e4', S='#adc9d8', g='#c46a4a', G='#b45d3e', e='#f4ede1', E='#d9cfc0', q='#8a9aa8', Q='#768694',
               m='#a8acb4', M='#6f747b', y='#f0c548', o='#c9a066', O='#9e7840',
               a=DEEP[0], A=DEEP[1], L='#8e5c3c', h='#1f1612', H='#3a2a24', n='#3e3a4a', N='#2e2b38', z='#2f2422',
               **{'1': PURPLE[0], '2': PURPLE[1]})
    DK = {'1': '2', '2': '2', 'a': 'A', 'n': 'N', 'o': 'O'}
    c.rect(0, 0, 63, 63, 's')

    def stands(l):                          # grandstand behind the track
        l.rect(0, 14, 63, 30, 'q')
        for y in (18, 22, 26):
            l.hl(0, 63, y, 'Q')
    bg(c, stands, None)

    def board(l):                           # a big lap clock on a post
        l.rect(4, 2, 19, 15, 'M'); l.ell(6, 3, 17, 14, 'e'); l.vl(11, 5, 8, 'k'); l.hl(11, 14, 8, 'k')
        l.rect(11, 16, 12, 30, 'M')
    pass
    c.rect(0, 31, 63, 63, 'g'); c.hl(0, 63, 31, 'e'); c.hl(0, 63, 42, 'e'); c.hl(0, 63, 54, 'e')
    c.rect(58, 31, 61, 63, 'e')            # the finish line

    def top(f):                             # visor
        f.hl(28, 41, 13, '1'); f.hl(28, 41, 14, '1'); f.hl(38, 44, 15, '2'); f.hl(39, 44, 16, '2')
        f.rect(28, 13, 29, 15, '2')

    def front(f):                           # polo collar
        f.poly([(31.5, 29), (38.5, 29), (35, 32)], 'e'); f.pts('E', [(35, 31), (35, 32)])
    person(c, DK, hx=28, hy=14, skin='a', shade='A', mouth='flat', brows='stern', brow='h',
           hs='crop', hk='h', hd='H', cx=35, sw=8, ww=7, th=13, cloth='1', top=top, front=front,
           lg=dict(gap=3, lw=4, lh=9, pants='n', pdark='N', shoe='z', stance=1),
           face=lambda h: None,
           arms=[([(28, 32), (23, 38), (24, 35)], 4, '1'), ([(42, 32), (45, 37), (43, 43)], 4, '1')])
    sw = layer()                            # stopwatch at the chest, thumb on the button
    sw.ell(26, 31, 34, 39, 'm'); sw.ell(27, 32, 33, 38, 'e'); sw.vl(30, 33, 35, 'k'); sw.px(31, 35, 'k')
    sw.rect(29, 29, 31, 30, 'M')
    sw.stamp(23, 29, ['.....sS', '....sS.', '.sssS..', 'sssss..', 'sSsS...'], {'s': 'a', 'S': 'A'})
    outline_once(sw); c.paste(sw)
    cb = layer()                            # clipboard tucked under the near arm
    cb.rect(41, 36, 50, 48, 'o'); cb.rect(42, 38, 49, 47, 'e'); cb.rect(44, 35, 47, 37, 'M')
    cb.pts('q', [(43, 40), (44, 40), (45, 40), (43, 42), (44, 42), (46, 42), (43, 44), (45, 44)])
    outline_once(cb); c.paste(cb)
    hl = layer(); hand(hl, 40, 42, 'flat', 'a', 'A'); outline_once(hl); c.paste(hl)
    return c.rows(), pal


PORTRAIT = ('purple.timekeepers', draw)
