# Host: a beaming party host, slick pomaded hair, pencil mustache, eyes shut with delight, bow tie and dinner jacket, confetti.
from common import *
def draw(g):
    doorway(g); shoulders(g)
    g.put(10, 22, ['12WWWWWWWW21', ' 12WWWWWV21 ', '  12WWWV21  ', '   12WV21   ', '   12WV21   ', '   12WV21   ', '   12WV21   ', '   12WV21   ', '   12WV21   ', '   12WV21   '])
    g.put(15, 26, ['K']); g.put(15, 29, ['K'])
    face(g, 8, 9)
    g.put(13, 22, ['KN  NK', 'KKKKKK', 'KK  KK'])
    g.put(7, 3, ['     jjhhhhhH     ',
                 '   jjjhhhhhhhhH   ',
                 '  jjhhhhhhhhhhhH  ',
                 ' jjhhhhhhhhhhhhHH ',
                 ' jhhwjjhhhhhhhhhH ',
                 'Hhhhhhhhhh hhhhhHH',
                 'Hhh    hh     hhhH'])
    g.put(7, 10, ['H', 'H']); g.put(24, 10, ['H', 'H'])
    g.put(10, 12, [' KK     KK ', 'K  K   K  K'])
    g.c[14][15] = 't'; g.put(14, 15, ['tt'])
    g.put(9, 15, ['aa']); g.put(20, 15, ['aa'])
    g.put(13, 16, ['HHHHHH'])
    g.put(11, 17, ['K        K', ' KKKKKKKK '])
    for (x, y, k) in [(4, 6, 'x'), (26, 4, 'y'), (3, 13, 'n'), (27, 11, 'z'), (4, 18, 'G'), (27, 18, 'x'), (22, 1, 'G'), (9, 2, 'y'), (5, 10, 'z'), (25, 8, 'n'), (6, 3, 'G')]:
        g.c[y][x] = k
