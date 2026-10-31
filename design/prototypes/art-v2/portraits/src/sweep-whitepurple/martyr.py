# Martyr (counts as 2): the martyr in front with a golden halo, long center-parted hair, eyes closed in peace, a soft
# smile, a plain robe with a rope tie, a palm frond; behind, a mourner in a dark veil with a tear on her cheek.
from lib import *
def draw():
    g = new()
    # behind, right: the mourner in a veil
    body(g, top=20, cx=24, start=6, maxhalf=8, keys='2111')
    ellipse(g, 24, 11.5, 6.5, 8.5, keys='2111')
    small(g, 18, 7, eyes='closed', mouth='flat', rows={0: '2SSSSSSSSss1', 4: 'SSwSSttSSast', 5: 'SSiSSSSSSsst', 6: ' SSiSKKSSst '})
    before = snap(g)
    # front, left: the martyr
    body(g, top=21, cx=10, start=8, maxhalf=11)
    at(g, 6, 21, [' SSSSst ', '4SSSSSt2', '34SSst21', ' 3422 1 ', '  3322  '])
    at(g, 2, 27, ['OoOoOoOoOoOoOoOo'])  # rope belt
    at(g, 3, 0, [' GGGGGGGGGG ', 'G          G', ' gggggggggg ']); at(g, 4, 1, ['Y']); at(g, 13, 1, ['Y'])
    head(g, 2, 3, [
        '    hhhhhh    ',
        '  hjjjhHhhhH  ',
        ' hjjjhhHhhhhH ',
        ' hjjhhSSHhhhH ',
        'hjhhSSSSSShhhH',
        'hjhSSSSSSSShhH',
        'hhStttSSttthhH',
        'hhSSSSSSSSSshH',
        'hhtKKtSStKKthH',
        'hhSSSSSSSSSshH',
        'hhaSSSttSSashH',
        'hhSSSSSSSSSshH',
        'hhSSKSSSSKSshH',
        'hhhSSKKKKSshhH',
        'hhh SSSSSSsthH',
        ' hh  tsssst hH',
        ' hh         hH',
    ])
    at(g, 7, 19, ['ssss'])
    gap_right(g, before)
    sticker(g, 0, 9, ['  EE ', ' EEeE', 'EEe E', 'Ee  E', 'e  E ', 'e    ', 'e    ', 'e    '], sides='lrt')  # palm frond
    return g
