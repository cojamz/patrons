# Cheerleader: high ponytail with a big red bow, eyes shut in a huge open cheer, pom-poms either side,
# a varsity sweater with a chevron.
from lib import *
def pom(g, x, y, a, b, c):
    P(g, x, y, [f' {a} {a}{b} ', f'{a}{b}{a}{b}{a}{b}', f'{b}{a}w{a}{b}{a}', f'{a}{b}{a}{b}{a}{c}', f'{b}{a}{b}{a}{c}{b}', f' {c}{b}{c}{b} ', f'  {c} {c}'])
def draw():
    g = new()
    torso(g)
    neck(g)
    # chevron on the sweater
    P(g, 9, 24, ['RR          RR', ' RR        RR', '  RR      RR', '   RR    RR', '    RR  RR', '     RRRR', '      RR'])
    P(g, 12, 22, ['WW    VV'])
    face(g, 8, 5, 16, 17, ear_row=7)
    # hair with a high ponytail and bow
    P(g, 7, 1, """
          Rr  rR
          RRqqRR
       HhhhRrrRhH
   HHhhhhjhhhhhhhhH
  HhhjjjhhhhhhhhhhH
 HhjjhhhhhhhhhhhhhhH
 Hhjhhhhhhhhhhh hhhH
 Hhh h          hhH
 Hh              hH
 H               hH
 H                H
""")
    P(g, 22, 7, ['hhH', 'hhhH', ' hhH', ' hhH', '  hH', '  H'])  # ponytail falling right
    eyes(g, 10, 12, 8, 'happy')
    P(g, 15, 14, ['tt'])
    P(g, 9, 15, ['aaa']); P(g, 20, 15, ['aaa'])
    P(g, 12, 16, ['KKKKKKKK', 'KwwwwwwK', 'KrrqqrrK', ' KrrrrK', '  KKKK'])
    pom(g, 0, 14, 'q', 'x', 'r'); pom(g, 26, 14, 'Y', 'n', 'g')
    return g
