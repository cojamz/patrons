# Broker: slicked hair with a side part, a sly grin, pinstripe suit, blue shirt, red tie, ticker tape curling past.
from common import *
ID = 'trading.broker'
def draw():
    g = new()
    # ticker tape ribbon down the left of the doorway
    g.put(3, 3, ['    WV', '   WV ', '  WK  ', ' WV   ', ' WK   ', '  WV  ', '   KV ', '   WV ', '  WK  ', ' WV   ', ' KV   ', '  WV  ', '   WK ', '   WV ', '  WK  '])
    shoulders(g)
    for y in range(23, 32):  # pinstripes
        for x in range(3, 29):
            if g.c[y][x] == '3' and x % 3 == 1: g.c[y][x] = '2'
    # shirt and lapels
    g.put(12, 22, ['1UUUUUUU1', '21UUUUU12', '421UUU124', '3421U1243', '33421243', '334212433', '3334243', '3333423'])
    g.put(12, 22, ['    ', ])
    g.put(15, 22, ['RRR', 'RRr', ' Rr', ' Rr', ' rr', ' Rr', '  r'])  # tie
    g.put(14, 22, ['s', ]); g.put(18, 22, ['t'])
    g.put(5, 26, ['W'])  # pocket square
    head(g, 8, 3, [
        '   HHHHHHHHH    ',
        '  HhjjjjhhhhHH  ',
        ' HhjjjhHhhhhhHH ',
        'HhjjhhHhhhhhhhhH',
        'HhhhhHhhhhhhhhhH',
        'HhSSSSSSSSSSSShH',
        'hSSSSSSSSSSSSssH',
        'SSSSSSSSSSHHHsst',
        'SHHHSSSSSSSSSsst',
        'SSwKSSSSSSwKSsst',
        'SSKKSSSSSSKKSsst',
        'SSSSSSStSSSSSsst',
        'SaaSSSttSSSSaast',
        'SSSSSSSSSSSSKsst',
        ' SSSKwwwwwwKsst ',
        ' SSSSKKKKKKSsst ',
        '  SSSSSSSSSSst  ',
        '   sSSSSSSSst   ',
        '    tsssssst    ',
    ])
    g.put(7, 12, ['s', 's', 't']); g.put(24, 12, ['t', 't', 't'])
    return g.rows()
