# Closer: a slick salesman who always gets the last word. Slicked hair with a shine, a wink, a smirk, suit and tie.
from lib import *
ID, NAME, SPHERE = 'purple.closer', 'Closer', 'purple'
def draw():
    g = new()
    body(g)
    face(g, rows={0: 'HHHSSSSSSSSSSHHH', 2: 'SttSSSSSSSttSsst', 3: 'SSSSSSSSSSwKSsst', 4: 'StKKtSSSSSKKSsst',
                  8: ' SSSSSSSSSKSsst ', 9: ' SSSSKKKKKSSsst '})
    at(g, 8, 3, ['   HHhhhhhhhH   ', ' Hhhjjjjhhhhhhh ', 'Hhhjjhhhhhhhhhhh', 'hhjhhhhHHhhhhhhH', 'hhhhhhHHHHhhhhHH',
                 'HhhhhHH  HHhhhHH'])
    at(g, 7, 7, ['H', 'H', 'H']); at(g, 24, 7, ['H', 'H', 'H'])
    at(g, 9, 3, ['w']); at(g, 10, 4, ['w'])
    # suit: white shirt V, red tie, gold clip, lapels, pocket square
    at(g, 12, 22, ['WWsstWWW', 'WWWWWWWW', ' WWRRWW ', ' WWRRWW', '  WRRW', '  GGGG', '   RR', '   RR', '   Rr', '   rr'])
    at(g, 10, 23, ['4', '44', ' 44', '  4']); at(g, 21, 23, [' 1', '11', '1', ''])
    at(g, 7, 26, ['W W', 'WWW'])
    return g
