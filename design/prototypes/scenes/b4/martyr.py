import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def martyr():
    c = C(N)
    pal = {'k': INK, 'w': WHITE[0], 'W': WHITE[1],
           'p': '#6a5f86', 'P': '#7a6a8e', 'b': '#5a5068', 'B': '#4e4560', 'l': '#f6dca6', 'L': '#e8c084',
           'f': '#6e6a78', 'F': '#605c6a', 'o': '#8a5a3a', 'O': '#6a4429', 'y': '#c9a24a',
           'u': MED[0], 'U': MED[1], 'H': '#2a1c14', 'h': '#4a3426', 'z': '#4a3c34', 'n': '#4a5262', 'N': '#3a4150'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 30, 63, 63, 'P'); c.rect(0, 52, 63, 63, 'f')

    def house(l):
        l.rect(0, 6, 30, 52, 'b'); l.poly([(-1, 6), (15, 0), (31, 6)], 'B')
        l.rect(6, 18, 24, 52, 'B'); l.rect(8, 20, 22, 52, 'l'); l.rect(8, 20, 9, 52, 'L')    # the open doorway, lit
        l.poly([(8, 52), (22, 52), (34, 63), (2, 63)], 'L')                                 # light spilling out
    bg(c, house, None)
    DK = {'w': 'W', 'u': 'U', 'o': 'O', 'n': 'N'}

    def coat(f):
        f.poly([(30, 39), (42, 39), (43, 47), (29, 47)], 'w'); f.poly([(39, 39), (42, 39), (43, 47), (40, 47)], 'W')
        f.vl(36, 28, 46, 'W')

    def glance(f):                                    # eyes turned back toward the door
        for ex in (31, 37):
            f.rect(ex, 20, ex + 1, 21, 'u'); f.rect(ex - 1, 20, ex, 21, 'k'); f.px(ex - 1, 20, 'w')

    def case(f):
        f.rect(42, 43, 52, 51, 'o'); f.rect(49, 43, 52, 51, 'O'); f.hl(42, 52, 47, 'O')
        f.hl(45, 48, 41, 'O'); f.vl(45, 41, 42, 'O'); f.vl(48, 41, 42, 'O')
    person(c, DK, 29, 13, ('u', 'U'), 'side', 'H', 'h', mouth='smile', brows='soft', brow='h', cloth='w', cdark='W',
           sw=7, ww=6, th=13, pants=('n', 'N'), shoe='z', lh=8, stance=1, front=coat, top=lambda f: (glance(f), case(f)),
           arms=[([(30, 31), (25, 30), (24, 23)], 3, 'w'), ([(42, 31), (45, 36), (46, 40)], 3, 'w')],
           hands=[(22, 18, WAVE, False), (45, 40, 'grip', True)])
    return c.rows(), pal


PORTRAIT = ('trading.martyr', martyr)
