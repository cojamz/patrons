import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def cashier():
    c = C(N)
    pal = {'k': INK, 'w': WHITE[0], 'W': WHITE[1],
           'p': '#b9cfb4', 'P': '#a9c1a4', 's': '#d8c49a', 'S': '#c4ae84', 'r': '#c9584a', 'R': '#9e4034',
           'g': '#8d9296', 'G': '#6b7075', 'q': '#3e4a52', 'y': '#f2d27a', 'Y': '#c9a24a',
           'n': '#8fb877', 'N': '#5d8a50', 'm': '#5a7fb0',
           'b': LIGHT[0], 'B': LIGHT[1], 'H': '#b0552c', 'h': '#7e3a1e', 'z': '#4a3c34'}
    c.rect(0, 0, 63, 63, 'p')

    def shelves(l):
        for y in (8, 22):
            l.rect(0, y + 9, 63, y + 10, 'S')
            for i, x in enumerate(range(2, 62, 7)):
                k = 'rms'[i % 3]
                l.rect(x, y + 3, x + 4, y + 8, k)
    bg(c, shelves, None)
    c.recolor('rms', 'P', (0, 0, 63, 40))                       # shelves stay quiet: one close value
    c.rect(0, 38, 63, 63, 'P')

    def counter(l):
        l.rect(0, 44, 63, 63, 'g'); l.hl(0, 63, 44, 'G'); l.rect(0, 50, 63, 51, 'G')
    bg(c, counter, None)

    def register(l):
        l.rect(36, 18, 61, 39, 'q'); l.rect(39, 21, 52, 26, 'n'); l.rect(55, 21, 59, 37, 'g')
        for y in (29, 32, 35):
            for x in (39, 43, 47, 51):
                l.rect(x, y, x + 2, y + 1, 'g')
        l.rect(34, 39, 63, 44, 'G'); l.rect(35, 40, 62, 43, 'g')          # open drawer
        l.rect(37, 41, 42, 42, 'n'); l.rect(44, 41, 49, 42, 'n')
        l.stamp(51, 40, ['.yyy.', 'yyyyY', '.YYY.']); l.stamp(56, 40, ['.yyy.', 'yyyyY', '.YYY.'])
    bg(c, register, None)
    DK = {'w': 'W', 'b': 'B', 'r': 'R', 'y': 'Y'}

    def tag(f):
        f.rect(20, 33, 24, 35, 'r'); f.vl(24, 33, 35, 'R')

    def coins(f):
        f.stamp(29, 25, ['.yyyy.', 'yywyyY', 'yyyyyY', 'yyyyyY', 'yyyyYY', '.YYYY.'])
    person(c, DK, 10, 10, ('b', 'B'), 'bun', 'H', 'h', size=16, mouth='smile', brows='soft', brow='h', cloth='w', cdark='W',
           sw=8, ww=8, th=18, nolegs=True, front=tag, top=coins, side='L',
           arms=[([(11, 30), (8, 37), (10, 43)], 4, 'w'), ([(25, 30), (28, 37), (31, 34)], 4, 'w')],
           hands=[(8, 43, 'flat', False), (29, 30, 'fist', False)])
    return c.rows(), pal


PORTRAIT = ('trading.cashier', cashier)
