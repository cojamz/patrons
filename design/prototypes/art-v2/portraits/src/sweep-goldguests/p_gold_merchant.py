# Merchant: big wrapped turban with a jewel, full beard, broad smile, gold hoop, trimmed robe, a little balance scale.
from lib import *
def draw():
    g = new()
    torso(g, half0=8)
    # wrap robe: gold-trimmed edge crossing from the left shoulder to the middle
    for i, y in enumerate(range(22, 32)):
        x = 11 + i // 1
        if x < 20: at(g, x, y, 'G'); at(g, x + 1, y, 'g')
    neck(g)
    face(g, 8, 4, 16, 18, ear_row=8)
    # beard
    P(g, 8, 14, """
H              H
Hh            hH
Hhh  HHHHHH  hhH
Hhhh HhhhhH hhhH
 Hhhh      hhhH
 HhhhhhhhhhhhhH
  HhhhhhhhhhhH
   HHhhhhhhHH
     HHHHHH
""")
    P(g, 13, 17, ['KKKKKK', 'KwwwwK', ' KKKK '])
    P(g, 15, 14, ['t', 'tt'])
    eyes(g, 10, 12, 8, 'happy')
    P(g, 9, 14, ['aa']); P(g, 21, 14, ['aa'])
    # turban
    P(g, 6, 1, """
       WWWWWW
     WWWWWWVVWW
   WWWWVVWWWWWVVW
  WWWVVWWWWWWWVVVV
 WWWVWWWWWGGWWWVVVV
 WWWWWWVVGxqGVVWVVV
 VWWWWVVWGxxGWWVVWV
 VVWWWVWWWGGWWVVVVV
 VVVWWWWWWWWWWWVVVV
  VVVVWWWWWWWWVVVV
""")
    P(g, 24, 12, [' ', 'G', 'g'])            # gold hoop on the ear
    P(g, 24, 15, ['g'])
    # balance scale in the doorway
    P(g, 2, 13, """
  M
LLMNN
M   N
M   N
GG NGG
gg  gg
""")
    return g
