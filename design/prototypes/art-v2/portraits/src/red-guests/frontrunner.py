# Front-runner: a racer leading the pack, spiky hair, red sweatband, clenched grin, sweat drop, race bib number 1.
from common import *
def draw(g):
    doorway(g); shoulders(g)
    for y in range(22, 32):
        for x in list(range(0, 32)):
            pass
    g.put(2, 25, ['SSSS', 'SSSSS', 'SSSSs', 'SSSSs', 'SSSs', 'SSSs', 'SSSs'])
    g.put(26, 25, ['ssst', 'ssst', 'ssst', 'sstt', 'sst', ' st', ' st'])
    g.put(6, 23, ['4', '4', '4']); g.put(25, 23, ['1', '1', '1'])
    g.put(14, 22, ['ssss', ' tt '])
    g.put(12, 22, ['22', ' 2']); g.put(18, 22, ['22', '2'])
    g.put(10, 25, ['GWWWWWWWWWG', 'WWWWWKKWWWV', 'WWWWKKKWWWV', 'WWWWWKKWWWV', 'WWWWWKKWWWV', 'WWWWWKKWWWV', 'WWWWKKKKWVV'])
    face(g, 8, 9)
    g.put(7, 2, ['        H  H      ', '    H  hH hH  H   ', '   hH hjhhhhhhH   ', '  hjhhjhhhhhhhhH  ', ' hjhhhhhhhhhhhhhH ', 'Hhhhhhhhhhhhhhhhh ', 'Hhhhhhhhhhhhhhhhh'])
    g.put(7, 8, ['RRRRRRRRRRRRRRRRRr', 'qqqWqqqqqqqqqqqqRr', 'rrrrrrrrrrrrrrrrrr'][0:0])
    g.put(7, 8, ['RqqqRRRRRRRRRRRRRr', 'RRRRRRRRRRRRRRRRrr'])
    g.put(7, 10, ['h', 'H']); g.put(24, 10, ['H', 'H'])
    g.put(10, 11, ['ttt    ttt'][0:0])
    g.put(9, 11, ['tt'][0:0])
    eyes(g, 10, 12, brow=False)
    g.put(10, 11, ['  t     t'][0:0])
    g.put(10, 11, ['tt       tt'][0:0])
    g.put(10, 11, ['t t'][0:0])
    g.put(10, 11, ['  t'])
    g.put(17, 11, ['t'])
    g.c[14][15] = 't'; g.put(14, 15, ['tt'])
    g.put(12, 17, ['KKKKKKKK', 'KwKwKwKK'][0:0])
    g.put(12, 16, ['K      K', 'KwwwwwwK', ' KKKKKK '])
    g.put(12, 17, ['KwKwKwwK'][0:0])
    g.put(25, 11, ['y', 'yy', 'iy'])
    g.put(1, 8, ['ii', '', 'iii', '', 'ii'][0:0])
    g.put(2, 11, ['iiii', '', ' iii', '', 'iiii'])
