# Window Shopper: nose to the glass. A beret, wide starry eyes looking up at the goods, an "ooh" smile,
# window glare streaking the doorway, a price tag hanging in view.
from lib import *
ID, NAME, SPHERE = 'market.windowshopper', 'Window Shopper', 'blue'
def draw():
    g = new()
    for y in range(1, 32):  # glare streaks on the glass
        for x0 in (4, 9):
            x = x0 + 14 - y
            if 0 <= x < 32 and g.c[y][x] == 'b': g.c[y][x] = 'i'
            if 0 <= x + 1 < 32 and g.c[y][x + 1] == 'b' and x0 == 4: g.c[y][x + 1] = 'i'
    body(g)
    face(g, rows={0: 'hhSSSSSSSSSSShhh', 2: 'SSttSSSSSSttSsst', 3: 'SSwKKSSSSSwKKsst', 4: 'SSKKKSSSSSKKKsst',
                  5: 'SSKwKSStSSKwKsst', 6: 'SaaSSSttSSSSaast', 8: ' SSSSKSSSKSSsst ', 9: ' SSSSSKKKSSSsst '})
    at(g, 7, 2, ['     4433333    ', '   44333333332  ', ' 443333333333322 ', '1222222222222222211'])
    at(g, 15, 1, ['1'])
    at(g, 6, 6, ['hhhhhhhhhhhhhhhhhHH', 'hhhh          hhhH'])
    at(g, 6, 8, ['hh', 'hhh', 'hh', 'hh', 'hh', 'h']); at(g, 24, 8, ['HH', 'HH', 'HH', 'HH', 'H'])
    at(g, 24, 2, ['  K', ' K ', 'WWW', 'WWWW', 'WKKW', 'WWWW'])  # price tag
    # scarf
    at(g, 10, 21, ['  RRRRRRRRRRr', 'qRRRRRRRRRRRr', ' RRRRRRRRRRrr', '        Rrr', '        Rr', '        RR', '        rr'])
    return g
