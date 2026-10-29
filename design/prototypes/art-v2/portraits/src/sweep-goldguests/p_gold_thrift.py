# Penny Pincher: old miser, bald with white tufts, half-moon specs, long nose, sly grin, fingerless glove pinching a penny, patched coat.
from lib import *
def draw():
    g = new()
    torso(g, half0=6, step=3)
    torso_vee(g, depth=5, half=2, fill='W', every=3, ledge=None, redge='V')
    neck(g)
    P(g, 20, 27, ['oooo', 'oOOo', 'oOOo', 'oooo'])     # patch
    face(g, 8, 3, 16, 19, ear_row=9)
    # bald dome with a shine, white tufts over the ears
    P(g, 11, 5, ['ww'])
    P(g, 5, 9, """
 WWV              VVW
WWWVV            VVWWW
 WVWV            VWVW
  WV              VW
""")
    P(g, 10, 10, ['WWW']); P(g, 18, 10, ['VVW'])
    # small squinting eyes, half-moon specs down the nose
    P(g, 10, 12, ['tt', 'KK']); P(g, 18, 12, ['tt', 'KK'])
    P(g, 9, 14, ['NiiN    NiiN', ' NN      NN ']); P(g, 13, 14, ['LNNN'])
    P(g, 15, 13, ['s', 's', 'st', 'tt'])
    P(g, 12, 18, ['KK     ', '  KKKKK', '      K'])   # sly lopsided grin
    # chin stubble
    # a penny pinched up between finger and thumb, fingerless glove
    P(g, 1, 14, """
  GG
 GwGg
 GGgg
  gg
 S  S
 SssS
 SSSt
OOOOOo
OoOOoo
 Oooo
 433
 4333
 43333
""")
    return g
