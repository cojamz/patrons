import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def exporter():
    c = C(N)
    pal = {'k': INK, 'w': WHITE[0], 'W': WHITE[1],
           'p': '#bcd6e2', 'P': '#a9c8d6', 'q': '#5d7f99', 'Q': '#4c6c85', 'f': '#a99a86', 'F': '#958673',
           'r': '#c86a4e', 'R': '#a65538', 'o': '#c9a066', 'O': '#9e7840', 'd': '#8a6838',
           'u': MED[0], 'U': MED[1], 'H': '#2a1c14', 'z': '#4a3c34', 'n': '#4a5a72', 'N': '#3a4860',
           'y': '#f2d27a', 'b': '#e8e0cf'}
    c.rect(0, 0, 63, 63, 'p'); c.rect(0, 34, 63, 63, 'q'); c.rect(0, 46, 63, 63, 'f'); c.hl(0, 63, 46, 'F')

    def ship(l):
        l.poly([(-1, 22), (26, 22), (22, 34), (-1, 34)], 'R'); l.hl(0, 25, 22, 'b'); l.hl(0, 24, 23, 'b')
        l.rect(2, 15, 9, 21, 'r'); l.rect(11, 17, 18, 21, 'Q'); l.rect(2, 11, 8, 14, 'Q')
        l.ell(52, 3, 57, 8, 'y')
    bg(c, ship, None)

    def crane(l):
        l.rect(48, 10, 50, 45, 'Q'); l.hl(38, 63, 10, 'Q'); l.hl(38, 63, 11, 'Q')
        l.vl(41, 12, 22, 'Q'); l.rect(39, 22, 44, 27, 'r'); l.rect(39, 26, 44, 27, 'R')
    bg(c, crane, None)
    c.rect(0, 47, 63, 47, 'F')
    DK = {'w': 'W', 'u': 'U', 'o': 'O', 'n': 'N', 'b': 'b'}

    def crate(f):
        f.rect(22, 33, 42, 46, 'o'); f.hl(22, 42, 33, 'O'); f.hl(22, 42, 39, 'O'); f.hl(22, 42, 46, 'O')
        f.vl(22, 33, 46, 'O'); f.vl(42, 33, 46, 'O')
        f.rect(26, 35, 31, 38, 'b'); f.hl(27, 30, 36, 'O')

    def beanie(f):
        f.rect(26, 9, 37, 14, 'n'); f.hl(27, 36, 8, 'n'); f.rect(25, 13, 38, 15, 'N')
    person(c, DK, 25, 12, ('u', 'U'), 'crop', 'H', 'z', mouth='smile', brows='soft', cloth='w', cdark='W',
           sw=8, ww=7, th=13, pants=('n', 'N'), lh=8, front=crate, top=beanie,
           arms=[([(25, 30), (21, 34), (21, 37)], 3, 'w'), ([(39, 30), (43, 34), (43, 37)], 3, 'w')],
           hands=[(20, 37, 'grip', False), (41, 37, 'grip', True)])
    return c.rows(), pal


PORTRAIT = ('trading.exporter', exporter)
