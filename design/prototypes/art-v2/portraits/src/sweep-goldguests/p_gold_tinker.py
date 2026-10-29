# Alchemist (gold): frizzy wild hair, brass goggles pushed up, soot smudge, delighted grin, lab-coat lapels,
# a flask beside him where a green drop turns to gold.
from lib import *
def draw():
    g = new()
    torso(g)
    torso_vee(g, depth=10, half=5, fill='W', every=2, ledge='W', redge='V')   # lab coat lapels
    torso_vee(g, depth=8, half=3, fill='3', every=3, ledge='4', redge='2')    # gold shirt
    neck(g)
    P(g, 6, 27, ['zz', 'Gn'])            # stains on the coat
    face(g, 8, 4, 16, 18, ear_row=8)
    # frizzy hair bursting out every way
    P(g, 3, 0, """
        h jh  hH
     hjjhhjjhhhhHh h
   hjjjhhhhhhhhhhhhhH
  hjjhhhhhhhhhhhhhhhhH
 hjjhhhhhhhhhhhhhhhhhhH
hjjhhhhhhhhhhhhhhhhhhhhH
hjhhhh            hhhhhH
 hjhhh            hhhhH
hjhhH              Hhhh H
 hhhH              Hhh
hjhH                HhH
 hH                  H
  H
""")
    # goggles pushed up on the forehead
    P(g, 8, 5, """
 NNNN NNNN
NDDwDNDDwDN
NDDDDNDDDDNMM
 NNNN NNNN
""")
    P(g, 6, 7, ['MM'])
    eyes(g, 10, 12, 8, 'open', brow='t')
    P(g, 15, 14, ['s', 'tt'])
    P(g, 9, 15, ['aN', 'N']); P(g, 21, 15, ['aa'])     # soot smudge, rosy cheek
    P(g, 12, 17, ['KKKKKKKK', 'KwwwwwwK', ' KrrrrK', '  KKKK'])
    # the flask, right side: green turning to gold, a bubble rising
    P(g, 1, 12, """
  w
   i
  LM
  iM
 LiiM
LiiiiM
LzzznM
LzGznM
LznGnM
 MMMM
""")
    return g
