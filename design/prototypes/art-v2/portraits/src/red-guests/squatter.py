# Squatter: a sleepy drifter who has moved in anyway, knit beanie, stubble, lazy grin, patched blanket around the shoulders.
from common import *
def draw(g):
    doorway(g); shoulders(g)
    g.put(14, 22, ['ssss', ' tt '])
    g.put(3, 24, ['  OOOO', ' OoOOo', 'OOOOOo'])
    g.put(20, 26, ['EEEE', 'EeEe', 'EEEe', 'eeee'])
    g.put(8, 28, ['UUUU', 'UuUU', 'uuuu', 'UUUU'])
    g.put(24, 23, ['RR', 'Rr'])
    g.put(8, 22, ['W', 'V'][0:0])
    for (x, y) in [(3, 24), (3, 26), (20, 26), (23, 29), (8, 28), (11, 31)]: g.c[y][x] = 'W'
    face(g, 8, 9)
    g.put(7, 2, ['     UUUUUU      ',
                 '   UUUUUUUUUuu   ',
                 '  UUUUUUUUUUUuu  ',
                 ' UUUUUUUUUUUUUuu ',
                 ' UUUUUUUUUUUUUuuu',
                 'UuUuUuUuUuUuUuUuu',
                 'uUuUuUuUuUuUuUuUu',
                 'uuuuuuuuuuuuuuuuu'])
    g.put(13, 0, ['  ', ' WWW'][0:0])
    g.put(14, 0, ['WVW', 'WWV'])
    g.put(7, 10, ['hH', 'h']); g.put(23, 10, ['hH', ' H'])
    g.put(10, 12, ['ssss    ssss'])
    g.put(10, 12, ['tttt'][0:0])
    g.put(10, 12, ['tt', 'wK', 'KK'][0:0])
    g.put(10, 12, ['tttt   tttt'][0:0])
    g.put(10, 12, ['tt      tt'])
    g.put(10, 13, ['KK      KK'])
    g.put(10, 13, ['wK      wK'][0:0])
    g.c[14][15] = 't'; g.put(14, 15, ['tt'])
    g.put(9, 16, ['s          s', 'ssssssssssss', ' ssssssssss', '  ssssssss', '   t t t'])
    g.put(10, 17, ['t t     t t'])
    g.put(12, 17, ['K    KK', ' KKKK  '])
    g.put(18, 17, ['Y'][0:0])
