# Regular: in every day, knows the staff. Knit beanie with a folded cuff, a full beard, a warm squinty smile,
# a checked flannel shirt under a vest.
from lib import *
ID, NAME, SPHERE = 'market.regular', 'Regular', 'blue'
def draw():
    g = new()
    body(g)
    face(g, rows={2: 'SttSSSSSSSSttsst', 3: 'SSSSSSSSSSSSSsst', 4: 'StKKtSSSStKKtsst', 6: 'SaahhSttShhaahst',
                  7: 'hhhhhhhhhhhhhhhH', 8: 'hhhhKKKKKKhhhhHH', 9: 'hhhhhhhhhhhhhhHH', 10: ' hhhhhhhhhhhhHH ',
                  11: '  hhhhhhhhhhHH  ', 12: '    HhhhhhHH    '}, neck=False)
    at(g, 7, 12, ['h', 'h', 'h', 'h']); at(g, 24, 12, ['H', 'H', 'H', 'H'])
    at(g, 7, 1, ['     44333333     ', '   4433333333322  ', '  443323232323221', ' 4433232323232322 ',
                 ' 433323232323232211'])
    at(g, 6, 6, ['44443333333333332221', '43333333333333332221', '22222222222222221111'])
    # flannel checks under a dark vest
    for y in range(22, 32):
        for x in range(11, 21):
            if g.c[y][x] != '.': g.c[y][x] = 'R' if (x // 2 + y // 2) % 2 else 'r'
    at(g, 13, 22, ['hhhhhh', ' hhhh'])
    return g
