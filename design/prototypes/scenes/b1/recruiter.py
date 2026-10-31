import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(s='#cfe3e8', S='#bcd6dc', g='#9ccb7a', G='#86b866', o='#b98a58', O='#8a6238',
                   m='#f2ecdc', M='#c9c0a8', x='#3a3644', n='#3a3644', z='#2a2220', H='#6a4630', h='#4a3022',
                   y='#f3cf5a', t='#6a8f9a')
    pal['1'], pal['2'] = RED
    pal['a'], pal['A'] = PALE
    c.rect(0, 0, 63, 63, 's'); c.rect(0, 40, 63, 63, 'g')

    def tents(l):                         # other fair stalls far off
        l.poly([(-2, 30), (6, 22), (14, 30)], 't'); l.rect(0, 30, 12, 40, 't')
        l.poly([(50, 30), (58, 22), (66, 30)], 't'); l.rect(52, 30, 63, 40, 't')
    bg(c, tents)
    c.rect(4, 33, 8, 40, 'S'); c.rect(55, 33, 59, 40, 'S')

    def booth(l):                         # stall posts and a scalloped awning
        l.rect(10, 4, 53, 11, 'm')
        for x in range(10, 54, 8):
            l.rect(x, 4, x + 3, 11, '1')
        for x in range(10, 54, 4):
            l.ell(x, 10, x + 3, 13, '1' if (x - 10) % 8 == 0 else 'm')
        l.rect(11, 12, 12, 40, 'O'); l.rect(51, 12, 52, 40, 'O')
    bg(c, booth)
    c.hl(10, 53, 4, '2')

    def table(l):
        l.rect(6, 43, 57, 58, '1'); l.hl(6, 57, 43, 'm'); l.hl(6, 57, 44, 'M')
        l.rect(6, 56, 57, 58, '2')
        l.rect(27, 48, 36, 54, 'm')
        l.stamp(29, 49, ['..y..', 'yyyyy', '.yyy.', '.y.y.'])
    bg(c, table)
    c.rect(44, 39, 52, 43, 'm'); c.rect(45, 38, 53, 42, 'M'); c.rect(46, 37, 54, 41, 'm')   # stack of flyers

    def top(f):
        cb = layer(); cb.rect(16, 26, 25, 38, 'O'); cb.rect(17, 28, 24, 37, 'm'); cb.rect(19, 25, 22, 27, 'x')
        cb.hl(18, 23, 30, 'M'); cb.hl(18, 23, 32, 'M'); cb.hl(18, 21, 34, 'M')
        over(f, cb, {'1': '2'})
        hl = layer(); hand(hl, 15, 33, 'flat', 'a', 'A'); over(f, hl, {'O': 'O', 'm': 'M'})
        hl = layer(); hand(hl, 41, 32, 'grip', 'a', 'A', flip=True); over(f, hl, {'1': '2'})

    def pen(p):
        p.pts('x', [(45, 29), (44, 30), (43, 31)]); p.pts('y', [(46, 28)])

    person(c, hx=25, hy=13, size=14, skin='a', shade='A', hs='side', hk='H', hd='h', mouth='grin', brows='soft',
           shirt='1', sdark='2', cx=32, sw=7, ww=6, th=15,
           arms=[([(26, 31), (20, 37), (17, 35)], 4), ([(38, 31), (41, 37), (43, 34)], 4)],
           front=lambda f: f.poly([(29.5, 28), (34.5, 28), (32, 32)], 'm'),
           top=top, props=pen)
    return c.rows(), pal


PORTRAIT = ('red.recruiter', draw)
