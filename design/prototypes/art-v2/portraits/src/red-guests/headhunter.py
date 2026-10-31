# Headhunter: a slick corporate recruiter, side-parted hair, dark shades, earpiece, smirk, suit and skinny tie.
from common import *
def draw(g):
    doorway(g); shoulders(g)
    g.put(11, 22, ['1WWWWWWWW2', ' 1WWWWWV2 ', '  1WWWV2  ', '  11WV21  ', '   1WV2   ', '   1WV2   ', '   1WV2   ', '   1WV2   ', '   1WV2   ', '   1WV2   '])
    g.put(15, 22, ['KK', 'KK', 'KK', ' K', 'KK', 'KK', 'KK', 'KK', 'KK', 'KK'])
    g.put(15, 22, ['NK', 'KK', 'NK', 'NK', 'KK', 'NK', 'NK', 'KK', 'NK', 'KK'])
    g.put(5, 24, ['WWV', 'VVV'])
    face(g, 8, 9)
    g.put(7, 3, ['    HhhhhhhhhH    ',
                 '  Hhhjjhhhhhhhh   ',
                 ' Hhhhhjjjhhhhhhh  ',
                 'Hhhhhhhhjjjhhhhhh ',
                 'HhhhhhhhhhjjjhhhhH',
                 'Hhhhhhh  hhhjjhhhH',
                 'HHh         hhhhHH'])
    g.put(7, 10, ['H', 'H']); g.put(24, 10, ['H', 'H'])
    g.put(8, 11, ['KKKKKKKKKKKKKKKK', ' KDDDDDKKDDDDDK ', ' KDwDDDK KwDDDK ', '  KDDDK   KDDK  '])
    g.put(8, 11, ['K']); g.put(23, 11, ['K'])
    g.c[15][15] = 't'; g.put(14, 16, ['tt'][0:0])
    g.put(15, 15, ['tt'])
    g.put(13, 17, ['KKKKK', '    KK'][0:1])
    g.put(13, 17, ['tKKKKK', '     K'][0:1]); g.c[16][19] = 'K'
    g.put(24, 12, ['K', 'K', ' K', ' K', 'K', 'K', ' K', ' K', 'K'])
    g.put(24, 12, ['N'])
