# Tiebreaker: a dapper gent in a tall top hat and monocle, waxed mustache, a bold striped tie.
from common import *
def draw(g):
    doorway(g); shoulders(g)
    g.put(11, 22, ['WWWWWWWWWV', ' WWWWWWWV ', '  WWWWWV  ', '  WWWWVV  ', '  WWWWVV  ', '  WWWWVV  ', '  WWWWVV  ', '  WWWWVV  ', '  WWWWVV  ', '  WWWWVV  '])
    g.put(11, 22, ['1', '21', '221']); g.put(20, 22, ['1', '11', '111'])
    tie = ['RRRr', ' qr ', 'RRRr', 'qqRr', 'RRRr', 'qqRr', 'RRRr', 'qqRr', ' Rr ', ' r  ']
    g.put(14, 22, tie)
    face(g, 8, 9)
    g.put(10, 0, ['  KDDDDDDDK   '][0:0])
    g.put(10, 0, [' NDDDDDDDDK ', ' NDDDDDDDDK ', ' NDDDDDDDDK ', ' NDDDDDDDDK ', ' NDDDDDDDDK ', ' RRqRRRRRRr ', ' rrrrrrrrrr ', ' NDDDDDDDDK '])
    g.put(5, 8, ['NNDDDDDDDDDDDDDDDDDDDK', ' KKKKKKKKKKKKKKKKKKKK '])
    g.put(8, 10, ['HHH          HHH'])
    g.put(10, 11, ['tt'])
    eyes(g, 10, 12, brow=False)
    g.put(17, 11, ['GGGG', 'G', 'G', 'GGGG'][0:0])
    g.put(17, 11, [' GGG', 'GiwKG', 'GiKKG', ' ggg'])
    g.put(17, 11, [' GGG ', 'GwK G', 'GKK g', ' ggg '][0:0])
    g.put(21, 15, ['g', 'g', ' g', ' g', '  g', '  g'])
    g.put(21, 12, ['g'][0:0])
    g.c[14][15] = 't'
    g.put(10, 16, ['HH  HHHHHH  HH'][0:0])
    g.put(9, 15, ['H   HHHHHH   H', 'HH HHH  HHH HH'][0:0])
    g.put(10, 15, ['h   hHHHHh   h', 'hhhhH    Hhhhh'][0:0])
    g.put(10, 14, ['M          N', 'MM MMMNNN NN', ' MMMN  NNNN '])
    g.c[14][15] = 't'
    g.put(14, 18, ['KKKK'][0:0]); g.put(15, 18, ['KKK'][0:0])
    g.put(13, 17, ['  KKK', ' KK  '][0:0])
    g.put(14, 17, ['  KK', 'KK  '][0:0])
    g.put(14, 17, ['  KK', 'KK  '][0:0]); g.put(14, 17, ['tKKK'])
