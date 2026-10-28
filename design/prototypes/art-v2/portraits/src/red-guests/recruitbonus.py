# Recruit Bonus: a winking hotshot recruiter, big pompadour, gold-tooth grin, a prize rosette pinned on, sparkles.
from common import *
def draw(g):
    doorway(g); shoulders(g)
    g.put(14, 22, ['ssss', ' tt '])
    g.put(10, 21, ['WWV', ' WWV', '  WV']); g.put(19, 21, ['VWW', 'VWW ', 'VW  '])
    face(g, 8, 9)
    g.put(7, 1, ['       jjjjhH     ',
                 '    jjjjhhhhhhH   ',
                 '  jjjhhhhhhhhhhHH ',
                 ' jjhhhhhwjhhhhhhHH',
                 'jjhhhhwjhhhhhhhhhH',
                 'jhhhhhhhhhhhhhhhHH',
                 'Hhhhhhhhhhhhhhhhh ',
                 ' Hhhhhh   hhhhhhH ',
                 ' Hh            hH '])
    g.put(7, 10, ['H', 'H']); g.put(24, 10, ['H', 'H'])
    g.put(10, 11, ['tt      tt'])
    g.put(10, 13, ['KK']); g.put(10, 12, ['  '])
    g.put(10, 12, ['SS', 'KK'])
    g.put(9, 13, ['K  ', ' KK'][0:1])
    g.put(18, 12, ['wK', 'KK'])
    g.c[14][15] = 't'; g.put(14, 15, ['tt'])
    g.put(9, 15, ['aa']); g.put(20, 15, ['aa'])
    g.put(11, 16, ['K        ', ' KwwwwGwK', '  KKKKKK '])
    g.c[16][20] = 'K'
    g.put(4, 23, [' yUy ', 'yUGUu', 'UGwGU', 'yUGUu', ' uUu ', ' U u ', 'U   u'])
    for (x, y) in [(4, 5), (26, 3), (27, 13)]:
        g.put(x - 1, y - 1, [' G ', 'GwG', ' G '])
    g.c[9][3] = 'G'; g.c[17][28] = 'G'
