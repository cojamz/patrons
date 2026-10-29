# Tax Collector: bowler hat, pencil behind the ear, narrow eyes, pencil mustache and a frown, starched collar, dark tie, ledger.
from lib import *
def draw():
    g = new()
    torso(g)
    torso_vee(g, depth=6, half=3, fill='W', every=2, ledge='V', redge='V')
    neck(g)
    P(g, 15, 23, ['DD', 'ND', 'DD', 'DD', 'DD', 'DD', 'DD'])
    P(g, 12, 22, ['WW    WW'])
    # ledger tucked under the arm, bottom right
    P(g, 22, 25, """
OOOOOOO
oWWWWxWo
oVVVVxVo
oWWWWWWo
oVVVVVVo
ooooooo
""")
    face(g, 8, 4, 16, 18, ear_row=8)
    P(g, 8, 10, ['HH', 'Hh', 'H']); P(g, 22, 10, ['hH', 'HH', ' H'])
    # bowler
    P(g, 7, 0, """
     DDDDDD
   DDNNDDDDDD
  DNNNDDDDDDDD
  DNNDDDDDDDDDK
  DNDDDDDDDDDDK
  KKKKKKKKKKKKK
DDNNDDDDDDDDDDDK
 KKKKKKKKKKKKKKK
""")
    P(g, 24, 7, ['qq', 'YY', 'YY', 'YY', 'Yg', 'oo'])    # pencil behind the ear
    P(g, 10, 11, ['KKK', '', ''][:1]); P(g, 18, 11, ['KKK'][:1])
    P(g, 10, 12, ['wK', 'KK']); P(g, 18, 12, ['wK', 'KK'])
    P(g, 10, 12, ['tt']); P(g, 18, 12, ['tt'])
    P(g, 10, 11, ['HHH']); P(g, 17, 11, ['HHH'])
    P(g, 15, 14, ['s', 'tt'])
    P(g, 12, 17, ['HHHH  HHHH'])
    P(g, 13, 19, [' KKKK ', 'K    K'])
    return g
