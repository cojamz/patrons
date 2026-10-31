import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def undertaker():
    c = C(N)
    pal = {'k': INK, 'w': WHITE[0], 'W': WHITE[1],
           'p': '#9aa0b4', 'P': '#8c92a7', 'g': '#6e8a62', 'G': '#5f7a54', 's': '#b9b8b4', 'S': '#9a9994',
           'x': '#3a3640', 'X': '#4b4652', 'l': '#8fb877', 'y': '#f2d27a',
           'a': PALE[0], 'A': PALE[1], 'H': '#5a4a40', 'h': '#3e3230', 'z': '#55504a', 'n': '#3a3640'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 46, 63, 63, 'g'); c.rect(0, 54, 63, 63, 'G')
    c.ell(48, 5, 53, 10, 'W')

    def stones(l):
        for (x0, y0, x1) in ((2, 32, 13), (49, 30, 61), (15, 38, 22), (43, 40, 50)):
            l.rect(x0, y0 + 4, x1, 48, 's'); l.ell(x0, y0, x1, y0 + 8, 's')
            l.rect(x1 - 2, y0 + 3, x1, 48, 'S'); l.hl(x0 + 3, x1 - 4, y0 + 8, 'S')
    bg(c, stones, 'S')
    DK = {'x': 'X', 'w': 'W', 'a': 'A', 'l': 'G'}

    def coat(f):
        f.poly([(29, 27), (35, 27), (32, 31)], 'w')
        f.poly([(25, 38), (39, 38), (41, 51), (23, 51)], 'x'); f.poly([(36, 38), (39, 38), (41, 51), (37, 51)], 'X')
        f.rect(25, 52, 29, 53, 'z'); f.rect(35, 52, 39, 53, 'z')

    def hat(f):
        f.rect(26, 1, 37, 10, 'x'); f.rect(26, 8, 37, 9, 'w'); f.rect(35, 1, 37, 10, 'X')
        f.hl(22, 41, 11, 'x'); f.hl(23, 40, 12, 'X')

    def lily(f):
        f.vl(31, 36, 46, 'l'); f.vl(32, 36, 46, 'G')
        f.stamp(27, 31, ['.w.w.', 'wwwww', '.wWw.', '..W..'])
        f.stamp(32, 33, ['w.w', 'www', '.W.'])
    person(c, DK, 25, 12, ('a', 'A'), 'crop', 'H', 'h', mouth='flat', brows='stern', brow='h', cloth='x', cdark='X',
           sw=7, ww=7, th=12, nolegs=True, front=coat, top=lambda f: (hat(f), lily(f)), glint='w',
           arms=[([(25, 30), (24, 37), (28, 41)], 3, 'x'), ([(39, 30), (40, 37), (36, 42)], 3, 'x')],
           hands=[(28, 39, 'fist', False), (32, 41, 'fist', True)])
    c.recolor('a', 'w', (27, 38, 37, 45)); c.recolor('A', 'W', (27, 38, 37, 45))     # white gloves
    return c.rows(), pal


PORTRAIT = ('trading.undertaker', undertaker)
