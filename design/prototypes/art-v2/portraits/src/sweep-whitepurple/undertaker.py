# Undertaker: tall black top hat with a band, a long gaunt face with sunken eyes and a thin solemn line of a mouth,
# long sideburns, a black cravat and a white lily in the lapel; a little gravestone in the doorway behind.
from lib import *
def draw():
    g = new()
    at(g, 2, 14, [' MMM ', 'MLLMN', 'MLKMN', 'MKKKN', 'MLKMN', 'MLMMN', 'MMMNN', 'EeEeE'])  # gravestone
    body(g, top=22, start=8)
    at(g, 8, 22, ['1111', '22211', ' 2221', '  221', '   21', '    1'])
    at(g, 20, 22, ['1111', '11222', '1222 ', '122  ', '12   ', '1    '])
    at(g, 12, 22, ['KKKKKKKK', ' KDKKDK ', '  KKKK  ', '   KK   '])
    sticker(g, 21, 23, [' W ', 'WiW', ' W ', ' e '])  # lily
    head(g, 8, 0, [
        '   DDDDDDDDDD   ',
        '   DNNDDDDDDK   ',
        '   DNDDDDDDDK   ',
        '   DNDDDDDDDK   ',
        '   NNNNNNNNNN   ',
        '   DNDDDDDDDK   ',
        'KKDDDDDDDDDDDDKK',
        ' KKKKKKKKKKKKKK ',
        'HHSSSSSSSSSSSsHH',
    ])
    face(g, y=9, mouth='flat', cheeks=False, rows={0: 'HSSSSSSSSSSSSssH', 1: 'HSSSSSSSSSSSSssH', 2: 'HKKKSSSSSSKKKssH',
        3: 'HtwKSSSSStwKssth', 4: 'HtKKSSSSStKKsstH', 5: 'HSttSSStSSttSssH', 6: 'HSSSSSttSSSSSssH', 8: ' SSSSSSSSSSSsst ', 9: ' SSSSKKKKKSSsst ',
        10: '  SSSSSSSSSSst  ', 11: '   SSSSSSSSst   ', 12: '    tsssssst    '})
    return g
