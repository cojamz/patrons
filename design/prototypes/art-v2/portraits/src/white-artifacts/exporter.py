# Exporter: a sea captain in dress whites, peaked cap with a gold anchor badge, short beard, pipe, gold epaulettes,
# a little ship sailing off in the doorway.
from common import *
ID = 'trading.exporter'
def draw():
    g = new()
    g.put(3, 8, ['  W  ', '  WV ', ' WWV ', 'WWWVV', '  N  ', 'OOOOO', ' ooo '])  # ship
    g.put(2, 15, ['yyyyy'])
    shoulders(g)
    g.put(3, 23, ['  GgGGg', ' GGGGGGg', 'gGgGgGgg', 'g g g g'])  # epaulettes
    g.put(22, 23, ['GGgGG  ', 'GGGGGg ', 'gGgGgGg', ' g g g g'])
    g.put(12, 22, ['1W2   2W1', '1WW2 2WW1', '11WW2WW11', ' 1 1W1 1 ', '  1 2 1  '])
    g.put(13, 27, ['G   G', '     ', 'G   G', '     ', 'G   G'])
    g.put(14, 22, [' ss ', '  t '])
    head(g, 7, 2, [
        '     4333332      ',
        '   44333333332    ',
        ' 4433333333333322 ',
        '44333333gGg3333221',
        '4433333gGGGg333221',
        ' 4433333gGg333221 ',
        ' 1111111111111111 ',
        '  DDDDDDDDDDDDDD  ',
        '  DDNNDDDDDDDDDD  ',
        ' hSSSSSSSSSSSSssh ',
        ' hHHHSSSSSSHHHssH ',
        ' SSwKSSSSSSwKSsst ',
        ' SSKKSSSSSSKKSsst ',
        ' SSSSSSStSSSSSsst ',
        ' haaSSSttSSSSaash ',
        ' hhhHHHHHHHHHhhhH ',
        ' hhhhhKKKKhhhhhhH ',
        '  hhhhhhhhhhhhhH  ',
        '   hhhhhhhhhhhH   ',
        '    HhhhhhhhhH    ',
    ])
    g.put(6, 13, ['s', 's', 't']); g.put(24, 13, ['t', 't', 't'])
    g.put(19, 18, ['OOOOo', '   oOo', '    oo'])  # pipe
    g.put(23, 18, [' Oo', 'OoOo', 'oooo'])
    g.put(24, 10, [' WW', 'Wiw', ' Wi', '  W'][::-1])
    g.put(26, 7, ['W', 'iW', ' W'])
    return g.rows()
