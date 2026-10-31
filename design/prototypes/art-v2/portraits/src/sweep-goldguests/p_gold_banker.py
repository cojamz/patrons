# Banker: slick side part, round spectacles, three-piece suit, tie pin, watch chain, coin stacks.
from lib import *
def draw():
    g = new()
    torso(g)
    torso_vee(g, depth=10, half=5, fill='2', every=2, ledge='4', redge='1')   # vest
    torso_vee(g, depth=7, half=3, fill='W', every=3, ledge=None, redge='V')  # shirt
    neck(g)
    P(g, 15, 23, ['DD', 'DD', 'GG', 'DD', 'DD', 'DD', 'DD', 'D'])            # tie, gold pin
    P(g, 12, 23, ['W', 'W']); P(g, 19, 23, ['V', 'V'])                      # collar points
    P(g, 18, 28, ['G', ' g', '  GG', '    g'])                              # watch chain
    P(g, 13, 29, ['g', '', 'g'])                                            # vest buttons
    P(g, 4, 26, ['WWV', 'WV'])                                              # pocket square
    face(g, 8, 3, 16, 19, ear_row=9)
    P(g, 7, 2, """
    HHHHHHHHH
  HHhhjjjjhHHH
 HhjjjjhhhhhHHH
HhjjhhhhHHhhhhhH
HhhhhhhSSHhhhhhH
HhhSSSSSSSShhhhH
HhSSSSSSSSSSSShH
HsSSSSSSSSSSSssH
Hs            sH
""")
    P(g, 9, 11, ['NNNN', 'N  N', 'N  N', 'NNNN']); P(g, 17, 11, ['NNNN', 'N  N', 'N  N', 'NNNN'])
    P(g, 10, 12, ['wK', 'KK']); P(g, 18, 12, ['wK', 'KK'])
    P(g, 13, 11, ['LNNN']); P(g, 8, 11, ['N']); P(g, 21, 11, ['NN'])
    P(g, 10, 10, ['HH']); P(g, 18, 10, ['HH'])
    P(g, 15, 14, ['s', 'tt'])
    P(g, 9, 16, ['aa']); P(g, 20, 16, ['aa'])
    P(g, 13, 18, ['K    K', ' KKKK '])
    stack(g, 2, 15, 3); stack(g, 25, 17, 2)
    return g
