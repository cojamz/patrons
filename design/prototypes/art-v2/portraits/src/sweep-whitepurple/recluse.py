# Recluse: keeps to himself. A deep pale hood pulled low, wary eyes glancing sideways, a long gray beard, a lone candle
# burning beside him and cobwebs in the corner of the doorway.
from lib import *
def draw():
    g = new()
    at(g, 18, 2, ['M M  M', ' MMMM ', 'MM  MM', ' M  M ', 'M    M'][:5]); at(g, 21, 1, ['M'])  # cobweb
    at(g, 3, 12, [' Y ', 'YGY', ' G ', 'WWV', 'WWV', 'WWV', 'WWV', 'WVV', 'OOOo'])  # candle on a holder
    for x, y in ((2, 11), (5, 11)): g.c[y][x] = 'i'
    body(g, top=21, start=9)
    ellipse(g, 16, 13.5, 10, 12)  # the hood
    for y in range(4, 20):
        for x in range(10, 22):
            if g.c[y][x] in '1234' and y > 8 and 10 < x < 22: g.c[y][x] = '1'
    head(g, 10, 8, [
        '1111111111111',
        'SSSSSSSSSSsst',
        'SStttSSStttst',
        'SSSwKSSSSwKst',
        'SSSKKSSSSKKst',
        'SSSSSStSSSsst',
        'SSSSSttSSSsst',
        'MMMMLLLLMMMMN',
        'MMLLMKKKMMMNN',
        'MMMLLLLMMMMNN',
        'MMMLLLMMMMNNN',
        ' MMMLLMMMMNN ',
        '  MMLMMMMNN  ',
        '   MMMMMNN   ',
        '    MMMNN    ',
        '     MMN     ',
    ])
    return g
