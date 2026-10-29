# Courier: a bike messenger in a vented helmet, earbuds, a leather satchel strap across the chest; the satchel
# flap at his side shows a red, a blue and a green token (+1 of each other color). Speed lines in the doorway.
from lib import *
def draw():
    g = new()
    for (x, y, n) in ((2, 9, 4), (3, 12, 3), (2, 15, 5), (25, 10, 4), (25, 13, 3)): at(g, x, y, ['i' * n])
    body(g, top=22, start=8)
    at(g, 12, 22, ['1      1', ' 1    1 ', '  1111  '])  # crew neck
    for k in range(10):  # satchel strap from his right shoulder down across to the left hip
        x = 21 - k * 2; y = 22 + k
        if y < 32: at(g, x - 1, y, ['ooO'])
    at(g, 2, 26, ['OOOOOOOo', 'OoooooOo', 'OOxOyOzo', 'OOOOOOOo', 'OOOOOOoo', 'oooooooo'])  # satchel with tokens
    at(g, 4, 28, ['x y z'])
    head(g, 7, 2, [
        '      444333      ',
        '    4443b33b322   ',
        '   443b33b33b3221 ',
        '  4433b33b33b33221',
        '  433b333b333b3221',
        '  4333333333333221',
        '  1111111111111111',
    ])
    at(g, 8, 8, ['HhhhhhhhhhhhhhhH'])
    face(g, y=9, mouth='grin', rows={0: 'HSSSSSSSSSSSSssH'})
    at(g, 7, 13, ['K', 'K']); at(g, 24, 13, ['K', 'K', 'K', 'K', ' K', ' K'])  # earbuds and wire
    return g
