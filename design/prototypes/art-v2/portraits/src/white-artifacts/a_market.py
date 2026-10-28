# Bargain Bin: a blue slatted bin overflowing with odds and ends (a rubber duck, a boot, a frying pan, a sock)
# and a red-slashed price tag hanging off the front.
from common import *
ID = 'artifact.market'
def draw():
    g = blank()
    g.put(5, 3, ['      MM', '     MNM', '    MNN', '   MN', ' LLL', 'LMMMN', 'LMMMN', ' NNN'][:0])
    g.put(14, 6, ['  UUUUu', ' UUUUUu', 'UWWWWWu', 'UUUUUuu', 'uuuuuu'][:0])
    g.put(15, 4, ['   EEe', '  EEEe', ' EEEe', 'EEEe', 'WWe', 'We'][:0])
    g.put(15, 8, ['UUUUUUUu', 'WWWWWWWu', 'UUUUUUuu'])  # a book
    g.put(16, 6, ['UUUUUUu', 'WWWWWWu'])
    g.put(3, 7, ['  YYY', ' YYKY', ' YYYYnn', '  YYY', 'YYYYYY', 'YYYYYYY', 'YYYYYYY'])  # duck
    g.put(20, 5, ['    OO', '    OO', '    OO', '    Oo', '  OOOo', 'OOOOOo', 'OOOooo', 'oooooo'][0:0])
    g.put(21, 2, ['  OOOOo', '  OOOOo', '  OOOOo', '  OOOOo', '  OOOOo', 'OOOOOOo', 'OOOOOOo', 'ooooooo'])  # boot
    g.put(10, 8, ['R R', 'RRRq', 'qRRR', ' RRR', ' RRr'])  # sock
    for y in range(13, 29):
        t = (y - 13) / 15
        x0 = round(2 + t * 3); x1 = round(29 - t * 3)
        for x in range(x0, x1 + 1):
            k = x - x0; w = x1 - x0
            c = '4' if k < 2 else ('1' if k >= w - 1 else ('2' if k >= w - 4 else '3'))
            if y in (13, 14): c = '4' if k < w - 2 else '2'
            elif y in (19, 24): c = '2' if k < w - 2 else '1'
            elif y == 28: c = '1'
            g.c[y][x] = c
    for x in range(3, 29, 6): pass
    g.put(13, 15, [' K', ' K', 'WWWWV', 'WxWWV', 'WWxWV', 'WWWxV', 'VVVVV'])  # price tag
    g.put(5, 15, ['w'])
    return g.rows()
