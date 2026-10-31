# Cashier: green eyeshade visor, neat center-parted hair, round glasses, polite smile, vest and skinny tie,
# arm garters, stacks of coins at the till.
from common import *
ID = 'trading.cashier'
def draw():
    g = new()
    g.put(23, 12, ['  nn ', ' GGGg', ' gggg', ' GGGg', ' gggg', 'GGGg ', 'ggggn', 'GGGgG', 'gggggg', 'GGGgGg', 'gggggg'])  # coins
    shoulders(g)
    g.put(3, 26, ['  RR', ' RRr', 'Rr'])
    g.put(26, 26, ['rr', 'Rrr', ' Rrr'])
    # vest over the shirt
    g.put(8, 23, ['  2223  ', ' 22223  ', '222223  ', '2222223 ', '2222223 ', '2122223 ', '2222223 ', '2222223 ', '2222223 '])
    g.put(17, 23, ['  3222  ', '  32221 ', '  322211', ' 3222211', ' 3222211', ' 3222121', ' 3222211', ' 3222211', ' 3222211'])
    g.put(14, 22, ['ssss', ' UU ', ' UU ', ' Uu ', ' Uu ', ' uu ', '  u'])
    g.put(16, 23, ['U', 'U', 'u', 'u'])
    g.put(10, 26, ['G']); g.put(21, 26, [' '])
    g.put(10, 26, ['n'])  # name pin
    head(g, 8, 3, [
        '    HHHHHHHH    ',
        '  HHhhhHHhhhHH  ',
        ' HhjjhhHHhhhhhH ',
        'EEEEEEEEEEEEEEee',
        'EEEEEEEEEEEEEeee',
        'eEEEEEEEEEEEEeee',
        'hsssssssssssssst',
        'hSSSSSSSSSSSSssH',
        'SSMMSSSSSSMMSsst',
        'SMwKMMMMMMwKMsst',
        'SMKKMSSSSMKKMsst',
        'SSMMSStSSSMMSsst',
        'SaaSSSttSSSSaast',
        'SSSSSSSSSSSSSsst',
        ' SSSSKSSSSKSSst ',
        ' SSSSSKKKKSSsst ',
        '  SSSSSSSSSSst  ',
        '   sSSSSSSSst   ',
        '    tsssssst    ',
    ])
    g.put(5, 7, ['EEE', ' EE']); g.put(24, 7, ['eee', 'ee'])
    g.put(7, 12, ['s', 's', 't']); g.put(24, 12, ['t', 't', 't'])
    return g.rows()
