# Restocker: the stock clerk. Visor cap, pencil behind the ear, a name badge on the vest, boxes stacked behind.
from lib import *
ID, NAME, SPHERE = 'market.restocker', 'Restocker', 'blue'
def draw():
    g = new()
    at(g, 1, 12, ['OOOOOOo', 'OoooooO', 'OOOOOOo', 'OOOOOOo', 'ooooooo'])
    at(g, 2, 17, ['OOOOOo', 'OOOOOo', 'OoOOOo', 'OOOOOo', 'oooooo'])
    at(g, 24, 15, ['OOOOOOo', 'OOOOOOo', 'OoooooO', 'OOOOOOo', 'oooooo'])
    body(g)
    face(g, rows={2: 'SSttSSSSSSttSsst', 8: ' SSSSKSSSSKSsst ', 9: ' SSSSSKKKKSSsst '})
    at(g, 8, 3, ['    4433333     ', '  44333WW33322  ', ' 4433WWWWW33221 ', '443333WW3333221 '])
    at(g, 6, 7, ['443333333333333332', '11111111111111111111', '  1111111111111111'])
    at(g, 7, 9, ['h']); at(g, 24, 9, ['H'])
    at(g, 22, 8, ['', '', '', 'Y', ' Y', '  t'])  # pencil behind the ear
    at(g, 23, 11, ['Y', ' Y']); g.c[12][25] = 'W'
    # vest over a white shirt, a badge
    at(g, 12, 22, ['WWsstWWW', ' WWWWWW ', '  WWWW  ', '   WW   '])
    at(g, 8, 26, ['WWWW', 'WKKW', 'WWWW'])
    return g
