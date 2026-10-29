# Tycoon: tall top hat with a gold band, monocle, white walrus mustache, cigar with smoke, fur collar, diamond stickpin.
from lib import *
def draw():
    g = new()
    torso(g, half0=9, step=3)
    torso_vee(g, depth=7, half=3, fill='W', every=2, ledge=None, redge='V')
    neck(g)
    P(g, 15, 23, ['KK', 'KK', 'Lw', 'KK', 'KK', 'K'])          # cravat, diamond pin
    # fur collar
    P(g, 3, 21, """
  WWW               WVV
 WWWVWW           VWVVVV
WWVWWVW           WVVWVVV
VWWWVVW           VVVWVVV
 WVWWV             VWVVV
  VVW               VV
""")
    P(g, 17, 27, ['G', ' G', '  gG'])                      # watch chain
    face(g, 7, 6, 18, 16, ear_row=6, shade=3)
    # top hat
    P(g, 9, 0, """
 KDDDDDDDDDDK
 KNDDDDDDDDDK
 KNDDDDDDDDDK
 GGGGGGGGGGGg
 gggggggggggg
KNNDDDDDDDDDDK
""")
    P(g, 6, 6, ['DDDDDDDDDDDDDDDDDDDD', ' KKKKKKKKKKKKKKKKKK'])
    P(g, 7, 8, ['WW', 'W']); P(g, 23, 8, ['VV', ' V'])      # white sideburns
    P(g, 7, 10, ['WV', 'W']); P(g, 23, 10, ['V', 'VV'])
    # eyes: monocle on his left (viewer's right)
    P(g, 10, 10, ['KK', '', ''][:1])
    eyes(g, 10, 12, 8, 'open', brow=('t', 't'))
    P(g, 10, 10, ['WWW']); P(g, 17, 10, ['WWWW'])          # white brows
    P(g, 17, 11, ['GGGG', 'G  G', 'G  G', 'GGGG'])
    P(g, 18, 12, ['wK', 'KK'])
    P(g, 21, 14, ['g', 'g', ' g', ' g'])                   # monocle cord
    P(g, 15, 14, ['s', 'tt'])
    P(g, 8, 15, ['aaa']); P(g, 21, 15, ['aa'][:1])
    # walrus mustache
    P(g, 9, 16, """
  WWWWWWWWWWW
 WWWVWWWVWWVV
WWVV VVV  VVVV
WV          VV
""")
    P(g, 13, 19, ['KKKKK'])
    # cigar out the side, ember and smoke
    P(g, 18, 19, ['OOOOOOx', 'ooooooR'])
    P(g, 25, 14, [' M', 'L', ' M', '  L'])
    P(g, 26, 11, ['L', ' M'])
    return g
