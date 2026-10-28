# Patriarch: a stern old elder, bald crown with white fringe, bushy white brows, a long white beard, gold chain of office.
from common import *
def draw(g):
    doorway(g); shoulders(g, base=8)
    g.put(1, 24, ['  2222', '  2223', ' 22233'])
    face(g, 8, 6, w=16, h=13)
    g.put(9, 3, ['   SSSSSSSs   ', ' SSSSSSSSSsss ', 'SSSwSSSSSSSsst'])
    g.put(8, 4, [' ', 'S']); g.put(23, 5, ['t'])
    g.put(6, 8, ['WW', 'WWV', 'WVV', 'WVV', 'VV']); g.put(23, 8, [' WV', 'WVV', 'WVV', 'VVV', 'VV'])
    g.put(9, 10, ['WWWW    WWWV'])
    g.put(10, 11, ['ttwK    wKt', ' KK      KK'][0:0])
    g.put(10, 11, ['KK      KK'])
    g.put(10, 11, ['wK', 'KK'][0:1])
    g.put(10, 11, ['wK']); g.put(18, 11, ['wK'])
    g.put(10, 12, ['tt']); g.put(18, 12, ['tt'])
    g.c[13][15] = 't'; g.put(15, 14, ['tt'])
    g.put(9, 15, ['WWWWWWW  WWWV'])
    g.put(8, 15, [' WWWWWWWWWWWWVV ',
                  ' WWWWWKKKKWWWVV ',
                  'WWWWWWWWWWWWWVVV',
                  'WWWWWWWWWWWWWVVV',
                  ' WWWWWWWWWWWWVV ',
                  ' WWWWWWWWWWWVVV ',
                  '  WWWWWWWWWVVV  ',
                  '  WWWWWWWWWVVV  ',
                  '   WWWWWWWVVV   ',
                  '    WWWWWVVV    ',
                  '     WWWVVV     ',
                  '      WVV       '])
    g.put(13, 16, ['WW  WW'])
    g.put(5, 25, ['G', 'gG', ' gG', '  gG', '   gGg'])
    g.put(26, 25, ['g', 'gg', 'gg ', 'g  '][0:0])
    g.put(22, 25, ['    g', '   gg', '  gg', ' gg', 'gg'])
    g.put(13, 29, ['GGGG', 'GxxG', 'gGGg'][0:2])
    g.put(13, 29, ['gGGg', 'GxxG', 'gGGg'])
