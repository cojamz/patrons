import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(p='#c7b9a6', P='#b5a792', s='#9fb0b8', S='#8b9ca4', u='#7fa6c9', U='#5c84a8', i='#dbe9ef',
                   x='#3b3d45', X='#5a5c66', n='#2f3448', N='#43496a', z='#2a2220', y='#f0c548',
                   j='#f3ead2', J='#c9bc9c', H='#7a4a2a', h='#5a361f')
    pal['1'], pal['2'] = RED
    pal['a'], pal['A'] = LIGHT
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 44, 63, 51, 's'); c.rect(0, 52, 63, 63, 'S')

    def shop(l):                          # shopfront with a no-parking sign
        l.rect(2, 4, 26, 26, 'P'); l.rect(4, 6, 24, 24, 'i')
        l.rect(4, 15, 24, 16, 'P'); l.vl(14, 6, 24, 'P')
        l.rect(30, 0, 62, 3, 'P')
    bg(c, shop)
    c.rect(56, 8, 57, 43, 'X')
    c.ell(51, 6, 62, 17, '1'); c.ell(53, 8, 60, 15, 'n')
    c.line(53, 14, 59, 8, '1'); c.line(54, 14, 60, 8, '1')

    def car(l):
        l.poly([(36, 33), (40, 25), (54, 25), (58, 33), (63, 34), (63, 48), (34, 48), (34, 34)], 'u')
        l.poly([(40, 33), (42, 27), (47, 27), (47, 33)], 'i'); l.poly([(49, 33), (49, 27), (53, 27), (56, 33)], 'i')
        l.hl(34, 63, 41, 'U')
    bg(c, car, 'U')
    for wx in (40, 57):
        c.ell(wx - 4, 44, wx + 4, 52, 'x'); c.ell(wx - 2, 46, wx + 2, 50, 'X')
    c.rect(44, 34, 48, 36, 'y'); c.hl(45, 47, 35, 'J')

    def cap(f):
        f.rect(18, 9, 30, 14, 'n'); f.hl(19, 29, 8, 'n'); f.hl(21, 27, 7, 'n')
        f.rect(18, 13, 30, 14, '1'); f.hl(17, 31, 15, 'x')
        f.rect(23, 10, 25, 11, 'y')

    def front(f):
        f.hl(18, 31, 40, 'x'); f.rect(24, 40, 25, 40, 'y')
        f.pts('y', [(25, 33), (25, 36)])

    def top(f):
        pd = layer(); pd.rect(16, 34, 23, 42, 'j'); pd.hl(17, 22, 36, 'J'); pd.hl(17, 22, 38, 'J'); pd.hl(17, 20, 40, 'J')
        over(f, pd, {'1': '2', 'a': 'A'})
        hl = layer(); hand(hl, 13, 39, 'flat', 'a', 'A'); over(f, hl, {'j': 'J', '1': '2'})
        hl = layer(); hand(hl, 22, 36, 'fist', 'a', 'A'); over(f, hl, {'j': 'J', '1': '2'})

    def pen(p):
        p.pts('n', [(21, 35), (20, 34), (19, 33)])

    person(c, hx=17, hy=15, size=14, skin='a', shade='A', hs='crop', hk='H', hd='h', mouth='flat', brows='stern',
           brow='H', shirt='1', sdark='2', cx=24, sw=7, ww=6, th=12,
           arms=[([(18, 32), (15, 38), (16, 41)], 4), ([(30, 32), (30, 38), (24, 38)], 4)],
           lg=dict(pants='n', pdark='N', shoe='z', lh=8),
           front=front, top=lambda f: (cap(f), top(f)), props=pen, DK={'n': 'N', 'x': 'x'})
    return c.rows(), pal


PORTRAIT = ('red.movementpenalty', draw)
