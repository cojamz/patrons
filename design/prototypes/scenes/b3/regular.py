import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base(p='#c9b089', P='#b99f78', x='#3a3d38', X='#2f322d', e='#f4ede1', E='#cfc8bc', o='#8a5a36', O='#6b4227',
               d='#a8744a', y='#f0c548', j='#c8423a', J='#9a2f2a', m='#a8acb4',
               a=MED[0], A=MED[1], h='#5e5550', H='#423a36', n='#4a4038', N='#3a3129', z='#2a221e',
               **{'1': BLUE[0], '2': BLUE[1]})
    DK = {'1': '2', '2': '2', 'a': 'A', 'n': 'N', 'j': 'J', 'o': 'O'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 0, 63, 2, 'P')

    def chalk(l):                           # menu board with chalk lines
        l.rect(36, 4, 61, 24, 'o'); l.rect(38, 6, 59, 22, 'x')
        for y, (x0, x1) in zip((9, 13, 17), ((40, 52), (40, 49), (40, 54))):
            l.hl(x0, x1, y, 'E'); l.hl(56, 57, y, 'y')
    bg(c, chalk, 'O')
    c.rect(2, 4, 14, 14, 'P'); c.ell(5, 6, 11, 12, 'e'); c.vl(8, 7, 9, 'x'); c.hl(8, 10, 9, 'x')   # wall clock

    def stool(l):                           # red stool seat shows either side of his lap
        l.rect(11, 42, 35, 46, 'j'); l.rect(13, 47, 14, 60, 'm'); l.rect(32, 47, 33, 60, 'm'); l.hl(13, 33, 56, 'm')
    bg(c, stool, 'J')

    lg = layer()                            # seated: lap, bent knees, shins down, feet on the rung
    lg.rect(15, 39, 31, 43, 'n'); lg.rect(24, 41, 31, 43, 'N')
    lg.rect(16, 44, 20, 53, 'n'); lg.rect(26, 44, 30, 53, 'N')
    lg.rect(15, 54, 21, 55, 'z'); lg.rect(25, 54, 31, 55, 'z')

    def front(f):                           # cardigan over a light shirt
        f.poly([(19.5, 26), (26.5, 26), (23, 31)], 'e'); f.vl(23, 31, 39, '2')
        f.pts('e', [(22, 33), (22, 36)])
    person(c, DK, back=lambda f: f.paste(lg), hx=16, hy=10, skin='a', shade='A', mouth='grin', brows='soft', brow='H',
           hs='side', hk='h', hd='H', cx=23, sw=8, ww=7, th=14, cloth='1', front=front,
           arms=[([(30, 29), (35, 35), (32, 37)], 4, '1'), ([(15, 29), (12, 34), (15, 39)], 4, '1')],
           hands=[(14, 39, 'flat', False)])
    mg = layer()                            # "the usual", held at the chest
    mg.rect(30, 29, 36, 37, 'j'); mg.rect(35, 29, 36, 37, 'J')
    mg.pts('J', [(37, 31), (38, 31), (39, 31), (39, 32), (39, 33), (39, 34), (38, 35), (37, 35)])
    mg.hl(31, 34, 29, 'n')
    hand(mg, 28, 34, 'grip', 'a', 'A')
    outline_once(mg); c.paste(mg)
    c.pts('E', [(32, 26), (33, 25), (32, 24), (33, 23)])

    def counter(l):                         # the counter at the right, side on
        l.rect(42, 34, 63, 63, 'o'); l.rect(40, 32, 63, 35, 'd'); l.hl(42, 63, 36, 'O')
        l.rect(46, 40, 60, 58, 'O'); l.rect(47, 41, 59, 57, 'o')
    bg(c, counter)
    sc = layer(); sc.rect(50, 25, 58, 31, 'm'); sc.rect(51, 24, 57, 25, 'E'); sc.ell(49, 24, 59, 27, 'e')
    edged(sc, 'E'); c.paste(sc)
    c.rect(0, 59, 63, 63, 'P'); c.paste(layer())
    return c.rows(), pal


PORTRAIT = ('market.regular', draw)
