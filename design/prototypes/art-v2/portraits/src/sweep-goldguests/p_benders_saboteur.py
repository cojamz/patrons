# Saboteur: black watch cap pulled low, dark bandana over nose and mouth, shifty eyes, a stick of dynamite
# tucked in the chest strap with its fuse fizzing.
from lib import *
def draw():
    g = new()
    torso(g, ramp='3211')
    # turtleneck collar
    # chest strap from the left shoulder
    for i in range(10):
        at(g, 8 + i, 22 + i, 'o'); at(g, 9 + i, 22 + i, 'O')
    # dynamite in the strap
    P(g, 18, 23, """
    Y
   G w
  xY
 RRRq
 RqRr
 RRRr
 RRrr
 KKKK
 RRrr
 rrrr
""")
    face(g, 8, 4, 16, 18, ear_row=8)
    # watch cap, ribbed, pulled low over the brow
    P(g, 7, 1, """
     DDDDDDD
   DDNNDDDDDDD
  DNNDDDDDDDDDD
 DNDDDDDDDDDDDDD
 DNDDDDDDDDDDDDDK
 DDDDDDDDDDDDDDDK
 NKNKNKNKNKNKNKNK
 NKNKNKNKNKNKNKNK
""")
    P(g, 8, 9, ['D']); P(g, 23, 9, ['D'])
    # shifty eyes looking to the side, one brow cocked
    P(g, 10, 10, ['tt'])
    P(g, 10, 11, ['wK', 'wK']); P(g, 18, 11, ['wK', 'wK'])
    P(g, 18, 10, ['tt'])
    # bandana over nose and mouth, tied at the side
    P(g, 7, 13, """
 DDDDDDDDDDDDDDDD
DDNDDDDDDDDDDDDDDK
 DNDDDDDNDDDDDDDK
  DDDDDDDDDDDDDK
   DDDDDDDDDDDK
    DDDDDDDDDK
      DDDDDK
        DK
""")
    P(g, 15, 13, ['NN'])   # nose under the cloth
    P(g, 24, 14, ['DD', ' DN', ' D'])
    return g
