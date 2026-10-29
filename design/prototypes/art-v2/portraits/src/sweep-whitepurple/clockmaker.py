# Clockmaker: an old craftsman, bald crown with white tufts, a jeweler's loupe screwed into one eye, white walrus
# mustache, leather apron with a pocket watch on a gold chain; little gears turning in the doorway.
from lib import *
def gear(g, x, y, k='G', d='g'):
    at(g, x, y, [f' {k} {k} ', f'{k}{k}{k}{k}{d}', f' {k}b{d}{d}', f'{k}{k}{d}{d}{d}', f' {d} {d} '])
def draw():
    g = new()
    gear(g, 2, 7); gear(g, 4, 13, 'M', 'N'); gear(g, 25, 16)
    body(g, top=22, start=8)
    at(g, 10, 23, ['OOOOOOOOOOOo', 'OOOOOOOOOOoo', 'OOOOOOOOOOoo', 'OOOOOOOOOooo', 'OOOOOOOOOooo', 'OOOOOOOOoooo',
                   'OOOOOOOOoooo', 'OOOOOOOoooo ', 'OOOOOOOoooo '])
    at(g, 10, 22, ['O', 'O']); at(g, 21, 22, ['o', 'o'])  # apron straps
    at(g, 12, 25, ['ooooo', 'o   o'])  # apron pocket
    at(g, 12, 25, ['GGg  ', 'G  g ', ' gGGg']); at(g, 13, 27, ['GwG', 'GKg', 'gGg'])  # watch on its chain
    head(g, 8, 3, [
        '                ',
        '    SSSSSSSs    ',
        '  SSSwwSSSSSss  ',
        ' WSSwSSSSSSSSsV ',
        'WWWSSSSSSSSSSVVV',
        'WWVSSSSSSSSSSsVV',
    ])
    face(g, y=9, mouth='smile', rows={
        0: 'WSSSSSSSSSSSSssV',
        1: 'VSSSSSSSSSSSSssV',
        1: 'NNNNNNNNNNNNNNNN',
        2: 'SLLMSSSSSLLMMsst',
        3: 'SSwKSSSSNLLLLNst',
        4: 'SSKKSSSNLDiwDLNt',
        5: 'SSSSSSStNDDDDLNt',
        6: 'SaaSSSttNMDDMMNt',
        7: 'SSLLLLMSMLNNNNst',
        8: ' LLMMMMMMMLLMMst',
        9: ' SMMSSKKKSSMMst ',
    })
    return g
