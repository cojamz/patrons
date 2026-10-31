# Big Spender: slicked pompadour, gold-rimmed shades, gold-tooth grin, fur-collared coat over a gold chain,
# bills fluttering round him.
from lib import *
def draw():
    g = new()
    torso(g, half0=8)
    torso_vee(g, depth=8, half=4, fill='D', every=2, ledge=None, redge='K')   # dark silk shirt
    neck(g)
    P(g, 12, 25, ['G     G', ' G   G', '  GgG', '   n'])   # gold chain, medallion
    P(g, 2, 21, """
 WWVW               VWWV
WWWVWWV           VWWVVWV
WVWWWVW           WVWVVVV
WWWVWW             VWVVV
 WWVW               VWV
""")
    face(g, 8, 5, 16, 17, ear_row=7)
    # big glossy pompadour
    P(g, 6, 0, """
      HHhhhH
   HHhhjjjjhhH
  HhjjjjjjhhhhhH
 HhjjhhhhhhhhhhhH
 HhjhhhhhhhhhhhhhH
  Hhh            HhH
  Hh              hH
""")
    # gold-rimmed shades
    P(g, 9, 10, """
GGGGGGGGGGGGGG
GDDwDGGGGDDwDG
GDDDDG  GDDDDG
 GDDG    GDDG
""")
    P(g, 8, 10, ['g']); P(g, 23, 10, ['g'])
    P(g, 15, 14, ['s', 'tt'])
    P(g, 12, 17, ['KKKKKKKK', 'KwwGwwwK', ' KKKKKK'])
    # making it rain: bills fluttering round his head
    flat = ['zzzzz', 'zEWEz', 'zzzzz']
    tilt = ['  zz', ' zEzz', 'zzWz', 'zEzz', 'zz']
    P(g, 24, 3, flat); P(g, 2, 9, tilt); P(g, 25, 11, tilt); P(g, 3, 16, flat)
    return g
