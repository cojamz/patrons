# Heiress (counts as 2): the heiress in front in a tiara, tall bun, pearls, red lips and a white fur stole; her
# butler stands just behind her, gray slicked hair, stiff upper lip, black bow tie.
from lib import *
def draw():
    g = new()
    # behind, right: the butler
    body(g, top=20, cx=24, start=6, maxhalf=8, keys='2111')
    at(g, 21, 20, ['WWWWWW', ' WWWWV', '  WWV ']); at(g, 22, 20, ['KK', ]); at(g, 25, 20, ['KK']); at(g, 23, 20, ['KK'][0][:1] + 'K')
    head(g, 18, 4, [
        '  MMMMMMMM  ',
        ' MLLLMMMMMN ',
        'MLLMMMMMMMMN',
    ])
    small(g, 18, 7, mouth='flat', rows={0: 'MSSSSSSSSssN', 1: 'SNNNSSNNNSst', 6: ' SSSSSSSSst '})
    before = snap(g)
    # front, left: the heiress
    body(g, top=21, cx=10, start=8, maxhalf=11, keys='2211')
    for x in range(0, 21):  # the fur stole: one soft roll over both shoulders, dipping to the neckline
        d = abs(x - 9.5)
        if d < 3: continue
        top = 22 + (2 if d < 5 else 1 if d < 7 else 0)
        for y in range(top, min(32, top + 4)):
            k = y - top
            g.c[y][x] = '4' if k == 0 else ('3' if k < 3 else '2')
            if x >= 18: g.c[y][x] = '2' if k < 3 else '1'
        if x % 3 == 0 and top + 4 < 32: g.c[top + 4][x] = '2'  # tufted lower edge
    at(g, 7, 21, ['SSSSss', ' SSSst', '  Sst ', '   t  '])
    for x, y in ((6, 22), (7, 23), (8, 24), (9, 24), (10, 24), (11, 23), (12, 22)): g.c[y][x] = 'w'  # pearls
    head(g, 2, 0, [
        '     hhhh     ',
        '    hjjhhH    ',
        '    hjhhhH    ',
        '   hhjjhhhH   ',
        '  G  Gw  G    ',
        ' GgxgGygGzgG  ',
        ' hjhhhhhhhhhH ',
        'hjhhhhhhhhhhhH',
        'hhSSSSSSSSSShH',
        'hSSSSSSSSSSssH',
        'hKKKSSSSKKKssH',
        'hSwKSSSSSwKssH',
        'hSKKSSSSSKKssH',
        'SSSSSStSSSSsst',
        'SaaSSttSSSaast',
        'SSSSSSSSSSKsst',
        ' SSSqRRRSSsst ',
        ' SSSSrrrSSsst ',
        '  SSSSSSSsst  ',
        '   tssssst    ',
    ])
    at(g, 1, 12, ['s', 't', 'w']); at(g, 16, 12, ['t', 't', 'w'])  # pearl earrings
    gap_right(g, before)
    return g
