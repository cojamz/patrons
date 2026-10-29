import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def windowdresser():
    c = C(N)
    pal = {'k': INK, 'w': '#f6f1e6', 'W': '#d3cabb',
           'p': '#d7e3e4', 'P': '#c6d4d6', 'f': '#b99a7c', 'F': '#a3866a', 'o': '#5e6a78', 'O': '#4b5562',
           'd': '#d9c9ad', 'D': '#b8a585', 'y': '#e6b84a', 'Y': '#b98c2c', 'r': '#c95a4a', 'R': '#9c4236',
           '1': BLUE[0], '2': BLUE[1], 'u': MED[0], 'U': MED[1],
           'H': '#2e2019', 'z': '#5a4a3e', 'n': '#4a5262', 'N': '#3a4150'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 52, 63, 63, 'f'); c.hl(0, 63, 52, 'F')
    c.poly([(44, 0), (50, 0), (30, 52), (24, 52)], 'P')            # one quiet glass streak
    c.rect(0, 0, 63, 5, 'o'); c.hl(0, 63, 5, 'O')                  # window frame top
    c.rect(0, 0, 2, 63, 'o'); c.rect(61, 0, 63, 63, 'o')
    c.rect(0, 58, 63, 63, 'o'); c.hl(0, 63, 58, 'O')

    def form(l):
        l.rect(15, 16, 17, 18, 'D'); l.hl(14, 18, 15, 'D')
        l.poly([(9, 19), (23, 19), (24, 22), (21, 30), (23, 39), (9, 39), (11, 30), (8, 22)], 'r')
        l.poly([(19, 19), (23, 19), (24, 22), (21, 30), (23, 39), (19, 39)], 'R')
        l.rect(15, 40, 16, 50, 'Y'); l.rect(11, 50, 20, 51, 'Y')
        l.rect(22, 33, 25, 36, 'w'); l.px(22, 33, 'p')              # price tag
    bg(c, form, None)
    for (x, y) in ((9, 19), (23, 19), (8, 22), (24, 22)):
        pass
    DK = {'1': '2', 'u': 'U', 'w': 'W', 'y': 'Y', 'n': 'N'}

    def apron(f):
        f.poly([(39, 33), (47, 33), (48, 41), (38, 41)], 'w'); f.poly([(45, 33), (47, 33), (48, 41), (45, 41)], 'W')

    def tape(f):                                    # measuring tape round the neck
        f.pts('y', [(39, 28), (39, 29), (39, 30), (39, 31), (40, 32), (40, 33), (40, 34)])
        f.pts('y', [(47, 28), (47, 29), (47, 30), (46, 31), (46, 32), (46, 33), (46, 34), (46, 35)])
        f.pts('Y', [(40, 31), (46, 30)])

    def scarf(l):                                   # yellow scarf draped on the form, no ink
        l.poly([(9, 18), (24, 18), (24, 21), (9, 21)], 'y')
        l.poly([(8, 18), (12, 18), (11, 34), (7, 33)], 'y'); l.poly([(20, 21), (24, 21), (24, 30), (21, 31)], 'y')
        l.poly([(10, 21), (12, 21), (11, 34), (9, 34)], 'Y'); l.vl(24, 21, 30, 'Y')
    bg(c, scarf, 'Y')
    person(c, DK, 36, 13, ('u', 'U'), 'short', 'H', 'z', mouth='smile', brows='soft', cloth='1', cdark='2',
           sw=7, ww=6, th=13, pants=('n', 'N'), shoe='z', lh=9, front=lambda f: (apron(f), tape(f)),
           arms=[([(37, 31), (32, 36), (28, 26)], 3, '1'), ([(50, 31), (52, 37), (51, 42)], 3, '1')],
           hands=[(24, 21, 'grip', False), (49, 42, 'fist', True)])
    return c.rows(), pal


PORTRAIT = ('market.windowdresser', windowdresser)
