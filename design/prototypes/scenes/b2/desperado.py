import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def desperado():
    c = C(N)
    pal = {'k': INK, 'w': WHITE, 'q': '#f2cf9a', 'Q': '#ecbf86', 'd': '#e0a868', 'D': '#d09858',
           'm': '#c27a4a', 'M': '#a8653a', 'y': '#fbe7a8', 'g': '#6f9a4f', 'G': '#557e3c',
           '1': MAGENTA[0], '2': MAGENTA[1], 'a': PALE[0], 'A': PALE[1],
           'o': '#8a5a34', 'O': '#6a4224', 'x': '#4b5a78', 'X': '#3a4660', 'z': '#4a3020', 'h': '#c99a52', 'c': '#d9c8a8', 'C': '#b0a080'}
    c.rect(0, 0, 63, 63, 'q'); c.rect(0, 34, 63, 63, 'd')
    c.ell(46, 4, 55, 13, 'y')

    def mesa(l):
        l.poly([(0, 34), (0, 18), (4, 17), (16, 17), (20, 34)], 'm'); l.rect(0, 26, 18, 34, 'M')
        l.poly([(48, 34), (52, 24), (60, 24), (63, 26), (63, 34)], 'm')
    bg(c, mesa, 'M')
    c.pts('D', [(8, 44), (9, 44), (10, 44), (54, 52), (55, 52), (24, 58), (25, 58)])

    def cactus(l):
        l.rect(52, 30, 56, 55, 'g'); l.rect(57, 38, 60, 41, 'g'); l.rect(59, 32, 62, 41, 'g')
        l.rect(48, 41, 51, 44, 'g'); l.rect(47, 35, 50, 44, 'g')
        l.vl(55, 31, 54, 'G'); l.vl(61, 33, 40, 'G')
    bg(c, cactus, 'G')

    def bag(f, DK):
        f.ell(6, 38, 17, 50, 'c'); f.poly([(10, 34), (13, 34), (14, 39), (9, 39)], 'c'); f.ell(13, 41, 16, 48, 'C')
        f.stamp(9, 40, ['.y.', 'y..', '.y.', '..y', 'y..'] if False else ['.C.', '.CC', 'C..', '.C.', '..C', 'CC.', '.C.'])

    def hat(f):
        f.hl(23, 42, 12, 'o'); f.hl(21, 44, 13, 'o'); f.pts('o', [(20, 12), (45, 12), (19, 11), (46, 11)])
        f.rect(26, 5, 39, 11, 'o'); f.pts('.', [(26, 5), (39, 5)]); f.hl(30, 35, 5, '.'); f.hl(31, 34, 6, 'O')
        f.hl(26, 39, 10, 'O'); f.hl(21, 44, 13, 'O')

    def bandana(f, DK):
        f.poly([(26, 28), (39, 28), (34, 33), (31, 33)], '2'); f.pts('1', [(29, 29), (30, 29), (35, 29)])
    person(c, 25, 13, 14, 'a', 'A', '1', '2', th=14, sw=8, ww=7,
           lg=dict(pants='x', pdark='X', shoe='z', lh=10, stance=1),
           front=bandana,
           arms=[([(26, 32), (21, 34), (14, 35)], 3, '1'), ([(39, 32), (42, 37), (41, 42)], 3, '1')],
           hands=[(39, 42, 'fist', True)],
           late=lambda f, DK: (bag(f, DK), hand(f, 9, 34, 'grip', 'a', 'A')),
           mouth='smirk', brows='stern', brow='h', hr=('crop', 'h', 'D'), hat=hat,
           dk={'c': 'C', 'o': 'O'})
    return c.rows(), pal


PORTRAIT = ('thieves.desperado', desperado)
