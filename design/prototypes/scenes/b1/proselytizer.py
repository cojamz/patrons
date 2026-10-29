import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(s='#c4dbe3', S='#b3ccd6', g='#8fb877', G='#7aa565', t='#6d8f5a', T='#5a7a4a',
                   o='#b07a4a', O='#7a5130', m='#e6e3dc', M='#aeaba4', x='#4b4f5c', n='#353a4a', N='#474d61',
                   z='#2a2220', H='#1c1513', y='#f3d27a')
    pal['1'], pal['2'] = RED
    pal['a'], pal['A'] = DEEP
    c.rect(0, 0, 63, 63, 's'); c.rect(0, 40, 63, 63, 'g'); c.rect(0, 52, 63, 63, 'G')

    def trees(l):
        l.ell(-6, 10, 14, 34, 't'); l.ell(46, 6, 70, 32, 't'); l.ell(54, 18, 72, 40, 't')
        l.rect(3, 30, 5, 42, 'O'); l.rect(57, 30, 59, 42, 'O')
    bg(c, trees, 'T')
    c.ell(-1, 13, 6, 20, 'S'); c.ell(50, 9, 57, 16, 'S')

    def lamp(l):
        l.rect(47, 14, 48, 46, 'x'); l.rect(45, 11, 50, 13, 'x'); l.hl(46, 49, 14, 'y')
    bg(c, lamp)

    def crate(l):                         # the soapbox
        l.rect(14, 48, 40, 59, 'o'); l.rect(16, 50, 38, 57, 'O'); l.rect(17, 51, 37, 56, 'o')
        l.line(17, 56, 37, 51, 'O')
    bg(c, crate, 'O')

    def top(f):
        mg = layer()
        mg.poly([(27.5, 18), (40.5, 12), (40.5, 26), (27.5, 22)], 'm')
        mg.poly([(31, 21), (40.5, 22), (40.5, 26), (31, 22.5)], 'M', only='m')
        mg.rect(39, 12, 40, 25, 'M'); mg.rect(27, 19, 28, 21, 'M')
        mg.rect(33, 22, 34, 25, 'x')
        over(f, mg, {'a': 'A', '1': '2'})
        hl = layer(); hand(hl, 32, 25, 'grip', 'a', 'A'); over(f, hl, {'1': '2', 'm': 'M'})
        lf = layer(); lf.rect(6, 21, 12, 29, 'm'); lf.rect(6, 21, 12, 23, '1'); lf.hl(7, 11, 25, 'M'); lf.hl(7, 10, 27, 'M')
        over(f, lf, {'1': '2', 'm': 'M'})
        hl = layer(); hand(hl, 8, 29, 'grip', 'a', 'A'); over(f, hl, {'1': '2', 'm': 'M'})

    person(c, hx=17, hy=8, size=14, skin='a', shade='A', hs='short', hk='H', hd='n', mouth='flat', brows='stern',
           brow='H', shirt='1', sdark='2', cx=24, sw=7, ww=6, th=13,
           arms=[([(19, 26), (13, 32), (10, 31)], 4), ([(29, 26), (35, 31), (34, 27)], 4)],
           lg=dict(pants='n', pdark='N', shoe='z', lh=10, stance=1),
           top=top, DK={'n': 'N'})
    return c.rows(), pal


PORTRAIT = ('red.proselytizer', draw)
