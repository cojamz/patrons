# Early Bird: up at dawn and chipper. Neat hair, a little songbird perched on top, a sweater vest over a collar.
from lib import *
ID, NAME, SPHERE = 'purple.earlybird', 'Early Bird', 'purple'
def draw():
    g = new()
    body(g)
    face(g, rows={0: 'HhhhSSSSSSSSShhH', 2: 'SttSSSSSSSSttsst', 3: 'SwKKSSSSSSwKKsst', 4: 'SKKKSSSSSSKKKsst',
                  8: ' SSSKSSSSSKSsst ', 9: ' SSSSKWWWKSSsst ', 10: '  SSSSKKKSSSst  '})
    at(g, 8, 4, ['  hhhhhhhhhhhh  ', ' hjjjhhhhhhhhhH ', 'hjjhhhhhhhhhhhHH', 'hhhhhhhhhhhhhHHH', 'hhhhHHHHhhhhhHHH'])
    at(g, 7, 8, ['h', 'h', 'h']); at(g, 24, 8, ['H', 'H'])
    # songbird on top of the head
    at(g, 12, 0, ['  YYY  ', ' YYwKYn', 'YYYYYYnn', 'GYYYYY  ', ' GGYYY  '])
    at(g, 10, 2, ['Gg'])
    at(g, 14, 5, ['n n'])
    # white collar under a sweater vest
    at(g, 12, 22, ['WW', 'WWW', ' WWW']); at(g, 18, 22, ['VV', 'VVV', 'VVV'])
    at(g, 14, 25, ['1  1', ' 11 ']); g.c[24][15] = 'W'; g.c[24][16] = 'W'
    for y in (27, 30): g.c[y][16] = 'W'
    for x, y in [(4, 4), (26, 5), (3, 10)]: at(g, x, y, [' w ', 'wGw', ' w '])  # morning sparkle
    return g
