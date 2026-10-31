import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def fixer():
    c = C(N)
    pal = {'k': INK, 'w': WHITE, 'W': '#cfd6d8', 'b': '#2d3352', 'B': '#353c5e', 'y': '#f3d27a', 'Y': '#e3bb5a',
           'r': '#b5413a', 'R': '#8a2f2a', 'g': '#a9aeac', 'G': '#7d8381', 'q': '#4d5878',
           '1': MAGENTA[0], '2': MAGENTA[1], 'd': DEEP[0], 'D': DEEP[1], 'e': '#8c5a3a',
           'h': '#1e1410', 'x': '#2c2a36', 'X': '#45424f', 'z': '#3a2a22', 'f': '#3b3446'}
    c.rect(0, 0, 63, 63, 'b'); c.rect(0, 55, 63, 63, 'f')
    # city behind
    for x0, h in ((0, 20), (8, 30), (52, 26), (58, 16)):
        c.rect(x0, 55 - h, x0 + 6, 54, 'B')
    c.pts('y', [(2, 40), (10, 30), (12, 36), (54, 34), (60, 44)])

    def booth(l):
        l.rect(12, 2, 51, 6, 'r'); l.rect(12, 7, 14, 58, 'r'); l.rect(49, 7, 51, 58, 'r')
        l.rect(12, 56, 51, 58, 'r'); l.rect(18, 3, 45, 5, 'R')
        l.hl(15, 48, 7, 'R'); l.vl(14, 7, 55, 'R'); l.vl(49, 7, 55, 'R')
        l.rect(16, 3, 17, 5, 'y'); l.rect(46, 3, 47, 5, 'y')
        # the phone box on the back wall
        l.rect(16, 18, 23, 30, 'G'); l.rect(17, 19, 22, 24, 'g'); l.pts('x', [(18, 26), (20, 26), (18, 28), (20, 28)])
    bg(c, booth)
    c.rect(15, 8, 48, 55, 'q', ) if False else None
    c.recolor('bByB', 'q', (15, 7, 48, 55))
    c.recolor('q', 'B', (40, 8, 48, 55))

    def cord(p):
        p.pts('x', [(22, 31), (23, 33), (22, 35), (23, 37), (24, 38), (25, 40), (26, 41)])

    def receiver(f, DK):
        f.rect(37, 16, 39, 27, 'g'); f.rect(36, 15, 39, 17, 'g'); f.rect(36, 26, 39, 28, 'g'); f.vl(39, 17, 28, 'G'); f.hl(36, 39, 17, 'G')
    person(c, 25, 14, 14, 'd', 'D', '1', '2', th=15, sw=8, ww=7,
           lg=dict(pants='x', pdark='X', shoe='z', lh=9),
           front=lambda f, DK: (f.poly([(29, 29), (35, 29), (32, 34)], 'w'), f.pts('x', [(32, 31), (32, 32), (31, 33), (32, 34), (33, 35)])),
           arms=[([(27, 33), (24, 38), (27, 42)], 3, '1'), ([(38, 32), (42, 30), (41, 25)], 3, '1')],
           hands=[(25, 41, 'fist', False)],
           late=lambda f, DK: (receiver(f, DK), hand(f, 39, 21, 'grip', 'd', 'D', True)),
           mouth='smile', brows='stern', brow='h', hr=('side', 'h', 'x'), dk={'x': 'X', 'w': 'W', 'g': 'G'})
    return c.rows(), pal


PORTRAIT = ('thieves.fixer', fixer)
