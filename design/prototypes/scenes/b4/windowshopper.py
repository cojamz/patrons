import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def windowshopper():
    c = C(N)
    pal = {'k': INK, 'w': '#f6f1e6', 'W': '#d3cabb',
           'p': '#d6b7a0', 'P': '#c7a68e', 's': '#c9dde0', 'S': '#b5ccd0', 'o': '#7a5a6a', 'O': '#634656',
           'f': '#a9a39a', 'F': '#958f86', 'y': '#e6b84a', 'Y': '#b98c2c', 'r': '#d26b6b', 'R': '#a84e52',
           '1': BLUE[0], '2': BLUE[1], 'u': MED[0], 'U': MED[1],
           'H': '#3a2418', 'h': '#5a3a26', 'z': '#5a4a3e', 'n': '#4a5262'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 53, 63, 63, 'f'); c.hl(0, 63, 53, 'F')
    c.rect(0, 0, 63, 3, 'r'); c.hl(0, 63, 4, 'R')                  # awning lip, one band
    for x in range(0, 64, 6):
        c.ell(x, 3, x + 5, 6, 'r', only='pR')

    def window(l):
        l.rect(2, 10, 34, 46, 'o'); l.rect(4, 12, 32, 44, 's'); l.poly([(22, 12), (27, 12), (13, 44), (8, 44)], 'S')
        l.rect(4, 41, 32, 44, 'O')
        l.rect(16, 30, 17, 40, 'O'); l.rect(13, 40, 20, 41, 'O')    # hat stand
        l.ell(9, 26, 24, 31, 'y'); l.ell(12, 20, 21, 29, 'y'); l.hl(12, 21, 27, 'R'); l.hl(9, 24, 30, 'Y')
        l.rect(25, 34, 29, 37, 'w'); l.px(25, 34, 's')              # price tag
    bg(c, window, 'O')
    DK = {'1': '2', 'u': 'U', 'w': 'W', 'n': 'n', 'r': 'R', 'y': 'Y'}

    def coat(f):
        f.poly([(39, 41), (53, 41), (55, 50), (37, 50)], '1'); f.poly([(49, 41), (53, 41), (55, 50), (50, 50)], '2')
        f.vl(46, 30, 49, '2'); f.pts('w', [(45, 34), (45, 39), (45, 44)])

    def bag(f):
        f.rect(53, 44, 59, 50, 'r'); f.rect(57, 44, 59, 50, 'R')
        f.pts('R', [(54, 42), (54, 43), (58, 42), (58, 43), (55, 41), (56, 41), (57, 41)])
    person(c, DK, 39, 13, ('u', 'U'), 'long', 'H', 'h', mouth='o', brows='soft', brow='H', cloth='1', cdark='2',
           sw=7, ww=6, th=13, pants=('n', 'n'), shoe='z', lh=4, front=coat,
           arms=[([(40, 31), (35, 33), (31, 29)], 3, '1'), ([(53, 31), (55, 36), (55, 40)], 3, '1')],
           hands=[(25, 27, POINT[::-1] and [r[::-1] for r in POINT], False), (53, 40, 'grip', True)], top=bag)
    return c.rows(), pal


PORTRAIT = ('market.windowshopper', windowshopper)
