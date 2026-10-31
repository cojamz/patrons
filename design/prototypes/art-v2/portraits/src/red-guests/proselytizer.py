# Proselytizer: a street preacher in a black wide-brim hat and clerical collar, mid-shout, pamphlets in his pocket.
from common import *
def draw(g):
    doorway(g); shoulders(g)
    face(g, 8, 9)
    g.put(14, 22, ['ssss', ' tt '])

    g.put(10, 2, ['   NDDDDDK  ', ' NDDDDDDDDDK', 'NDDDDDDDDDDK', 'NDDDDDDDDDDK', 'DDDDDDDDDDDK', 'RRRRRRRRRRRr'])
    g.put(4, 8, ['DDDDDDDDDDDDDDDDDDDDDDDD', ' KKKKKKKKKKKKKKKKKKKKKK '])
    g.put(8, 10, ['HHHHssssssssHHHH'])
    g.put(10, 11, ['tt      tt'])
    g.put(10, 11, [' t      t '])
    eyes(g, 10, 12, brow=False)
    g.put(10, 11, ['KK']); g.put(18, 11, ['KK']); g.put(9, 12, ['K']); g.put(20, 12, ['K'])
    g.c[14][15] = 't'; g.put(14, 15, ['tt'])
    g.put(13, 16, ['KKKKKK', 'KrqqrK', 'KrrrrK', ' KKKK '])
    g.put(25, 14, ['V', ' V', ' V', 'V']); g.put(27, 13, ['W', ' V', ' V', ' V', 'W'])
    g.put(5, 23, [' WWWV ', ' WKKV  ', 'WWWWV ', 'WKKKV ', 'WWWWVV', 'WKKWV1', '111111'])
    g.put(11, 22, ['NKKKWWKKKK', ' KKKVVKKK '])
