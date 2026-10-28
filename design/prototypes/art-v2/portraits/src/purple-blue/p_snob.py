# Snob: nose in the air. Tall beehive hair, cat-eye glasses, lids half shut, pursed lips, a fur stole and a brooch.
from lib import *
ID, NAME, SPHERE = 'market.snob', 'Snob', 'blue'
def draw():
    g = new()
    body(g)
    face(g, rows={0: 'hhSSSSSSSSSSShhh', 2: 'SSSSSSSSSSSSSsst', 3: 'KKKKKSSSSKKKKKKt', 4: 'KttttKKKKKttttKt',
                  5: 'SKKKKSStSKKKKSst', 6: 'SSSSSSttSSSSSsst', 7: 'SSSSSSSSSSSSSsst', 8: ' SSSSSSRRSSSsst ',
                  9: ' SSSSSSttSSSsst '})
    g.c[12][7] = 'K'; g.c[11][7] = 'K'; g.c[11][24] = 'K'
    at(g, 10, 0, ['   hhhhhh   ', ' hhjjhhhhhH ', 'hhjjjhhhhhHH', 'hjjHHHHHHHHH', 'hjhhhhhhhhhH', 'hhhhhhhhhhHH',
                  'hjHHHHHHHHHH', 'hhhhhhhhhhHH'])
    at(g, 7, 7, ['   hhhhhhhhhhhh ', ' hjhhhhhhhhhhhhHH', 'hhhh        hhhHH', 'hhh          hHHH'])
    at(g, 21, 4, ['WW', 'G'])
    at(g, 7, 10, ['h', 'h']); at(g, 24, 10, ['H', 'H'])
    # fur stole
    at(g, 3, 22, ['     WWWWV    VWWWW', '   WWWWWWVV  VWWWWWWV', ' WWWWWWWWWV  VWWWWWWWVV', 'WWWVWWWWWVV  VVWWWWVWWV',
                  ' VWWWVWWVV    VVWWVWWV'])
    at(g, 15, 24, ['GG', 'yw'])
    return g
