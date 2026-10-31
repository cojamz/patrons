# Heiress: tall bun, tiara, half-lidded eyes, red lips, pearl earrings and necklace, a white fur stole.
from common import *
ID = 'trading.heiress'
def draw():
    g = new()
    shoulders(g, keys='2211')  # satin gown in the shade tones
    g.put(12, 21, [' SSSSSst', ' SSSSSst', 'SSSSSSsst', ' SSSSsst', '  SSSst', '   Sst'])
    # fur stole: a fluffy white roll over both shoulders, dipping toward the neckline
    for x in range(1, 31):
        d = abs(x - 15.5)
        if d < 3.5: continue
        top = 22 + max(0, int((d - 7) / 2.6)) if d >= 7 else 22 + int((7 - d) * 0.9)
        top -= (x % 2)  # tufts
        for y in range(top, min(32, top + 6)):
            k = y - top
            c = '4' if k == 0 else ('3' if k < 4 else '2')
            if x >= 28: c = '1' if k > 0 else '2'
            elif x >= 26 and k > 1: c = '2'
            g.c[y][x] = c
    for (x, y) in [(5, 25), (9, 26), (22, 26), (26, 25), (7, 24), (24, 24)]: g.c[y][x] = '2'
    # pearls
    for (x, y) in [(13, 22), (14, 23), (15, 24), (16, 24), (17, 23), (18, 22)]: g.c[y][x] = 'w'
    g.c[16][25] = 'L'; g.c[16][26] = 'w'
    head(g, 8, 1, [
        '      hhhh      ',
        '     hjjhhH     ',
        '    hjjhhhHH    ',
        '     hhhhHH     ',
        '   hhjjhhhhhH   ',
        '  hjjhhhhhhhhHH ',
        ' hjhhhhhhhhhhhH ',
        'hjhhhhhhhhhhhhhH',
        'hhSSSSSSSSSSSShH',
        'hSSSSSSSSSSSSssH',
        'hKKKSSSSSSKKKssH',
        'hSwKSSSSSSwKSssH',
        'hSKKSSSSSSKKSssH',
        'SSSSSSStSSSSSsst',
        'SaaSSSttSSSSaast',
        'SSSSSSSSSSSSSsst',
        ' SSSSqRRRSSSsst ',
        ' SSSSSrrrSSSsst ',
        '  SSSSSSSSSSst  ',
        '   sSSSSSSSst   ',
        '    tsssssst    ',
    ])
    g.put(9, 6, ['  G  G  G  ', ' GgGGgGGgG ', 'GgxgGygGzgG'][1:])  # tiara
    g.put(11, 5, ['G', ]); g.put(15, 4, ['w', 'G']); g.put(19, 5, ['G'])
    g.put(7, 12, ['s', 's', 't', 'w']); g.put(24, 12, ['t', 't', 't', 'w'])
    g.c[16][20] = 'K'  # beauty mark
    return g.rows()
