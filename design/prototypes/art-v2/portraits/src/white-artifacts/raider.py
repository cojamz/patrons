# Raiders: two of them squeezed in the doorway; a horned-helmet brute with a braided beard and a masked bandit
# in a head scarf, grinning with a gold tooth.
from common import *
ID = 'trading.raider'
def draw():
    g = new()
    shoulders(g, top=22, start=6, slope=3, cx=9, maxhalf=10, keys='3221')
    g.put(3, 22, ['OOOOOOOOOOOO', 'OoOoOOoOoOoo', ' o o  o o o'])  # fur collar
    shoulders(g, top=21, start=6, slope=3, cx=23, maxhalf=10)
    # left: horned helmet brute
    head(g, 1, 3, [
        'W              ',
        'WV           W ',
        'WWV  LLLMN  VW ',
        ' WWVLLMMMMNVW  ',
        '  VLLMLMMMMNV  ',
        '  LLMMMLMMMMN  ',
        '  NNNNNNNNNNN  ',
        '  SSSSSSSSsst  ',
        '  SHHSSSHHsst  ',
        '  SwKSSSwKsst  ',
        '  SKKSSSKKsst  ',
        '  SSSStSSSsst  ',
        '  hhhhhhhhhhH  ',
        '  hhKqqqKhhhH  ',
        '  hhhKKKhhhhH  ',
        '  hhhhhhhhhhH  ',
        '   hhHhhhHhH   ',
        '   hhH  hhH    ',
        '   hH   hH     ',
        '   GG   GG     ',
        '   hH   hH     ',
    ])
    # right: masked bandit with head scarf
    head(g, 15, 3, [
        '    4333332   ',
        '  443333333221',
        ' 43333333332211',
        ' 4333333333221 ',
        ' 433333333321  ',
        ' 2111111111123 ',
        ' SSSSSSSSSSst23',
        ' KKKKKKKKKKKK 2',
        ' KwKKKKKwKKKt  ',
        ' KKKKKKKKKKKt  ',
        ' SSSSStSSSSst  ',
        ' SaaSSttSSaast ',
        ' SSSSSSSSSSsst ',
        '  SKwGwwwwKst  ',
        '  SSKKKKKKsst  ',
        '   SSSSSSSst   ',
        '    tsssssst   ',
    ])
    g.put(16, 10, [' ', ' KK', ' KK'][1:])
    g.put(16, 11, ['wK'])
    g.put(16, 12, ['KK'])
    g.put(23, 11, ['wK']); g.put(23, 12, ['KK'])
    return g.rows()
