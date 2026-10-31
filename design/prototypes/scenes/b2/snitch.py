import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit2 import *


def snitch():
    c = C(N)
    pal = {'k': INK, 'w': WHITE, 'W': '#d6cdbd', 't': '#8e9a9c', 'T': '#7f8b8d', 'm': '#4a5560', 'M': '#3e4852',
           'o': '#8a5a34', 'O': '#6a4224', 'y': '#f6e08a', 'Y': '#d8b850', 'g': '#5f6b70', 'G': '#4d585c',
           '1': MAGENTA[0], '2': MAGENTA[1], 'a': LIGHT[0], 'A': LIGHT[1],
           'h': '#c09a58', 'H': '#8a6a3a', 'x': '#3b3446', 'u': '#b8d0d8'}
    c.rect(0, 0, 63, 63, 't'); c.rect(0, 46, 63, 63, 'T')

    def mirror(l):
        l.rect(36, 6, 63, 30, 'M'); l.rect(38, 8, 63, 28, 'm'); l.poly([(44, 28), (52, 8), (56, 8), (48, 28)], 'g')
    bg(c, mirror)

    def lamp(l):
        l.vl(14, 0, 6, 'G'); l.poly([(8, 12), (11, 7), (17, 7), (20, 12)], 'g'); l.hl(9, 19, 12, 'y')
    bg(c, lamp)
    c.poly([(9, 13), (19, 13), (25, 46), (3, 46)], 'u') if False else None

    def table(l):
        l.rect(0, 44, 63, 48, 'o'); l.hl(0, 63, 48, 'O'); l.rect(4, 49, 7, 63, 'O'); l.rect(56, 49, 59, 63, 'O')
        l.rect(42, 39, 52, 43, 'w'); l.rect(43, 38, 51, 42, 'W'); l.rect(44, 37, 52, 41, 'w')   # the file
        l.rect(6, 38, 9, 43, 'W'); l.vl(10, 39, 41, 'W')                                        # paper cup
    bg(c, table, 'O')

    def hd_hair(l):
        hair(l, 23, 12, 14, 'short', 'h', 'H')
    # leaning in, hand by the mouth, the other hand pointing off to the side
    person(c, 23, 12, 14, 'a', 'A', '1', '2', th=17, sw=8, ww=8,
           arms=[([(36, 31), (40, 34), (38, 27)], 3, '1'), ([(24, 32), (19, 38), (12, 35)], 3, '1')],
           late=lambda f, DK: (hand(f, 36, 23, 'flat', 'a', 'A', True),
                               f.pts('a', [(7, 34), (8, 34), (9, 34)]), hand(f, 9, 33, 'fist', 'a', 'A')),
           mouth='smirk', brows='soft', brow='H', hr=hd_hair,
           face=lambda l: freckles(l, 23, 12, 14, 'A'))
    return c.rows(), pal


PORTRAIT = ('thieves.snitch', snitch)
