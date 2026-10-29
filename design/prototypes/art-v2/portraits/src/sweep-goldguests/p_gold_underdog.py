# Underdog: scrappy kid, newsboy cap, a shiner and a plaster, gap-toothed determined grin, patched shirt, rolled sleeves.
from lib import *
def draw():
    g = new()
    torso(g, half0=6)
    neck(g)
    P(g, 13, 22, ['W', 'WV'][:2]); P(g, 18, 22, ['V'])
    P(g, 14, 24, ['G', '', 'G', '', 'G'])                   # buttons
    P(g, 6, 26, ['oooo', 'oOOo', 'oOOo', 'oooo'])           # patch on the shirt
    P(g, 22, 28, ['VV', 'VV'])                              # rolled-up sleeve
    face(g, 8, 4, 16, 18, ear_row=8)
    # newsboy cap, cocked
    P(g, 6, 1, """
      NNNNNNNN
    NNMMNNNNNNNN
   NMMNNNNNNNNNNN
  NMNNNNNNNMNNNNNN
  NNNNNNNNNNNNNNNNN
  NNNNNNNNNNNNNNNNN
  DDDDDDDDDDDDDDDDD
  KKKKKKKK  KKKKKK
""")
    P(g, 14, 3, ['NM'])
    P(g, 8, 8, ['hh', 'h']); P(g, 22, 8, ['hH', ' H'])
    # eyes: one with a shiner
    eyes(g, 10, 12, 8, 'open', brow=('angry_l', 'angry_r'))
    P(g, 9, 14, ['pPp'])
    P(g, 9, 11, ['p'])
    P(g, 15, 14, ['s', 'tt'])
    # plaster on the right cheek
    P(g, 18, 15, ['WVW', 'VWV', 'WVW'])
    P(g, 9, 16, ['aa'])
    P(g, 12, 18, ['KKKKKKKK', ' KwKwwK', '  KKKK'])
    return g
