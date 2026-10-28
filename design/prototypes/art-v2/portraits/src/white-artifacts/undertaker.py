# Undertaker: tall black top hat with a white band breaking the arch, long gaunt face, sunken eyes, a thin frown,
# dark coat, white wing collar, black cravat, a lily on the lapel.
from common import *
ID = 'trading.undertaker'
def draw():
    g = new()
    shoulders(g, keys='2111')
    for i in range(7):
        g.c[22 + i][11 + i // 2] = '2'; g.c[22 + i][20 - i // 2] = '2'
    g.put(12, 21, ['4444 444', '34444444', ' 34KKK43', '  4KK43 ', '   KK  ', '   KK  ', '   KK  '])
    g.put(13, 21, ['  ss '])
    g.put(5, 24, ['  W ', ' WWW', 'WWiWV', ' WWV', '  e', '  e ', ' e'])  # lily
    g.put(9, 0, [
        '  KKKKKKKKKK  ',
        '  KDDKKKKKKK  ',
        '  KDKKKKKKKK  ',
        '  KDKKKKKKKK  ',
        '  KDKKKKKKKK  ',
        '  4333333332  ',
        '  4333333321  ',
        '  KDKKKKKKKK  ',
        'KKKKKKKKKKKKKK',
    ])
    g.put(7, 8, ['K', ' ']); g.put(23, 8, ['K'])
    head(g, 9, 9, [
        ' HHSSSSSSSSHH ',
        ' HSSSSSSSSSsH ',
        ' SSSSSSSSSSst ',
        ' StKKSSSSKKtt ',
        ' tSSttSStSSst ',
        ' twKtSSStwKtt ',
        ' tKKtSSStKKtt ',
        ' SSSSSStSSSst ',
        ' StSSSttSSStt ',
        ' StSSSSSSSStt ',
        ' StSKKKKKSStt ',
        ' SSSKSSSKSSst ',
        '  SSSSSSSSst  ',
        '  SSSSSSSSst  ',
        '   sSSSSSst   ',
        '    tssst     ',
    ])
    g.put(9, 13, ['s', 's', 't']); g.put(23, 13, ['t', 't', 't'])
    return g.rows()
