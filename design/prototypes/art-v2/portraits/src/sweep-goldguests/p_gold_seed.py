# Treasurer: hair pulled back into a neat bun, pencil behind the ear, pearl earring, prim smile,
# ruffled collar with a brooch, the treasury keys on a ring at her chest.
from lib import *
def draw():
    g = new()
    torso(g)
    torso_vee(g, depth=4, half=3, fill='W', every=2, ledge='W', redge='V')
    neck(g)
    P(g, 12, 22, ['WVW    WVW', ' WW    VV'])        # ruffled collar
    P(g, 15, 24, ['Gg', 'gg'])                          # brooch
    P(g, 18, 25, """
 NMN
M   N
M   N
 NMN
 L  G
 LL GG
 L  G
 LL GG
""")
    face(g, 8, 5, 16, 17, ear_row=7)
    # hair pulled back, centre parting, bun on top
    P(g, 7, 0, """
      HHHHHH
     HhjjhhhH
     HhjhhhhH
      HHHHHH
   HHhhhhHhhhhHH
  HhjjjjhHhhhhhhH
 HhjjhhhhHhhhhhhhH
 HhjhhhhhSHhhhhhhH
 HhhhSSSSSSSShhhhH
 HhSSSSSSSSSSSSShH
 HhS            hH
 Hh              H
""")
    P(g, 24, 7, ['q', 'Y', 'Y', 'Y', 'o'])           # pencil behind the ear
    P(g, 24, 15, ['W'])                             # pearl earring
    P(g, 6, 15, ['W'])
    eyes(g, 10, 12, 8, 'open', brow='H')
    P(g, 10, 12, ['tt']); P(g, 18, 12, ['tt'])
    P(g, 10, 13, ['wK']); P(g, 18, 13, ['wK'])
    P(g, 10, 14, ['KK']); P(g, 18, 14, ['KK'])
    P(g, 15, 15, ['s', 'tt'])
    P(g, 9, 16, ['aa']); P(g, 21, 16, ['aa'])
    P(g, 13, 18, ['K    K', ' KKKK '])
    return g
