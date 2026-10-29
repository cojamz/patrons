# Recluse: keeps to himself. A deep pale hood pulled low, wary watchful eyes under heavy brows, a long gray beard, a lone candle
# burning beside him and cobwebs in the corner of the doorway.
from lib import *
def draw():
    g = new()
    at(g, 18, 2, ['M M  M', ' MMMM ', 'MM  MM', ' M  M ', 'M    M'][:5]); at(g, 21, 1, ['M'])  # cobweb
    at(g, 3, 12, [' Y ', 'YGY', ' G ', 'WWV', 'WWV', 'WWV', 'WWV', 'WVV', 'OOOo'])  # candle on a holder
    for x, y in ((2, 11), (5, 11)): g.c[y][x] = 'i'
    body(g, top=21, start=9)
    ellipse(g, 16, 13.5, 10, 12)  # the hood
    for y in range(6, 9):  # the hood's shadow over the brow
        for x in range(9, 23):
            if g.c[y][x] in '34': g.c[y][x] = '2'
    sticker(g, 9, 8, [
        ' 222222222222 ',
        'HhSSSSSSSSSssH',
        'SLLMSSSSSLLMst',
        'SwwKSSSSwwKsst',
        'SwKKSSSSwKKsst',
        'SSSSSSStSSSsst',
        'SaSSSSttSSsast',
        'LLLLLWWLLLLLMN',
        'LLWWLLLLLLLMMN',
        'LLLWLKKKLLLMMN',
        ' LLLWWLLLLMMN ',
        ' LLLLWLLLLMMN ',
        '  LLLWLLLMMN  ',
        '   LLWLLMMN   ',
        '    LLLMMN    ',
        '     LMN      ',
    ], sides='lrb')
    at(g, 8, 11, ['t', 't']); at(g, 23, 11, ['t', 't'])
    return g
