# Plus-One: a date brought along. Two heads in the doorway: a guy in a tux with a bow tie, and his date with
# an updo and earrings, confetti in the air.
from lib import *
ID, NAME, SPHERE = 'market.plusone', 'Plus-One', 'blue'
def draw():
    g = new()
    for x, y, k in [(4, 4, 'x'), (26, 3, 'z'), (3, 13, 'n'), (28, 11, 'y'), (16, 1, 'x'), (9, 2, 'z'), (23, 1, 'n')]:
        g.c[y][x] = k
    body(g, start=12)
    # the date (left): updo bun and earrings
    at(g, 4, 3, ['   HHHH    ', '  HhjjhH   ', '  HhhhhH   ', ' HHhhhhHH  ', 'Hhjjhhhhhhh ', 'hjhhhhhhhhHH',
                 'hhSSSSSSShHH', 'hSSttSSttsH', 'SSwKSSSwKst', 'SSKKSSSKKst', 'SaaSSStSast', 'SSSSRRRSSst',
                 ' SSSSSSSst', '  tssssst '])
    at(g, 3, 13, ['s', 'G', 'G']); at(g, 15, 13, ['t', 'G', 'G'])
    # the guy (right): neat hair
    at(g, 17, 5, ['  HHhhhhhH  ', ' Hhjjjhhhhh ', 'Hhjhhhhhhhh', 'hhSSSSSSSHH', 'SSttSSSttst', 'SSwKSSSwKst',
                  'SSKKSSSKKst', 'SSSSSStSSst', 'SSKSSSSKsst', 'SSSKKKKSsst', ' SSSSSSSst', '  tssssst '])
    at(g, 16, 12, ['s', 't']); at(g, 28, 12, ['t', 't'])
    # her dress neckline with a pendant; his shirt and bow tie
    at(g, 7, 20, ['ssss', ' tt ']); at(g, 6, 22, ['SSSSSS', ' SSSS ', '  GG  '])
    at(g, 20, 19, ['ssss', ' tt ']); at(g, 18, 21, ['WWWWWWWW', ' WKKKKW ', ' WKwKKW', '  WWWW', '  WWWW'])
    for y in range(26, 32): g.c[y][22] = 'W'
    g.c[27][22] = 'K'; g.c[30][22] = 'K'
    return g
