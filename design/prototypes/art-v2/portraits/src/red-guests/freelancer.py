# Freelancer: big purple headphones, round glasses, pencil tucked in messy hair, a smock spattered in every color.
from common import *
def draw(g):
    doorway(g); shoulders(g)
    g.put(14, 22, ['ssss', ' tt '])
    g.put(11, 22, ['3', '33']); g.put(20, 22, ['2', '22'])
    g.put(12, 22, ['WV', 'WV']); g.put(18, 22, ['WV', 'WV'])
    for (x, y, k) in [(4, 26, 'x'), (5, 27, 'x'), (9, 29, 'y'), (10, 29, 'y'), (10, 30, 'y'), (22, 25, 'z'), (23, 26, 'z'), (26, 29, 'n'), (27, 29, 'n'), (15, 28, 'x'), (19, 30, 'n'), (7, 24, 'z')]:
        g.c[y][x] = k
    face(g, 8, 9)
    g.put(7, 2, ['     hhjHhhH    ',
                 '   hjhhhhhhhhH  ',
                 '  hjjhhhhhhhhhH ',
                 ' hjhhhhhhhhhhhhH',
                 ' jhhhhhhhhhhhhhhH',
                 'hhhhhhhhhhhhhhhhH',
                 'hhh hhhh hhhhh hH',
                 'Hh   h    h     HH'])
    g.put(3, 1, ['  Yq', ' YY ', 'YY  ', 'o   '])
    g.put(3, 1, ['    ', '  Yq', ' YY ', 'oY  '])
    # headphones
    g.put(7, 2, ['     PPPPPPPP     '])
    g.put(5, 3, ['  PP', ' PP', 'PP', 'P', 'P', 'P'])
    g.put(24, 3, ['pp', ' pp', '  p', '  p', '  p', '  p'])
    g.put(4, 9, [' PPp', 'PPPp', 'PPPp', 'PPPp', 'PPPp', ' pp'])
    g.put(23, 9, ['pPP ', 'pPPp', 'pPPp', 'pPPp', 'pPPp', ' pp'])
    g.put(8, 9, ['p'] * 5); g.put(23, 9, ['p'] * 0)
    # round glasses
    g.put(9, 11, [' KKKK  KKKK ', 'KiwK KKKiwKK', 'KKKiK  KKKiK', ' KKKK  KKKK '][0:0])
    g.put(9, 11, [' KKK    KKK ', 'KwK iKKKwK iK', 'KKK iK KKK iK', ' KKK    KKK '][0:0])
    g.put(9, 11, [' NNNN  NNNN ', 'NwKSN  NwKSN', 'NKKSNNNNKKSN', ' NNNN  NNNN '][0:0])
    g.put(9, 11, [' NNN    NNN ', 'NwKSN  NwKSN', 'NKKSNNNNKKSN', ' NNN    NNN '])
    g.put(9, 11, ['    ', 'N   ', 'N   ', '    '][0:0])
    g.c[15][15] = 't'; g.put(15, 15, [''])
    g.put(14, 15, ['tt'])
    g.put(9, 15, ['a']); g.put(21, 15, ['a'])
    g.put(13, 17, ['KK  K', '  KK '][0:0])
    g.put(13, 17, ['K   K', ' KKK '])
