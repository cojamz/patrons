# Timekeepers (counts as 1): one keeper of the hours. A deep purple hood, a long white beard, calm knowing eyes, a big
# brass hourglass pendant on a chain; golden motes of sand drifting in the doorway.
from lib import *
def draw():
    g = new()
    body(g, top=21, start=9)
    for x, y in ((3, 12), (28, 10), (4, 5), (27, 18), (2, 19)): g.c[y][x] = 'G'  # motes of sand drifting
    ellipse(g, 16, 13, 10, 12, keys='4321')  # the hood
    head(g, 9, 6, [
        '  2222222222  ',
        ' 211111111112 ',
        'HSSSSSSSSSSssH',
        'SSSSSSSSSSSsst',
        'SMMMSSSSMMMsst',
        'SwKKSSSSwKKsst',
        'SSSSSSStSSSsst',
        'SaaSSSttSSaast',
        'SWWWWWWWWWWVst',
        'WWWWWVKKVWWWVV',
        'WWWWWWWWWWWVVV',
        'WWWWWWWWWWVVVV',
        ' WWWWWWWWVVVV ',
        '  WWWWWWWVVV  ',
        '   WWWWWVVV   ',
        '    WWWVVV    ',
        '     WVV      ',
    ])
    at(g, 13, 23, ['g    g', ' g  g ']); at(g, 15, 25, ['GG', 'gw', 'Yg', 'YY', 'GG'][:5])  # chain and hourglass
    at(g, 14, 25, ['G', ' ', ' ', ' ', 'G']); at(g, 17, 25, ['g', ' ', ' ', ' ', 'g'])
    at(g, 15, 25, ['GG', 'Yw', 'gY', 'YY', 'GG'])
    return g
