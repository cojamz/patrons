# Patroness: a grand lady who funds the shop. Wide hat with a tall plume, pearls, red lips, a beauty mark.
from lib import *
ID, NAME, SPHERE = 'market.patroness', 'Patroness', 'blue'
def draw():
    g = new()
    body(g, start=6)
    face(g, rows={0: 'hhSSSSSSSSSSShhh', 2: 'SSttSSSSSSttSsst', 3: 'SKwKSSSSSKwKSsst', 4: 'SSKKSSSSSSKKSsst',
                  6: 'SaaSSSttSSSSaast', 7: 'SSSSSSSSSSSKSsst', 8: ' SSSSRRRRSSSsst ', 9: ' SSSSSrrSSSSsst '})
    at(g, 7, 9, ['hh', 'hh', 'hh', 'h']); at(g, 23, 9, ['hH', 'HH', 'HH', 'H'])
    at(g, 2, 6, ['  44333333333333333332211  ', '4433333333333333333333222111', '44333333333333333333332221 1', '  1122222222222222222111  '])
    at(g, 8, 3, ['   4433333331  ', '  443333333321  ', ' 44WWWWWWWWWW21 '])
    at(g, 18, 0, ['  WW', ' WWW', 'WWVV', 'WVV', 'WV ', 'V'])  # the plume
    at(g, 22, 0, ['', 'W', 'VW'])
    # pearls and a dress neckline
    at(g, 11, 22, ['W W W W W', ' W W W W'])
    at(g, 13, 24, ['W W W', '  G  '])
    at(g, 7, 15, ['W']); at(g, 24, 15, ['W'])
    return g
