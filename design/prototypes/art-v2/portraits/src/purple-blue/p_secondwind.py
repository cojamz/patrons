# Go-Getter: a runner who never stops. Spiky hair, red sweatband, track jacket with white stripes, big grin, a sweat drop.
from lib import *
ID, NAME, SPHERE = 'purple.secondwind', 'Go-Getter', 'purple'
def draw():
    g = new()
    body(g)
    face(g, rows={1: 'SttSSSSSSSSSttst', 2: 'SSSttSSSSttSSsst',
                  8: ' SSKWWWWWWKSsst ', 9: ' SSSKrrrrKSSsst ', 10: '  SSSKKKKSSSst  '})
    at(g, 8, 2, ['  h   hj   h  h ',
                 ' hhh hjjh hhh hh',
                 'hhjjhhjjhhhhhhhH',
                 'hjjhhhhhhhhhhhHH',
                 'hhhhhhhhhhhhhHHH'])
    at(g, 7, 7, ['qqqRRRRRRRRRRrrrr', 'RRRRRRRRRRRRRrrrr'])
    at(g, 24, 6, ['  Rr', ' Rrr', 'rr  '])  # the band's tails flying back
    at(g, 26, 10, [' y ', 'yyy', 'ywy', ' y '])  # sweat
    at(g, 4, 3, ['  ii', ' ii ', 'ii  '])        # speed lines
    at(g, 3, 6, ['  ii', ' ii '])
    # track jacket: stand-up collar, zip, white stripes over the shoulders
    at(g, 11, 21, ['44', '443', ' 43']); at(g, 19, 21, [' 22', '221', '21 '])
    for y in range(24, 32): g.c[y][16] = 'N'
    g.c[23][16] = 'L'
    for y in range(24, 32):
        g.c[y][max(1, 9 - (y - 24) * 2)] = 'W'; g.c[y][min(30, 22 + (y - 24) * 2)] = 'V'
    return g
