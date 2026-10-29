import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base(p='#c5c9d6', P='#b7bcca', f='#d9a868', F='#c8955a', o='#e07a32', O='#b8541f', y='#f6d36a',
               m='#e8e2d6', M='#b8b2a6', b='#d86a2c', B='#a84a1c', x='#2b2735',
               a=MED[0], A=MED[1], h='#22181a', H='#3e2c2a', n='#f4ede1', z='#e8e2d6', Z='#9c968c',
               **{'1': PURPLE[0], '2': PURPLE[1]})
    DK = {'1': '2', '2': '2', 'a': 'A', 'n': 'M', 'b': 'B'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 0, 63, 3, 'P')
    c.rect(0, 50, 63, 63, 'f'); c.hl(0, 63, 50, 'F'); c.hl(0, 63, 57, 'F')

    def hoop(l):                            # backboard and rim, right
        l.rect(44, 6, 62, 20, 'm'); l.rect(49, 11, 57, 18, 'M'); l.rect(50, 12, 56, 17, 'm')
        l.rect(48, 20, 58, 21, 'o')
        for x in (49, 52, 55, 57):
            l.vl(x, 22, 27, 'M')
        l.hl(50, 56, 27, 'M')
        l.rect(52, 0, 54, 5, 'M')
    bg(c, hoop, 'M')

    def front(f):                           # jersey: sleeveless, white trim, a number bar
        f.poly([(28, 27), (36, 27), (32, 31)], 'a')
        f.rect(29, 33, 31, 37, 'n'); f.vl(34, 33, 37, 'n')
    lg = layer()
    thick(lg, [(28, 43), (26, 49), (27, 53)], 4, 'a')
    thick(lg, [(35, 43), (38, 48), (37, 53)], 4, 'A')
    lg.rect(24, 54, 29, 56, 'z'); lg.rect(35, 54, 40, 56, 'z'); lg.hl(24, 29, 56, 'Z'); lg.hl(35, 40, 56, 'Z')
    lg.rect(25, 40, 39, 45, '2')
    person(c, DK, back=lambda f: f.paste(lg), hx=25, hy=12, skin='a', shade='A', mouth='grin', brows='soft', brow='h',
           hs='crop', hk='h', hd='H', cx=32, sw=7, ww=6, th=13, cloth='1', front=front,
           arms=[([(25, 30), (22, 24), (25, 13)], 3, 'a'), ([(39, 30), (42, 24), (39, 13)], 3, 'a')],
           hands=[(23, 9, 'grip', False), (37, 9, 'grip', True)])
    ball = layer()                          # ball overhead, a short fire streak behind it
    ball.ell(26, 0, 37, 10, 'b'); ball.ell(27, 1, 31, 4, 'b')
    ball.vl(31, 0, 10, 'B'); ball.hl(26, 37, 5, 'B'); ball.rect(35, 2, 37, 8, 'B')
    outline_once(ball); c.paste(ball)
    hl = layer(); hand(hl, 23, 7, 'grip', 'a', 'A'); hand(hl, 37, 7, 'grip', 'a', 'A', flip=True); outline_once(hl); c.paste(hl)
    fl = layer()
    fl.poly([(10, 2), (24, 0), (25, 9), (12, 8), (16, 5)], 'o'); fl.poly([(16, 3), (24, 2), (24, 7), (17, 6)], 'y')
    fl.poly([(4, 10), (14, 9), (12, 12)], 'o')
    c.paste(fl)
    return c.rows(), pal


PORTRAIT = ('purple.streak', draw)
