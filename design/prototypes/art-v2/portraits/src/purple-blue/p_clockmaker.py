# Clockmaker: an old watchmaker. Bald, gray tufts, a jeweler's loupe in one eye, bushy mustache, leather apron, gears.
from lib import *
ID, NAME, SPHERE = 'purple.clockmaker', 'Clockmaker', 'purple'
def draw():
    g = new()
    body(g)
    face(g, rows={0: 'SSSSSSSSSSSSSsss', 2: 'SMMSSSSSSSMMSsst', 3: 'SSwKSSSSSLLLLsst', 4: 'SSKKSSSSLDDwDLst',
                  5: 'SSSSSSStLDDDDLst', 6: 'SaaSSSttSLLLLsst', 7: 'SSSMMMMMMMMSSsst', 8: ' SMMMMMMMMMMNst ',
                  9: ' SSSSKKKKSSSsst '})
    at(g, 9, 4, ['   SSSSSSSS  ', ' SSSSwwSSSSSss', 'SSSSSwSSSSSSsss', 'SSSSSSSSSSSSssst', 'SSSSSSSSSSSSSsst'])
    at(g, 6, 7, ['MMM', 'MMMM', 'MMN', 'MN']); at(g, 23, 7, [' NMM', 'MMMN', ' MNN', '  N'])
    # apron over a work shirt
    at(g, 11, 22, ['O', 'O', 'O']); at(g, 20, 22, ['o', 'o', 'o'])
    at(g, 10, 25, ['OOOOOOOOOOOo', 'OOOOOOOOOOOo', 'OOOOOOOOOOoo', 'OOOggOOOOOoo', 'OOOOOOOOOOoo', 'OOOOOOOOOOoo',
                   'OOOOOOOOOooo'])
    at(g, 12, 27, ['L', 'L']); at(g, 13, 27, ['N'])  # tweezers in the pocket
    gear = lambda: [' g g ', 'gGGGg', ' GiG ', 'gGGgg', ' g g ']
    at(g, 2, 9, gear()); at(g, 25, 11, gear())
    at(g, 24, 2, [' g ', 'gGg', ' g '])
    return g
