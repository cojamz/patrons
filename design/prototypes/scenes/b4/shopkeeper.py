import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def shopkeeper():
    c = C(N)
    pal = {'k': INK, 'w': WHITE[0], 'W': WHITE[1],
           'p': '#c9b18f', 'P': '#b9a07e', 'g': '#5e8a6a', 'G': '#4c7457', 's': '#cfe0e0', 'S': '#b8cdce',
           'r': '#e8ddc8', 'o': '#c9a066', 'O': '#9e7840', 'y': '#e6b84a', 'Y': '#b98c2c', 'f': '#a9a39a', 'F': '#958f86',
           'a': PALE[0], 'A': PALE[1], 'H': '#d9a85a', 'h': '#b0823a', 'z': '#5a4a3e', 'n': '#6a7088', 'N': '#565b72',
           'j': '#d9534a', 'u': '#7aa0c8'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 50, 63, 63, 'f'); c.hl(0, 63, 50, 'F')

    def front(l):
        l.rect(0, 0, 63, 9, 'g')
        for x in range(0, 64, 12):
            l.rect(x + 6, 0, x + 11, 9, 'r')
        for x in range(0, 64, 6):
            l.ell(x, 8, x + 5, 12, 'g' if (x // 6) % 2 == 0 else 'r')
        l.rect(4, 16, 24, 44, 'G'); l.rect(6, 18, 22, 42, 's'); l.poly([(16, 18), (20, 18), (10, 42), (6, 42)], 'S')
        l.hl(6, 22, 32, 'O')
        for (x, k) in ((8, 'j'), (13, 'y'), (18, 'u')):
            l.rect(x, 27, x + 3, 31, k); l.hl(x, x + 3, 26, 'O')
        l.rect(48, 16, 63, 50, 'G'); l.rect(50, 18, 63, 50, 'g'); l.ell(51, 32, 53, 34, 'y')
    bg(c, front, None)
    DK = {'w': 'W', 'a': 'A', 'n': 'N', 'o': 'O'}

    def apron(f):
        f.poly([(29, 33), (37, 33), (39, 50), (27, 50)], 'n'); f.poly([(35, 33), (37, 33), (39, 50), (35, 50)], 'N')
        f.pts('n', [(29, 32), (36, 32), (29, 31), (36, 31)])

    def broom(p):
        p.line(27, 24, 14, 50, 'O'); p.line(28, 24, 15, 50, 'o')

    def bristles(f):
        f.poly([(11, 48), (17, 49), (19, 57), (6, 56)], 'y'); f.poly([(15, 49), (17, 49), (19, 57), (16, 57)], 'Y')
    person(c, DK, 26, 12, ('a', 'A'), 'side', 'H', 'h', mouth='smile', brows='soft', brow='h', cloth='w', cdark='W',
           sw=7, ww=7, th=13, pants=('n', 'N'), shoe='z', lh=9, front=apron,
           arms=[([(27, 30), (25, 35), (22, 38)], 3, 'w'), ([(39, 30), (36, 34), (28, 30)], 3, 'w')],
           hands=[(19, 36, 'grip', False), (24, 27, 'grip', False)], props=broom)
    b = layer(); bristles(b); edged(b, 'Y'); c.paste(b)
    return c.rows(), pal


PORTRAIT = ('trading.shopkeeper', shopkeeper)
