# Shopkeeper: bald, side hair, handlebar mustache, pencil behind the ear, striped shirt, bow tie, shop apron.
from common import *
ID = 'trading.shopkeeper'
def draw():
    g = new()
    shoulders(g)
    for y in range(23, 32):  # shirt stripes
        for x in range(3, 29):
            if g.c[y][x] == '3' and x % 3 == 0: g.c[y][x] = '2'
    # apron with straps and a pocket
    g.put(10, 22, ['O', 'O', 'O']); g.put(21, 22, ['o', 'o', 'o'])
    g.put(10, 25, ['OOOOOOOOOOOo', 'OOOOOOOOOOOo', 'OOOOOOOOOOoo', 'OOOoooooOOoo', 'OOOoOOOoOOoo', 'OOOoooooOOoo', 'OOOOOOOOOooo'])
    g.put(14, 22, ['ssss', ' tt '])
    g.put(13, 22, ['RqrrR', 'RRrRr'])  # bow tie
    head(g, 8, 4, [
        '    SSSSSSSs    ',
        '  SSSSSSSSSSss  ',
        ' SSSSSSSSSSSSss ',
        ' SSSSSSSSSSSSsst',
        'hhSSSSSSSSSSSsHH',
        'hhSSSSSSSSSSSsHH',
        'hhHHHSSSSSHHHsHH',
        'hSwKSSSSSSwKSssH',
        'hSKKSSSSSSKKSssH',
        'SSSSSSStSSSSSsst',
        'SaaSSSttSSSSaast',
        'SHHHHHHHHHHHHHst',
        'SSSSKSSSSSKSSsst',
        ' SSSSKKKKKSSSst ',
        '  SSSSSSSSSSst  ',
        '   sSSSSSSSst   ',
        '    tsssssst    ',
    ])
    g.put(7, 11, ['s', 's', 't']); g.put(24, 11, ['t', 't', 't'])
    g.put(6, 14, ['H', 'HH']); g.put(24, 14, [' H', 'HH'])  # mustache curls
    g.put(23, 6, ['  q', '  Y', ' Y ', ' Y ', 'V  '])  # pencil behind the ear
    g.c[11][23] = 'K'
    return g.rows()
