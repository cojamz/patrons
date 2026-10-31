# Connoisseur: a gentleman of taste. Slicked side part, a gold monocle on a chain, one brow up, waxed curled mustache,
# a cravat under the jacket.
from lib import *
ID, NAME, SPHERE = 'market.connoisseur', 'Connoisseur', 'blue'
def draw():
    g = new()
    body(g)
    face(g, rows={0: 'NSSSSSSSSSSSSssN', 1: 'SSSSSSSSSNNSSsst', 2: 'SNNSSSSSSSSNsst', 3: 'SSSSSSSSSGGGGsst',
                  4: 'SwKKSSSSGwKKSGst', 5: 'SSSSSSStGKKSSGst', 6: 'SSSSSSttSGGGGsst', 6: 'NSSSSSttSGGGGsNt', 7: 'NMMMMMMMMMMMMMNt',
                  8: ' SSMNSSSSNMSSst ', 9: ' SSSSKKKKKSSsst '})
    at(g, 6, 14, ['MN']); at(g, 24, 14, ['NM'])
    at(g, 8, 3, ['   NNNNMMMMMM   ', ' NNNMLLLLLLMMMM ', 'NNNNMMMMMMMMMMMN', 'NMNNMMMMMMMMMMMN', 'MMNMMMMMMMMMMMNN',
                 'MM  MMMMMMMMMMNN'])
    at(g, 7, 7, ['M', 'M', 'M']); at(g, 24, 7, ['N', 'N'])
    for y in range(16, 26): g.c[y][22 + (y - 16) // 4] = 'g' if y % 2 else 'G'  # monocle chain
    at(g, 11, 22, ['WWsstWWWWW', ' RRRRRRRR', '  RqRRRr', '   RRRr', '   RRr', '    r'])
    at(g, 9, 23, ['4', '44', '  4']); at(g, 21, 23, ['11', '1', ''])
    return g
