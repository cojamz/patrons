# Martyr: a golden halo, long center-parted hair, eyes closed in peace, a soft smile, plain robe with a rope tie,
# a palm frond behind the shoulder.
from common import *
ID = 'trading.martyr'
def draw():
    g = new()
    # palm frond
    g.put(19, 3, ['        EE', '      EEEe', '    EEeEE ', '   EeEEe E', '  EeE EeE ', ' EEe EE Ee', ' Ee EEe  E', 'EeEEe  E  ', 'Ee E  E   ', 'e  E      ', 'e         '])
    g.put(23, 3, ['  E', ' E ', 'E'])
    shoulders(g)
    g.put(12, 21, ['  SSSSst', ' 4SSSSt2', ' 34SSt21', '  3422 ', '   33 '])
    g.put(9, 1, [' GGGGGGGGGGGG ', 'GY          YG', ' ggggggggggggg'])
    g.put(10, 2, ['  ', ]); 
    head(g, 8, 4, [
        '     hhhhhh     ',
        '   hjjjhHhhhH   ',
        '  hjjjhhHhhhhH  ',
        ' hjjhhhSHhhhhhH ',
        ' hjhhSSSSShhhhH ',
        'hjhhSSSSSSSShhhH',
        'hjhSSSSSSSSSShhH',
        'hhSSSSSSSSSSSShH',
        'hhStttSSSStttsH ',
        'hhSSKKSSSSKKSshH',
        'hhSSSSSSSSSSSshH',
        'hhSSSSSStSSSSshH',
        'hhaaSSSttSSSaahH',
        'hhSSSSSSSSSSSshH',
        'hhSSSKSSSSKSSshH',
        'hhhSSSKKKKSSshhH',
        'hhh SSSSSSSSsthH',
        ' hh  sSSSSSst hH',
        ' hh   tssssst hH',
    ])
    g.put(7, 14, ['h', 'h', 'h', 'h', 'h', 'h', 'h', 'h'])
    g.put(24, 14, ['H', 'H', 'H', 'H', 'H', 'H', 'H'])
    return g.rows()
