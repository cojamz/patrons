# Hoarder: wild frizzy hair, wide eyes, a gap-toothed grin, a patched cardigan, junk piled up on both sides:
# taped boxes on the left, books, a clock and a rubber duck on the right.
from common import *
ID = 'trading.hoarder'
def draw():
    g = new()
    g.put(2, 9, ['  OOOOo', ' OOOOOoo', ' OWWOOoo', ' OOOOOoo', ' oooooo', 'OOOOOOOo', 'OOOWWOoo', 'OOOOOOoo', 'OOOOOOoo', 'oooooooo', 'OOOOOOO', 'OWOOOoo', 'OOOOOoo'])
    g.put(23, 7, ['   Y ', '  YYYq', '  YYY ', ' YYYY ', '   LLL', '  LMKML', '  LMKML', '   LML ', '  RRRRrr', '  UUUUuu', '  EEEEee', ' PPPPPpp', ' RRRRRrr', ' UUUUUuu', ' OOOOOoo'])
    shoulders(g)
    g.put(5, 25, ['EEe', 'EEe', 'eee']); g.put(22, 27, ['UUu', 'UUu', 'uuu']); g.put(13, 29, ['RRr', 'Rrr'])
    for (x, y) in [(6, 25), (23, 28), (14, 29)]: g.c[y][x] = 'W'
    g.put(12, 22, ['21SSSSSs12', ' 21Ssst12 ', '  21tt12  ', '   2112   ', '    11    '])
    head(g, 6, 1, [
        '   h  hh  h  h      ',
        '  hjh hjhhjhhjh h   ',
        ' hhjjhhjjhhhhhhhHh  ',
        'hhjhhjhhhhjhhhhhhHH ',
        ' hhjhhhhhjhhhhhhhHHh',
        'hhhhhhhhhhhhhhhhhhH ',
        ' hhhhSSSSSSSShhhhHHh',
        'hhhSSSSSSSSSSSShhHH ',
        ' hhSHHHSSSSHHHSshHHh',
        'hhhSWWWSSSSWWWSshH  ',
        ' hhSWKKSSSSWKKSssH  ',
        '  hSWKwSSSSWKwSsst  ',
        '  SSSSSSStSSSSSsst  ',
        '  SaaSSStttSSSaast  ',
        '  SsSsSsSsSsSsSsst  ',
        '   SSKwwKwwwKSsst   ',
        '   SsSKKKKKKsSst    ',
        '    sSsSsSsSsst     ',
        '     sSSsSSsst      ',
        '      tsssst        ',
    ])
    return g.rows()
