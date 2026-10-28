# Doorman: holds the shop door. Peaked cap with a gold band and badge, a big friendly mustache,
# a double-breasted coat with gold buttons and braided shoulders.
from lib import *
ID, NAME, SPHERE = 'market.doorman', 'Doorman', 'blue'
def draw():
    g = new()
    body(g)
    face(g, rows={2: 'SttSSSSSSSSttsst', 3: 'SwKKSSSSSSwKKsst', 6: 'SaaSSSttSSSSaast', 7: 'SSSHHhhhhhHHSsst',
                  8: ' HhhhhhhhhhhHHt ', 9: ' HSSSKSSSKSSHst ', 10: '  SSSSKKKSSSst  '})
    at(g, 6, 2, ['    44333333333    ', '  443333333333322  ', ' 4433333333333332211', '443333333333333332211',
                 'GGGGGGGGGGgGGGGGGggg', 'gggggggggggggggggggg'])
    at(g, 14, 4, ['GG', 'Gg'])
    at(g, 7, 8, ['DDDDDDDDDDDDDDDDDD', ' DDDDDDDDDDDDDDDD'])
    at(g, 8, 8, ['LL'])
    at(g, 7, 10, ['h', 'h']); at(g, 24, 10, ['H', 'H'])
    # coat: high collar, gold buttons in two rows, braid on the shoulders
    at(g, 12, 22, ['4ss3', '43333', ' 433']); at(g, 17, 22, ['3tt2', '3332', '332'])
    for y in (25, 28, 31): g.c[y][13] = 'G'; g.c[y][19] = 'G'
    at(g, 2, 25, ['GGGG', ' g g', ' g g']); at(g, 26, 25, ['GGGG', 'g g ', 'g g '])
    return g
