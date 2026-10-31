# Recluse: a hooded hermit peeking out, long gray beard, a lone candle in the dark doorway.
from common import *
ID = 'trading.recluse'
def draw():
    g = new()
    # candle with a soft glow
    g.put(2, 10, [' iii ', 'ii ii', 'i   i', 'ii ii', ' i i '])
    g.put(3, 11, [' Y ', 'YGY', 'YGY', ' K '])
    g.put(3, 15, ['WWV', 'WWV', 'WWV', 'WVV', 'WVV', 'WVV', 'WVV'])
    g.put(2, 22, ['NMMMN'])
    shoulders(g, top=21, start=10, slope=2)
    # the hood
    widths = {2: 3, 3: 5, 4: 6, 5: 7, 6: 8}
    for y in range(2, 22):
        half = widths.get(y, 9 if y < 18 else 10)
        x0 = 16 - half; w = 2 * half
        for x in range(x0, x0 + w):
            k = x - x0
            g.c[y][x] = '4' if k < 2 else ('1' if k >= w - 1 else ('2' if k >= w - 3 else '3'))
    head(g, 10, 7, [
        ' 1111111111 ',
        '1tttttttttt1',
        'tsssssssssst',
        'SSSSSSSSSsst',
        'NNNSSSSNNNst',
        'SwKSSSSSwKst',
        'SKKSSSSSKKst',
        'SSSSStSSSSst',
        'SaSSttSSSast',
        'LMMMNNMMMMNN',
        'LMMMMKKMMMNN',
        'LMMMMMMMMMNN',
        'LMMMLMMMMMNN',
        'LMMMMMMLMNNN',
        ' LMMMMMMMNN ',
        '  LMMLMMNN  ',
        '   LMMMNN   ',
        '    LMNN    ',
    ])
    g.put(15, 26, ['NN'])
    return g.rows()
