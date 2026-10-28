# Trendsetter: always first. Shaved side with a long dyed swoop, oversized round shades, one big gold hoop,
# a tall collar and a chunky chain.
from lib import *
ID, NAME, SPHERE = 'market.trendsetter', 'Trendsetter', 'blue'
def draw():
    g = new()
    body(g)
    face(g, rows={0: 'qqqqqqqqqqqqSssH', 1: 'qqqqqqqqqqSSSsst', 2: 'qqqqqqqqSSSSSsst', 3: 'qqqDDDDSSDDDDsst',
                  4: 'qqDDwDDGGDwDDDst', 5: 'qqDDDDDStDDDDDst', 6: 'qqqDDDttSDDDDsst', 7: 'qqSSSSSSSSSSSsst',
                  8: ' qSSSSSSSKKSsst ', 9: ' SSSSKKKKKSSsst '}, ears=False)
    at(g, 6, 2, ['   qqqqqqqqqqq   ', '  qqqqWqqqqqqqqHH ', ' qqqWqqqqqqqqqqHHH', 'qqqWqqqqqqqqqqqHHH', 'qqqqqqqqqqqqqqrHHH',
                 'qqqqqqqqqqqqqrr  H', 'qqqqqqqqqqqrr', 'qqqqqqqqqrr'])
    at(g, 5, 10, ['qqq', 'qqq', 'qqr', 'qqr', 'qrr', 'qr', 'rr'])
    at(g, 22, 4, ['HHH', 'HHHH', 'HH'])  # the shaved side
    at(g, 24, 12, ['t', 't', 'G', 'GG', 'G G', 'GG'])
    # high collar and chunky chain
    at(g, 11, 21, ['44', '443', '433', '43']); at(g, 19, 21, ['  21', ' 221', ' 211', '  21'])
    at(g, 12, 25, ['G', ' g', '  G', '   gGg', '      G']); at(g, 21, 25, ['g', 'G', 'g'])
    for x, y in [(3, 4), (27, 8), (26, 18)]: at(g, x - 1, y - 1, [' w ', 'www', ' w '])
    return g
