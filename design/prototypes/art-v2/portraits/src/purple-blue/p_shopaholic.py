# Shopaholic: can't stop buying. Big curly hair, sunglasses pushed up, sparkling eyes, a huge grin, hoop earrings,
# shopping bags on both shoulders.
from lib import *
ID, NAME, SPHERE = 'market.shopaholic', 'Shopaholic', 'blue'
def draw():
    g = new()
    at(g, 4, 3, ['  hh hh hh hh hh hh ', ' hhjhhjhhhhhhhhhhhhH', 'hhjjhhhhhhhhhhhhhhhhH', 'hjhhhhhhhhhhhhhhhhhHH',
                 'hhhhhhhhhhhhhhhhhhHHH', 'hhh               hHH', 'hhh               HHH', 'hhh               HHH',
                 ' hh               HH', 'hhh               HHH', ' hh               HH', 'hhh              HHH'])
    body(g)
    face(g, rows={0: 'hhSSSSSSSSSSShhh', 2: 'SSttSSSSSSttSsst', 3: 'SRSRSSSSSSRSRsst', 4: 'SRRRSSSSSSRRRsst',
                  5: 'SSRSSSStSSSRSsst', 7: 'SSKKKKKKKKKSSsst', 8: ' SKWWWWWWWKSst ', 9: ' SSKrrrrrKSSst ',
                  10: '  SSKKKKKSSst  '})
    at(g, 9, 4, ['DDDDD  DDDDD', 'DwDDDLLDwDDD', ' DDD    DDD'])
    at(g, 6, 14, ['GG', 'G ', 'GG']); at(g, 24, 14, ['GG', ' G', 'GG'])
    # bags on the shoulders
    at(g, 1, 22, [' K K ', ' K K', 'RRRRR', 'qRRRRr', 'RRRRRr', 'RRRRRr', 'RRRRrr', 'RRRRrr', 'rrrrrr'])
    at(g, 25, 23, [' K K', 'nnnnn', 'Ynnnnn', 'nnnnnn', 'nnWnnn', 'nnnnnn', 'nnnnnn', 'gggggg'])
    at(g, 13, 22, ['WWWWWW', ' WWWW']); 
    return g
