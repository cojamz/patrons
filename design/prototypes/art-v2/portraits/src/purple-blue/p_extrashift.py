# Extra Shift: a worker pulling a double. Trucker cap, tired bags under the eyes, stubble, coveralls with a name patch,
# a time card sticking out of the pocket.
from lib import *
ID, NAME, SPHERE = 'purple.extrashift', 'Extra Shift', 'purple'
def draw():
    g = new()
    body(g)
    face(g, rows={2: 'SttttSSSSttttsst', 3: 'SSwKSSSSSSwKSsst', 4: 'SSKKSSSSSSKKSsst', 5: 'SsttsSStSsttsSst',
                  6: 'SSSSSSttSSSSSsst', 7: 'SSSSSSSSSSSSSsst', 8: ' SsSKKKKKKSsst ', 9: ' sSsSsSsSsSsst ',
                  10: '  SsSsSsSsSsst  '})
    at(g, 8, 2, ['    44333333    ', '  4433WWWW3322  ', ' 443WWWKWWWW221 ', ' 433WWKKKWWW321 ', '4333WWWWWWWW3221',
                 '4333333333333221'])
    at(g, 4, 8, ['111111111111111111111'])
    at(g, 7, 9, ['h']); at(g, 24, 9, ['H'])
    at(g, 26, 14, ['y', 'w'])  # sweat
    # coveralls: collar points, a name patch and a time card in the pocket
    at(g, 11, 22, ['44', '443', '  4']); at(g, 19, 22, ['21', '221', '2  '])
    at(g, 8, 26, ['WWWWW', 'WKKKW', 'WWWWW'])
    at(g, 19, 23, ['WWW', 'WKW', 'WWW', 'WKW']); at(g, 18, 26, ['22222'])
    for y in range(24, 32): g.c[y][16] = '2'
    return g
