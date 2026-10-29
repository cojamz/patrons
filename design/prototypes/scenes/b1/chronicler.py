import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def draw():
    c = C(N)
    pal = base_pal(p='#d8c7a6', P='#c8b693', o='#8a6142', O='#6d4a31', d='#a2683f', D='#7d4f2e',
                   j='#f5eedb', J='#d3c6a6', u='#6f8fb8', e='#c46a4a', y='#f6d77e', Y='#c9a24a',
                   x='#3a3644', H='#2a1d18', h='#4a3328', q='#4f8a7a', m='#e8e2d4')
    pal['1'], pal['2'] = GREEN
    pal['a'], pal['A'] = DEEP
    c.rect(0, 0, 63, 63, 'p')

    def shelves(l):                       # bookcase behind
        l.rect(0, 0, 63, 2, 'O')
        for y in (14, 28):
            l.rect(0, y, 63, y + 1, 'O')
        for (x, y, w, k) in ((2, 6, 3, 'u'), (5, 5, 2, 'e'), (8, 7, 3, 'q'), (46, 6, 3, 'e'), (50, 5, 2, 'u'),
                             (53, 7, 3, 'Y'), (57, 4, 3, 'q'), (3, 20, 3, 'Y'), (7, 21, 2, 'u'), (52, 20, 3, 'q'), (56, 19, 2, 'e')):
            l.rect(x, y, x + w - 1, y + (13 - (y % 14)) if y < 14 else 27, k)
    bg(c, shelves)

    def lamp(l):                          # small desk lamp
        l.rect(53, 42, 58, 43, 'Y'); l.rect(55, 36, 56, 41, 'Y')
        l.poly([(50, 36), (53, 30), (58, 30), (61, 36)], '1'); l.hl(51, 60, 36, 'y')
    bg(c, lamp)

    def top(f):
        bk = layer()                      # big open book on the desk
        bk.poly([(14, 46), (31, 43), (31, 50), (14, 51)], 'j'); bk.poly([(33, 43), (50, 46), (50, 51), (33, 50)], 'j')
        bk.rect(31, 43, 32, 50, 'J')
        for y in (46, 48):
            bk.hl(17, 28, y, 'J'); bk.hl(35, 46, y + 1, 'J')
        bk.hl(14, 50, 51, 'D')
        over(f, bk, {'1': '2', 'a': 'A'})
        hl = layer(); hand(hl, 19, 44, 'flat', 'a', 'A'); over(f, hl, {'j': 'J'})
        q = layer()
        q.line(42, 45, 49, 31, 'm'); q.line(43, 45, 50, 31, 'm'); q.line(44, 44, 50, 33, 'J')
        q.pts('m', [(48, 32), (49, 32), (51, 32), (47, 34)]); q.px(42, 46, 'x')
        over(f, q, {'1': '2', 'j': 'J'})
        hl = layer(); hand(hl, 40, 42, 'grip', 'a', 'A'); over(f, hl, {'j': 'J', '1': '2', 'm': 'J'})


    person(c, hx=25, hy=15, size=14, skin='a', shade='A', hs='long', hk='H', hd='h', mouth='smile', brows='soft',
           shirt='1', sdark='2', cx=32, sw=8, ww=8, th=17,
           arms=[([(25, 33), (21, 39), (22, 44)], 4), ([(39, 33), (43, 39), (42, 43)], 4)],
           front=lambda f: f.poly([(29.5, 30), (34.5, 30), (32, 33)], 'j'), top=top)

    def desk(l):
        l.rect(0, 52, 63, 63, 'd'); l.hl(0, 63, 52, 'D'); l.rect(0, 58, 63, 63, 'o')
    bg(c, desk)
    c.rect(6, 47, 10, 51, 'x'); c.hl(7, 9, 46, 'x'); c.hl(6, 10, 49, 'J')       # ink pot
    return c.rows(), pal


PORTRAIT = ('echo.chronicler', draw)
