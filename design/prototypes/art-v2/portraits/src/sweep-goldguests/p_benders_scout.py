# Scout: a wide-brimmed campaign hat, red neckerchief with a woggle, binoculars on the chest, a badge sash, keen eyes.
from lib import *
def draw():
    g = new()
    torso(g)
    neck(g)
    # sash across with merit badges
    for i in range(10):
        for k in range(3):
            at(g, 19 - i + k, 22 + i, 'e' if k == 2 else 'E')
    for (x, y, c) in [(17, 25, 'x'), (15, 27, 'y'), (13, 29, 'n'), (19, 23, 'z')]: at(g, x, y, c)
    # neckerchief: a triangle down the chest and a gold woggle
    P(g, 11, 21, ['RRRRRRRRRR', 'qRRRRRRRRr', ' qRRGgRRr', '  RRggRr', '   RRRr', '    Rr'])
    # binoculars hanging on the left
    P(g, 4, 24, ['NN NN', 'MNNMN', 'DwDDw', 'DDDDD', 'DD DD'])
    face(g, 8, 6, 16, 16, ear_row=6)
    # campaign hat: pinched crown, flat wide brim
    P(g, 2, 1, """
           OO OO
         OOOOoOOO
        OOOOOoOOOo
        OOOOoOOOOo
       OOOOOoOOOOoo
       RRRRRRRRRRrr
 OOOOOOOOOOOOOOOOOOOOOOOOOO
  oooooooooooooooooooooooo
""")
    P(g, 8, 9, ['Hhh', 'Hh']); P(g, 21, 9, ['hhH', ' hH'])
    eyes(g, 10, 12, 8, 'open', brow='H')
    P(g, 15, 14, ['s', 'tt'])
    P(g, 9, 16, ['aa']); P(g, 21, 16, ['aa'])
    P(g, 12, 17, ['K      K', ' KKKKKK'])
    return g
