# Bouncer: bald and huge, dark shades, an earpiece with a coiled wire, stubble, a flat stare; tight black tee under a
# purple jacket, the velvet rope and its brass post beside him (he decides who gets in, so rivals sit out).
from lib import *
def draw():
    g = new()
    # velvet rope post at the left of the doorway, rope swagging toward him
    at(g, 2, 11, [' GG ', 'GwGg', 'GGgg', ' gg ', ' Gg ', ' Gg ', ' Gg ', ' Gg ', ' Gg ', ' Gg ', 'GGGg'])
    at(g, 4, 12, ['qR  ', 'Rrq ', ' rRq', '  rR', '  rr'])
    body(g, top=21, start=10, grow=3)
    at(g, 11, 21, ['KKKKKKKKKK', ' KKKKKKKK ', '  KKKKKK  ', '   KKKK   ', '    KK    '])  # black tee
    at(g, 9, 21, ['42', '432', '3332', '33332']); at(g, 21, 21, ['21', '211', '2211', '22211'])  # lapels
    at(g, 13, 20, ['SSSSss', 'sSSSst'])  # thick neck
    head(g, 8, 3, [
        '    SSSSSSSs    ',
        '  SSSwwSSSSSss  ',
        ' SSSwSSSSSSSSss ',
        'SSSSSSSSSSSSSsst',
        'SSSSSSSSSSSSSsst',
        'SSSSSSSSSSSSSsst',
    ])
    face(g, y=9, mouth='flat', rows={
        0: 'SSSSSSSSSSSSSsst',
        2: 'KKKKKKKKKKKKKKst',
        3: 'KDwwDDKKDwwDDKst',
        4: 'SDDDDDSSDDDDDsst',
        5: 'SSDDDSStSSDDDsst',
        6: 'SSSSSSttSSSSSsst',
        7: 'SsSsSSSSSSsSssst',
        8: ' SsSSKKKKKKSsst ',
        9: ' SSsSSsSSsSSsst ',
        10: '  SSsSsSSsSSst  ',
    }, cheeks=False)
    at(g, 23, 11, ['NN', 'NM', 'N ', ' M', 'N ', ' M', 'N ', ' M', 'N ', ' M'])  # earpiece and coiled wire
    return g
