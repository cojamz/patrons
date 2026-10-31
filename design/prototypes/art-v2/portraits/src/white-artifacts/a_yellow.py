# Farmer: a yellow straw hat, wide woven brim, red band, a stalk of wheat tucked in.
from common import *
ID = 'artifact.yellow'
def draw():
    g = blank()
    ellipse(g, 16, 21.5, 15.5, 5.5, cuts=(-0.5, 0.25, 0.7))  # brim
    ellipse(g, 15.5, 14, 7.5, 9, clip=lambda x, y: y < 20)  # crown
    for y in range(N):
        for x in range(N):
            if g.c[y][x] in '34' and (x * 2 + y * 3) % 5 == 0: g.c[y][x] = '2'
    for x in range(8, 24):
        g.c[17][x] = 'R' if x < 21 else 'r'; g.c[18][x] = 'r' if x > 9 else 'R'
    g.put(7, 17, ['R', 'r'])
    # wheat
    g.put(20, 3, ['    G ', '   GgG', '  GgG ', '   gG ', '  GgG ', '  gG  ', ' GgG  ', ' gG   ', ' g    ', 'g     ', 'g     ', 'g     ', 'g     ', 'g     '])
    g.put(9, 8, ['ww', 'w'])
    return g.rows()
