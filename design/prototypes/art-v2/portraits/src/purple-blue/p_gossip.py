# Gossip: hair in curlers, eyes sliding sideways, an "ooh" mouth, hoop earrings, a speech bubble full of dots.
from lib import *
ID, NAME, SPHERE = 'purple.gossip', 'Gossip', 'purple'
def draw():
    g = new()
    body(g)
    face(g, rows={0: 'hhSSSSSSSSSSShhh', 2: 'SSSttSSSSSSttsst', 3: 'SSSwKSSSSSSwKsst', 4: 'SSSKKSSSSSSKKsst',
                  6: 'SaaSSSttSSSSaast', 8: ' SSSSSSSSKKSsst ', 9: ' SSSSSSSKrrKsst ', 10: '  SSSSSSSKKSst  '})
    at(g, 7, 4, [' hhhhhhhhhhhhhhH ', 'hhjhhhhhhhhhhhhHH', 'hjhhhhhhhhhhhhhHH', 'hhhhhhhhhhhhhhHHH',
                 'hhh           hHH', 'hh             HH'])
    at(g, 6, 8, ['hh', 'hh', 'h']); at(g, 24, 8, [' H', 'HH'])
    for x in (8, 12, 16, 20):  # curlers
        at(g, x, 2, ['qqq', 'WWW', 'qqq']) if x != 8 else at(g, x, 3, ['qqq', 'WWW', 'qqq'])
    at(g, 20, 3, ['qqq', 'WWW', 'qqq'])
    at(g, 6, 13, [' GG', 'G  ', 'G  ', ' GG']); at(g, 24, 13, ['GG ', '  G', '  G', 'GG '])
    at(g, 1, 13, [''])
    at(g, 2, 7, [' WWWWW ', 'WKWKWKW', ' WWWWV ', '   WV  ', '  V    '])
    # a housecoat with a ruffled collar
    at(g, 10, 22, ['WWW', 'WVWW', ' WVW']); at(g, 19, 22, ['WWV', 'WVWV', 'VWV'])
    for y in range(25, 32): g.c[y][16] = '1'
    return g
