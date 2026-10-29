import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(s='#cfe3ea', S='#bcd8e2', q='#6fa3bf', Q='#5b8fac', t='#7f9e6a', o='#b98a58', O='#8a6238',
                   m='#d6d2c8', M='#a8a49a', x='#3a3a40', n='#4a4636', z='#2a2220', H='#7a4a2a', h='#5a361f',
                   v='#e98a9a', f='#e6a33e', F='#b87a26', y='#f3e3a0')
    pal['1'], pal['2'] = GREEN
    pal['a'], pal['A'] = LIGHT
    c.rect(0, 0, 63, 63, 's'); c.rect(0, 30, 63, 63, 'q')
    c.poly([(-1, 30), (10, 22), (22, 27), (34, 21), (50, 28), (64, 24), (64, 30)], 't')
    for (x, y) in ((36, 40), (50, 46), (42, 54), (56, 36)):
        c.hl(x, x + 4, y, 'Q')

    def dock(l):
        l.rect(0, 48, 34, 53, 'o'); l.rect(0, 54, 34, 55, 'O')
        l.rect(4, 56, 6, 63, 'O'); l.rect(26, 56, 28, 63, 'O')
        for x in (8, 17, 26):
            l.vl(x, 48, 53, 'O')
    bg(c, dock, 'O')

    def bucket(l):
        l.poly([(3, 40), (12, 40), (11, 48), (4, 48)], 'm'); l.hl(3, 12, 40, 'M')
    bg(c, bucket, 'M')

    def fish(l):                          # a fish leaping for the worm
        l.ell(46, 32, 55, 37, 'f'); l.poly([(48, 34.5), (43, 31), (43, 38)], 'f')
        l.px(52, 33, 'x'); l.hl(47, 54, 37, 'F')
    bg(c, fish, 'F')
    c.hl(44, 54, 39, 'w'); c.pts('w', [(43, 40), (55, 40)])

    def hat(f):
        f.rect(16, 12, 28, 15, '1'); f.hl(17, 27, 11, '1'); f.hl(14, 30, 16, '2'); f.hl(13, 31, 17, '2')

    def front(f):
        f.rect(18, 37, 19, 47, '2'); f.rect(26, 37, 27, 47, '2')       # wader straps / bib edge
        f.rect(18, 36, 27, 37, '2')

    def rod(p):
        p.line(26, 37, 58, 8, 'O'); p.line(27, 37, 59, 8, 'x')

    person(c, hx=15, hy=15, size=14, skin='a', shade='A', hs='crop', hk='H', hd='h', mouth='grin', brows='soft',
           shirt='1', sdark='2', cx=22, sw=7, ww=6, th=12,
           arms=[([(17, 33), (17, 39), (24, 39)], 4), ([(28, 33), (31, 36), (31, 31)], 4)],
           hands=[(23, 37, 'grip', False), (30, 29, 'grip', False)],
           lg=dict(pants='1', pdark='2', shoe='z', lh=7), front=front, top=hat, props=rod)
    c.vl(59, 9, 29, 'M')
    c.pts('v', [(58, 30), (59, 31), (59, 32), (58, 33)])
    return c.rows(), pal


PORTRAIT = ('echo.bait', draw)
