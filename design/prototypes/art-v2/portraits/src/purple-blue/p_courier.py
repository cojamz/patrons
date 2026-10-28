# Courier: a bike messenger. Round cap with a winged pin, leather satchel strap across the chest, a letter tucked in it.
from lib import *
ID, NAME, SPHERE = 'purple.courier', 'Courier', 'purple'
def draw():
    g = new()
    body(g)
    face(g, rows={6: 'SaaSSSttSSSSaast', 8: ' SSSSSSSSSKSsst ', 9: ' SSSSKKKKKSSsst '})
    at(g, 8, 3, ['   44333333     ',
                 '  4433333333322 ',
                 ' 443333333333221',
                 ' 433333333333221',
                 '4333333333333221'])
    at(g, 7, 8, ['1111111111111111111', ' 11111111111111111'])  # the brim, shading the brow
    at(g, 7, 9, ['h', 'h']); at(g, 24, 9, ['H', 'H'])
    at(g, 9, 4, ['WW  ', 'WWWG', ' WWG'])  # winged pin
    # satchel strap from the left shoulder down to the right hip
    for y in range(22, 32):
        x = 8 + (y - 22) * 2
        at(g, x - 1, y, ['oOOOOo'])
    at(g, 14, 25, ['WWWWW', 'WVVVW', 'WWVWW'])  # the letter in the strap
    g.c[26][16] = 'x'
    at(g, 23, 10, ['', '', 'Y', 'Y', 'n'])  # a pen behind the ear
    return g
