# Speculator: green eyeshade visor, wild eager grin, rolled sleeves and suspenders, ticker tape, a chart arrow shooting up.
from lib import *
def draw():
    g = new()
    torso(g)
    torso_vee(g, depth=5, half=3, fill='W', every=2, ledge=None, redge='V')
    neck(g)
    P(g, 15, 24, ['Rr', 'Rr', 'rR', 'Rr', ' r'])     # loosened tie
    P(g, 10, 23, ['o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o'])   # suspenders
    P(g, 21, 23, ['o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o'])
    P(g, 10, 27, ['G']); P(g, 21, 27, ['G'])
    P(g, 3, 26, ['rRr']); P(g, 26, 26, ['rRr'])   # sleeve garters
    face(g, 8, 3, 16, 19, ear_row=9)
    # tousled hair under the visor
    P(g, 7, 2, """
   HhhjhH hHhH
  HhjjhhhHhhhhH
 HhjhhhhhhhhhhhH
 HhhhhhhhhhhhhhH
""")
    # the visor: green band, translucent brim throwing green shade on the brow
    P(g, 6, 6, """
 eeeeeeeeeeeeeeee
EEEEEEEEEEEEEEEEEEe
 zEzzzzzzzzzzzzzEe
  eeeeeeeeeeeeeee
""")
    P(g, 8, 10, ['h', 'H']); P(g, 23, 10, ['h', 'H'])
    eyes(g, 10, 12, 8, 'open', brow=('up', 'up'))
    P(g, 10, 12, ['wK', 'KK']); P(g, 18, 12, ['wK', 'KK'])
    P(g, 15, 14, ['s', 'tt'])
    P(g, 9, 16, ['aa']); P(g, 20, 16, ['aa'])
    P(g, 12, 17, ['KKKKKKKK', 'KwwwwwwK', ' KrrrrK', '  KKKK'])
    # chart arrow going up, behind on the right
    P(g, 24, 2, """
  zzz
   zz
  z z
 z
""")
    P(g, 24, 6, ['z', '', ''][:1])
    return g
