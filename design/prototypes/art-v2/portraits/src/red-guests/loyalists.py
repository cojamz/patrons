# Loyalists: a sworn palace guard, tall bearskin hat, gold chin strap, unblinking stare, tunic with gold buttons and a white cross-belt.
from common import *
def draw(g):
    doorway(g); shoulders(g)
    g.put(1, 22, ['', '', ' GGGG', 'GGGG'][0:0])
    g.put(3, 25, ['GgGg'][0:0])
    for j, x in enumerate(range(6, 16)):
        g.put(x, 22 + j, ['WWV'])
    g.put(14, 21, ['1111', '1GG1', '1111'])
    g.put(12, 21, ['11', '11']); g.put(18, 21, ['11', '11'])
    for y in (25, 28, 31): g.put(16, y, ['G'])
    g.put(2, 25, ['GG', 'gg']); g.put(28, 25, ['gg', 'gg'])
    face(g, 8, 10, w=16, h=12)
    g.put(9, 0, ['   NNDDDDD    ',
                 '  NDDDDDDDDK  ',
                 ' NDDNDDDNDDDK ',
                 ' NDDNDNDDNDDK ',
                 'NDDDDDNDDDDNDK',
                 'NDNDDDNDDNDNDK',
                 'NDNDNDDDDNDDDK',
                 'NDDDNDDNDDDNDK',
                 'NDDDDDDNDDNDDDK',
                 'DDDDNDDDDDDDDDK',
                 'DDDDDDDDDDDDDDK'])
    g.put(8, 8, ['N', 'D', 'D'])
    g.put(6, 4, [' x', 'xqx', 'xxr', 'xxr', ' xr', ' r'])
    g.put(8, 11, ['tttttttttttttttt'])
    eyes(g, 10, 13, brow=False)
    g.put(10, 12, ['tt      tt'])
    g.c[15][15] = 't'; g.put(14, 16, ['tt'])
    g.put(13, 18, ['KKKKK'])
    g.put(7, 13, ['G', 'G', 'G', 'G', 'G', ' G', '  G', '   G'])
    g.put(24, 13, ['g', 'g', 'g', 'g', 'g', 'g', 'g ', 'g'])
    g.put(23, 19, ['g'][0:0])
    g.put(10, 20, ['GG']); g.put(20, 20, ['gg', ''])
    g.put(11, 21, ['GGGGGGGGgg'][0:0])
    g.put(23, 19, ['g', 'g']); g.put(22, 20, ['g'])
