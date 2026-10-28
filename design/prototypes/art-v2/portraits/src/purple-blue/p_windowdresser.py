# Window Dresser: dresses the shop window. A sharp bob with a straight fringe, pins held in the lips, one eye squinting
# to judge the display, a tape measure draped round the neck, scissors in the smock pocket.
from lib import *
ID, NAME, SPHERE = 'market.windowdresser', 'Window Dresser', 'blue'
def draw():
    g = new()
    at(g, 6, 3, ['   HHhhhhhhhhhH   ', '  HhhjjjhhhhhhhHH ', ' Hhjjhhhhhhhhhhhhh ', ' hjhhhhhhhhhhhhhHH ', 'hhhhhhhhhhhhhhhhHHH',
                 'hhhhhhhhhhhhhhhhHHH', 'hhh            hHHH', 'hhh            HHHH', 'hhh            HHHH', 'hhh            HHHH',
                 'hhh            HHHH', 'hhhh           HHH', ' hhh           HH'])
    body(g)
    face(g, rows={0: 'hhhhhhhhhhhhhhhH', 1: 'hhhhhhhhhhhhhhhH', 2: 'SSttSSSSSSSSSsst', 3: 'SSwKSSSSSttttsst',
                  4: 'SSKKSSSSSSKKSsst', 8: ' SSSSKKKKKSSsst ', 9: ' SSSSSSSSSSSsst '}, ears=False)
    at(g, 18, 16, [' LLK', 'LLLLK'])  # pins held in the lips
    # tape measure round the neck
    at(g, 11, 22, ['Y', 'YK', 'Y', 'YK', 'Y', 'YK', 'Y', 'YK', 'Y', 'Y']); at(g, 20, 22, ['Y', 'KY', 'Y', 'KY', 'Y', 'KY', 'Y'])
    at(g, 12, 22, ['nn']); at(g, 18, 22, ['nn'])
    at(g, 22, 26, ['L L', ' L ', 'N N', 'N N'])  # scissors in the pocket
    at(g, 21, 28, ['22222'])
    return g
