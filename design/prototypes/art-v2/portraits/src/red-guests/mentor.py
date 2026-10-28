# Mentor & Protégé: a gray-haired mentor in gold spectacles and a mustache, beside an eager kid in a propeller cap.
from common import *
def draw(g):
    doorway(g)
    shoulders(g, cx=10, top=21, base=6, step=3, maxhalf=11)
    g.put(8, 21, ['WVVW', 'WttV', ' WV ', ' 11 ', ' 11 ', ' 12 ', ' 11 ', ' 12 ', ' 11 ', ' 11 '])
    shoulders(g, cx=23, top=24, base=5, step=2, maxhalf=9)
    # mentor
    face(g, 4, 8, w=13, h=13)
    g.put(3, 3, ['   MMMMMMM    ',
                 '  LMMMMMMMMN  ',
                 ' LMMSSSSSSMMN ',
                 'LMM SSSSSSS MN',
                 'LM          MN',
                 'M            N',
                 'M            N'])
    g.put(6, 10, ['MM    MM'])
    g.put(5, 11, [' GG    GG ', 'GwKGggGwKg', 'gKKg  gKKg', ' gg    gg '])
    g.c[14][9] = 't'; g.put(8, 15, ['tt'])
    g.put(5, 16, ['MMMMMMM', 'N     N'])
    g.put(7, 17, ['tKKt'])
    g.put(5, 15, ['a'])
    # protégé
    face(g, 18, 14, w=10, h=10)
    g.put(17, 10, ['   44332    ',
                   ' 44333333221',
                   '443333333221',
                   'hhhhjhhhhhHH',
                   'h          H'])
    g.put(21, 6, ['Y Y', ' 1', ' 1', ' 1'])
    g.put(20, 6, ['Y']); g.put(22, 6, ['Y']); g.put(21, 6, ['n'])
    g.put(20, 16, ['wK  wK', 'KK  KK'])
    g.c[19][23] = 't'
    g.put(19, 19, ['a'][0]); g.c[19][26] = 'a'
    g.put(21, 20, ['KwwK', ' KK '])
    g.put(22, 24, ['sss'])
